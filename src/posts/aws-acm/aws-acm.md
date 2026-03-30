---
id: 328be0b2-87a1-81c5-9333-fdd542b2c22b
title: '[AWS] ACM 정리'
slug: aws-acm
date:
  start_date: '2026-03-19'
createdTime: 'Thu Mar 19 2026 03:13:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Private
type:
  - Post
tags:
  - AWS
  - Network
  - Cloud
category:
  - AWS
summary: AWS ACM에서 TLS 인증서를 발급하고 검증해서 연결하는 과정을 정리한 글 !
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
# AWS ACM 정리: TLS 인증서 발급, 검증, 연결까지

HTTPS를 붙이려면 결국 TLS 인증서가 필요합니다. 문제는 인증서를 직접 발급하고, 서버에 넣고, 만료일을 챙기고, 갱신까지 관리하는 일이 생각보다 번거롭다는 점입니다. AWS에서는 이 과정을 `AWS Certificate Manager`, 즉 `ACM`이 많이 대신해줍니다.

---

## TL;DR

  - `ACM`은 AWS에서 TLS 인증서를 발급, 관리, 갱신할 수 있게 도와주는 서비스입니다.
  - 퍼블릭 인증서는 보통 `DNS validation`으로 검증하는 것이 가장 실무적이고 자동 갱신에도 유리합니다.
  - `ALB`, `CloudFront`, `API Gateway` 같은 AWS 서비스와 연동할 때 ACM이 특히 편합니다.
  - `CloudFront`에 연결할 인증서는 반드시 `us-east-1` 리전에 있어야 한다는 점을 자주 놓칩니다.
---

## 시작 전 목표

이 글의 목표는 ACM을 처음 보는 기준으로 **무엇을 하는 서비스인지**, **어떻게 인증서를 발급하고 검증하는지**, **어디에 연결하는지**, **실무에서 자주 헷갈리는 포인트가 무엇인지**를 한 번에 이해하는 것입니다.

---

## 1) ACM이 하는 일

`ACM`은 AWS에서 TLS 인증서를 발급하고, 연결 가능한 서비스에 붙이고, 만료 전에 갱신까지 관리할 수 있게 해주는 서비스입니다. 직접 `openssl`로 CSR을 만들고 인증서를 설치하는 전통적인 방식보다 운영 부담이 훨씬 적습니다.

특히 AWS 리소스와 통합될 때 장점이 큽니다. `ALB`, `CloudFront`, `API Gateway` 같은 서비스는 ACM 인증서를 바로 선택해 붙일 수 있어, 인증서 파일을 직접 서버에 복사하지 않아도 됩니다.

---

## 2) TLS 인증서가 왜 필요한가

TLS 인증서는 크게 두 가지 역할을 합니다. 첫째, 클라이언트와 서버 사이 통신을 암호화합니다. 둘째, 사용자가 접속한 서버가 진짜 해당 도메인의 소유자인지 신뢰할 수 있게 해줍니다.

즉 `https://example.com`에 접속했을 때 브라우저가 자물쇠 표시를 보여주는 이유는 단순히 암호화뿐 아니라, 해당 도메인에 대한 인증서가 신뢰 가능한 기관을 통해 검증되었기 때문입니다.

---

## 3) ACM에서 다루는 인증서 종류

### 퍼블릭 인증서

퍼블릭 인증서는 인터넷 사용자에게 공개되는 웹 서비스에 붙이는 인증서입니다. 예를 들어 `api.example.com`이나 `www.example.com`에 HTTPS를 적용할 때 사용합니다. ACM에서 요청하면 AWS 통합 서비스에 바로 연결할 수 있습니다.

### 가져온 인증서

이미 외부 CA에서 발급받은 인증서가 있다면 ACM으로 가져와서 사용할 수도 있습니다. 다만 이 경우에는 발급과 갱신 자체를 ACM이 대신 해주는 것이 아니라, 가져온 인증서를 AWS 서비스에 연결하기 쉽게 해주는 쪽에 가깝습니다.

### 프라이빗 인증서

사내 서비스나 내부 시스템처럼 퍼블릭 인터넷에서 신뢰할 필요가 없는 환경에서는 `AWS Private CA`와 함께 프라이빗 인증서를 사용할 수 있습니다. 이 글에서는 주로 웹 서비스 HTTPS에 많이 쓰는 퍼블릭 인증서를 기준으로 설명합니다.

---

## 4) ACM에서 퍼블릭 인증서 발급 흐름

### 1. 도메인 이름 입력

먼저 인증서를 적용할 도메인을 입력합니다. 예를 들어 `example.com`, `www.example.com`, `api.example.com` 같은 이름을 넣습니다. 여러 도메인을 함께 넣을 수도 있고, 필요하면 `*.example.com` 같은 와일드카드도 사용할 수 있습니다.

