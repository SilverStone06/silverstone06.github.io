---
id: 2edbe0b2-87a1-804a-b659-fc721ac893d5
title: '[AWS] 3Tier 구조 구축하기'
slug: aws-3tier-구조-구축하기
date:
  start_date: '2025-11-03'
createdTime: 'Mon Jan 19 2026 07:37:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
category:
  - AWS
summary: AWS 3-Tier 아키텍처를 구성하며 네트워크·서버·DB 계층을 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## AWS 3-Tier Architecture 구축 실습 개요

이 글에서는 단순히 EC2 하나를 띄우는 수준이 아니라,

**실제 서비스 환경에서 가장 많이 사용되는 AWS 3-Tier 아키텍처**를 단계별로 직접 구성해봅니다.

구성의 핵심은 다음입니다.

  - 네트워크 레벨에서 역할을 분리하고
  - 외부 노출 지점을 최소화하며
  - 트래픽 증가 시 자동 확장이 가능한 구조 만들기
아래 순서대로 하나씩 쌓아 올리면서,

각 리소스가 **왜 필요한지 / 어디에 위치해야 하는지**를 함께 설명합니다.

---

## VPC 구성

VPC 서비스에서 VPC 생성 클릭

먼저 VPC를 생성하고 CIDR을 `10.0.0.0/16`으로 설정합니다.

![image.png](/images/posts/aws-3tier-구조-구축하기/image1.png)

IPv4 CIDR 블록은 10.0.0.0/16 기본값을 주었고, 가용성을 위해 3개 AZ를 사용하고, 각 AZ에 Public/Private Subnet을 나눠 배치합니다.

![image.png](/images/posts/aws-3tier-구조-구축하기/image2.png)

퍼블릭 서브넷과 프라이빗 서브넷 모두 3개씩 만들었고, CIDR 블록은 구분을 위해 다음과 같이 설정했습니다.

권장 구성

  - Public Subnet 3개: Nginx, ALB, Bastion 등 외부 진입 계층
  - Private Subnet 3개: FastAPI, RDS 등 내부 계층

라우팅은 아래 원칙으로 구성합니다.

  - Public Route Table: 0.0.0.0/0 -> Internet Gateway
  - Private Route Table: 0.0.0.0/0 -> NAT Gateway
![image.png](/images/posts/aws-3tier-구조-구축하기/image3.png)

Private Subnet 인스턴스가 패키지 설치를 할 수 있도록 NAT Gateway를 연결합니다.

![image.png](/images/posts/aws-3tier-구조-구축하기/image4.png)

최종 구성은 다음과 같습니다. 

이 설정으로 Private 리소스는 외부 인바운드는 차단하면서,
필요한 아웃바운드 통신만 허용할 수 있습니다.

---

## RDS(**MySQL)** 구성

RDS는 DB 계층이므로 Private Subnet에 배치합니다.

![image.png](/images/posts/aws-3tier-구조-구축하기/image5.png)

실습 기준으로 Single-AZ를 사용할 수 있지만, 운영 환경이라면 Multi-AZ를 권장합니다.
설정 예시는 다음과 같습니다.

  - Engine: MySQL 8.0.43
  - Public Access: `No`
  - DB Subnet Group: Private Subnet만 포함
![image.png](/images/posts/aws-3tier-구조-구축하기/image6.png)

![image.png](/images/posts/aws-3tier-구조-구축하기/image7.png)

보안 그룹

  - `TCP 3306` 인바운드는 App 서버 보안 그룹에서만 허용
  - `0.0.0.0/0` 직접 허용 금지
연결 설정에선 생성한 vpc 그룹을 선택하고, 퍼블릭 엑세스는 아니요를 선택해 아무나 접속할 수 없도록 유지했습니다.

또, vpc 보안 그룹은 새로 생성하였는데 3306 포트만 허용하게 만들어 주었습니다.

> +) 추가 구성에서 백업과 불필요한 옵션을 정리하면 비용이 내려갑니다.
> EC2 → 보안그룹 → db 보안그룹 → 인바운드 규칙 편집 에서 인바운드 규칙, 소스가 Anywhere IPv4로 설정되었는지 확인 필요합니다.

---

## **3) FastAPI(App Tier) 구성**

FastAPI 서버는 Private Subnet에 배치합니다.

외부에서 직접 접속하지 않고 Web Tier(Nginx) 또는 점프 호스트를 통해 접근하도록 구성합니다.

![image.png](/images/posts/aws-3tier-구조-구축하기/image8.png)

인스턴스

  - OS : Ubuntu 24.04
  - Type : t3.micro (실습용)
User Data로 애플리케이션 설치와 실행을 자동화합니다.

![image.png](/images/posts/aws-3tier-구조-구축하기/image9.png)

키페어는 새 키 페어 생성 클릭하시고, 다음과 같이 발급 받아주시면 됩니다.

![image.png](/images/posts/aws-3tier-구조-구축하기/image10.png)

네트워크 설정은 수정 버튼을 눌러 vpc랑 서브넷을 설정해 줍니다. 우리는 LB 설정을 할 것이기에 노출을 줄일 수 있게 private 서브넷 영역을 선택해 줍니다.

![image.png](/images/posts/aws-3tier-구조-구축하기/image11.png)

보안 그룹은 다음과 같이 설정해 주었고, fastapi 포트가 8000번이니 접속할 수 있도록 설정해 주었습니다.

> 현재는 테스트를 위해 인바운드 IP를 다 열어두었지만, IP 대역을 지정해주면 더 보안이 높아집니다.

추가로 고급 세부 정보에 사용자 데이터(User Data)에 다음과 같이 설정했는데, 나중에 ec2 들어가서 설정해도 무관합니다~

