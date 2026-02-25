---
id: 2c0be0b2-87a1-8090-ab2f-f3bafdf03292
title: '[Linux] Basic Ch.2 (네트워크 기초)'
slug: linux-ch2
date:
  start_date: '2025-10-27'
createdTime: 'Fri Dec 05 2025 07:04:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - Linux
  - Network
category:
  - Linux
summary: 'net-tools, netplan, hosts 이 뭐야❓'
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
Linux에서 네트워크를 다루기 위해서는 IP 확인, 포트 조회, 네트워크 설정 파일 관리 등 다양한 도구를 사용할 수 있습니다.

이번 포스팅에서는 네트워크 관련 기본 명령어(net-tools)와 네트워크 설정 도구(netplan), 그리고 간단한 DNS 서버(bind9)를 살펴보겠습니다.

---

# 1) IP 확인 도구

네트워크 상태를 확인하기 위한 기본 도구들입니다.

네트워크 상태를 파악하려면 우선 **현재 서버가 어떤 IP를 가지고 있는지**, **어떤 포트를 사용하고 있는지**, **라우팅 경로가 어떻게 설정되어 있는지 **등을 확인할 줄 알아야 합니다.

여기서 소개할 명령어들은 Linux에서 가장 기본적으로 사용되는 네트워크 조회 도구입니다.

---

## 1-1) net-tools

`net-tools` 패키지는 `ifconfig`, `netstat`, `route` 같은 전통적인 네트워크 명령어를 제공합니다.

`net-tools` 패키지는 예전부터 사용되어 온 네트워크 도구 모음입니다. Ubuntu 최신 버전에는 기본 설치되지 않지만, 여전히 많이 사용되므로 설치해 두면 편리합니다.

**설치**

```Bash
# 꼭 설치전 업데이트  하기
sudo apt update
sudo apt install net-tools
```

---

### **ifconfig – 네트워크 인터페이스 확인**

`ifconfig`는 서버에 존재하는 네트워크 인터페이스(eth0, ens33, lo 등)의 정보를 확인할 때 사용합니다.
`ifconfig` 를 실행하면 다음과 같은 정보를 확인할 수 있습니다.

  - IP 주소(IPv4/IPv6)
  - MAC 주소
  - 네트워크 인터페이스의 상태(UP/DOWN)
  - 송·수신 패킷 정보
네트워크 연결 문제를 점검할 때 가장 먼저 확인하는 명령어 중 하나입니다.

![image.png](/images/posts/linux-ch2/image1.png)

---

### **netstat – 포트 및 연결 상태 확인**

`netstat`은 현재 시스템에서 어떤 포트가 열려 있고, 어떤 서비스가 그 포트를 사용 중인지 확인할 수 있습니다.

웹서버나 DB 서버가 정상적으로 실행되고 있는지 점검할 때 가장 유용한 도구입니다.

**형식(Format)**

```Plain Text
netstat [옵션]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -t | TCP 연결 보기 |
| -u | UDP 연결 보기 |
| -l | Listening 중인 소켓 보기 |
| -n | 숫자(IP/포트)로 출력 |
| -p | 해당 포트를 사용하는 프로세스 표시 |

**예시**

```Bash
# LISTEN 상태인 네트워크 중 TCP 프로토콜만 출력 
netstat -ntlp
```

![image.png](/images/posts/linux-ch2/image2.png)

위 명령을 실행하면

  - 어떤 포트가 열려 있는지
  - 어떤 프로그램이 해당 포트를 사용 중인지 한 눈에 확인할 수 있어 트러블슈팅에 매우 유용합니다.
---

# 2) 네트워크 구성 도구 : netplan

Ubuntu에서 네트워크 설정은 `/etc/netplan/50-cloud-init.yaml` 파일을 통해 관리합니다.

이 파일은 시스템 부팅 시 적용되며, IP 주소나 Gateway를 고정하고 싶을 때 수정하게 됩니다.

  - YAML 문법을 사용하여 간단하게 네트워크 설정 가능
  - DHCP(자동 IP 할당) 또는 정적 IP 설정 가능
  - 네트워크 인터페이스 이름별로 설정 가능
---

### 2-1) netplan 파일 구조

네트워크 설정 파일은 YAML 형식으로 작성됩니다.

```YAML
# sudo apt -y install netplan.io
# sudo vim /etc/netplan/50-cloud-init.yaml
network:
  version: 2
  ethernets:
    ens33:
      addresses:
        - 192.168.5.13/24
      routes:
      - to: default
        via: 192.168.5.2
      nameservers:
        addresses:
          - 8.8.8.8
        search:
          - 8.8.4.4
      dhcp4: false
    ens34:
      addresses:
        - 172.100.100.13/24
      nameservers:
        addresses:
          - 8.8.8.8
        search:
          - 8.8.4.4
      dhcp4: false
