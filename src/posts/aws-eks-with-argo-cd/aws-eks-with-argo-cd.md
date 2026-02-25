---
id: 302be0b2-87a1-802e-a679-ccf3cca17aca
title: '[AWS] EKS with Argo CD'
slug: aws-eks-with-argo-cd
date:
  start_date: '2025-12-18'
createdTime: 'Mon Feb 09 2026 00:41:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
category:
  - AWS
summary: EKS에 Argo CD를 연동해 GitOps 배포 흐름을 구성한 실습 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## TL;DR

EKS 클러스터에 Argo CD를 설치하고, GitHub 저장소를 연결해 `Git Push -> ArgoCD Sync -> EKS 반영` 흐름으로 GitOps 배포를 구성하는 실습 정리입니다.

## 시작 전 목표

  - EKS 클러스터와 kubectl 연결을 완료한다.
  - AWS Load Balancer Controller를 설치해 외부 접근 경로를 확보한다.
  - Argo CD를 설치하고 GitHub Repository를 연결한다.
  - Application을 생성해 자동 동기화(Automatic Sync) 배포를 구성한다.
---

## 1) 사전 준비

  - EKS 클러스터: `<CLUSTER_NAME>`
  - 리전: `<AWS_REGION>`
  - VPC ID: `<VPC_ID>`
  - 도구: `awscli`, `kubectl`, `eksctl`, `helm`
```Bash
aws sts get-caller-identity
kubectl get nodes
```

## 2) AWS Load Balancer Controller 설치

```Bash
# OIDC 연결(최초 1회)
eksctl utils associate-iam-oidc-provider --cluster <CLUSTER_NAME> --approve

# IAM ServiceAccount 생성
# 권장: AWS Load Balancer Controller 전용 정책 ARN 사용
eksctl create iamserviceaccount \
  --cluster=<CLUSTER_NAME> \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=<AWS_LOAD_BALANCER_CONTROLLER_POLICY_ARN> \
  --override-existing-serviceaccounts \
  --approve

# Helm repo
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# 컨트롤러 설치/업데이트
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=<CLUSTER_NAME> \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=<AWS_REGION> \
  --set vpcId=<VPC_ID>

kubectl get deployment -n kube-system aws-load-balancer-controller
```

## 3) Git 저장소 구조(예시)

```Plain Text
eks-with-argocd/
- .github/workflows/
- fastapi/
  - Dockerfile
  - main.py
  - requirements.txt
- nginx/
  - Dockerfile
  - default.conf
  - html/
- k8s/
  - web-deploy-cluster-ip.yaml
  - ingress.yaml
```

## 4) GitHub Secrets (설명형)

실제 값은 절대 문서에 남기지 않고 GitHub Secrets에만 저장합니다.

| Secret Name | Secret Value (설명) |
| --- | --- |
| `AWS_ACCESS_KEY_ID` | GitHub Actions에서 AWS API 호출에 사용하는 Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | Access Key ID와 짝으로 사용하는 Secret Access Key |
| `AWS_REGION` | 배포 대상 AWS 리전 코드 |
| `ECR_REPOSITORY` | Nginx 이미지용 ECR 리포지토리 경로 |
| `ECR_REPOSITORY_FASTAPI` | FastAPI 이미지용 ECR 리포지토리 경로 |
| `S3_BUCKET_NAME` | 정적 파일/설정 파일 저장 버킷 이름 |
| `ASG_TAG_KEY` | 배포 대상 인스턴스 식별용 태그 키 |
| `EC2_INSTANCE_TAG` | 배포 대상 인스턴스 식별용 태그 값 |

## 5) GitHub Actions (ECR 빌드/푸시 예시)

```YAML
name: Build and Push to ECR

on:
  push:
    branches: ["main"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build & Push Nginx
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/${{ secrets.ECR_REPOSITORY }}:nginx-$IMAGE_TAG ./nginx
          docker push $ECR_REGISTRY/${{ secrets.ECR_REPOSITORY }}:nginx-$IMAGE_TAG
```

## 6) Argo CD 설치

```Bash
# namespace 생성
kubectl create namespace argocd

# 설치
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 외부 노출 (학습용)
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# 상태 확인
kubectl get svc argocd-server -n argocd
```

초기 비밀번호 확인:

```Bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

## 7) Argo CD에 Git Repository 연결

Argo CD UI에서 아래로 연결합니다.

  - `Settings -> Repositories -> Connect Repo`
  - `Repository URL`: `<GITHUB_REPOSITORY_URL>`
  - `Username`: `<GITHUB_USERNAME>`
  - `Password`: GitHub PAT (repo scope)
보안 규칙:

  - PAT 원문(`ghp_...`)은 문서/스크린샷에 남기지 않습니다.
  - 노출 시 즉시 Revoke 후 재발급합니다.
## 8) Argo CD Application 생성

`Applications -> NEW APP`

  - Application Name: `<ARGO_APP_NAME>`
  - Project: `default`
  - Sync Policy: `Automatic`
  - Repository URL: `<GITHUB_REPOSITORY_URL>`
  - Revision: `HEAD`
  - Path: `k8s`
  - Cluster URL: `https://kubernetes.default.svc`
  - Namespace: `default`
## 9) 배포 확인

```Bash
kubectl get pods,svc -n default
kubectl get ingress -n default
```

Argo CD에서 확인:

  - `Synced`
  - `Healthy`
## 트러블슈팅

  - `OutOfSync`
    - Git repo `path` 오타, branch mismatch 확인
  - `LoadBalancer Pending`
    - Subnet 태그 및 LB Controller 상태 확인
  - Argo CD 접속 불가
    - `argocd-server` 서비스 타입/보안그룹/라우팅 확인
  - 이미지 Pull 실패
    - ECR 권한 및 태그 확인
## 확인 체크리스트

  - Argo CD UI 접근 가능
  - Repository 연결 성공
  - Application이 `Synced/Healthy`
  - Git Push 시 자동 동기화 반영
## 마무리

EKS + Argo CD의 핵심은 `Git을 단일 배포 소스(Source of Truth)`로 두고, 클러스터 반영을 자동화하는 것입니다. 이후에는 `dev/prod 분리`, `PR 기반 승인`, `롤백 전략`까지 붙이면 운영 안정성이 크게 올라갑니다.

## 참고
