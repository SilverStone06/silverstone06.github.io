---
id: 2fdbe0b2-87a1-8091-bca8-c1b744f7db58
title: '[Git] CI/CD with SSM'
slug: git-cicd-with-ssm
date:
  start_date: '2025-12-08'
createdTime: 'Wed Feb 04 2026 00:31:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - Git
category:
  - Git
summary: Git과 SSM 기반 CI/CD 배포 흐름을 실습 중심으로 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## TL;DR

Private/Public Subnet 구조에서 GitHub Actions와 AWS SSM을 이용해 EC2에 배포하는 흐름을 정리합니다.

## 시작 전 목표

  - Private EC2에 SSM Agent를 올바르게 연결한다.
  - GitHub Actions에서 SSM으로 배포 명령을 전달한다.
  - Docker Hub 기반 배포를 ECR 기반으로 확장한다.
---

## 1) Private/Public Subnet 기반 배포 준비

  1. Private EC2(Ubuntu) 인스턴스를 생성합니다.
    1. 스토리지는 `10GiB`로 설정합니다.
    1. User Data를 사용합니다.
    1. User Data 내용은 시작 템플릿에도 동일하게 반영합니다.
```Python
#!/bin/bash

# 1. SSM 에이전트 설치 (최우선 실행)
# 인스턴스가 뜨자마자 AWS 콘솔에서 제어 가능하도록 먼저 설치합니다.
snap install amazon-ssm-agent --classic
snap start amazon-ssm-agent
snap enable amazon-ssm-agent

# 2. 패키지 업데이트 및 필수 도구 설치
apt-get update -y
apt-get install -y curl unzip net-tools apt-transport-https ca-certificates gnupg lsb-release

# 3. Docker 설치 (공식 저장소 등록 방식)
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker 권한 설정 및 실행
systemctl enable --now docker
usermod -aG docker ubuntu

# 4. AWS CLI v2 설치 (ECR 로그인 및 SSM 통신에 필수)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf awscliv2.zip aws/
```

  - 상태 확인: `sudo snap services amazon-ssm-agent`
## 2) SSM용 IAM 역할 연결

  1. `IAM -> 역할 -> 역할 생성`으로 이동합니다.
  1. 역할 이름을 지정해 생성합니다. (예: `song-ec2-ssm-role`)
  1. `EC2 -> 작업 -> 보안 -> IAM 역할 수정`에서 인스턴스에 연결합니다.
![image.png](/images/posts/git-cicd-with-ssm/image1.png)

```Python
# 리모트 신규 연결
git remote add origin <깃 레포지토리 주소>

# 변경
git remote set-url origin <깃 레포지토리 주소>

# 삭제
git remote remove origin
```

기본 Git 작업 흐름: `레포 생성 -> git init -> remote 연결 -> git add . -> git commit -m "TEST" -> git push origin main`

## 3) GitHub Actions SSM 배포 워크플로 추가

`Git repo -> Actions`에서 Docker image 기반 워크플로를 추가합니다.

```YAML
name: Nginx Deployment Pipeline (Private EC2 via SSM)

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

permissions:
  contents: read

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # --- [CD 영역 시작: 도커 이미지 생성] ---
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: "${{ secrets.DOCKER_USERNAME }}"
          password: "${{ secrets.DOCKER_PASSWORD }}"

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./nginx-private
          push: true
          # 콜론(:)이 포함된 문자열이므로 따옴표로 감싸주는 것이 안전합니다.
          tags: "${{ secrets.DOCKER_USERNAME }}/nginx-private:latest"

      # --- [CD 영역: AWS 자격 증명 설정] ---
      # Private EC2는 SSH로 직접 접속할 수 없으므로, AWS 권한을 얻어 SSM으로 명령을 내려야 합니다.
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: "${{ secrets.AWS_ACCESS_KEY_ID }}"
          aws-secret-access-key: "${{ secrets.AWS_SECRET_ACCESS_KEY }}"
          aws-region: "${{ secrets.AWS_REGION }}"

      # --- [CD 영역: SSM을 통한 EC2 실 배포] ---
      # appleboy/ssh-action 대신 aws ssm 명령을 사용하여 내부망의 EC2에 명령을 전달합니다.
      - name: Deploy to EC2 via SSM
        run: |
          aws ssm send-command \
            --instance-ids "${{ secrets.EC2_INSTANCE_ID }}" \
            --document-name "AWS-RunShellScript" \
            --comment "Deploying Nginx via SSM" \
            --parameters 'commands=[
              "sudo docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}",
              
              "# 1. 최신 이미지 가져오기 (NAT Gateway를 통해 외부 통신)",
              "sudo docker pull ${{ secrets.DOCKER_USERNAME }}/nginx-private:latest",

              "# 2. 기존 컨테이너 중지 및 삭제",
              "sudo docker stop nginx-server || true",
              "sudo docker rm nginx-server || true",

              "# 3. 80번 포트로 실행 (ALB로부터의 트래픽을 수신)",
              "sudo docker run -d --name nginx-server -p 80:80 ${{ secrets.DOCKER_USERNAME }}/nginx-private:latest",

              "# 4. 오래된 이미지 정리",
              "sudo docker image prune -f"
            ]' \
            --region ${{ secrets.AWS_REGION }}

```

