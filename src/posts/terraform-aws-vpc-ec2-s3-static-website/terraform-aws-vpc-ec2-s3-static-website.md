---
id: 31abe0b2-87a1-81e1-9c3c-e5b8d4deb6d3
title: '[Terraform] VPC, EC2, S3 구축'
slug: terraform-aws-vpc-ec2-s3-static-website
date:
  start_date: '2026-02-19'
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
summary: 'Terraform으로 VPC, EC2, S3를 구성하는 흐름을 정리한 글 !'
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
# [Terraform] VPC, EC2, S3 구축

## TL;DR

이 글은 terraform/ex-02/network.tf 한 파일로 VPC, subnet, IGW/NAT, EC2, S3 정적 웹사이트까지 이어지는 전체 흐름을 코드 중심으로 설명합니다. 핵심은 “통신 경로를 먼저 설계하고 컴퓨트를 올린다”입니다.

## 시작 전 목표

  - 10.0.0.0/16 내부에서 public/private 역할을 분리합니다.
  - IGW와 NAT가 각각 어떤 방향의 트래픽을 담당하는지 이해합니다.
  - EC2 user_data, S3 website 정책이 어떻게 연결되는지 확인합니다.
## Problem

네트워크 경로를 먼저 정하지 않고 EC2부터 만들면, 접근 제어와 라우팅을 뒤늦게 고치느라 구조가 복잡해집니다. ex-02는 이 문제를 피하기 위해 VPC부터 단계적으로 선언합니다.

## 1) VPC와 subnet 구분

```HCL
resource "aws_vpc" "song_study_vpc" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "song_study_public_subnet" {
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "song_study_private_subnet" {
  cidr_block = "10.0.2.0/24"
}
```

`10.0.1.0/24`는 외부 진입을 받는 public, `10.0.2.0/24`는 직접 진입을 막는 private 역할입니다. 이 구분이 이후 SG와 route table 설계 기준이 됩니다.

## 2) IGW, NAT, Route Table 경로

```HCL
resource "aws_route_table" "public1a_rt" {
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.song_study_igw.id
  }
}

resource "aws_route_table" "private1a_rt" {
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.song_study_public1a_nat.id
  }
}
```

IGW는 인터넷 양방향 진입점, NAT는 private subnet의 outbound 전용 경로입니다. 즉 private 인스턴스는 패키지 다운로드는 가능하지만 외부에서 직접 SSH 진입은 불가합니다.

## 3) EC2 user_data와 웹 초기화

```HCL
resource "aws_instance" "song_study_ec2" {
  ami           = "ami-0b6c6ebed2801a5cb"
  instance_type = "t3.micro"
  user_data = <<-EOF
    #!/bin/bash
    sudo apt update -y
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    echo "<h1>Welcome to Song's Web Server</h1>" > /var/www/html/index.html
  EOF
}
```

부팅 시 자동으로 Nginx를 설치해 즉시 웹 응답을 확인할 수 있습니다. user_data가 커지면 별도 스크립트 파일로 분리하는 방식이 관리에 유리합니다.

## 4) S3 정적 웹사이트 공개 구성

```HCL
resource "aws_s3_bucket_public_access_block" "song_study_bucket_public_access_block" {
  block_public_acls       = false
  ignore_public_acls      = false
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "song_study_bucket_web_config" {
  index_document { suffix = "index.html" }
}

resource "aws_s3_bucket_policy" "song_study_bucket_policy" {
  policy = jsonencode({
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.song_study_bucket.arn}/*"
    }]
  })
}
```

정적 웹사이트 실습을 위해 공개 읽기를 허용한 구성입니다. 운영 환경이라면 직접 공개 대신 CloudFront + OAC 방식으로 전환하는 것이 일반적입니다.

## 개선 포인트

  - SSH/HTTP 0.0.0.0/0 허용은 학습용으로만 두고, 운영 시 소스 IP를 제한하세요.
  - S3 버킷 이름 고정값은 충돌 가능성이 크므로 접두사/환경값을 붙여 유니크 전략을 두세요.
  - 현재 private subnet을 만들었지만 앱 서버는 public EC2에 있습니다. 운영형 구조에서는 앱을 private로 이동하는 것이 일반적입니다.
## 마무리

ex-02는 인프라 전체 흐름을 빠르게 체감하기 좋은 예제입니다. 이 코드를 기준으로 다음에는 보안 경계와 배포 경로를 더 엄격히 나누는 방향으로 정리하면 운영 품질이 크게 올라갑니다.