```

저는 두 개의 NIC를 다음과 같이 지정해 뒀는데 설정을 이해해봅시다.

---

### 2-2) 정적 IP 설정

서버에서는 IP 주소를 고정하는 경우가 많습니다.

정적 IP를 설정하면, 재부팅하거나 시간이 지나도 IP가 변하지 않아 안정적인 서비스 운영이 가능합니다.

**형식(Format)**

```YAML
network:
  version: 2
  ethernets:
    ens33:
      addresses:
        - 192.168.5.13/24
      routes:
      - to: default
        via: 192.168.5.2
      nameservers:
        addresses:
          - 8.8.8.8
        search:
          - 8.8.4.4
      dhcp4: false

```

다음과 같은 들여쓰기 구조를 가지고 있고, network안에 ens33이라는 인터페이스 명을 지정해 세부 사항들을 지정해 줬습니다.

  - addresses : `192.168.5.3/24` 는 이 인터페이스에 **고정으로 할당할 IP 주소**이며, `/24`는 서브넷 마스크(255.255.255.0)를 의미합니다. 여러 개의 주소를 넣고 싶다면 리스트 형태로 추가할 수 있습니다.
  - routes : `to: default`와 via : `192.168.5.2`는 **인터넷으로 나가는 기본 게이트웨이를 192.168.5.2로 사용하겠다 **는 의미입니다. 즉, 외부 네트워크와 통신할 때 어떤 경로로 나갈지 지정하는 영역입니다.
  - **nameservers** : `addresses` 아래에 DNS 서버 목록을 적습니다. 위 예시는 `8.8.8.8`(Google DNS)을 DNS 서버로 사용한다는 뜻입니다. 
`search` 항목에는 **도메인 검색 시 자동으로 붙일 도메인**을 지정합니다. 예를 들어 `example.local` 같은 내부 도메인을 사용하는 환경에서 활용합니다.
  - **dhcp4: **IPv4 주소를 **DHCP로 자동 할당받을지, 받지 않을지 **결정하는 설정입니다.
정적 IP를 사용할 때는 반드시 `false`로 지정해야 설정이 충돌하지 않고, `True`로 지정하면 자동으로 할당 받아 옵니다.

---

### 2-3) 설정 적용

이렇게 각 항목을 지정하여 서버가 항상 동일한 IP를 사용하고, 동일한 게이트웨이와 DNS를 사용하도록 설정할 수 있습니다.

설정을 완료했다면 마지막으로 다음 명령으로 네트워크 설정을 적용합니다.

```Shell
sudo netplan apply
```

만약 구문 오류(SytaxError)나 값을 잘못 지정한 경우 , 오류 내용이 나오니 그것을 보고 맞춰서 다시 설정하고, 다시 apply해야 합니다.

---

# 3) DNS 서버: bind9

`bind9`는 Linux에서 가장 널리 사용되는 DNS 서버 소프트웨어입니다. 도메인 이름을 IP 주소로 변환하는 역할을 하며, 내부망·외부망 모두에서 사용할 수 있습니다.

bind9의 **설치**, **주요 설정 파일 구조**, **서비스 관리 방법**까지 기본적인 부분을 살펴봅니다.

---

## 3-2) 주요 설정 파일 경로

bind9는 여러 설정 파일을 조합해 DNS 서버 기능을 구성합니다.

각 파일마다 역할이 나뉘어 있기 때문에 구조를 이해하면 이후 설정을 변경할 때 훨씬 쉽게 접근할 수 있습니다.

| 경로 | 용도 |
| --- | --- |
| `/etc/bind/named.conf` | bind 전체 구성의 메인 파일 |
| `/etc/bind/named.conf.options` | 전역 옵션 설정(DNS 포워더, 보안 옵션 등) |
| `/etc/bind/named.conf.local` | 사용자 정의 도메인(Zone 파일) 설정 |
| `/etc/bind/named.conf.default-zones` | 기본 zone 정보(localhost 등) |
| `/var/cache/bind/` | Zone 데이터 및 캐시가 저장되는 디렉토리 |

각 파일의 역할을 자세히 살펴보면 다음과 같습니다.

---

### 3-2-1) named.conf

bind9의 가장 상위 설정 파일입니다.

다른 설정 파일을 include(불러오기)하는 구조로 되어 있으며, DNS 서버의 전체적인 흐름을 구성합니다.

여기에서 옵션 파일, 로컬 설정 파일 등을 불러와 bind9의 실제 동작 구성을 완성합니다.

---

### 3-2-2) named.conf.options

DNS 서버의 **옵션(Options)**을 지정하는 파일입니다.

여기서 대표적으로 설정하는 요소는 다음과 같습니다.

```Plain Text
options {
    directory "/var/cache/bind";
		version "unknown";
		recursion no;
		//allow-transfer {};
		allow-query { any; };
    forwarders {
        8.8.8.8;
        1.1.1.1;
    };

    dnssec-validation auto;
    listen-on { any; };
};


