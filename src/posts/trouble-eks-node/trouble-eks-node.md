---
id: 335be0b2-87a1-8170-a914-d9de506efc68
title: '[Trouble Shooting] EKS Node NotReady와 aws-node CrashLoopBackOff'
slug: trouble-eks-node
date:
  start_date: '2026-04-01'
createdTime: 'Wed Apr 01 2026 07:26:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
  - Kubernetes
  - TroubleShooting
  - Network
  - Cloud
category:
  - TroubleShooting
summary: EKS에서 Node가 NotReady로 떨어지고 aws-node가 CrashLoopBackOff에 빠지던 문제 !
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
# [Trouble Shooting] EKS Node NotReady와 aws-node CrashLoopBackOff

이번 이슈는 HPA가 replicas를 크게 늘린 뒤 Pending Pod가 쌓이면서 시작됐다. 처음에는 단순히 HPA 설정 문제처럼 보였지만, 실제로는 새로 늘어난 EKS 노드 일부가 CNI 초기화에 실패하면서 Node가 NotReady로 떨어진 사례였다.

---

# 문제 상황

- airline-flight 네임스페이스에서 HPA로 replicas가 크게 증가했다
- HPA를 삭제했지만 이미 Pending 상태로 생성된 Pod는 남아 있었다
- 새로 뜬 노드 일부가 Ready로 올라오지 못하고 NotReady 상태를 유지했다
```Plain Text
container runtime network not ready: NetworkReady=false reason:NetworkPluginNotReady message:Network plugin returns error: cni plugin not initialized
```

---

# HPA 문제일까 ?

처음에는 HPA가 replicas를 과하게 늘리면서 Pending Pod가 쌓인 것처럼 보였기 때문에, 자연스럽게 HPA 설정 문제를 먼저 의심하게 됐다. 하지만 HPA를 삭제해도 이미 생성된 Pod는 자동으로 정리되지 않았고, 더 중요한 점은 새 노드가 아예 서비스 가능한 상태로 올라오지 못했다는 사실이었다.

```Bash
k scale deploy flight --replicas=1 -n airline-flight
```

즉, HPA 삭제는 오토스케일 제어를 멈출 뿐이고, 현재 replicas와 Pending Pod 정리는 Deployment를 직접 줄여야 한다. 그래서 이번 케이스에서 HPA는 겉으로 드러난 시작점이었지, 핵심 원인은 아니었다.

---

# 직접적인 장애 신호

문제 노드에서 aws-node Pod를 확인하자 공통적으로 :50051 readiness probe 실패가 반복됐다. 이미지는 정상적으로 pull 되었지만 ipamd가 끝까지 올라오지 못했고, 결국 aws-node가 CrashLoopBackOff에 빠졌다.

```Plain Text
Readiness probe failed: timeout: failed to connect service ":50051" within 5s
Liveness probe failed: timeout: failed to connect service ":50051" within 5s
Container aws-node failed liveness probe, will be restarted
```

이 상태가 반복되면서 kubelet은 해당 노드를 NetworkPluginNotReady로 판단했고, Node는 계속 NotReady로 남았다.