### 2. 검증 방식 선택

도메인 소유권을 증명해야 인증서가 발급됩니다. ACM에서는 보통 `DNS validation`과 `Email validation`을 선택할 수 있는데, 실무에서는 거의 항상 `DNS validation`을 먼저 고려합니다.

### 3. DNS 레코드 추가

`DNS validation`을 선택하면 ACM이 특정 `CNAME` 검증 레코드를 제시합니다. 이 값을 Route 53이나 사용 중인 DNS 서비스에 추가하면, ACM이 도메인 소유권을 확인하고 인증서를 발급합니다.

### 4. 서비스에 연결

인증서 상태가 `Issued`가 되면 ALB 리스너, CloudFront 배포, API Gateway 커스텀 도메인 같은 곳에서 해당 인증서를 선택해 HTTPS를 적용할 수 있습니다.

---

## 5) 왜 DNS validation을 많이 쓰는가

`DNS validation`은 한 번 레코드를 정확히 넣어두면 갱신 시에도 사람이 개입할 일이 거의 없습니다. ACM이 동일한 검증 관계를 바탕으로 자동 갱신을 처리할 수 있기 때문입니다.

반면 `Email validation`은 도메인 메일 주소 확인이 필요하고 운영 과정에서 사람이 확인하지 못하면 갱신이 끊길 수 있습니다. 그래서 실무에서는 DNS validation이 훨씬 안정적입니다.

---

## 6) 어디에 붙일 수 있나

### ALB

`Application Load Balancer`에서는 HTTPS 리스너를 만들 때 ACM 인증서를 선택하면 됩니다. 가장 흔한 구성은 `Route 53 -> ALB -> EC2/ECS/EKS` 흐름입니다.

### CloudFront

`CloudFront`는 정적 사이트나 전역 배포에서 자주 사용되는데, 여기서 중요한 점은 **CloudFront에 연결할 ACM 인증서는 `N. Virginia`, 즉 `us-east-1` 리전에 있어야 한다는 것**입니다. 다른 리전에 만든 인증서는 CloudFront에서 선택할 수 없습니다.

### API Gateway

커스텀 도메인을 붙이는 경우 ACM 인증서를 연결해서 HTTPS 엔드포인트를 구성할 수 있습니다. 외부 사용자가 보는 API 엔드포인트를 정리할 때 자주 사용합니다.

---

## 7) 운영할 때 자주 헷갈리는 포인트

  - ACM이 인증서를 발급해도, 그것이 자동으로 서비스에 연결되는 것은 아닙니다. `ALB`, `CloudFront`, `API Gateway` 같은 대상 리소스에 직접 연결해야 합니다.
  - 검증이 안 되면 대부분은 DNS 레코드가 잘못 들어갔거나, 전파가 끝나지 않았거나, 다른 DNS 서비스에 잘못 넣은 경우입니다.
  - CloudFront용 인증서는 `us-east-1`이어야 하고, 이 점 때문에 인증서는 발급됐는데 콘솔에서 선택이 안 되는 경우가 많습니다.
  - 가져온 인증서는 ACM이 자동 갱신을 대신해주지 않으므로 만료 관리 책임이 남아 있습니다.
---

## 확인 체크리스트

  - 도메인 이름이 정확한지 확인합니다. apex와 서브도메인을 각각 필요한 만큼 넣습니다.
  - 가능하면 `DNS validation`을 선택합니다.
  - 검증용 CNAME 레코드를 정확한 DNS zone에 추가했는지 확인합니다.
  - 인증서 상태가 `Issued`인지 확인한 뒤 대상 서비스에 연결합니다.
  - CloudFront라면 인증서 리전이 `us-east-1`인지 다시 확인합니다.
---

## 마무리

ACM은 단순히 인증서를 발급하는 서비스가 아니라, AWS 환경에서 HTTPS 운영을 훨씬 단순하게 만들어주는 관리 서비스에 가깝습니다. 특히 DNS validation과 자동 갱신을 잘 활용하면 인증서 만료 사고를 크게 줄일 수 있습니다.

처음에는 `인증서 요청 -> DNS 검증 -> Issued 확인 -> 대상 서비스 연결` 이 네 단계만 정확히 기억해도 충분합니다. 이후에는 CloudFront 리전 제약이나 가져온 인증서의 갱신 책임 같은 운영 포인트를 함께 익히면 됩니다.

---

## 참고 자료

[AWS Certificate Manager User Guide](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html)

[DNS validation for ACM certificates](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)

[CloudFront requires ACM certificates in us-east-1](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)
