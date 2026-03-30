---
id: 328be0b2-87a1-81b4-86d4-da2328bf4004
title: '[AWS] WAF 정리'
slug: aws-waf
date:
  start_date: '2026-03-26'
createdTime: 'Thu Mar 19 2026 07:09:00 GMT+0000 (Coordinated Universal Time)'
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
summary: 'AWS WAF에서 웹 ACL, 규칙, Managed Rules를 어떻게 봐야 하는지 정리한 글 !'
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
# AWS WAF 정리: 웹 ACL, 규칙, Managed Rules까지

웹 서비스를 운영하다 보면 정상 사용자 요청만 들어오는 것이 아니라 봇, 스캐너, 과도한 요청, 단순 취약점 탐색 같은 트래픽도 함께 들어옵니다. `AWS WAF`는 이런 HTTP(S) 요청을 애플리케이션 앞단에서 검사하고, 허용하거나 차단하거나 기록할 수 있게 도와주는 서비스입니다.

---

## TL;DR

  - `AWS WAF`는 웹 애플리케이션 앞에서 요청을 검사해 허용, 차단, 카운트할 수 있는 웹 방화벽 서비스입니다.
  - 핵심 구성 요소는 `web ACL`, `rule`, `rule group`, `managed rule group`입니다.
  - 처음 시작할 때는 `Managed Rules`와 `Rate-based rule`부터 적용하고, 바로 차단하지 말고 `Count` 모드로 먼저 튜닝하는 편이 안전합니다.
  - CloudFront, ALB, API Gateway 같은 서비스 앞단에서 붙여 쓰는 그림을 먼저 이해하면 AWS WAF가 훨씬 쉬워집니다.
---

## 시작 전 목표

이 글의 목표는 AWS WAF를 처음 보는 기준으로 **무엇을 보호하는 서비스인지**, **web ACL과 rule이 어떻게 연결되는지**, **Managed Rules를 어떻게 써야 하는지**, **실무에서 어떤 순서로 적용하면 좋은지**를 한 번에 이해하는 것입니다.

---

## 1) AWS WAF가 하는 일

AWS WAF는 들어오는 웹 요청을 기준으로 조건을 검사하고, 그 결과에 따라 요청을 `Allow`, `Block`, `Count`, `CAPTCHA`, `Challenge` 같은 방식으로 처리할 수 있게 해줍니다. 쉽게 말하면 애플리케이션 코드에 도달하기 전에 한 번 더 걸러주는 보안 필터입니다.

중요한 점은 네트워크 레벨 전체를 보호하는 방화벽이라기보다, **HTTP(S) 요청 기반으로 동작하는 애플리케이션 계층 보안 서비스**에 가깝다는 것입니다. 그래서 URL, 헤더, 쿼리 문자열, IP, 바디 일부 같은 웹 요청 요소를 기준으로 룰을 만들 수 있습니다.

---

## 2) 핵심 구성 요소

### Web ACL

`web ACL`은 AWS WAF 설정의 가장 바깥쪽 컨테이너입니다. 실제로 CloudFront나 ALB 같은 리소스에 연결하는 단위도 web ACL입니다. 여러 규칙을 모아두고, 어떤 요청을 기본적으로 허용할지 또는 차단할지 기본 동작도 여기서 결정합니다.

### Rule

`rule`은 개별 검사 조건입니다. 예를 들어 특정 IP를 차단하거나, `/login` 경로에 대한 과도한 요청을 세거나, SQL injection 패턴을 탐지하는 식입니다.

### Rule Group

`rule group`은 여러 개의 rule을 재사용 가능한 묶음으로 만든 것입니다. 직접 만든 규칙 모음을 여러 web ACL에 다시 붙이고 싶을 때 유용합니다.

### Managed Rule Group

`managed rule group`은 AWS나 서드파티가 관리해주는 규칙 묶음입니다. 처음부터 모든 공격 패턴을 직접 정의하기 어렵기 때문에, 실무에서는 보통 이 기능부터 활용합니다.

---

## 3) 어디에 붙여서 쓰는가

AWS WAF는 보통 서비스 앞단에 연결합니다. 대표적으로 `CloudFront`, `Application Load Balancer`, `API Gateway`, `AppSync` 같은 리소스와 함께 사용합니다. 즉 흐름으로 보면 `사용자 -> CloudFront/ALB/API Gateway -> WAF 검사 -> 애플리케이션` 구조를 떠올리면 됩니다.

이 구조를 이해하면 WAF를 왜 애플리케이션 코드와 분리해서 운영할 수 있는지도 자연스럽게 보입니다. 요청이 애플리케이션에 들어가기 전에 먼저 선별되기 때문입니다.

---

## 4) 처음 적용할 때 가장 많이 쓰는 규칙

### Managed Rules

