---
id: 2f8be0b2-87a1-800c-bd12-c53a39ee01fa
title: '[AWS] EKS(Elastic Kubernetes Service) 맛보기'
slug: aws-ekselastic-kubernetes-service-맛보기
date:
  start_date: '2025-12-01'
createdTime: 'Fri Jan 30 2026 00:37:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
category:
  - AWS
summary: EKS를 처음 접할 때 필요한 설치·배포·검증 과정을 맛보기로 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## TL;DR

  - Bastion EC2에 `awscli`, `kubectl`, `eksctl`, `docker`를 설치해 EKS 실습 환경을 구성합니다.
  - `eksctl`로 클러스터/노드그룹을 만들고, `kubectl`로 배포/서비스(NodePort, LoadBalancer)를 확인합니다.
  - ECR 이미지 배포, RDS 연동(FastAPI), Nginx reverse proxy까지 한 흐름으로 테스트합니다.
## Goals Before Start

  - EKS 기본 생성/검증/삭제 흐름 익히기
  - ECR 이미지 기반 배포 익히기
  - FastAPI + RDS 연결 및 Nginx proxy 구성 경험하기
## 1) Bastion EC2 준비

  - Ubuntu
  - `t3.medium`
  - 퍼블릭 서브넷
  - 스토리지 `20GiB`
## 2) EKS 개발 환경 구축 (Ubuntu)

```Bash
#!/bin/bash

# 1. 패키지 업데이트 및 필수 도구 설치
apt-get update -y
apt-get install -y curl unzip net-tools apt-transport-https ca-certificates gnupg lsb-release

# 2. Docker 설치
mkdir -p /etc/apt/keyrings
sudo chmod 755 /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
| sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" \
| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
sudo ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose

# 3. AWS CLI v2 설치
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf awscliv2.zip aws/

# 4. kubectl 설치
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

# 5. eksctl 설치
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
mv /tmp/eksctl /usr/local/bin
```

### AWS CLI 설정

```Bash
aws configure
# AWS Access Key ID: <YOUR_ACCESS_KEY_ID>
# AWS Secret Access Key: <YOUR_SECRET_ACCESS_KEY>
# Default region name: ap-southeast-2
# Default output format: json

aws sts get-caller-identity
```

## 3) EKS 클러스터 생성

설정값 예시:

  - 클러스터 이름: `ex-eks`
  - 리전: `ap-southeast-2`
  - 노드 그룹 이름: `ex-eks-ng`
  - 노드 타입: `t3.medium`
  - 노드 수: `2`
  - 노드 볼륨: `20GiB`
  - AZ: `ap-southeast-2a, ap-southeast-2c`
  - `--with-oidc` 활성화
```Bash
# 형식
eksctl create cluster \
  --name <cluster-name> \
  --region <region> \
  --nodegroup-name <nodegroup-name> \
  --zones <az-1>,<az-2> \
  --nodes 2 \
  --node-type <instance-type> \
  --node-volume-size 20 \
  --managed \
  --with-oidc

# 예시
eksctl create cluster \
  --name ex-eks \
  --region ap-southeast-2 \
  --nodegroup-name ex-eks-ng \
  --zones ap-southeast-2a,ap-southeast-2c \
  --nodes 2 \
  --node-type t3.medium \
  --node-volume-size 20 \
  --managed \
  --with-oidc

# kubectl 자동완성
source <(kubectl completion bash)
echo "source <(kubectl completion bash)" >> ~/.bashrc
```

참고:

  - 생성은 보통 10~20분 소요
  - CloudFormation 스택 이벤트에서도 진행 상태 확인 가능
## 4) 생성 확인 및 기본 배포

```Bash
kubectl get nodes

kubectl create deployment nginx-test --image=nginx:latest --port=80 --replicas=3
kubectl get po

kubectl expose deployment nginx-test --port 80 --type ClusterIP
kubectl get svc -o wide

# ClusterIP -> NodePort
kubectl edit svc nginx-test
kubectl get svc -o wide

# NodePort -> LoadBalancer
kubectl edit svc nginx-test
kubectl get svc -o wide
```

## 5) ECR CLI 사용

```Bash
# 레포 조회
aws ecr describe-repositories --region ap-southeast-2

# 레포 생성
aws ecr create-repository --region ap-southeast-2 --repository-name ses0609/test

# 취약점 스캔 + 암호화 옵션
aws ecr create-repository \
  --region ap-southeast-2 \
  --repository-name ses0609/test \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# 레포 상세
aws ecr describe-repositories --repository-names ses0609/test --region ap-southeast-2

# 레포 삭제(이미지 있으면 --force)
aws ecr delete-repository --repository-name ses0609/test --region ap-southeast-2

# 이미지 조회
aws ecr list-images --repository-name ses0609/nginx --region ap-southeast-2
aws ecr describe-images --repository-name ses0609/nginx --region ap-southeast-2
aws ecr describe-images --repository-name ses0609/nginx --region ap-southeast-2 \
  --query 'sort_by(imageDetails, &imagePushedAt)[*].{Tag:imageTags[0], PushAt:imagePushedAt}' \
  --output table

# 이미지 삭제
aws ecr batch-delete-image --region ap-southeast-2 --repository-name ses0609/nginx \
  --image-ids imageTag=<TAG>
```