필요한 Secrets를 먼저 등록합니다.

| Secret Name | Secret Value (설명) |
| --- | --- |
| DOCKER_USERNAME | Docker Hub 계정 사용자명 |
| DOCKER_PASSWORD | Docker Hub Personal Access Token (PAT) |
| AWS_ACCESS_KEY_ID | GitHub Actions에서 AWS API 호출에 사용하는 Access Key ID |
| AWS_SECRET_ACCESS_KEY | Access Key ID와 짝으로 사용하는 Secret Access Key |
| AWS_REGION | 배포 대상 AWS 리전 코드 (예: `ap-southeast-2`) |
| EC2_INSTANCE_ID | SSM 명령을 보낼 대상 EC2 인스턴스 ID |

워크플로 실행 후 AWS 콘솔에서 결과를 확인합니다.

  - Systems Manager `Fleet Manager`에서 SSM 연결 상태와 명령 실행 결과를 확인합니다.
![image.png](/images/posts/git-cicd-with-ssm/image2.png)

## 4) Docker Hub에서 ECR로 전환

전환 시 아래 3가지를 함께 반영합니다.

  - IAM 역할 권한 추가
  - Actions Secrets 추가
  - 워크플로 코드 수정
  1. IAM 역할을 생성하고 아래 권한을 부여합니다.
  - `AmazonEC2ContainerRegistryFullAccess`
  - `AmazonSSMManagedInstanceCore`
![image.png](/images/posts/git-cicd-with-ssm/image3.png)

  1. 권한을 선택해 역할을 생성합니다. (예: `song-cicd-role`)
  1. EC2 인스턴스의 IAM 역할을 변경합니다.
  1. Git 저장소를 새로 준비합니다.
  1. AWS ECR 리포지토리를 생성합니다.
  1. Actions Secrets 값을 추가합니다.
| Secret Name | Secret Value (설명) |
| --- | --- |
| ECR_REPOSITORY | ECR 리포지토리 경로 (예: `<namespace>/<repository>`) |
| AWS_ACCESS_KEY_ID | GitHub Actions에서 AWS API 호출에 사용하는 Access Key ID |
| AWS_SECRET_ACCESS_KEY | Access Key ID와 짝으로 사용하는 Secret Access Key |
| AWS_REGION | 배포 대상 AWS 리전 코드 |
| EC2_INSTANCE_ID | 배포 대상 EC2 인스턴스 ID |

  1. 워크플로 코드를 ECR 기준 수정합니다.
```YAML
name: Nginx Deployment Pipeline (Private EC2 via SSM & ECR)

'on':
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

permissions:
  contents: read

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # --- [CD 영역 시작: AWS 자격 증명 설정] ---
      # ECR 로그인 및 SSM 명령 실행을 위해 AWS 권한을 먼저 얻습니다.
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      # --- [CD 영역: ECR 로그인] ---
      # Docker Hub 대신 AWS ECR 창고에 접근하기 위해 로그인합니다.
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      # --- [CD 영역: 도커 이미지 생성 및 ECR 푸시] ---
      - name: Build and push Docker image to ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: ${{ secrets.ECR_REPOSITORY }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          # 빌드 시 ECR 주소를 포함한 태그를 생성합니다.
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./nginx-private
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest ./nginx-private
          # 생성된 이미지를 ECR 창고로 푸시합니다.
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      # --- [CD 영역: SSM을 통한 EC2 실 배포] ---
      # Private EC2 내부망에 있는 에이전트에게 ECR 이미지를 배포하도록 명령합니다.
      - name: Deploy to EC2 via SSM
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: ${{ secrets.ECR_REPOSITORY }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          aws ssm send-command \
            --instance-ids "${{ secrets.EC2_INSTANCE_ID }}" \
            --document-name "AWS-RunShellScript" \
            --comment "Deploying Nginx from ECR via SSM" \
            --parameters '{
              "commands": [
                "# 1. EC2 내부에서 ECR 로그인 (12시간 유효한 임시 비밀번호 생성)",
                "aws ecr get-login-password --region ${{ secrets.AWS_REGION }} | sudo docker login --username AWS --password-stdin '"$ECR_REGISTRY"'",

                "# 2. 최신 이미지 가져오기 (ECR에서 이미지 Pull)",
                "sudo docker pull '"$ECR_REGISTRY"'/'"$ECR_REPOSITORY"':'"$IMAGE_TAG"'",

                "# 3. 기존 컨테이너 중지 및 삭제",
                "sudo docker stop nginx-server || true",
                "sudo docker rm nginx-server || true",

                "# 4. 80번 포트로 실행 (ALB로부터의 트래픽을 수신)",
                "sudo docker run -d --name nginx-server -p 80:80 '"$ECR_REGISTRY"'/'"$ECR_REPOSITORY"':'"$IMAGE_TAG"'",

                "# 5. 오래된 이미지 정리",
                "sudo docker image prune -f"
              ]
            }' \
            --region ${{ secrets.AWS_REGION }}
```

  1. FastAPI 배포용 워크플로도 추가합니다.
    - ECR 리포지토리를 하나 더 생성합니다.
    - 그에 맞는 Secrets를 추가합니다.
