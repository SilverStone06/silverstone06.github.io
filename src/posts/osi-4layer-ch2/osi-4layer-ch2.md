---
id: 2b0be0b2-87a1-8087-98d4-ed7134d6435c
title: '[Network] OSI 7 Layers : 4 Layer (Transport Layer) Ch.2'
slug: osi-4layer-ch2
date:
  start_date: '2025-10-24'
createdTime: 'Wed Nov 19 2025 05:29:43 GMT+0000 (Coordinated Universal Time)'
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
summary: OSI 4 Layer Chapter 2
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## 0️⃣ Ch.1에서 이어서

앞서 전송 계층의 개념과 프로토콜 구조를 정리했다면,

이번 글에서는 TCP가 어떻게 **신뢰성을 실제로 구현하는지** 살펴보겠습니다.

이 챕터는 L4의 핵심 메커니즘을 깊게 다루는 단계입니다.

---

## 1️⃣ TCP 헤더 구조 이해하기

![image.png](/images/posts/osi-4layer-ch2/image1.png)

TCP 헤더는 신뢰성 있는 통신을 위해 다양한 필드를 포함합니다.

| 필드 | 설명 |
| --- | --- |
| Source Port / Dest Port | 송수신 포트 번호 |
| Sequence Number | 데이터 순서 정보 |
| ACK Number | 수신한 데이터에 대한 응답 번호 |
| Flags (SYN/ACK/FIN 등) | 연결 설정/해제 제어 |
| Window Size | 흐름 제어에 사용 |
| Checksum | 오류 검출 |
| Urgent Pointer | 긴급 데이터 여부 |

이 값들로 TCP의 모든 신뢰성 기능이 이루어집니다.

---

## 2️⃣ 연결 설정 — 3-Way Handshake

![image.png](/images/posts/osi-4layer-ch2/image2.png)

TCP는 실제 데이터 전송 전, 가상의 연결을 맺습니다.

  1. SYN → (연결 요청)
  1. SYN+ACK ← (요청 확인)
  1. ACK → (연결 완료)
이 과정을 통해 양측은 다음을 합의합니다.

  - 초기 Sequence Number
  - 통신 가능 여부
  - 버퍼 크기 등
---

## 3️⃣ 연결 종료 — 4-Way Handshake

![image.png](/images/posts/osi-4layer-ch2/image3.png)

TCP 연결 해제는 다음과 같이 진행됩니다.

FIN →

ACK ←

FIN ←

ACK →

왜 4단계냐면, 데이터 송신 방향 2개(송신·수신)를 각각 끊어야 하기 때문입니다.

---

## 4️⃣ TCP의 신뢰성을 책임지는 메커니즘

TCP의 핵심 메커니즘은 크게 오류제어, 흐름제어, 혼잡제어 3가지입니다.

오류제어, 

### ✔ 오류 제어 — ARQ(Automatic Repeat Request)

ARQ는 전송한 데이터가 손실되거나 손상되었을 때 자동으로 재전송하여 신뢰성을 확보하는 방식입니다. 대표적으로 세 가지 방식이 있습니다.

---

### ① Stop-and-Wait ARQ (보내고 기다리는 방식)

개념

  - 송신자가 하나의 세그먼트를 전송한 뒤, 수신자로부터 해당 세그먼트의 ACK를 받을 때까지 기다린 다음 다음 세그먼트를 전송하는 방식입니다. 즉, **한 번에 하나씩**만 전송합니다.
![image.png](/images/posts/osi-4layer-ch2/image4.png)

**장점**

  - 동작 방식이 가장 단순합니다.
  - 오류 제어의 정확성이 매우 높습니다.
**단점**

  - 매번 ACK를 기다려야 하므로 매우 느립니다.
  - 네트워크 대역폭을 충분히 활용하지 못해 효율이 낮습니다.
---

### ② Go-Back-N ARQ (손실 지점부터 다시 보내는 방식)

**개념**

송신자는 여러 세그먼트를 연속으로 전송할 수 있습니다.

하지만 전송 중 중간의 한 세그먼트가 손실되면, **그 손실된 지점부터 이후 세그먼트를 모두 다시 보내는 방식**입니다.

![image.png](/images/posts/osi-4layer-ch2/image5.png)

**장점**

  - Stop-and-Wait보다 훨씬 빠르며 파이프라이닝이 가능합니다.
**단점**

  - 손실된 세그먼트 이후의 세그먼트까지 모두 재전송하여 비효율적입니다.
---

### ③ Selective Repeat ARQ (필요한 것만 선택적으로 재전송)

**개념**

손실된 세그먼트만 선택적으로 재전송하는 방식입니다.

TCP의 실제 동작 방식과 가장 유사합니다.

![image.png](/images/posts/osi-4layer-ch2/image6.png)

**장점**

  - 불필요한 재전송이 없어 효율이 매우 높습니다.
  - 고속 네트워크 환경에 적합합니다.
**단점**

  - 구현이 복잡하며, 재정렬을 위한 추가 버퍼가 필요합니다.
> TCP는 Selective Repeat 기반
> 
> TCP는 Selective Acknowledgement(SACK)를 사용하여 필요한 세그먼트만 재전송하는 방식에 가깝게 동작합니다.

---

### ✔ (2) 흐름 제어 — Sliding Window

흐름 제어는 수신자가 처리 가능한 범위 내에서 송신자의 전송 속도를 조절하여 수신 버퍼 오버플로우를 방지하는 기능입니다.

이 기능은 **Sliding Window** 메커니즘을 통해 동작합니다.

---

**Sliding Window란?**

송신자가 한 번에 전송할 수 있는 세그먼트 수는 수신자가 제공하는 **윈도우 크기(Window Size)** 로 제한됩니다.

ACK가 도착할 때마다 이 윈도우는 **오른쪽으로 한 칸씩 슬라이드**하며 새로운 세그먼트 전송이 허용됩니다.

![image.png](/images/posts/osi-4layer-ch2/image7.png)

---

```Plain Text
① [0][1][2][3] 전송 가능
   → Frame 0, 1 전송

② ACK 2 수신
   → 윈도우 슬라이드

③ [1][2][3][0] 전송 가능
   → Frame 2, 3 전송

④ ACK 3 수신
   → 윈도우 슬라이드

⑤ [2][3][0][1] 전송 가능
```

즉, **수신자의 버퍼 상황에 따라 동적으로 전송량을 조절하는 것**이 Sliding Window의 핵심입니다.

---

### ✔ (3) 혼잡 제어 — 네트워크 혼잡 반응

네트워크가 혼잡한 상황을 파악하고 전송량을 조절합니다.

네트워크 내의 패킷 수를 조절하여 네트워크의 overflow를 방지하는 방법이라고 할 수 있습니다.

대표 알고리즘:

  - Slow Start
  - Congestion Avoidance
  - Fast Retransmit
  - Fast Recovery
이 4가지의 혼잡 회피 방식이 있습니다.

아직 여기는 이해가 완벽히 되지 않았기에 추후에 정리하도록 하겠습니다…😿

---

## 8️⃣ Ch.2 마무리

전송 계층은 네트워크 통신의 **품질**을 책임지는 계층입니다.

  - 순서 보장
  - 오류 검출·재전송
  - 흐름 제어
  - 혼잡 제어
  - 연결 설정/종료
TCP 하나만 깊게 공부해도 네트워크의 절반을 이해했다고 할 정도로 핵심 기능이 많습니다.

다음 챕터에서는 세션·표현·응용 계층을 하나로 묶어 정리하도록 하겠습니다 🫡