## 6) ECR 이미지로 Deployment 생성

```Bash
kubectl create deployment nginx-test \
  --image=036333380579.dkr.ecr.ap-southeast-2.amazonaws.com/ses0609/nginx:latest \
  --port=80 --replicas=3

kubectl describe deployment nginx-test
kubectl expose deployment nginx-test --port 80 --type LoadBalancer
kubectl get svc
```

## 7) YAML로 Deployment/Service 생성

```Bash
kubectl create deployment nginx-deploy --image=nginx:latest \
  --port=80 --replicas=2 --dry-run=client -o yaml > nginx-deploy.yaml
```

```YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deploy
  labels:
    app: nginx-deploy
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx-deploy
  template:
    metadata:
      labels:
        app: nginx-deploy
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
spec:
  selector:
    app: nginx-deploy
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

```Bash
kubectl apply -f nginx-deploy.yaml
kubectl get po,svc
```

## 8) RDS 연동 FastAPI 배포

```Python
# main.py
from fastapi import FastAPI
import pymysql

app = FastAPI()

@app.get("/")
def read_db():
    try:
        con = pymysql.connect(
            host="<RDS_ENDPOINT>",
            user="<DB_USER>",
            password="<DB_PASSWORD>",
            port=3306,
            connect_timeout=5,
        )
        with con.cursor() as cur:
            cur.execute("SELECT 1;")
            row = cur.fetchone()
        con.close()
        return {"message": f"DB OK, SELECT 1 => {row}"}
    except Exception as e:
        return {"message": f"DB FAIL: {type(e).__name__}: {e}"}
```

```Plain Text
# requirements.txt
uvicorn
fastapi
pymysql
cryptography
```

```Docker
# Dockerfile
FROM python:3.11-slim
COPY main.py /app/main.py
COPY requirements.txt /app/
WORKDIR /app
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```YAML
# fastapi-deploy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fastapi-deploy
  labels:
    app: fastapi-deploy
spec:
  replicas: 2
  selector:
    matchLabels:
      app: fastapi-deploy
  template:
    metadata:
      labels:
        app: fastapi-deploy
    spec:
      containers:
      - name: fastapi
        image: 036333380579.dkr.ecr.ap-southeast-2.amazonaws.com/ses0609/fastapi:eks
        ports:
        - containerPort: 8000
---
apiVersion: v1
kind: Service
metadata:
  name: fastapi-svc
spec:
  selector:
    app: fastapi-deploy
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000
  type: LoadBalancer
```

```Bash
kubectl apply -f fastapi-deploy.yaml
```

## 9) Nginx로 FastAPI reverse proxy

```
# default.conf
charset utf-8;

server {
    listen 80;
    server_name _;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://fastapi-svc:8000/;
        proxy_http_version 1.1;
    }
}
```

```Docker
FROM nginx:1.29.3-alpine
COPY index.html /usr/share/nginx/html/
COPY default.conf /etc/nginx/conf.d/
EXPOSE 80
```

```YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deploy
  labels:
    app: nginx-deploy
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx-deploy
  template:
    metadata:
      labels:
        app: nginx-deploy
    spec:
      containers:
      - name: nginx
        image: 036333380579.dkr.ecr.ap-southeast-2.amazonaws.com/ses0609/nginx:eks
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
spec:
  selector:
    app: nginx-deploy
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

```Bash
# fastapi는 내부 호출만 필요하면 ClusterIP로 변경
kubectl edit svc fastapi-svc

kubectl apply -f nginx-deploy.yaml
kubectl get deployment,svc
```

## 10) EKS 삭제

```Bash
kubectl delete -f nginx-deploy.yaml
kubectl delete -f fastapi-deploy.yaml

eksctl delete cluster --name ex-eks --region ap-southeast-2
```

## Checklist

  - `kubectl get nodes`에서 노드 Ready 확인
  - `kubectl get svc`에서 외부 노출 대상 확인
  - ECR 이미지 pull이 정상인지 확인
  - RDS 보안 그룹/서브넷/접근 경로 확인
## Wrap-up

이 글은 EKS 기본 실습(클러스터 생성, 서비스 노출, ECR 배포, RDS 연동, 정리)까지 한 번에 확인하는 입문 흐름입니다. 다음 단계로는 Ingress Controller, HPA, IRSA까지 확장하면 운영에 가까운 구조를 만들 수 있습니다.