```

  - `directory "/var/cache/bind";`
    - bind9가 사용하는 캐시 및 임시 데이터의 저장 위치를 지정합니다. 
    - DNS 조회 결과나 작업 중 생성되는 파일들이 이 경로를 기준으로 저장됩니다.
---

  - `version "unknown";`
    - 외부에서 DNS 버전을 조회할 때 실제 버전 노출X
**"unknown" 문자열만 표시**하도록 합니다.
    - 보안 강화를 위한 설정으로, 취약점 공격을 어렵게 만드는 목적이 있습니다.
---

  - `recursion no;`
    - DNS 서버가 **재귀 질의(Recursive Query)를 수행하지 않도록 설정**합니다.
    - 서버가 모르는 도메인에 대해 직접 다른 DNS 서버에게 질의하지 않습니다.
    - 외부에 공개되는 DNS 서버는 일반적으로 `recursion no`를 사용합니다.
---

  - `//allow-transfer {};`
    - Zone Transfer 기능을 제한하는 옵션입니다.
    - 현재는 주석 처리되어 있어서 적용되지 않습니다.
    - **지정한 서버에만 zone 전체 데이터를 전달하겠다**는 의미가 됩니다.
---

  - `allow-query { any; };`
    - DNS 서버에 질의할 수 있는 클라이언트 범위를 지정합니다.
    - `any`는 **모든 IP 주소에서 DNS 조회를 허용**한다는 의미입니다.
    - 내부망 전용 DNS 서버일 경우 특정 IP 대역만 허용하도록 설정할 수 있습니다.
---

  - `forwarders { 8.8.8.8; 1.1.1.1; };`
    - DNS 서버가 모르는 도메인을 상위 DNS 서버(포워더)로 전달해 응답을 받도록 설정합니다.
    - 일반적으로 외부 도메인을 조회하기 위해 Google DNS(8.8.8.8), Cloudflare DNS(1.1.1.1)를 지정합니다.
