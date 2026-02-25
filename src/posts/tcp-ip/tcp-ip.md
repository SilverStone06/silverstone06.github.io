---
id: 2b6be0b2-87a1-80fd-b482-e7f58e32790c
title: '[Network] TCP/IP 4 Layer'
slug: tcp-ip
date:
  start_date: '2025-10-20'
createdTime: 'Tue Nov 25 2025 06:13:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - Network
  - TCP/IP
category:
  - "\U0001F916 Computer Science"
summary: TCP/IP 한방에 정리하기
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## 0️⃣ 왜 TCP/IP를 별도로 공부해야 할까?

OSI 7계층의 역할을 충분히 확인했으니, 이제 실제 인터넷에서 사용되는 TCP/IP 계층모델도 살펴봐야겠지요?

이미 OSI 7계층을 기반으로 개념을 정리했기 때문에 TCP/IP는 *“어떻게 OSI 구성 요소들이 묶여서 실제 프로토콜로 동작하는지”* 정도만 이해하셔도 충분합니다.

복잡하게 들어가기보단, **OSI가 개념이라면, TCP/IP는 실제 인터넷에서 굴러가는 구조**라는 정도만 잡고 어떤 식으로 계층이 합쳐지는지 흐름만 살펴보면 훨씬 쉽게 이해할 수 있습니다. 자세한 설명은 해당되는 OSI 계층을 보시면 도움이 됩니다.

그럼 한 번 같이 알아보죠!

---

## 1️⃣ TCP/IP 4계층 살펴보기

![image.png](/images/posts/tcp-ip/image1.png)

TCP/IP 모델은 실제 인터넷에서 사용되는 네트워크 구조로,

총 **4개의 계층**으로 구성되어 있습니다.

OSI 7계층처럼 세부 기능을 모두 분리하기보다는, 실제 동작에 맞게 **역할이 비슷한 계층끼리 묶어** 더 실용적으로 설계된 모델이에요.

간단히 말해,

  - **Network Interface Layer** → OSI 1·2 계층
  - **Internet Layer** → OSI 3 계층
  - **Transport Layer** → OSI 4 계층
  - **Application Layer** → OSI 5·6·7 계층
이렇게 크게 네 덩어리로 묶여 있다고 보면 됩니다.

구조는 이렇게 간단하지만, TCP/IP는 인터넷 통신의 기반이기 때문에 각 계층이 어떤 기능을 담당하는지 이해해두면 큰 도움이 됩니다.

---

## 2️⃣ Network Interface Layer

**(OSI 1계층 + 2계층 역할 통합)**

네트워크의 가장 아래에서 실제 전송을 담당하는 계층.

  - [https://google.com](https://google.com/)
  - [https://silverstone06.github.io/osi-567layer/](https://silverstone06.github.io/osi-567layer/)
> 🔗 **[]()**

> 🔗 **[[Network] OSI 7 Layers : 5·6·7 Layer (Session / Presentation / Application)](https://silverstone06.github.io/osi-567layer/)**
>
> 5,6,7 Layer 가보자고~

‣

‣

**✔ 핵심 기능**

  - 전기 신호 ↔ 프레임 변환
  - MAC 주소 기반 통신
  - 오류 검출(FCS)
  - 이더넷 기반 프레임 처리
**✔ 주요 프로토콜**

  - **Ethernet (IEEE 802.3)**
  - **ARP(Address Resolution Protocol)** 
  - **RARP(Reverse ARP)** 
---

## 3️⃣ Internet Layer

**(OSI 3계층 역할)**

네트워크 간 라우팅, 패킷 전달을 담당하는 TCP/IP의 핵심 계층.

‣

**✔ 주요 기능**

  - IP 주소를 이용한 목적지 식별
  - 라우팅
  - 패킷 단편화(Fragmentation) 
  - TTL 관리 
**✔ 주요 프로토콜**

  - **IP (IPv4/IPv6)** 
  - **ICMP**
  - **IGMP**
  - **ARP (같은 네트워크 MAC 탐색)** 
---

## 4️⃣ Transport Layer

**(OSI 4계층 역할)**

프로세스 간 통신을 제공하며, 포트 번호가 등장하는 계층.

‣

‣

---

### TCP (Transmission Control Protocol)

신뢰성을 보장하는 연결 지향 프로토콜.

기능

  - 3-way handshake 
  - 4-way handshake
  - 흐름 제어 (슬라이딩 윈도우) 
  - 혼잡 제어 
  - 오류 제어 / 재전송 ARQ 
  - 세그먼트 기반 통신
**TCP가 적합한 서비스**

HTTP, HTTPS, SSH, FTP 등 신뢰성이 필요한 서비스

---

### UDP (User Datagram Protocol)

비연결성·비신뢰성 기반의 빠른 전송.

**특징**

  - 오류 복구 없음
  - 패킷 순서 보장 없음
  - 단순·저지연
**UDP가 적합한 서비스**

DNS, 스트리밍, VoIP, 온라인 게임

---

### 포트 번호

실제 프로그램 구분은 전송 계층 TCP/UDP의 **포트 번호**로 이루어진다.

(응용 계층에서 어떤 프로그램이 쓰는지는 TCP/UDP 포트로 판별)

> 자세한 서비스별 포트 번호는 →‣

---

## 5️⃣ Application Layer

**(OSI 5·6·7 계층 역할이 모두 포함)**

사용자 프로그램이 네트워크를 직접 사용하는 계층.

‣

**특징**

  - 사용자와 가장 가까운 계층
  - 서비스는 포트 번호를 통해 식별
  - 데이터 포맷·인증·암호화 등도 포함 (예: TLS)
**대표 프로토콜**

  - **HTTP / HTTPS**
  - **FTP**
  - **SSH**
  - **SMTP / POP3 / IMAP**
  - **DNS**
---

## 6️⃣ TCP/IP 4계층 한눈에 정리

| 계층 | 기능 핵심 | 예시 |
| --- | --- | --- |
| Network Interface | 물리적 전송, MAC, 프레임 | Ethernet, ARP |
| Internet | 패킷 전달, 라우팅, IP | IP, ICMP |
| Transport | 포트, 세그먼트, 신뢰성 | TCP, UDP |
| Application | 사용자 서비스 | HTTP, FTP, DNS |

---

## 7️⃣ 마무리

TCP/IP는 **OSI보다 실제 네트워크에 훨씬 가깝고 현실적인 모델**입니다.

특히 전송 계층(TCP/UDP)과 응용 계층(L7)은 네트워크 문제를 분석할 때 가장 중요하게 다뤄집니다.

앞으로 OSI와 TCP/IP를 매핑해서 보면 훨씬 이해가 빨라질 것이니 둘 다 까먹지 말 것..~
