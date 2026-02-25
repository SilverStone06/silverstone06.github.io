---
id: 2f6be0b2-87a1-80a8-b37c-ea440b48dd72
title: '[AWS] ECS 컨테이너 2개 빌드하기'
slug: aws-ecs-컨테이너-2개-빌드하기
date:
  start_date: '2025-11-24'
createdTime: 'Wed Jan 28 2026 00:49:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
category:
  - AWS
summary: ECS에서 컨테이너 2개를 빌드·운영하는 과정을 실습으로 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## TL;DR

  - ECS 한 태스크 안에 `nginx`와 `FastAPI` 컨테이너를 함께 배치해 서비스합니다.
  - `nginx`는 정적 파일을 서빙하고, `/api/` 요청은 컨테이너 간 통신으로 FastAPI에 프록시합니다.
## 시작 전 목표

  - 두 컨테이너를 하나의 태스크 정의에 묶어 실행하기
  - 컨테이너 별칭(`fastapi-app`)으로 내부 라우팅 연결하기
## 1. Nginx 설정 (프론트 + API 프록시)

```Bash
# default.conf
# ------------
charset utf-8;

server {
    listen 80;
    server_name _; # ALB를 통해 들어오므로 모든 호스트 허용

    # 클라이언트 실제 IP 및 프로토콜 전달 설정
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto; # ALB가 보낸 프로토콜(https) 전달

    # 1. 프론트엔드 정적 파일
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 2. FastAPI 백엔드 프록시
    location /api/ {
        proxy_pass http://fastapi-app:8000/; # 컨테이너 별칭을 사용해 지정할 예정
        proxy_http_version 1.1;
    }
}
# ------------
```

## 2. FastAPI 설정

```Bash
# main.py
# -----------
# fastapi 테스트 페이지

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "FastAPI"}
# -----------

# requirements.txt
# -----------
uvicorn
fastapi
# -----------
```

![image.png](/images/posts/aws-ecs-컨테이너-2개-빌드하기/image1.png)

## 3. 태스크 정의에서 컨테이너 연결

  - FastAPI 컨테이너에 별칭 `fastapi-app`을 지정합니다.
  - Nginx 컨테이너의 `proxy_pass http://fastapi-app:8000/`가 이 별칭을 통해 FastAPI로 라우팅됩니다.
## 확인 체크리스트

  - 두 컨테이너가 같은 ECS 태스크에서 `RUNNING`인지
  - Nginx 접근 시 정적 페이지가 정상 노출되는지
  - `/api/` 요청이 FastAPI 응답으로 정상 전달되는지
## 마무리

핵심은 컨테이너 별칭 기반 내부 통신입니다. 이 구성이 완료되면 하나의 서비스에서 프론트(Nginx)와 API(FastAPI)를 함께 운영할 수 있습니다.
