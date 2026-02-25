---
id: 2ffbe0b2-87a1-8091-879a-efb5a7417141
title: '[AWS] EKS 사용 예시'
slug: aws-eks-사용-예시
date:
  start_date: '2025-12-15'
createdTime: 'Fri Feb 06 2026 00:58:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
category:
  - AWS
summary: EKS 실무 사용 예시와 필수 명령 흐름을 단계별로 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## TL;DR

기존 VPC/Subnet을 재사용해 `eksctl`로 EKS 클러스터를 만들고, `AWS Load Balancer Controller`까지 설치해 `Service type=LoadBalancer`를 정상 동작시키는 실습 정리입니다.

## 시작 전 목표

  - 로컬에서 `awscli`, `eksctl`, `kubectl`, `helm`을 준비한다.
  - 기존 네트워크(VPC/Subnet) 태그를 EKS 요구사항에 맞춘다.
  - `eksctl` 설정 파일 기반으로 클러스터/노드그룹을 생성·관리한다.
  - ALB/NLB 연동을 위한 컨트롤러를 설치하고 서비스 노출을 검증한다.
---

## 1) 로컬 도구 설치 및 AWS 인증

```PowerShell
# Chocolatey 설치 (Windows)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iwr https://community.chocolatey.org/install.ps1 -UseBasicParsing | iex

# eksctl 설치
choco install eksctl -y
eksctl version

# kubectl 설치
choco install kubernetes-cli -y
kubectl version --client

# Helm 설치
winget install Helm.Helm
helm version

# AWS 인증
aws configure
aws sts get-caller-identity
```

## 2) 네트워크 정보 정리

실사용 값은 아래 placeholder 위치에 입력합니다.

  - `VPC_ID`: `<VPC_ID>`
  - `Public Subnet IDs`: `<PUB_SUBNET_A>`, `<PUB_SUBNET_B>`, `<PUB_SUBNET_C>`
  - `Private Subnet IDs`: `<PRI_SUBNET_A>`, `<PRI_SUBNET_B>`, `<PRI_SUBNET_C>`
  - `Cluster Name`: `<CLUSTER_NAME>`
  - `Region`: `<AWS_REGION>`
## 3) VPC/Subnet 필수 태그

EKS가 서브넷을 인식하려면 아래 태그가 필요합니다.

  - VPC/Public/Private 공통
    - `kubernetes.io/cluster/<CLUSTER_NAME>` = `shared`
  - Public Subnet
    - `kubernetes.io/role/elb` = `1`
  - Private Subnet
    - `kubernetes.io/role/internal-elb` = `1`
## 4) `create_cluster.yaml` 예시

```YAML
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: <CLUSTER_NAME>
  region: <AWS_REGION>
  version: "1.31"

vpc:
  id: "<VPC_ID>"
  subnets:
    public:
      ap-southeast-2a: { id: "<PUB_SUBNET_A>" }
      ap-southeast-2b: { id: "<PUB_SUBNET_B>" }
      ap-southeast-2c: { id: "<PUB_SUBNET_C>" }
    private:
      ap-southeast-2a: { id: "<PRI_SUBNET_A>" }
      ap-southeast-2b: { id: "<PRI_SUBNET_B>" }
      ap-southeast-2c: { id: "<PRI_SUBNET_C>" }
  clusterEndpoints:
    publicAccess: true
    privateAccess: true

managedNodeGroups:
  - name: <NODEGROUP_NAME>
    instanceType: t3.medium
    desiredCapacity: 2
    minSize: 1
    maxSize: 3
    volumeSize: 20
    privateNetworking: true
    iam:
      withAddonPolicies:
        imageBuilder: true
        autoScaler: true
        albIngress: true
        cloudWatch: true
        ebs: true

iam:
  withOIDC: true
```

## 5) 클러스터 생성/운영 명령

```Bash
# 생성
eksctl create cluster -f create_cluster.yaml

# kubeconfig 연결 확인
kubectl get nodes

# 노드 개수 조정
eksctl scale nodegroup \
  --cluster=<CLUSTER_NAME> \
  --name=<NODEGROUP_NAME> \
  --nodes=2 --nodes-min=1 --nodes-max=3

# 스택 상태 확인
eksctl utils describe-stacks --cluster <CLUSTER_NAME>

# 삭제
eksctl delete cluster -f create_cluster.yaml
```

## 6) 샘플 워크로드 배포 (`pod_svc.yaml`)

```YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-project
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-project
  template:
    metadata:
      labels:
        app: web-project
    spec:
      containers:
        - name: nginx
          image: <ECR_NGINX_IMAGE_URI>
          ports:
            - containerPort: 80
        - name: fastapi
          image: <ECR_FASTAPI_IMAGE_URI>
          ports:
            - containerPort: 8000
---
apiVersion: v1
kind: Service
metadata:
  name: web-project-svc
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "instance"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  type: LoadBalancer
  selector:
    app: web-project
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 80
    - name: api
      protocol: TCP
      port: 8000
      targetPort: 8000
```

```Bash
kubectl apply -f pod_svc.yaml
kubectl get pods,svc -o wide
```

## 7) AWS Load Balancer Controller 설치

`Service type=LoadBalancer`가 Pending이면 이 단계가 필요합니다.

```Bash
# OIDC 연결(최초 1회)
eksctl utils associate-iam-oidc-provider --cluster <CLUSTER_NAME> --approve

# Helm repo
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# IAM ServiceAccount 생성
# 권장: AWSLoadBalancerController 정책 ARN 사용
eksctl create iamserviceaccount \
  --cluster=<CLUSTER_NAME> \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=<AWS_LOAD_BALANCER_CONTROLLER_POLICY_ARN> \
  --approve

# 컨트롤러 설치
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=<CLUSTER_NAME> \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=<AWS_REGION> \
  --set vpcId=<VPC_ID>

kubectl get deployment -n kube-system aws-load-balancer-controller
```

## 8) 트러블슈팅

  - `EXTERNAL-IP`가 Pending
    - Subnet 태그(`elb`/`internal-elb`) 누락 여부 확인
    - AWS Load Balancer Controller 설치 상태 확인
    - Worker Node IAM 권한 및 OIDC 연결 확인
  - 서비스 접근 불가
    - Node SG/Target SG 인바운드(80, 8000) 확인
    - NACL/Route Table에서 통신 경로 확인
  - 이미지 Pull 실패
    - Node Role의 ECR 권한 확인
    - 이미지 URI/태그 오타 확인
## 확인 체크리스트

  - `kubectl get nodes` 결과가 `Ready`다.
  - `kubectl get svc`에서 `EXTERNAL-IP`가 할당된다.
  - Nginx(80), FastAPI(8000) 모두 응답한다.
  - `eksctl scale nodegroup`으로 노드 수 조절이 된다.
## 마무리

핵심은 `네트워크 태그`, `OIDC`, `Load Balancer Controller` 3가지를 정확히 맞추는 것입니다. 이 3개가 맞으면 EKS 기본 배포 흐름이 안정적으로 동작합니다.