---

  - `dnssec-validation auto;`
    - DNSSEC(보안 확장)을 자동으로 검증하는 설정입니다.
    - DNS 응답이 위조되거나 변조되지 않았는지 확인하는 보안 기능입니다.
---

  - `listen-on { any; };`
    - DNS 서버가 **어떤 IP 주소에서 질의를 받을지** 지정합니다.
    - `any`는 서버가 가진 모든 네트워크 인터페이스에서 포트 53 요청을 수신하겠다는 의미입니다.
---

### 3-2-3) named.conf.local

`named.conf.local`파일은 bind9에서 **사용자가 직접 관리할 도메인(Zone)**을 정의하는 곳입니다.

DNS 서버가 어떤 도메인을 담당하고, 어떤 Zone 파일을 사용할지, 이 도메인의 Master/Slave 관계는 무엇인지 등을 여기서 설정합니다.

```Plain Text
// slave
//zone "home.kr" IN {
//    type slave;
//    masters { 10.100.83.48; };
//    file "/etc/bind/zones/db.home.kr";
//    masterfile-format text;
//};

// master
zone "test.kr" IN {
    type master;
    file "/etc/bind/zones/db.test.kr";
    allow-update {
        10.100.82.8;
        10.100.81.175;
    };
    also-notify {
        10.100.83.48;
        10.100.81.175;
    };
};
```

---

`zone "test.kr" IN { ... }`

  - DNS 서버가 **test.kr 도메인을 관리한다**는 뜻입니다.
  - `IN`은 Internet(인터넷 클래스)라는 의미로 거의 모든 zone에서 동일하게 사용됩니다.
---

 `type master;`

  - 이 서버가 **test.kr 도메인의 Master DNS 서버**임을 의미합니다.
  - Master 서버는 해당 zone의 **원본 데이터(Source of truth)** 를 가지고 있습니다.
  - Slave 서버는 Master의 데이터를 복제하여 사용합니다.
---

`file "/etc/bind/zones/db.test.kr";`

  - test.kr 도메인 정보(A, CNAME, NS 등 레코드)가 저장되어 있는 **Zone 파일의 위치**를 지정합니다.
  - 실제 레코드는 여기에서 작성하게 됩니다.
파일 형식은 밑에서 보여드리겠습니다.

---

`allow-update { ... };`

  - 특정 IP 주소가 **동적으로 DNS 레코드를 업데이트할 수 있도록 허용**하는 옵션입니다.
  - 예)
    - DHCP 서버가 자동으로 레코드를 수정하는 경우
    - 내부 시스템이 자동으로 DNS 업데이트를 요청하는 경우
여기서는 다음 두 IP가 업데이트 권한을 가집니다:

  - 10.100.82.8
  - 10.100.81.175
즉, “이 두 클라이언트만 DNS 업데이트 가능”이라는 의미입니다.

---

 `also-notify { ... };`

  - Master 서버가 zone 파일이 변경되었을 때
**Slave 서버들에게 변경 사실을 즉시 알려주는 기능(NS Notify)** 입니다.

  - 일반적으로 Slave 서버의 IP를 넣습니다.
여기서는 다음 두 서버에 변경 알림을 보냅니다:

  - 10.100.83.48
  - 10.100.81.175
이 기능이 없으면 Slave 서버는 SOA Refresh Interval이 지나야만 업데이트를 확인합니다.

즉, `also-notify` = “변경 즉시 Slave에 알려라” 입니다.

---

### 3-2-4) /etc/bind/zones/db.test.kr

Zone 파일은 특정 도메인(test.kr)에 대한 **DNS 레코드 정보를 실제로 저장하는 파일**입니다.

서버가 이 파일을 읽어 클라이언트의 DNS 질의에 응답하게 됩니다.

아래 예시는 `test.kr` 도메인의 zone 파일 예시입니다.

![image.png](/images/posts/linux-ch2/image3.png)

`$TTL 604800`

  - TTL(Time To Live) = DNS 레코드의 **캐시 유지 시간(초 단위)**
  - 기본값을 지정하며, 여기서는 **604800초 = 7일**
