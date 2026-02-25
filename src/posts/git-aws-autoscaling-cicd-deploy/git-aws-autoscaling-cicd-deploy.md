---
id: 2febe0b2-87a1-80c7-a265-c56bab458653
title: '[Git] AWS Autoscaling CI/CD 배포'
slug: git-aws-autoscaling-cicd-deploy
date:
  start_date: '2025-12-11'
createdTime: 'Thu Feb 05 2026 02:06:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - Git
category:
  - Git
summary: AWS Autoscaling 환경에서 Git 기반 CI/CD 배포 과정을 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## TL;DR

EC2 + Auto Scaling + GitHub Actions를 연결해 ECR 이미지 기반 자동 배포를 구성하는 과정을 정리합니다.

## 시작 전 목표

  - 배포용 EC2/Launch Template/ASG 기본 구조를 만든다.
  - GitHub Actions에서 ECR 푸시와 배포 트리거를 연결한다.
  - Auto Scaling 인스턴스가 새 템플릿(User Data)로 올라오도록 맞춘다.
---

## 1) 배포용 EC2 생성

  - Public Subnet에 배포 기준 EC2를 먼저 생성합니다.
  - IAM 역할을 부여합니다.
    - `AmazonEC2ContainerRegistryFullAccess`
    - `AmazonSSMManagedInstanceCore`
    - `AmazonS3`
## 2) Launch Template 생성

  - 리소스 태그를 설정합니다.
  - IAM 권한이 연결된 인스턴스 프로파일을 사용합니다.
| 키 | 값 | 리소스 유형 |
| --- | --- | --- |
| deploygroup | container-asg | 인스턴스 |

![image.png](/images/posts/git-aws-autoscaling-cicd-deploy/image1.png)

## 3) Auto Scaling Group 생성

  - 사전 준비: ALB + Target Group을 먼저 생성합니다.
  - 가용 영역은 Private Subnet 전체를 선택합니다.
  - 기존 Load Balancer 연결을 선택합니다.
  - ELB 상태 확인을 활성화합니다.
  - 그룹 크기: `2`
  - 크기 조정 범위: `2~3`
![image.png](/images/posts/git-aws-autoscaling-cicd-deploy/image2.png)

상태 확인

```Bash
sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent.service
docker --version
```

## 4) Git Repository 생성

## 5) GitHub Actions 및 Secrets 설정

| Secret Name | Secret Value (설명) |
| --- | --- |
| ECR_REPOSITORY | Nginx 이미지용 ECR 리포지토리 경로 |
| AWS_ACCESS_KEY_ID | GitHub Actions에서 AWS API 호출에 사용하는 Access Key ID |
| AWS_SECRET_ACCESS_KEY | Access Key ID와 짝으로 사용하는 Secret Access Key |
| AWS_REGION | 배포 대상 AWS 리전 코드 |
| S3_BUCKET_NAME | 정적 파일/설정 파일을 저장한 S3 버킷 이름 |
| ASG_TAG_KEY | 배포 대상 ASG 인스턴스 식별용 태그 키 |
| EC2_INSTANCE_TAG | 배포 대상 ASG 인스턴스 식별용 태그 값 |
| ECR_REPOSITORY_FASTAPI | FastAPI 이미지용 ECR 리포지토리 경로 |

## 6) Launch Template 새 버전 생성

  - User Data를 최신 배포 흐름으로 갱신합니다.
```YAML
#!/bin/bash
# 1. 변수 설정 (본인의 환경에 맞게 수정)
REGION="ap-southeast-2"
ACCOUNT_ID="036333380579"  # 본인의 AWS 계정 ID
ECR_REPO="cicd-study"
S3_BUCKET="song-s3-cicd-bucket"

# 2. 필요한 디렉토리 생성
mkdir -p /home/ubuntu/app/html

# 3. S3에서 최신 설정 및 자산 가져오기
aws s3 cp s3://${S3_BUCKET}/nginx-private/default.conf /home/ubuntu/app/default.conf
aws s3 sync s3://${S3_BUCKET}/nginx-private/html/ /home/ubuntu/app/html/ --delete

# 4. ECR 로그인
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# 5. 최신 이미지 Pull (latest 태그 기준)
docker pull ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:latest

# 6. 컨테이너 실행
docker run -d --name nginx-server -p 80:80 \
  -v /home/ubuntu/app/default.conf:/etc/nginx/conf.d/default.conf \
  -v /home/ubuntu/app/html:/usr/share/nginx/html \
  ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:latest
```

위 내용으로 새 버전을 생성합니다.

주의사항

  - AMI 없이 인스턴스 기반으로 생성하면 기본 이미지 기준으로 올라올 수 있습니다.
  - 이 경우 기존 User Data가 반영되지 않으므로, `Update User Data`를 다시 적용해야 합니다.
## 7) Auto Scaling Group 템플릿 버전 교체

`Auto Scaling -> 작업 -> 편집`에서 템플릿 버전을 `Latest`로 변경합니다.

## 확인 체크리스트

  - ASG 인스턴스가 Private Subnet에서 정상 생성된다.
  - EC2에 SSM Agent와 Docker가 정상 동작한다.
  - GitHub Actions에서 ECR 푸시가 성공한다.
  - Launch Template 최신 버전으로 교체 후 신규 인스턴스에 User Data가 반영된다.
## 마무리

이 글은 EC2 단건 배포가 아니라 Auto Scaling 환경에서 지속 배포가 가능하도록 구성 요소를 맞추는 과정에 초점을 둡니다. 다음 단계로는 Blue/Green 또는 롤링 배포 전략을 추가해 무중단 배포 품질을 높일 수 있습니다.

## 참고
