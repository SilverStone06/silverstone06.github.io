---
id: 30cbe0b2-87a1-81bf-b874-c0a39dc72d59
title: '[Cloud] AWS VPC vs GCP VPC 차이점 정리'
slug: aws-vpc-vs-gcp-vpc-differences
date:
  start_date: '2026-01-22'
createdTime: 'Thu Feb 19 2026 05:28:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - Project
category:
  - Project
summary: AWS와 GCP VPC 차이를 리전/NAT/보안/라우팅 관점으로 비교 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## 실습/학습 목표

AWS와 GCP에서 네트워크를 설계할 때 헷갈리기 쉬운 VPC 개념 차이를 한 번에 정리합니다.

## 한눈에 보는 핵심 차이

| 항목 | AWS | GCP |
| --- | --- | --- |
| VPC 스코프 | **리전 단위** | **글로벌 단위** |
| 서브넷 스코프 | 리전 단위 | 리전 단위 |
| 라우터/NAT | NAT Gateway(관리형), AZ 단위 설계 권장 | Cloud Router + Cloud NAT |
| 기본 라우팅 | VPC 라우팅 테이블 중심 | VPC 네트워크 라우트 + 동적 라우팅 옵션 |
| 보안 모델 | Security Group(상태저장) + NACL(무상태) | VPC Firewall Rule(주로 상태저장, 태그/서비스계정 타깃) |
| 피어링 특징 | 전이 라우팅 미지원 | 전이 라우팅 미지원 |

## 1) VPC 범위: Regional vs Global

AWS VPC는 리전 단위 자원입니다. 예를 들어 `ap-northeast-2`와 `us-east-1`은 각각 별도 VPC로 설계해야 합니다.

GCP VPC는 글로벌 리소스입니다. 하나의 VPC 안에 여러 리전 서브넷을 두고 운영할 수 있어 멀티리전 확장 시 네트워크 일관성이 좋습니다.

정리하면:

  - AWS: 리전별 VPC를 복수 운영하는 패턴이 일반적
  - GCP: 글로벌 VPC 하나 + 리전별 서브넷 확장 패턴이 일반적
## 2) 서브넷과 라우팅 관점

서브넷은 AWS/GCP 모두 리전 단위입니다. 다만 운영 관점이 다릅니다.

  - AWS: VPC 자체가 리전 단위라 리전 분리 설계가 명확함
  - GCP: 글로벌 VPC 내 리전 서브넷을 묶어 관리 가능
라우팅도 접근이 다릅니다.

  - AWS: 라우팅 테이블과 서브넷 연결을 명시적으로 관리
  - GCP: 네트워크 전역 라우트 + 필요 시 동적 라우팅(BGP) 활용
## 3) NAT 구성 차이

### AWS NAT

  - 일반적으로 Public Subnet에 NAT Gateway 배치
  - Private Subnet의 기본 경로(`0.0.0.0/0`)를 NAT Gateway로 전달
  - 고가용성을 위해 AZ별 NAT Gateway를 배치하는 설계가 자주 쓰임
### GCP NAT

  - Cloud NAT는 Cloud Router와 연결해 구성
  - Private VM이 외부로 나갈 때 공인 IP 없이 egress 가능
  - 글로벌 VPC 기반이지만 NAT 동작은 리전/라우터 구성 단위로 설계
실무 체크 포인트:

  - AWS: AZ 장애 격리와 NAT 비용/가용성 균형
  - GCP: Cloud Router/Cloud NAT 범위(리전, 서브넷 선택) 명확화
## 4) 보안 모델 차이

### AWS

  - Security Group: 인스턴스(ENI) 단위, 상태저장
  - NACL: 서브넷 단위, 무상태
### GCP

  - VPC Firewall Rule 중심
  - 타깃을 네트워크 태그/서비스 계정으로 지정 가능
  - ingress/egress 규칙을 중앙에서 관리하는 패턴이 흔함
## 5) 멀티리전/하이브리드 확장 시 영향

  - AWS: 리전 간은 VPC Peering, Transit Gateway, VPN/Direct Connect 조합으로 설계
  - GCP: 글로벌 VPC 기반으로 리전 확장 단순화, 필요 시 Cloud VPN/Interconnect 조합
공통 주의점:

  - VPC Peering은 전이 라우팅을 기본 지원하지 않으므로 허브-스포크 구조에서는 별도 설계가 필요
## 6) 어떤 상황에서 무엇이 유리한가

  - AWS VPC가 유리한 경우
    - 리전 단위 격리 정책이 명확한 조직
    - 계정/리전 단위 거버넌스를 강하게 분리해야 하는 환경
  - GCP VPC가 유리한 경우
    - 멀티리전 서비스를 빠르게 확장해야 하는 환경
    - 글로벌 단일 네트워크 관점으로 운영 복잡도를 줄이고 싶은 경우
## 최종 점검 체크리스트

  - 서비스 확장 방향이 리전 중심인지 글로벌 중심인지
  - NAT 설계가 가용성/비용 기준에 맞는지
  - 방화벽/보안정책 운영 주체가 명확한지
  - 피어링/허브-스포크에서 전이 라우팅 제약을 반영했는지
## 마무리

AWS와 GCP 모두 VPC의 목적은 같지만, **스코프(Regional vs Global)**와 **NAT/보안 운영 모델**이 달라 설계 감각이 다릅니다. 초기에 이 차이를 기준으로 아키텍처를 잡아두면 이후 확장과 운영에서 시행착오를 크게 줄일 수 있습니다.
