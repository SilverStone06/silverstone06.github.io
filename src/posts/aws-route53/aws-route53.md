---
id: 328be0b2-87a1-81f2-a558-ce1521b68b34
title: '[AWS] Route 53 정리'
slug: aws-route53
date:
  start_date: '2026-03-12'
createdTime: 'Thu Mar 19 2026 02:34:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
  - Network
  - Cloud
category:
  - AWS
summary: AWS Route 53에서 자주 쓰는 레코드 타입과 역할을 정리한 글 !
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
# AWS Route 53 정리: 레코드 타입별 역할과 예시

도메인을 구매하고 나면 결국 해야 하는 일은 간단합니다. 사용자가 입력한 도메인 이름을 올바른 서비스로 보내는 것입니다. Route 53은 이 매핑을 담당하는 AWS의 DNS 서비스이고, 실제 동작은 **레코드(record)** 설정에서 결정됩니다.

---

## TL;DR

- `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `SOA`는 가장 자주 보게 되는 기본 레코드입니다.
- AWS에서는 `A`/`AAAA` 레코드를 만들 때 `Alias` 옵션을 켜서 AWS 리소스로 연결할 수 있고, 이 방식은 zone apex에서도 사용할 수 있습니다.
- `CAA`, `DS`, `TLSA`, `SSHFP`는 보안이나 신뢰 체인과 관련이 있고, `SRV`, `NAPTR`, `SVCB`, `HTTPS`는 서비스 발견과 연결 정보 전달에 사용됩니다.
---

## 시작 전 목표

이 글의 목표는 Route 53에서 지원하는 주요 레코드 타입을 한 번에 이해하는 것입니다. 각 레코드마다 **무슨 역할인지**, **언제 쓰는지**, **어떤 값이 들어가는지**를 예시 중심으로 정리합니다.

---

## 1) Route 53에서 레코드를 본다는 뜻

레코드는 "이 이름으로 들어온 DNS 질의를 어디로 보낼지"를 정의한 규칙입니다. 예를 들어 `www.example.com` 요청을 EC2 퍼블릭 IP로 보낼 수도 있고, 메일 서버로 보낼 수도 있고, 다른 도메인 이름으로 위임할 수도 있습니다.

같은 hosted zone 안에서도 이름이 다르면 서로 다른 레코드를 가질 수 있습니다. 반대로 같은 이름에 여러 정책을 적용해 failover, weighted, latency 기반 라우팅을 구성할 수도 있습니다.

---

## 2) 가장 자주 쓰는 레코드

### A

`A` 레코드는 도메인 이름을 **IPv4 주소**에 연결합니다. 가장 기본적인 웹 서비스 연결 방식이며, 예를 들어 `example.com -> 192.0.2.10`처럼 EC2나 외부 웹 서버의 IPv4 주소를 직접 가리킬 때 사용합니다.

### AAAA

`AAAA` 레코드는 도메인 이름을 **IPv6 주소**에 연결합니다. 예를 들어 `example.com -> 2001:db8::10`처럼 IPv6로 서비스하는 환경에서 사용합니다.

### CNAME

`CNAME` 레코드는 현재 이름을 **다른 도메인 이름으로 별칭 처리**합니다. 예를 들어 `www.example.com -> app.example.net`처럼 서브도메인을 다른 호스트 이름으로 연결할 때 씁니다. 다만 **zone apex (`example.com`)에는 CNAME을 둘 수 없습니다.**

### Alias

`Alias`는 별도 DNS 레코드 타입이 아니라 Route 53에서 `A` 또는 `AAAA` 레코드에 붙이는 옵션입니다. 그래서 콘솔의 `Record type` 목록에서 `Alias`가 따로 보이지 않고, 대신 `A` 또는 `AAAA`를 고른 뒤 `Alias` 설정을 켜는 형태로 보입니다. 이 옵션을 사용하면 CloudFront, ALB, S3 정적 웹사이트 같은 AWS 리소스로 직접 연결할 수 있고, `example.com -> d111111abcdef8.cloudfront.net`처럼 apex 도메인에도 적용할 수 있습니다.

### MX

`MX` 레코드는 **메일 서버**를 지정합니다. 예를 들어 `example.com`의 메일을 `10 mail.example.com`으로 보내도록 설정할 수 있습니다. 숫자가 낮을수록 우선순위가 높습니다.

### TXT

`TXT` 레코드는 **텍스트 기반 검증 정보나 정책 정보**를 저장합니다. 예를 들어 SPF, DKIM, 도메인 소유권 검증에 자주 쓰이며 `"v=spf1 include:amazonses.com -all"` 같은 값을 넣습니다.

### NS

`NS` 레코드는 해당 도메인 또는 서브도메인을 **어떤 네임서버가 책임지는지** 나타냅니다. 예를 들어 `example.com`의 NS 값으로 `ns-123.awsdns-45.com` 등이 들어가면 Route 53 네임서버가 이 zone을 관리한다는 뜻입니다.

### SOA

`SOA` 레코드는 zone의 **기본 메타데이터**를 담습니다. 주 네임서버, 관리자 메일, serial, refresh, retry 같은 동기화 정보를 포함합니다. 보통 Route 53이 자동 관리하며 직접 자주 수정하지는 않습니다.

---

## 3) 인증, 보안, 신뢰 체인 관련 레코드

### CAA

`CAA` 레코드는 **어떤 인증기관(CA)이 이 도메인용 인증서를 발급할 수 있는지** 제한합니다. 예를 들어 `0 issue "amazon.com"`처럼 설정하면 지정한 CA만 인증서를 발급하도록 유도할 수 있습니다.

### DS

`DS` 레코드는 **DNSSEC 신뢰 체인**을 연결할 때 사용합니다. 부모 zone이 자식 zone의 서명 키 정보를 참조하도록 만드는 역할이며, 예를 들어 `12345 13 2 abcdef...` 형태의 값이 들어갑니다.

### TLSA

`TLSA` 레코드는 **특정 서비스의 TLS 인증서 정보**를 DNS에 게시하는 DANE 시나리오에서 사용합니다. 예를 들어 `_443._tcp.example.com`에 인증서 해시를 넣어 클라이언트가 추가 검증을 하도록 구성할 수 있습니다.

### SSHFP

`SSHFP` 레코드는 **SSH 공개키 지문(fingerprint)** 을 게시합니다. 예를 들어 `server.example.com`의 SSH 호스트 키 지문을 DNS에 넣어 접속 시 검증 보조 수단으로 사용할 수 있습니다.

### SPF

`SPF` 레코드는 과거에 발신자 정책을 표현하던 타입이지만, 현재는 **대부분 `TXT` 레코드에 SPF 문자열을 저장**하는 방식이 일반적입니다. 레거시 환경에서는 보일 수 있지만 신규 구성에서는 보통 TXT를 사용합니다.

---

## 4) 서비스 검색과 고급 연결 정보 레코드

### SRV

`SRV` 레코드는 **특정 서비스가 어느 호스트와 포트에서 동작하는지** 알릴 때 사용합니다. 예를 들어 `_sip._tcp.example.com -> 10 5 5060 sipserver.example.com`처럼 SIP, XMPP 같은 서비스 검색에 사용합니다.

### NAPTR

`NAPTR` 레코드는 **하나의 식별자를 다른 식별자나 URI로 변환하는 규칙**을 담습니다. 전화번호를 SIP URI로 바꾸는 DDDS 시나리오가 대표적이며, 실무에서는 통신 계열 서비스에서 더 자주 봅니다.

### PTR

`PTR` 레코드는 **역방향 조회(reverse DNS)** 에 사용합니다. 예를 들어 IP 주소 `192.0.2.10`이 `host.example.com`으로 역매핑되도록 설정할 수 있어, 메일 서버 평판이나 네트워크 진단에서 중요합니다.

### SVCB

`SVCB` 레코드는 **서비스에 접속할 때 필요한 추가 연결 정보**를 전달합니다. 예를 들어 대체 엔드포인트나 프로토콜 파라미터를 DNS 한 번의 조회로 알릴 수 있게 설계된 비교적 새로운 레코드입니다.

### HTTPS

`HTTPS` 레코드는 SVCB의 한 형태로 **HTTP 서비스 연결에 필요한 정보**를 전달합니다. 예를 들어 `alpn`, 대체 대상 호스트, 서비스 우선순위 등을 함께 전달해 최신 클라이언트가 더 효율적으로 연결할 수 있도록 돕습니다.

---

## 5) 운영 중 헷갈리기 쉬운 포인트

- `CNAME`은 apex 도메인에 둘 수 없지만, Route 53에서는 `A`/`AAAA` 레코드에 `Alias` 옵션을 사용해 apex에서도 AWS 리소스로 연결할 수 있습니다.
- 메일 인증용 SPF는 별도 `SPF` 타입보다 `TXT` 레코드로 넣는 구성이 더 일반적입니다.
- `NS`와 `SOA`는 zone 자체를 설명하는 레코드라 일반 서비스 연결용으로 수정하는 레코드가 아닙니다.
- `PTR`, `DS`, `TLSA`, `SSHFP`, `NAPTR`는 특정 보안·통신 시나리오에서만 등장하므로, 처음에는 역할만 기억해도 충분합니다.
---

## 확인 체크리스트

- 웹 서버 연결이면 먼저 `A` 또는 `AAAA`를 보고, 대상이 AWS 리소스라면 해당 레코드에서 `Alias` 옵션 사용 가능 여부를 함께 봅니다.
- 메일 수신이면 `MX`, 메일/도메인 검증이면 `TXT`를 점검합니다.
- 서브도메인을 다른 이름으로 넘기려면 `CNAME`을 검토하되 apex 여부를 먼저 확인합니다.
- DNSSEC를 쓰면 `DS`, 인증기관 제한이 필요하면 `CAA`를 고려합니다.
---

## 한눈에 보는 주요 Route 53 레코드

| 레코드 | 역할 | 예시 |
| --- | --- | --- |
| A | 도메인을 IPv4 주소에 연결 | example.com -> 192.0.2.10 |
| AAAA | 도메인을 IPv6 주소에 연결 | example.com -> 2001:db8::10 |
| CNAME | 현재 이름을 다른 도메인 이름으로 별칭 처리 | www.example.com -> app.example.net |
| Alias | Route 53에서 A/AAAA 레코드에 붙는 옵션으로 AWS 리소스에 연결 | example.com -> ALB 또는 CloudFront |
| MX | 메일 서버와 우선순위를 지정 | 10 mail.example.com |
| TXT | 검증 정보, SPF, DKIM 같은 텍스트 정책 저장 | "v=spf1 include:amazonses.com -all" |
| NS | 해당 zone을 관리하는 네임서버 지정 | ns-123.awsdns-45.com |
| SOA | zone의 기본 메타데이터와 동기화 정보 저장 | primary NS, serial, refresh 정보 |
| CAA | 인증서를 발급할 수 있는 CA를 제한 | 0 issue "amazon.com" |
| DS | DNSSEC 신뢰 체인을 부모 zone과 연결 | 12345 13 2 abcdef... |
| TLSA | TLS 인증서 정보나 해시를 DNS에 게시 | _443._tcp.example.com |
| SSHFP | SSH 호스트 키 fingerprint 게시 | server.example.com의 SSH 키 지문 |
| SPF | 레거시 발신자 정책 타입, 보통은 TXT로 대체 | 신규 구성에서는 TXT 사용 |
| SRV | 서비스가 동작하는 호스트와 포트를 알림 | _sip._tcp.example.com -> 10 5 5060 sipserver.example.com |
| NAPTR | 식별자를 다른 URI나 규칙으로 변환 | 전화번호를 SIP URI로 변환 |
| PTR | IP 주소의 역방향 DNS 조회에 사용 | 192.0.2.10 -> host.example.com |
| SVCB | 서비스 접속에 필요한 추가 연결 정보 전달 | 대체 엔드포인트와 프로토콜 정보 |
| HTTPS | HTTP 서비스용 SVCB 형태의 연결 정보 전달 | alpn, 우선순위, 대상 호스트 정보 |

## 마무리

Route 53은 화면은 단순해 보여도 레코드의 의미를 모르면 설정이 금방 꼬입니다. 처음에는 `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `SOA`부터 확실히 익히고, 그다음 Route 53의 `Alias` 옵션이 어디에 붙는지 이해하면 운영이 훨씬 쉬워집니다.

특히 AWS 환경에서는 **'이 도메인을 IP로 연결할지, 다른 이름으로 넘길지, 아니면 AWS 리소스로 Alias 처리할지'** 를 먼저 구분하면 대부분의 Route 53 설정이 훨씬 명확해집니다.

---

## 참고 자료

[AWS Route 53 Supported DNS record types](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html)

[AWS Route 53 Alias records common values](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-values-alias-common.html)

[AWS Route 53 AliasTarget API reference](https://docs.aws.amazon.com/Route53/latest/APIReference/API_AliasTarget.html)
