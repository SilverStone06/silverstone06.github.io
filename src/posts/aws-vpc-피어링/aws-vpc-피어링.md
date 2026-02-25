---
id: 2f7be0b2-87a1-809f-8d83-dd2abee7f303
title: '[AWS] VPC 피어링'
slug: aws-vpc-피어링
date:
  start_date: '2025-11-27'
createdTime: 'Thu Jan 29 2026 02:44:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
category:
  - AWS
summary: AWS VPC 피어링 구성 방법과 라우팅 주의사항을 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## TL;DR

  - 서로 다른 두 VPC를 연결해 사설 네트워크 간 통신을 가능하게 합니다.
  - 핵심은 `피어링 연결 생성 -> 요청 수락 -> 양쪽 라우팅 반영`입니다.
## Goals Before Start

  - 피어링할 VPC 2개 준비
  - CIDR 대역 중복 여부 확인
## 1) 피어링 연결 생성

  - 경로: `VPC -> 피어링 연결 -> 피어링 연결 생성`
  - 로컬 VPC와 대상 VPC, 각 CIDR을 선택해 피어링 요청을 생성합니다.
  - (이미지) 생성 화면에서 VPC/CIDR 값이 올바른지 먼저 확인합니다.
![image.png](/images/posts/aws-vpc-피어링/image1.png)

![image.png](/images/posts/aws-vpc-피어링/image2.png)

  - 요청 생성 후 상태가 `수락 대기 중`이면 `작업 -> 요청 수락`을 수행합니다.
  - (이미지) 요청 수락 메뉴와 피어링 상태를 확인합니다.
## 2) 라우팅 테이블 반영

  - 각 VPC 라우팅 테이블에서 `편집 -> 라우팅 추가`를 선택합니다.
  - 목적지에는 상대 VPC CIDR, 대상은 `피어링 연결(pcx-...)`을 지정합니다.
  - (이미지) 라우팅 편집 화면에서 `pcx-...`가 타깃으로 설정됐는지 확인합니다.
  - 양쪽 VPC 라우팅 테이블에 모두 반영해야 양방향 통신이 됩니다.
## 3) RDS 프록시와 피어링 연동

  1. 기존과 동일하게 RDS를 생성합니다.
  1. `RDS -> 프록시 -> 프록시 생성`에서 프록시를 생성합니다.
  1. 접근용 DB/유저를 준비합니다.
```SQL
CREATE DATABASE ses0609;
CREATE USER 'ses0609' IDENTIFIED BY 'ses0609';
GRANT ALL PRIVILEGES ON ses0609.* TO 'ses0609'@'%';
FLUSH PRIVILEGES;
```

## Checklist

  - 피어링 상태가 `활성(Active)`인지
  - 양쪽 라우팅 테이블에 상대 CIDR + `pcx-...` 타깃이 들어갔는지
  - 보안 그룹/NACL에서 필요한 포트가 허용됐는지
  - 피어링 경유로 대상 리소스(RDS 등) 접속이 되는지
## Wrap-up

VPC 피어링은 연결만 만들면 끝이 아니라 라우팅과 보안 설정까지 맞아야 실제 통신이 됩니다.