가장 먼저 고려할 것은 `AWS Managed Rules`입니다. 일반적인 웹 공격 패턴이나 알려진 악성 요청을 빠르게 막을 수 있어, WAF를 처음 켤 때 가장 현실적인 출발점이 됩니다.

### Rate-based Rule

`Rate-based rule`은 짧은 시간에 비정상적으로 많은 요청을 보내는 IP를 탐지하고 제한할 때 유용합니다. 로그인, 검색, 게시판 작성, 티켓팅 같은 엔드포인트에서 특히 자주 사용합니다.

### IP Set

신뢰할 수 있는 IP를 허용하거나, 반복적으로 문제를 일으키는 IP 대역을 차단할 때는 `IP set`을 씁니다. 운영 중 블랙리스트나 화이트리스트를 관리할 때 기본 도구가 됩니다.

### Path / Header / Query 기반 규칙

특정 경로나 헤더, 쿼리스트링에만 별도 검사를 하고 싶을 때는 요청 구성 요소 기반 매칭을 씁니다. 예를 들어 `/admin` 경로에는 더 엄격한 룰을 적용하고, `/health` 같은 엔드포인트는 예외 처리할 수 있습니다.

---

## 5) 왜 바로 Block 하지 않고 Count부터 보는가

WAF를 처음 적용할 때 가장 흔한 실수는 룰을 추가하자마자 바로 `Block`으로 켜는 것입니다. 이 경우 정상 사용자 요청까지 함께 막을 수 있고, 특히 Managed Rules는 서비스 특성에 따라 오탐이 날 수도 있습니다.

그래서 실무에서는 먼저 `Count` 모드로 요청이 얼마나 걸리는지 확인하고, 로그와 메트릭을 보면서 조정한 뒤 필요한 것만 `Block`으로 전환하는 방식이 훨씬 안전합니다. WAF는 단순히 켜는 것보다 **조정하면서 맞추는 과정**이 중요합니다.

---

## 6) 운영 관점에서 기억할 포인트

  - WAF는 web ACL을 리소스에 연결해야 실제로 동작합니다. 규칙만 만들어 두고 연결하지 않으면 보호가 적용되지 않습니다.
  - 정교한 규칙을 많이 넣을수록 관리 복잡도와 WCU 사용량도 함께 올라갑니다. 처음에는 단순하게 시작하는 편이 좋습니다.
  - 로그와 메트릭을 보지 않으면 어떤 요청이 막히는지 알기 어렵습니다. Count 결과와 CloudWatch 지표를 함께 보는 습관이 중요합니다.
  - 모든 공격을 WAF 하나로 막을 수 있다고 생각하면 안 됩니다. WAF는 애플리케이션 앞단 필터이고, 인증, 애플리케이션 로직, 네트워크 보안과 함께 봐야 합니다.
---

## 7) 실무에서 시작하는 추천 순서

  1. 먼저 보호할 대상 리소스를 정합니다. 예: CloudFront 또는 ALB
  1. 새 web ACL을 만들고 기본 동작을 정합니다.
  1. AWS Managed Rules를 추가합니다.
  1. Rate-based rule을 추가해 과도한 요청을 제한합니다.
  1. 초기에는 Count 위주로 보면서 오탐을 확인합니다.
  1. 필요한 규칙만 Block으로 전환하고, 특정 경로나 IP 예외를 조정합니다.
---

## 확인 체크리스트

  - web ACL이 실제 리소스에 연결되어 있는지 확인합니다.
  - Managed Rules를 바로 Block하지 않고 먼저 Count로 관찰합니다.
  - Rate-based rule 기준이 현재 서비스 트래픽 패턴에 맞는지 봅니다.
  - 로그와 메트릭을 함께 보고 오탐을 줄입니다.
  - WAF만으로 끝내지 않고 인증, 애플리케이션 보안, 네트워크 보안과 함께 설계합니다.
---

## 마무리

AWS WAF는 처음 보면 규칙이 많고 용어도 낯설지만, 실제로는 `web ACL에 규칙을 넣고 서비스 앞에 연결한다`는 한 줄로 요약할 수 있습니다. 처음부터 모든 것을 직접 정의하려 하지 말고, Managed Rules와 Rate-based rule부터 작게 시작하는 편이 훨씬 현실적입니다.

운영에서는 '무엇을 막을지'보다 '정상 요청을 얼마나 덜 건드리면서 막을지'가 더 중요합니다. 그래서 AWS WAF는 설정 자체보다도 관찰과 조정이 핵심이라는 점을 함께 기억하면 좋습니다.

---

## 참고 자료

[AWS WAF Developer Guide](https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html)

[Web ACLs in AWS WAF](https://docs.aws.amazon.com/waf/latest/developerguide/web-acl.html)

[Rule groups in AWS WAF](https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-groups.html)
