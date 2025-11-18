---
id: 2a9be0b2-87a1-8171-8f74-cc3ab09dad0c
title: '[Network] OSI 7 Layers : 3 Layer (Network Layer)'
slug: osi-3layer
date:
  start_date: '2025-10-06'
createdTime: 'Wed Nov 12 2025 13:47:44 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - CSS
  - Network
  - OSI
category:
  - "\U0001F916 Computer Science"
summary: OSI 3 Layer에 대해 알아볼까나
thumbnail: null
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
    profile_photo: null
fullWidth: false
---
## 0️⃣ Layer 2에서 Layer 3로

앞서 데이터링크 계층에서는 같은 네트워크 안에서 안정적으로 프레임을 주고받는 역할에 대해 정리했습니다. 하지만 네트워크는 하나의 구역(LAN)만 있는 것이 아니라, 수많은 네트워크가 서로 연결되어 데이터를 주고받습니다. 

이제 그 범위를 확장해, 서로 다른 네트워크 간의 통신을 담당하는 네트워크 계층(Network Layer) 을 정리해 봅시다.

---

## 1️⃣ 네트워크 계층의 핵심 역할

네트워크 계층은 OSI 7계층의 세 번째 단계로, 패킷(Packet) 단위로 데이터를 전송하며 논리적 주소(IP) 를 사용합니다. 이 계층의 가장 큰 목적은 “데이터가 목적지까지 가는 최적의 경로를 찾아 전달하는 것”입니다.

핵심 기능은 다음과 같습니다.

  - 주소 지정(Addressing) : 송수신 장치를 IP 주소로 구분
  - 라우팅(Routing) : 목적지까지의 최적 경로를 탐색 및 결정
  - 단편화(Fragmentation) : MTU(Maximum Transmission Unit)보다 큰 패킷을 분할
  - 재조립(Reassembly) : 분할된 패킷을 목적지에서 원래 형태로 복원
  - TTL 관리(Time To Live) : 패킷이 네트워크에 무한히 남아있지 않도록 수명 제한
---

## 2️⃣ IP(Internet Protocol)

네트워크 계층의 대표적인 프로토콜은 IP (Internet Protocol) 입니다.

IP는 데이터를 작은 조각(패킷)으로 나누고, 각각에 주소 정보를 붙여 목적지까지 전달합니다.

---

### 🔹 IP 단편화(Fragmentation)

MTU(Maximum Transmission Unit, 최대 전송 단위)를 초과하는 패킷은

여러 개의 작은 패킷으로 나누어 전송됩니다.

이때 사용되는 필드는 다음과 같습니다.

📘 예를 들어 MTU가 1500바이트인데, IP 패킷이 3000바이트라면

2개의 패킷으로 나누어 전송하고, 목적지에서 오프셋 값을 기준으로 다시 조립합니다.

---

### 🔹 TTL(Time To Live)

TTL(Time To Live) 은 패킷의 수명을 의미합니다.

패킷이 라우터나 호스트를 한 번 지날 때마다 TTL 값이 1씩 감소하며,

0이 되면 패킷은 폐기됩니다.

> 이는 네트워크 상에서 무한 루프에 빠지는 문제를 방지하기 위한 장치입니다.

---

### 🔹 ARP(Address Resolution Protocol)

ARP는 동일 네트워크 내에서 IP 주소를 MAC 주소로 변환하는 프로토콜입니다.

즉, “이 IP 주소를 가진 장치가 어떤 하드웨어 주소(MAC)를 가지고 있지?”를 찾아주는 역할이죠.

예를 들어,

> 내 PC가 192.168.0.10인 장치로 데이터를 보내야 할 때

ARP를 통해 해당 IP의 MAC 주소를 찾아내어 프레임 전송이 가능해집니다.

> 💡 

> RARP(Reverse Address Resolution Protocol)도 알아두기 ❗
> RARP는 ARP와 반대로 MAC 주소를 통해 IP 주소를 찾아내는 프로토콜입니다. ARP의 반대라고 생각하면 쉬우니 같이 알아두면 좋습니다 ~ 

---

## 3️⃣ IP 주소 체계

네트워크 계층의 가장 기본이자 중요한 요소는 IP 주소입니다.

DHCP(Dynamic Host Configuration Protocol)는 자동으로 IP 주소를 할당해 관리 효율을 높이고, IP 자원을 절약합니다.

---

## 4️⃣ 라우팅(Routing)

라우팅은 패킷이 목적지까지 가는 최적의 경로를 결정하는 과정입니다.

이 작업은 라우터(Router) 가 담당하며, 라우터는 목적지 IP를 확인해 다음 목적지(Next Hop)를 결정합니다.

> 💡 

> 라우터(Router) == 그 계산을 수행하는 장비
> 라우팅(Routing) == 패킷의 이동 경로를 계산하는 일 

---

### 🔹 홉(Hop)

Hop은 패킷이 하나의 장치를 통과하는 과정을 뜻합니다.

즉, 호스트 → 라우터, 라우터 → 라우터로 이동할 때마다

패킷은 한 홉을 거치는 셈입니다.

---

### 🔹 라우팅 프로토콜

라우팅 프로토콜은 라우터 간 정보를 교환해

최적의 경로를 자동으로 찾아내는 기술입니다.

크게 AS(Autonomous System, 자율 시스템) 내부와 외부 통신용으로 나뉩니다.

---

  - RIP (Routing Information Protocol)
거리 벡터(distance vector) 기반으로, 홉 수를 기준으로 경로를 계산합니다.

단순하고 설정이 쉽지만, 네트워크 규모가 커질수록 효율이 떨어집니다.

  - OSPF (Open Shortest Path First)
링크 상태(link-state) 기반 프로토콜로, Dijkstra 최단 경로 알고리즘을 이용해 네트워크 전체 구조를 파악하고 최적의 경로를 계산합니다. 중·대규모 네트워크 환경에서 가장 널리 사용됩니다.

  - BGP (Border Gateway Protocol)
서로 다른 AS 간의 통신을 담당하며, 단순한 거리보다 정책과 경유 AS 경로(AS Path) 를 기반으로 안정적인 라우팅을 수행합니다. 인터넷 전반의 경로 선택을 책임지는 핵심 프로토콜입니다.

> 💡 정리하자면,

IGP는 내부 네트워크의 길잡이, EGP는 네트워크 간의 외교관 같은 역할을 합니다.

---

### 🔹 라우팅 테이블(Routing Table)

라우터는 라우팅 테이블을 참조해 패킷을 어디로 보낼지 결정합니다.

라우팅 테이블은 수동으로 설정할 수도 있고(정적 라우팅),

라우터끼리 정보를 교환하며 자동으로 구성되기도 합니다(동적 라우팅).

---

### 🔹 라우팅 프로토콜

라우팅 프로토콜은 라우터 간 정보를 교환하며

최적 경로를 자동으로 찾아내는 기술입니다.

---

## 5️⃣ 마무리 — 네트워크 간의 길을 만드는 계층

네트워크 계층은 패킷이 목적지까지 도달할 수 있도록 길을 안내하는 계층입니다.

주소(IP)를 부여하고, 라우팅을 통해 최적의 경로를 찾아 전달합니다.

어렵게 생각하지 말고,

**“데이터가 목적지까지 가는 길을 안내하는 네비게이션 계층”**이라고 이해하면 됩니다.

다음 단계에서는, 이렇게 전달된 패킷을

신뢰성 있게 관리하고 재전송을 보장하는 전송 계층(Transport Layer) 을 살펴보겠습니다.
