---
id: 2f4be0b2-87a1-8080-bf3f-fbc99bb2a718
title: '[AWS] ECS(Elastic Container Service) 레포지토리 업로드 해보기'
slug: aws-ecs-repo
date:
  start_date: '2025-11-13'
createdTime: 'Mon Jan 26 2026 07:54:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
category:
  - AWS
summary: ECS 레포지토리 업로드 전 과정을 순서대로 실습한 기록
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
# [AWS] ECS(Elastic Container Service) 레포지토리 업로드 해보기

## TL;DR

이번 글은 EC2(Amazon Linux)에서 Docker 이미지를 빌드하고 Amazon ECR에 Push하는 과정을 빠르게 재현할 수 있게 정리한 기록입니다.

흐름은 `IAM Access Key 준비 -> Docker 설치 -> AWS CLI 설정 -> 이미지 빌드/검증 -> ECR Push` 입니다.

## 시작 전 목표

  - EC2에서 Docker를 정상 설치하고 권한을 반영한다.
  - AWS CLI 인증/리전 설정 후 호출 계정을 확인한다.
  - 로컬 이미지 빌드/실행 검증 뒤 ECR에 Push한다.
---

## Problem

ECS 배포를 시작하려면 먼저 컨테이너 이미지를 보관할 ECR이 준비되어 있어야 합니다.

이 단계가 빠지면 Task Definition과 Service 생성 단계에서 이미지를 참조할 수 없습니다.

---

## 1) IAM 사용자 Access Key 준비

먼저 IAM 사용자 상세 화면에서 **액세스 키 만들기**로 들어갑니다.

이 단계는 ECR Push에 사용할 자격 증명을 준비하는 단계입니다.

진행 순서:

  - IAM 사용자 상세 화면에서 우측의 **액세스 키 만들기**를 선택한다.
  - 사용 사례에서 **Command Line Interface(CLI)** 를 선택한다.
  - 확인 체크 후 다음으로 진행해 Access Key/Secret을 발급받는다.
중요:

  - Access Key/Secret은 문서에 그대로 남기지 않습니다.
  - 노출된 키는 즉시 비활성화하고 재발급해야 합니다.
화면 1: IAM 사용자 상세에서 액세스 키 생성 진입

![](/images/posts/aws-ecs-repo/image1.png)

화면 2: Access Key 사용 사례에서 CLI 선택 후 다음 진행

![](/images/posts/aws-ecs-repo/image2.png)

---

## 2) EC2 생성 후 Docker 설치 (Amazon Linux)

Amazon Linux에서 Docker를 설치하고, 현재 사용자 권한을 Docker 그룹에 반영합니다.

```Bash
# 패키지 인덱스 갱신
sudo dnf update -y

# Docker 설치
sudo dnf install -y docker

# Docker 서비스 활성화 및 시작
sudo systemctl enable docker
sudo systemctl start docker

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 새 그룹 권한 즉시 반영
newgrp docker

# Docker 정상 동작 확인
docker --version
```

왜 필요한가?

  - `docker` 그룹 권한이 반영되지 않으면 Docker 실행 시 권한 오류가 발생할 수 있습니다.
---

## 3) AWS CLI 설치 및 인증 정보 설정

AWS CLI를 설치하고 `aws configure`로 인증/리전을 설정합니다.

```Bash
# AWS CLI 설치 파일 다운로드
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# 압축 해제
unzip awscliv2.zip

# 설치 실행
sudo ./aws/install

# 임시 설치 파일 정리
sudo rm -rf awscliv2.zip aws

# 버전 확인
aws --version
```

```Bash
# AWS 자격 증명/리전 설정
aws configure
```

```Bash
# 현재 인증된 사용자 정보 확인
aws sts get-caller-identity
```

왜 필요한가?

  - ECR 로그인과 Push는 AWS 인증 정보가 정상 설정되어 있어야 동작합니다.
---

## 4) Docker 이미지 빌드/실행 확인

ECR Push 전에 로컬 실행 검증을 먼저 진행합니다.

```Docker
FROM nginx:1.29.3-alpine
COPY html /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/
EXPOSE 80
```

```Bash
# 현재 디렉터리 기준으로 이미지 빌드
docker build -t nginx-test .

# 컨테이너 실행(호스트 80 -> 컨테이너 80)
docker run -d -p 80:80 --name nginx-test nginx-test:latest

# 로컬 응답 확인
curl localhost
```

검증 포인트:

  - `curl localhost`가 기대한 HTML을 반환하면 빌드/실행은 정상입니다.
---

## 5) Amazon ECR 리포지토리 생성 후 Push

리포지토리 준비 후 로그인 -> 태깅 -> Push 순서로 진행합니다.

```Bash
# 리전과 계정 ID 변수 설정
AWS_REGION=ap-northeast-2
AWS_ACCOUNT_ID=<YOUR_ACCOUNT_ID>
REPO_NAME=nginx-test

# ECR 로그인 토큰 발급 후 docker login
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 로컬 이미지를 ECR 태그로 재태깅
docker tag nginx-test:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:latest

# ECR로 Push
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:latest
```

왜 이 순서인가?

  - 인증 전 `docker push`를 실행하면 권한 오류가 발생합니다.
---

## 자주 막히는 지점

  - Access Key를 문서/스크린샷에 그대로 남김
  - `newgrp docker` 또는 재로그인을 누락해 권한 반영이 안 됨
  - AWS CLI 리전과 ECR 리전이 다름
  - ECR 로그인 없이 `docker push`를 먼저 실행함
---

## 확인 체크리스트

  - `docker --version` 출력이 정상이다.
  - `aws sts get-caller-identity` 결과가 기대한 계정이다.
  - `curl localhost`로 컨테이너 응답을 확인했다.
  - `docker push` 완료 후 ECR 콘솔에서 이미지 태그를 확인했다.
## 마무리

여기까지 완료하면 ECS 배포 전 준비물(ECR 이미지)이 준비됩니다.

다음 단계는 Task Definition -> Cluster -> Service 순서로 연결해 실제 서비스 실행까지 진행하면 됩니다.