```Bash
#!/bin/bash
set -e

# 1) 기본 패키지 설치
apt update -y
apt install -y python3-venv python3-pip

# 2) 테스트용 FastAPI 앱 생성
#!/bin/bash
set -e

# 1) 기본 패키지 설치
apt update -y
apt install -y python3-venv python3-pip

# 2) FastAPI 앱 생성 (MySQL health check 포함)
cat <<'EOF' > /home/ubuntu/main.py
from fastapi import FastAPI
import os
import pymysql

app = FastAPI()

def check_mysql() -> None:
    host = os.getenv("DB_HOST", "")
    user = os.getenv("DB_USER", "")
    password = os.getenv("DB_PASSWORD", "")
    #dbname = os.getenv("DB_NAME", "")
    port = int(os.getenv("DB_PORT", "3306"))

    if not all([host, user, password]):
        raise RuntimeError("DB env is missing: DB_HOST/DB_USER/DB_PASSWORD/DB_NAME")

    conn = pymysql.connect(
        host=host,
        user=user,
        password=password,
        #database=dbname,
        port=port,
        connect_timeout=3,
        read_timeout=3,
        write_timeout=3,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.Cursor,
    )
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1;")
            cur.fetchone()
    finally:
        conn.close()

@app.get("/")
def root():
    return {"message": "hello fastapi"}

@app.get("/health")
def health():
    try:
        check_mysql()
        return {"status": "ok"}
    except Exception as e:
        return {"status": "fail", "reason": str(e)}
EOF

# 3) venv 생성 + 패키지 설치
cd /home/ubuntu
python3 -m venv venv

/home/ubuntu/venv/bin/pip install --upgrade pip
/home/ubuntu/venv/bin/pip install fastapi uvicorn pymysql

# 4) DB 접속 정보 (여기 값만 네 환경에 맞게 바꿔)
#    RDS 정보의 endpoint 넣으면 됨. 보안그룹에서 3306 인바운드 허용도 필요.
cat <<'EOF' > /home/ubuntu/app.env
DB_HOST=song-rds-1.cxusyoomcrwn.ap-south-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=song9116
# DB_NAME=YOUR_DB_NAME
EOF
chown ubuntu:ubuntu /home/ubuntu/app.env
chmod 600 /home/ubuntu/app.env

# 5) 로그 파일 권한 정리
rm -f /home/ubuntu/log.txt
touch /home/ubuntu/log.txt
chown ubuntu:ubuntu /home/ubuntu/log.txt

# 6) FastAPI 실행 (백그라운드) - env 로드 후 실행
nohup /bin/bash -c "set -a; source /home/ubuntu/app.env; set +a; \
  /home/ubuntu/venv/bin/python -m uvicorn main:app \
  --app-dir /home/ubuntu \
  --host 0.0.0.0 \
  --port 8000" >> /home/ubuntu/log.txt 2>&1 &
```

![image.png](/images/posts/aws-3tier-구조-구축하기/image12.png)

생성을 확인하면 테스트 해야하는데 프라이빗 영역에 올렸으니 EC2 엔드포인트 생성을 통해 ssh에 연결해야합니다.

![image.png](/images/posts/aws-3tier-구조-구축하기/image13.png)

유형에 EC2 선택하고,

![image.png](/images/posts/aws-3tier-구조-구축하기/image14.png)

vpc + 보안그룹까지 설정해줍니다. 보안그룹은 ssh, fastapi, http, https 포트 규칙이 들어있으면 됩니다.

서브넷은 Public 영역 선택해줍니다.

이제 생성한 fastapi 인스턴스 클릭 → 연결 → EC2 인스턴스 연결 → 연결유형 프라이빗 IP를 사용하여 연결로 연결 선택 후 연결

(여기서 생성한 엔드포인트가 선택되어 있어야합니다.)

```Bash
curl localhost:8000
```

을 집어넣어서 `{"status": "ok"}` 가 나오면 연결 체크 끝입니다.

---

## Nginx 구성

EC2 메뉴로 들어가 인스턴스 시작 클릭

![image.png](/images/posts/aws-3tier-구조-구축하기/image15.png)

인스턴스 유형 : t3.micro

키 페어 : 생성해둔거 선택

![image.png](/images/posts/aws-3tier-구조-구축하기/image16.png)

![image.png](/images/posts/aws-3tier-구조-구축하기/image17.png)

생성해둔 vpc 선택, 서브넷 public 선택

보안그룹은 ssh, http, https 열어준거 선택합니다.

고급 세부 정보 → 사용자 데이터(User Data)에 다음과 같이 삽입

```Bash
# nginx User Data
#---------------------
#!/bin/bash
sudo apt update -y
sudo apt install openssh-server nginx -y

sudo systemctl enable ssh
sudo systemctl restart ssh

sudo systemctl enable nginx
sudo systemctl restart nginx

echo "charset utf-8;" | sudo tee /etc/nginx/conf.d/charset.conf

sudo systemctl restart nginx
```

인스턴스 시작 클릭 !

생성한 인스턴스 선택 후 퍼블릭 DNS 복사해서 주소창에 넣어서 실행 확인하기

![image.png](/images/posts/aws-3tier-구조-구축하기/image18.png)

---

## 마무리

이번 구성의 핵심은 "네트워크 분리 + 최소 권한 + 계층 분리"입니다.
이 3가지만 지켜도 단일 서버 구조보다 보안성과 운영 안정성을 크게 높일 수 있습니다.
다음 단계로는 ALB 도입, 무중단 배포, 모니터링 자동화까지 연결해 더 큰 아키텍처로 확장해보면 좋습니다.
