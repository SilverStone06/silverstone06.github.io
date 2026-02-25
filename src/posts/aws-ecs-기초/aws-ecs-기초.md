---
id: 2f5be0b2-87a1-8024-baa2-c8ceb78d0285
title: '[AWS] ECS 기초'
slug: aws-ecs-기초
date:
  start_date: '2025-11-20'
createdTime: 'Tue Jan 27 2026 01:40:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
category:
  - AWS
summary: ECS 핵심 개념과 기본 구성 요소를 빠르게 익히는 기초 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## TL;DR

  - 퍼블릭 서브넷에 ALB를 두고, ECS 태스크는 프라이빗 서브넷에서 실행하는 구성으로 배포합니다.
  - 대상 그룹(ALB)은 이전 글에서 만든 리소스를 재사용하고, 이번 글에서는 ECS 쪽 설정에 집중합니다.
## 시작 전 구성

  - VPC/서브넷/라우팅/보안 그룹은 사전 구성되어 있다고 가정합니다.
  - ALB와 대상 그룹은 이미 생성되어 있으며, 서비스 연결만 진행합니다.
## 1. 클러스터 생성

![image.png](/images/posts/aws-ecs-기초/image1.png)

![image.png](/images/posts/aws-ecs-기초/image2.png)

  - t2.micro(1 vCPU, 1GiB 메모리)
![image.png](/images/posts/aws-ecs-기초/image3.png)

## 2. 대상 그룹 확인

  - 이전 단계에서 만든 대상 그룹을 그대로 재사용합니다.
  - 이 단계에서는 대상 그룹을 새로 만들지 않고, ECS 서비스 생성 시 연결만 진행합니다.
## 3. 태스크 정의 생성

![image.png](/images/posts/aws-ecs-기초/image4.png)

  - 테스트 목적이라 `0.25 vCPU / 0.5 GB`로 설정했습니다.
  - `nginx` 단일 컨테이너 기준으로는 충분한 스펙입니다.
![image.png](/images/posts/aws-ecs-기초/image5.png)

  - 이미지 URI만 지정하고 나머지 옵션은 기본값으로 진행했습니다.
## 4. 서비스 생성

  - `배포 -> 서비스 생성`으로 이동합니다.
  - 서비스 이름은 자동 생성값을 사용해도 무방합니다.
![image.png](/images/posts/aws-ecs-기초/image6.png)

![image.png](/images/posts/aws-ecs-기초/image7.png)

  - 원하는 태스크 수는 `2`를 권장합니다.
  - 한 태스크에 장애가 나도 나머지 태스크가 트래픽을 받아 가용성을 유지할 수 있습니다.
![image.png](/images/posts/aws-ecs-기초/image8.png)

![image.png](/images/posts/aws-ecs-기초/image9.png)

![image.png](/images/posts/aws-ecs-기초/image10.png)

## 5. 배포 확인

  - ALB DNS로 접속해 `nginx` 기본 페이지가 보이면 정상 배포입니다.
  - ECS 서비스 이벤트 탭에서 태스크가 안정적으로 유지되는지 확인합니다.
## 확인 체크리스트

  - 태스크가 프라이빗 서브넷에서 `RUNNING` 상태인지
  - 대상 그룹 헬스 체크가 `healthy`인지
  - ALB를 통해 외부 접속이 가능한지
## 마무리

이번 단계에서는 ECS를 프라이빗 서브넷에 배치하고, ALB를 통해 외부 트래픽을 연결하는 기본 구성을 완료했습니다. 다음 글에서는 오토스케일링/롤링 배포 설정까지 확장해볼 수 있습니다.