```YAML
name: Nginx Deployment Pipeline (Private EC2 via SSM & ECR)

'on':
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

permissions:
  contents: read

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # --- [CD 영역 시작: AWS 자격 증명 설정] ---
      # ECR 로그인 및 SSM 명령 실행을 위해 AWS 권한을 먼저 얻습니다.
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      # --- [CD 영역: ECR 로그인] ---
      # Docker Hub 대신 AWS ECR 창고에 접근하기 위해 로그인합니다.
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      # --- [CD 영역: 도커 이미지 생성 및 ECR 푸시] ---
      - name: Build and push Docker image to ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: ${{ secrets.ECR_REPOSITORY_FASTAPI }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          # 빌드 시 ECR 주소를 포함한 태그를 생성합니다.
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./fastapi-private
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest ./fastapi-private
          # 생성된 이미지를 ECR 창고로 푸시합니다.
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      # --- [CD 영역: SSM을 통한 EC2 실 배포] ---
      # Private EC2 내부망에 있는 에이전트에게 ECR 이미지를 배포하도록 명령합니다.
      - name: Deploy to EC2 via SSM
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: ${{ secrets.ECR_REPOSITORY_FASTAPI }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          aws ssm send-command \
            --instance-ids "${{ secrets.EC2_INSTANCE_ID }}" \
            --document-name "AWS-RunShellScript" \
            --comment "Deploying FastAPI from ECR via SSM" \
            --parameters '{
              "commands": [
                "# 1. EC2 내부에서 ECR 로그인 (12시간 유효한 임시 비밀번호 생성)",
                "aws ecr get-login-password --region ${{ secrets.AWS_REGION }} | sudo docker login --username AWS --password-stdin '"$ECR_REGISTRY"'",

                "# 2. 최신 이미지 가져오기 (ECR에서 이미지 Pull)",
                "sudo docker pull '"$ECR_REGISTRY"'/'"$ECR_REPOSITORY"':'"$IMAGE_TAG"'",

                "# 3. 기존 컨테이너 중지 및 삭제",
                "sudo docker stop fastapi-server || true",
                "sudo docker rm fastapi-server || true",

                "# 4. 80번 포트로 실행 (ALB로부터의 트래픽을 수신)",
                "sudo docker run -d --name fastapi-server -p 8000:8000 '"$ECR_REGISTRY"'/'"$ECR_REPOSITORY"':'"$IMAGE_TAG"'",
                "# 5. 오래된 이미지 정리",
                "sudo docker image prune -f"
              ]
            }' \
            --region ${{ secrets.AWS_REGION }}
```

## 5) S3 Bucket 파일 연동 후 Docker 실행

  - IAM 권한에 `AmazonS3FullAccess`를 추가합니다.
![image.png](/images/posts/git-cicd-with-ssm/image4.png)

| Secret Name | Secret Value (설명) |
| --- | --- |
| ECR_REPOSITORY | Nginx 이미지용 ECR 리포지토리 경로 |
| AWS_ACCESS_KEY_ID | GitHub Actions에서 AWS API 호출에 사용하는 Access Key ID |
| AWS_SECRET_ACCESS_KEY | Access Key ID와 짝으로 사용하는 Secret Access Key |
| AWS_REGION | 배포 대상 AWS 리전 코드 |
| EC2_INSTANCE_ID | 배포 대상 EC2 인스턴스 ID |
| S3_BUCKET_NAME | 정적 파일/설정 파일을 저장한 S3 버킷 이름 |
| ECR_REPOSITORY_FASTAPI | FastAPI 이미지용 ECR 리포지토리 경로 |

## 확인 체크리스트

  - Private EC2가 SSM에서 `Managed` 상태로 보인다.
  - GitHub Actions에서 `aws ssm send-command`가 정상 실행된다.
  - 컨테이너 교체(`stop -> rm -> run`)가 실패 없이 완료된다.
  - ECR 전환 시 IAM 권한/Secrets/워크플로 수정이 모두 반영됐다.
## 마무리

이 문서는 Private EC2 환경에서 SSM 기반 배포를 구성하고, Docker Hub에서 ECR로 전환하는 전체 흐름을 다시 정리한 가이드입니다. 다음 단계로는 환경별 워크플로 분리(`dev`/`prod`)와 롤백 전략을 추가하면 안정성이 더 좋아집니다.