---

`@` (origin)

  - `@`는 현재 zone의 루트(= test.kr)를 의미하는 축약 표현입니다.
즉,

```Plain Text
@ = test.kr.
```

---

**SOA 레코드 (Start of Authority)**

```Plain Text
@ IN SOA ns1.test.kr. root.test.kr. (
           2         ; Serial
      604800         ; Refresh
        86400        ; Retry
      2419200        ; Expire
       604800 )      ; Negative Cache TTL
```

SOA 레코드는 zone 파일의 **필수 항목**입니다.

각 필드의 의미는 다음과 같습니다.

  - **ns1.test.kr.**
이 zone의 기본 네임서버(NS 서버)

  - **root.test.kr.**
관리자 이메일 주소 (`root@test.kr` → 마침표(.)로 표기)

  - **Serial (2)**
Zone 파일 버전 번호

변경할 때마다 반드시 증가시켜야 Slave 서버가 갱신됨

  - **Refresh (604800)**
Slave 서버가 Master에게 변경 여부를 확인하는 주기

  - **Retry (86400)**
Refresh에 실패했을 때 재시도하는 간격

  - **Expire (2419200)**
Master에게 너무 오래 응답받지 못하면 zone을 폐기하는 시간

  - **Negative Cache TTL (604800)**
존재하지 않는 레코드 응답(NXDOMAIN)을 캐싱하는 시간

---

**NS 레코드**

```Plain Text
IN NS ns1.test.kr.
```

  - test.kr 도메인을 담당하는 네임서버가 **ns1.test.kr**임을 의미
  - 한 zone에 NS 레코드는 최소 1개 이상 필요
---

**A 레코드**

```Plain Text
ns1  IN A 192.168.119.2
@    IN A 192.168.119.2
ftp  IN A 192.168.119.3
db   IN A 192.168.119.4
```

A 레코드는 **도메인 이름 → IPv4 주소 매핑**입니다.

  - `ns1.test.kr` → `192.168.119.2`
  - `test.kr (@)` → `192.168.119.2`
  - `ftp.test.kr` → `192.168.119.3`
  - `db.test.kr` → `192.168.119.4`
즉, 서비스별 서버 위치를 정의하는 역할입니다.

---

**CNAME 레코드**

```Plain Text
www IN CNAME test.kr.
```

  - `www.test.kr`을 `test.kr`의 별칭(alias)으로 지정
  - 클라이언트는 결국 `test.kr`의 A 레코드 IP로 연결됨
예:

www.test.kr → test.kr → 192.168.119.2

---

### 3-3) 서비스 관리

bind9는 일반적인 Linux 서비스와 동일하게 systemctl 명령으로 관리할 수 있습니다.

**형식(Format)**

```Plain Text
systemctl [옵션] bind9
```

**예시**

```Bash
sudo systemctl start bind9   # 서비스 실행
sudo systemctl status bind9  # 실행 상태 조회
sudo systemctl restart bind9 # 설정 변경 시 재시작
```

여기에서 가장 자주 사용하는 명령은 `restart` 입니다.

DNS 설정 파일을 수정한 뒤에는 반드시 서버를 재시작하여 적용해야 합니다.

---

### 3-4) 간단한 동작 확인

DNS 서버가 정상적으로 동작하는지 확인하려면 `dig` 또는 `nslookup` 명령을 사용합니다.

```Bash
dig @127.0.0.1 google.com
```

위 명령은 로컬 bind9 서버에게 직접 DNS 조회를 요청하는 형태입니다.

---

# 정리

이번 장에서는 네트워크 상태를 확인하고 설정하는 데 사용되는 핵심 도구들을 살펴보았습니다.

  - net-tools (`ifconfig`, `netstat`, `route`)
  - iproute2 (`ip addr`, `ip route`, `ip link`)
  - netplan을 사용한 네트워크 설정
  - bind9 기본 구조 및 환경 설정
