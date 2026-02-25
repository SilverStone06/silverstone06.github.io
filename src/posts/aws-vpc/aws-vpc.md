---
id: 2f4be0b2-87a1-80aa-a913-d0ae311241b4
title: '[AWS] 수동으로 VPC 만들면서 구조 이해하기'
slug: aws-vpc
date:
  start_date: '2025-11-06'
createdTime: 'Mon Jan 26 2026 07:47:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
category:
  - AWS
summary: VPC를 수동으로 생성하며 서브넷·라우팅·게이트웨이 구조를 이해하는 기록
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
이번 글은 AWS 콘솔에서 VPC를 하나씩 수동으로 만들며 네트워크 구조를 익히는 기록입니다.

`VPC -> Public Subnet -> IGW -> Private Subnet -> NAT Gateway -> Endpoint` 순서로 구성합니다.

핵심은 "외부 공개 구간"과 "내부 전용 구간"을 분리해서 관리하는 것입니다.

## 시작 전 목표

이번 설정에서 확인할 내용은 아래 3가지입니다.

  - Public Subnet은 인터넷과 직접 통신할 수 있다.
  - Private Subnet은 NAT를 통해서만 외부로 나간다.
  - 필요한 AWS 서비스(S3 등)는 Endpoint로 내부 연결할 수 있다.
---

## **1) VPC 생성**

먼저 VPC를 생성합니다.

  - Name: `song-vpc`
  - IPv4 CIDR: `10.0.0.0/20`
생성 후 기본 라우팅 테이블 이름을 알아보기 쉬운 이름으로 변경합니다.

  - 예: `song-vpc-rtb`
그리고 VPC 설정에서 `DNS 호스트 이름 활성화`를 켭니다.
이 설정을 켜야 인스턴스 이름 해석이 쉬워집니다.

![image.png](/images/posts/aws-vpc/image1.png)

---

## 2) 라우팅 테이블 생성

VPC를 만든 뒤 라우팅 테이블을 먼저 정리합니다.

  - 기본 라우팅 테이블 이름 변경: `song-vpc-rtb`
  - Public 라우팅용 테이블 생성: `song-public1-rtb`
이 단계에서 라우팅 테이블을 먼저 나눠두면,
뒤에서 Public/Private 서브넷을 연결할 때 구조를 이해하기 쉽습니다.

![image.png](/images/posts/aws-vpc/image2.png)

---

## 3) Public 서브넷 구성

Public 서브넷을 생성합니다.

  - Name: `song-subnet-public1`
  - CIDR 예시: `10.0.0.0/26`
서브넷 설정에서 `IPv4 주소 자동 할당`을 활성화합니다.

이 옵션을 켜면 Public 서브넷에 띄운 인스턴스가 퍼블릭 IP를 자동으로 받을 수 있습니다.

![image.png](/images/posts/aws-vpc/image3.png)

생성한 Public 라우팅 테이블에 해당 서브넷을 연결합니다.

  - 라우팅 테이블 -> 서브넷 연결 편집 -> `song-subnet-public1` 선택
![image.png](/images/posts/aws-vpc/image4.png)

---

## 4) 인터넷 게이트웨이(IGW) 연결

인터넷 게이트웨이를 생성합니다.

  - Name: `song-public1-igw`
그다음 생성한 IGW를 VPC에 연결합니다.
마지막으로 Public 라우팅 테이블에 기본 경로를 추가합니다.

  - Destination: `0.0.0.0/0`
  - Target: Internet Gateway
이 단계가 끝나면 Public Subnet은 인터넷과 직접 통신 가능합니다.

![image.png](/images/posts/aws-vpc/image5.png)

---

## 5) Private 서브넷 구성

Private 서브넷을 생성합니다.

  - Name: `song-subnet-private1`
  - CIDR 예시: `10.0.0.64/26`
`/26`은 IP를 64개 단위로 나눠 관리하기 쉬워서 연습용으로 자주 사용합니다.

중요한 점은 Public 대역과 겹치지 않게 나누는 것입니다.

![image.png](/images/posts/aws-vpc/image6.png)

---

## 6) NAT Gateway + Private 라우팅

Private 인스턴스가 외부로 나갈 수 있도록 NAT Gateway를 생성합니다.

(일반적으로 NAT는 Public Subnet에 생성)

이후 Private 라우팅 테이블을 만들고 다음 경로를 추가합니다.

  - Destination: `0.0.0.0/0`
  - Target: NAT Gateway
그리고 Private 서브넷을 Private 라우팅 테이블에 연결합니다.

![image.png](/images/posts/aws-vpc/image7.png)

![image.png](/images/posts/aws-vpc/image8.png)

![image.png](/images/posts/aws-vpc/image9.png)

이제 Private Subnet은 외부에서 직접 들어올 수 없고, 필요한 아웃바운드만 NAT를 통해 처리할 수 있습니다.

---

## 7) VPC Endpoint 연결(S3 포함)

추가로 Endpoint를 만들면 특정 AWS 서비스로의 통신을 내부 경로로 보낼 수 있습니다.

문서 기준으로는 Private 연결 Endpoint와 S3 Endpoint 구성을 다룹니다.

핵심 포인트

  - Endpoint를 연결할 라우팅 테이블 선택
  - 서비스 유형(예: S3) 선택
  - 정책은 처음엔 기본값으로 시작하고, 익숙해진 뒤 세부 조정
![image.png](/images/posts/aws-vpc/image10.png)

![image.png](/images/posts/aws-vpc/image11.png)

![image.png](/images/posts/aws-vpc/image12.png)

---

## 확인 체크리스트

설정이 끝났다면 아래를 확인하세요.

  - Public 라우팅 테이블에 `0.0.0.0/0 -> IGW`가 있는지
  - Private 라우팅 테이블에 `0.0.0.0/0 -> NAT`가 있는지
  - Public/Private 서브넷이 올바른 라우팅 테이블과 연결됐는지
  - Endpoint가 의도한 라우팅 테이블에 연결됐는지
---

## 마무리

수동으로 VPC를 구성해보면 "왜 이 리소스가 필요한지"가 눈에 잘 들어옵니다.

특히 `IGW`와 `NAT`의 역할 차이, 그리고 `Public/Private` 분리 이유를 이해하는 데 큰 도움이 됩니다.
