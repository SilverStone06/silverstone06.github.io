---
id: 31abe0b2-87a1-810d-bc22-d890c8825c89
title: '[Terraform] ALB와 Auto Scaling'
slug: single-ec2-to-alb-asg
date:
  start_date: '2026-02-26'
createdTime: 'Thu Mar 05 2026 01:21:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Private
type:
  - Post
tags:
  - AWS
  - Cloud
  - Blog
category:
  - AWS
summary: Terraform으로 ALB와 Auto Scaling을 구성하는 흐름을 정리한 글 !
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
# [Terraform] ALB와 Auto Scaling

## TL;DR

terraform/ex-03 코드를 기준으로 단일 서버 한계를 ALB + ASG 구조로 해결하는 과정을 정리합니다. 핵심은 트래픽 분산(ALB), 인스턴스 템플릿(LT), 개수 제어(ASG)의 책임 분리입니다.

## 시작 전 목표

  - Multi-AZ subnet 설계가 확장성에 왜 필요한지 이해합니다.
  - ALB, Target Group, Listener 연결 관계를 코드로 확인합니다.
  - ASG의 min/desired/max와 CPU target policy 해석 기준을 익힙니다.
## Problem

단일 EC2 구조는 장애 지점이 하나이고, 트래픽 급증 시 수평 확장이 어렵습니다. ex-03는 동일 서비스를 여러 인스턴스로 분산하고, 상태를 자동 조절하는 구조로 바꾸는 예제입니다.

## 1) Multi-AZ 네트워크 기반

```HCL
resource "aws_subnet" "song_public1_subnet" { cidr_block = "10.0.1.0/24" }
resource "aws_subnet" "song_public2_subnet" { cidr_block = "10.0.2.0/24" }
resource "aws_subnet" "song_public3_subnet" { cidr_block = "10.0.3.0/24" }

resource "aws_subnet" "song_private1_subnet" { cidr_block = "10.0.4.0/24" }
resource "aws_subnet" "song_private2_subnet" { cidr_block = "10.0.5.0/24" }
resource "aws_subnet" "song_private3_subnet" { cidr_block = "10.0.6.0/24" }
```

public subnet은 ALB가 외부 요청을 받는 위치, private subnet은 서비스 인스턴스를 두는 위치로 역할을 분리합니다. 이 분리가 보안 그룹 설계의 기준점입니다.

## 2) ALB, Target Group, Listener

```HCL
resource "aws_lb_target_group" "song_web_tg" {
  port     = 80
  protocol = "HTTP"
  health_check {
    path                = "/"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }
}

resource "aws_lb" "song_web_lb" {
  load_balancer_type = "application"
  internal           = false
}

resource "aws_lb_listener" "song_web_listener" {
  port     = 80
  protocol = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.song_web_tg.arn
  }
}
```

Target Group은 단순 대상 목록이 아니라 health check 단위입니다. 비정상 인스턴스는 자동으로 트래픽 대상에서 빠지므로, 장애 전파를 줄이는 역할을 합니다.

## 3) Launch Template와 ASG

```HCL
resource "aws_launch_template" "song_web_lt" {
  image_id      = "ami-0b3d362e82f48c4bb"
  instance_type = "t3.micro"
  user_data = base64encode(<<-EOF
    #!/bin/bash
    systemctl start nginx
    systemctl enable nginx
  EOF
  )
}

resource "aws_autoscaling_group" "song_web_asg" {
  min_size         = 2
  desired_capacity = 2
  max_size         = 3
  vpc_zone_identifier = [
    aws_subnet.song_private1_subnet.id,
    aws_subnet.song_private2_subnet.id,
    aws_subnet.song_private3_subnet.id
  ]
  target_group_arns = [aws_lb_target_group.song_web_tg.arn]
}
```

Launch Template는 “어떤 인스턴스를 만들지”를 정의하고, ASG는 “몇 대를 유지할지”를 정의합니다. `min=2, desired=2, max=3`은 평시 2대 유지 후 부하 시 최대 3대로 확장한다는 뜻입니다.

## 4) Target Tracking 정책 해석

```HCL
resource "aws_autoscaling_policy" "song_web_asg_policy" {
  policy_type = "TargetTrackingScaling"
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 50.0
  }
}
```

CPU 평균이 목표치 50%를 넘는 구간이 이어지면 scale out, 다시 안정 구간으로 내려오면 scale in이 진행됩니다. 목표값은 워크로드 특성에 맞춰 조정하는 값입니다.

## 개선 포인트

  - `2.network.tf`의 단일 EC2 흔적과 ASG 구성이 혼재되어 있어 파일 역할을 더 분리하면 학습 흐름이 좋아집니다.
  - 보안 그룹 명명에서 ALB SG와 웹 SG 관계를 더 직관적으로 드러내면 유지보수가 쉬워집니다.
  - AMI 수동 생성 기반 템플릿은 운영 자동화 한계가 있어 이미지 빌드 파이프라인 연동을 고려하세요.
  - NAT Gateway 1개 구성은 AZ 장애 시 리스크가 있으므로 고가용성이 필요하면 AZ별 NAT를 검토하세요.
## 마무리

ex-03는 확장형 웹 구조의 핵심 요소를 모두 경험하기 좋은 예제입니다. 운영 전환 시에는 SG 명확화, 이미지 자동화, NAT 고가용성부터 보강하면 구조 완성도가 높아집니다.