참고: [Amazon VPC CNI - Amazon EKS](https://docs.aws.amazon.com/eks/latest/best-practices/vpc-cni.html) / [Configure networking for Amazon EKS clusters](https://docs.aws.amazon.com/eks/latest/userguide/eks-networking.html)

---

# 원인 추적 과정

1. 먼저 IAM 권한 부족을 의심했지만, aws-node service account에는 별도 IRSA role이 연결되어 있었고 흔한 AccessDenied 패턴은 바로 보이지 않았다.
1. 그다음 aws-node 설정을 확인하니 custom networking과 prefix delegation이 모두 활성화되어 있었다.
```Plain Text
AWS_VPC_K8S_CNI_CUSTOM_NETWORK_CFG=true
ENABLE_PREFIX_DELEGATION=true
WARM_PREFIX_TARGET=1
ENI_CONFIG_LABEL_DEF=topology.kubernetes.io/zone
```

1. ENIConfig를 확인해보니 노드 subnet이 아니라 100.64.0.0/24, 100.64.1.0/24 Pod 전용 subnet을 사용하고 있었다.
1. subnet free IP는 남아 있었지만, 최종적으로 AWS에서 확인한 에러는 Client.InsufficientCidrBlocks였다.
참고: [Custom Networking - Amazon EKS](https://docs.aws.amazon.com/eks/latest/best-practices/custom-networking.html) / [Prefix Mode for Linux - Amazon EKS](https://docs.aws.amazon.com/eks/latest/best-practices/prefix-mode-linux.html)

---

# 핵심 원인

이번 환경에서 노드용 subnet은 10.0.0.64/26, 10.0.0.128/26 이었고, Pod 전용 subnet은 100.64.0.0/24, 100.64.1.0/24 였다. 당시 확인한 available IP 수는 노드 subnet 기준으로 각각 48개, 51개였고, Pod subnet 기준으로는 각각 115개, 99개였다.

| 구분 | CIDR | 당시 Available IP |
| --- | --- | --- |
| Node subnet (2a) | 10.0.0.64/26 | 48 |
| Node subnet (2c) | 10.0.0.128/26 | 51 |
| Pod subnet (2a) | 100.64.0.0/24 | 115 |
| Pod subnet (2c) | 100.64.1.0/24 | 99 |

겉으로 보면 IP가 꽤 남아 있는 것처럼 보이지만, 이번 케이스의 핵심은 free IP 총량이 아니라 prefix delegation이 요구하는 연속 CIDR 블록 확보 실패였다. custom networking 환경에서 새 노드가 추가 ENI와 prefix를 확보해야 하는 순간, 일부 노드가 필요한 /28 블록을 얻지 못하면서 aws-node/ipamd 초기화가 실패한 것이다.

> 10.0.0.x 노드 subnet과 100.64.x.x Pod subnet 모두 available IP는 남아 있었지만, 연속된 /28 prefix를 확보하지 못해 Client.InsufficientCidrBlocks가 발생했다.

참고: [Prefix Mode for Linux - Amazon EKS](https://docs.aws.amazon.com/eks/latest/best-practices/prefix-mode-linux.html) / [Prefix delegation for Amazon EC2 network interfaces](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-prefix-eni.html) / [Subnet CIDR reservations - Amazon VPC](https://docs.aws.amazon.com/vpc/latest/userguide/subnet-cidr-reservation.html)

## 왜 /26, /24인데도 부족해 보일 수 있었나

이번 장애를 이해할 때 가장 헷갈렸던 부분은 바로 여기였다. /26, /24 대역이면 숫자만 보면 충분히 여유가 있어 보이는데, 왜 새 노드가 못 뜨는지 처음에는 잘 납득이 되지 않았다.

이유는 VPC CNI가 ENABLE_PREFIX_DELEGATION=true 상태에서 Pod IP를 개별 IP 하나씩 받는 것이 아니라, /28 prefix 단위로 묶어서 확보하기 때문이다. 즉 빈 IP가 여러 개 흩어져 남아 있어도, 붙어 있는 연속 블록이 없으면 새 prefix를 할당하지 못한다.

즉, 새 노드가 뜰 때마다 /28 단위 prefix를 여유분까지 포함해 확보하려고 시도하기 때문에, 숫자상 available IP가 남아 있어도 실제로는 원하는 형태의 연속 블록을 만들지 못하면 바로 실패할 수 있다.

- 개별 IP 총량은 남아 있을 수 있다
- 하지만 prefix delegation은 연속된 /28 블록을 요구한다
- 그래서 AvailableIpAddressCount와 실제 prefix 할당 가능 상태가 다를 수 있다
쉽게 말하면 빈 좌석은 많아 보이는데, 16자리 연속석을 달라고 하면 못 주는 상황과 비슷하다. 이번 케이스에서 free IP 수만 보면 넉넉해 보였지만, 실제로는 새 노드가 필요로 하는 연속 prefix를 확보하지 못해 aws-node가 초기화에 실패했다.

즉, 이번 장애는 단순히 IP 개수가 부족해서가 아니라, ENABLE_PREFIX_DELEGATION=true 상태에서 새 노드가 붙는 순간 필요한 prefix 블록을 확보하지 못한 데서 시작됐다. 이 때문에 기존 노드는 계속 Ready였지만, 스케일아웃으로 새로 생성된 노드들만 복불복처럼 NotReady로 떨어졌다.

참고: [Prefix Mode for Linux - Amazon EKS](https://docs.aws.amazon.com/eks/latest/best-practices/prefix-mode-linux.html) / [Subnet CIDR reservations - Amazon VPC](https://docs.aws.amazon.com/vpc/latest/userguide/subnet-cidr-reservation.html) / [Subnet CIDR blocks - Amazon VPC](https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html)

## 왜 `ENABLE_PREFIX_DELEGATION=true` 로 둬야하는가?

이 설정을 켜는 이유는 Pod IP를 더 효율적으로 확보하고, 노드당 더 많은 Pod를 수용하기 위해서다. prefix delegation을 사용하면 IP를 하나씩 붙이는 대신 /28 단위 블록으로 확보할 수 있어서, 대규모 스케일 환경에서는 Pod 배치 속도와 IP 할당 효율이 좋아진다.

즉, 평소에는 성능과 밀도 측면에서 꽤 유리한 옵션이다. 특히 custom networking을 쓰고 있고 Pod 수가 빠르게 늘어날 수 있는 환경이라면 prefix delegation을 켜 두는 편이 일반적이다.

다만 이번처럼 subnet fragmentation이나 연속 CIDR 확보 문제가 생기면, 장점이 있던 설정이 오히려 장애를 더 빨리 드러내는 트리거가 될 수 있다. 그래서 이 값은 무조건 좋은 값이 아니라, 네트워크 설계와 스케일 패턴까지 함께 맞아야 의미가 있다.

참고: [Prefix Mode for Linux - Amazon EKS](https://docs.aws.amazon.com/eks/latest/best-practices/prefix-mode-linux.html) / [Amazon VPC CNI - Amazon EKS](https://docs.aws.amazon.com/eks/latest/best-practices/vpc-cni.html)

---

# 확인에 사용한 명령

```Bash
k get hpa -n airline-flight
k get nodes
k describe node <notready-node>
k describe pod -n kube-system <aws-node-pod>
k logs -n kube-system <aws-node-pod> -c aws-node --previous --tail=300
k get eniconfig
aws ec2 describe-subnets --subnet-ids <node-subnet-ids> <pod-subnet-ids> --query 'Subnets[*].{Id:SubnetId,Cidr:CidrBlock,AZ:AvailabilityZone,Free:AvailableIpAddressCount}' --output table
aws iam list-attached-role-policies --role-name <vpc-cni-irsa-role>
```

---

# 해결

최종적으로는 Pod 대역을 더 여유 있게 확보한 뒤 다시 노드를 늘려보자, 이전처럼 NotReady로 떨어지지 않고 정상적으로 생성되는 것을 확인할 수 있었다. 이번 케이스에서는 단순히 노드 수를 줄이는 임시 대응보다, prefix delegation이 사용할 수 있는 Pod subnet 여유를 넓히는 방향이 실제 해결에 가까웠다.

운영 관점에서는 scale out을 여러 번 짧게 반복하는 패턴을 줄이고, Pod subnet 크기와 custom networking 설계를 먼저 다시 보는 것이 재발 방지에 더 효과적이다.

참고: [Custom Networking - Amazon EKS](https://docs.aws.amazon.com/eks/latest/best-practices/custom-networking.html) / [Configure networking for Amazon EKS clusters](https://docs.aws.amazon.com/eks/latest/userguide/eks-networking.html)

---

# 정리

이번 이슈는 HPA가 겉으로 드러난 시작점이었을 뿐, 실제 원인은 EKS VPC CNI의 custom networking과 prefix delegation 환경에서 새 노드가 연속 CIDR 블록을 확보하지 못한 데 있었다. Node가 NotReady로 떨어지고 aws-node가 CrashLoopBackOff를 반복할 때는 free IP 총량만 보지 말고, prefix delegation과 Pod subnet까지 같이 봐야 한다.

같은 구조를 운영 중이라면 Pod subnet 설계, prefix delegation 사용 여부, burst scale 패턴, 그리고 필요하면 waiting room이나 rate limiting 같은 유입 제어 전략까지 함께 검토하는 것이 좋다.
