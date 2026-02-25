---
id: 303be0b2-87a1-804a-863c-c96fd030d04d
title: '[GCP] 기본적인 서비스 사용'
slug: gcp-core-services
date:
  start_date: '2026-01-13'
createdTime: 'Tue Feb 10 2026 01:14:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - GCP
category:
  - GCP
summary: 'GCP 기본 서비스(VPC, Subnet, NAT, VM, DB) 사용 흐름 정리'
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
GCP의 서브넷, vpc, nat, gateway등의 리전

특수 서브넷 - proxy, private service connect, management subnet

## 실습 목표

  - VPC/Subnet 구조를 먼저 설계하고 Public/Private 역할을 분리합니다.
  - Private 자원의 인터넷 아웃바운드는 Cloud NAT로 처리합니다.
  - VM 생성 시 네트워크/보안 옵션을 함께 검토합니다.
  - Cloud SQL(MySQL) 생성 시 접속 방식(Public/Private)을 확인합니다.
## 보는 순서

  1. 상단 네트워크 리소스 화면: VPC/서브넷 기본 구조 확인
  1. NAT 설정 화면: Private Subnet의 아웃바운드 경로 확보
  1. Routes 화면: 기본 경로/우선순위 점검
  1. VM 인스턴스 화면: 머신/디스크/네트워킹 설정 확인
  1. Cloud SQL 화면: DB 인스턴스 생성 및 연결 방식 확인
![image.png](/images/posts/gcp-core-services/image1.png)

![image.png](/images/posts/gcp-core-services/image2.png)

![image.png](/images/posts/gcp-core-services/image3.png)

![image.png](/images/posts/gcp-core-services/image4.png)

## NAT 설정

Cloud NAT

이 구간은 **Private VM이 외부 인터넷으로 나갈 수 있게** 만드는 설정입니다.

  - Cloud NAT 자체는 인바운드가 아니라 아웃바운드 전용입니다.
  - NAT를 만들 때 Cloud Router가 필요하며, 둘 다 같은 리전으로 맞춰야 합니다.
  - 대상 서브넷을 잘못 선택하면 Private VM에서 패키지 설치/업데이트가 실패합니다.
![image.png](/images/posts/gcp-core-services/image5.png)

  - 라우터 없으면 만들기
![image.png](/images/posts/gcp-core-services/image6.png)

  - ipv4 서브넷 범위는 추후 gks 쓸꺼면 보조 서브넷도 같이 주면 좋음.
## routes

![image.png](/images/posts/gcp-core-services/image7.png)

이 화면에서는 라우팅 테이블을 확인합니다.

  - `0.0.0.0/0` 기본 경로가 어디를 향하는지 먼저 확인합니다.
  - 커스텀 라우트가 있을 경우 우선순위(priority) 충돌 여부를 확인합니다.
  - NAT/게이트웨이 설정 후에는 라우트 반영 상태를 꼭 다시 점검합니다.
## VM 인스턴스

### 머신구성

VM 생성은 보통 `머신 타입 -> 디스크 -> 네트워크` 순으로 확인합니다.

  - Public VM은 외부 IP를 할당하고, Private VM은 외부 IP 없이 내부 통신만 허용합니다.
  - 방화벽은 필요한 포트만 최소 허용(예: SSH 22, 서비스 포트)하는 방식이 안전합니다.
  - 네트워크 서비스 계층(Premium/Standard)은 비용/지연에 영향이 있으니 목적에 맞게 선택합니다.
![image.png](/images/posts/gcp-core-services/image8.png)

![image.png](/images/posts/gcp-core-services/image9.png)

### OS 및 스토리지

부팅 디스크 변경

![image.png](/images/posts/gcp-core-services/image10.png)

### 데이터 보호

백업 없음 선택

### 네트워킹

![image.png](/images/posts/gcp-core-services/image11.png)

![image.png](/images/posts/gcp-core-services/image12.png)

![image.png](/images/posts/gcp-core-services/image13.png)

  - 외부 IPv4 주소 임시 == public , 없음 == private
  - 네트워크 서비스 계층 프리미엄, 표준 차이 알 것
## MYSQL 인스턴스 만들기

Cloud SQL → MYSQL 인스턴스 만들기

Cloud SQL 생성 단계에서는 아래를 먼저 결정합니다.

  - 연결 방식: Public IP(테스트) / Private IP(운영 권장)
  - 리전/머신 타입/스토리지 크기
  - 백업/복구(PITR)와 고가용성(HA) 사용 여부
운영 환경에서는 DB 비밀번호를 문서에 남기지 않고 Secret Manager로 분리하는 것을 권장합니다.

![image.png](/images/posts/gcp-core-services/image14.png)

![image.png](/images/posts/gcp-core-services/image15.png)

![image.png](/images/posts/gcp-core-services/image16.png)

## 최종 점검 체크리스트

  - VPC/Subnet CIDR가 충돌 없이 구성되었는지 확인
  - Private VM이 Cloud NAT를 통해 아웃바운드 가능한지 확인
  - 방화벽 규칙이 최소 권한으로 설정됐는지 확인
  - Cloud SQL 인스턴스가 `RUNNABLE` 상태인지 확인
  - 애플리케이션에서 DB 연결 테스트가 성공했는지 확인
## 마무리

이번 실습은 GCP 네트워크 기초(VPC/Subnet/Route/NAT)와 컴퓨트(VM), 데이터베이스(Cloud SQL)까지 한 번에 연결해 보는 흐름입니다.

핵심은 **Public/Private 역할 분리**와 **Private 자원의 아웃바운드 경로(NAT)**를 정확히 잡는 것입니다.

다음 단계로는 IAP 기반 접속, 방화벽 최소 권한 정책, Cloud SQL Private IP 고정 구성까지 확장하면 운영에 더 가까운 구조를 만들 수 있습니다.
