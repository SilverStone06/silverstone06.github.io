---
id: 2a9be0b2-87a1-816f-9598-f2347a80c017
title: '[Network] OSI 7 Layers : 4 Layer (Transport Layer) Ch.1'
slug: osi-4layer-ch1
date:
  start_date: '2025-10-22'
createdTime: 'Wed Nov 12 2025 13:47:44 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - Network
  - OSI
  - TCP
  - UDP
category:
  - "\U0001F916 Computer Science"
summary: OSI 4 Layer Chapter 1
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## 0️⃣ Layer 3에서 Layer 4로

이전 글에서 정리한 네트워크 계층(L3)은 “목적지까지 가는 길을 찾는 네비게이션 역할”을 했습니다.

하지만, 목적지 라우터까지 패킷이 잘 도착했다고 해서 그 데이터가 **정확하게, 순서대로, 손실 없이** 전달되었다고 보장할 순 없죠.

이제는 두 호스트(송신자 ↔ 수신자) 사이에서 **신뢰성 있는 데이터 전송을 보장하는 계층**, 전송 계층(Transport Layer)을 살펴봅시다. 

+) 전송 계층은 중요한 계층이기도 하고, 양도 많아 Ch1, Ch2로 나누어 정리하겠습니다 ~

---

## 1️⃣ OSI 7계층 — L4 : 전송 계층(Transport Layer)이란?

![image.png](/images/posts/osi-4layer-ch1/image1.png)

전송 계층은 송신자와 수신자 사이에 **End-to-End 신뢰성 있는 데이터 전송**을 보장합니다.

주요 역할은 다음과 같습니다.

  - 신뢰성 있는 데이터 전송 보장
  - 오류 검출 및 재전송
  - 흐름 제어(Flow Control)
  - 혼잡 제어(Congestion Control)
  - 포트를 이용한 프로세스 구분
  - 전송 단위: 세그먼트(Segment)
이해를 위해 비유하자면, 4 Layer 는 **“데이터를 안정적으로 목적지 프로세스까지 배달하는 택배 계층”** 입니다.

---

## 2️⃣ 데이터 전송 단위 — 세그먼트(Segment)

전송 계층의 PDU는 **세그먼트(Segment)** 입니다.

Layer별 단위를 비교하면 다음과 같습니다.

| 계층 | PDU(전송 단위) | 예시 |
| --- | --- | --- |
| L2 | 프레임(Frame) | Ethernet |
| L3 | 패킷(Packet) | IP |
| **L4** | **세그먼트(Segment)** | TCP/UDP |
| L7 | 데이터(Data) | HTTP |

> 세그먼트는 다음 구조를 갖습니다.
> [TCP/UDP Header] + [Payload(Data)]

---

## 3️⃣ 포트(Port) — 프로세스 주소 지정

IP는 “어떤 컴퓨터인가”를 구분하고,

포트는 “그 컴퓨터의 어떤 프로그램인가”를 구분합니다.

  - 범위: 0 ~ 65535
  - Well-Known Ports
    - 80 : HTTP
    - 443 : HTTPS
    - 22 : SSH
    - 53 : DNS
결국 데이터는 **IP + Port** 조합을 통해 최종 목적지를 찾습니다.

> 192.168.0.10 : 443
> └─ 192.168.0.10 주소로 가서 443포트를 통해 통신(프로그램 실행)하겠다~ 이런 뜻입니다.

---

## 4️⃣ Multiplexing / Demultiplexing

전송 계층의 핵심 기능 중 하나입니다.

### ✔ Multiplexing (다중화)

> 여러 애플리케이션 데이터를 하나의 네트워크 연결로 묶어 전송

예:

Chrome, Slack, VSCode가 동시에 인터넷을 쓰더라도,

모두 하나의 NIC → 라우터 → 인터넷을 통해 나감.

### ✔ Demultiplexing (역다중화)

> 수신된 세그먼트를 포트 번호 기반으로 각 프로세스에게 분배

예:

80번 포트 → 웹브라우저

22번 포트 → SSH 클라이언트

---

## 5️⃣ TCP vs UDP

### 🔹 TCP — 신뢰성 중심

  - 연결 지향적(Connection-oriented)
  - 순서 보장
  - 오류 검출 및 재전송
  - 흐름 제어
  - 혼잡 제어
  - 속도는 느리지만 안정성 최고
### 🔹 UDP — 속도 중심

  - 비연결형(Connectionless)
  - 순서 보장 X
  - 빠르고 가볍고 단순
  - 손실 허용 환경에 적합
### ✔ 사용 예시

| 구분 | TCP | UDP |
| --- | --- | --- |
| 안정성 | O | X |
| 속도 | 느림 | 빠름 |
| 대표 서비스 | 웹(HTTP), 이메일 | 게임, VoIP, 스트리밍 |

---

## 6️⃣ Ch.1 마무리

전송 계층은 네트워크 계층 위에서 **실제 데이터 신뢰성과 품질을 담당하는 핵심 계층**입니다.

여기까지는 개념 중심으로 정리했고, 다음 **Ch.2**에서는 전송 계층의 핵심 중 핵심인

  - TCP 3-way handshake
  - 4-way termination
  - 흐름 제어
  - 혼잡 제어
  - ARQ
  - Sliding Window
  - Time-Wait
같은 메커니즘을 깊게 파고들어볼 예정입니다.

Ch.2로 돌아오겠습니다~~
