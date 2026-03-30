---
id: 310be0b2-87a1-80bf-912b-c0b81069acc8
title: '[Terraform] 이론'
slug: terraform-theory
date:
  start_date: '2026-02-05'
createdTime: 'Mon Feb 23 2026 00:38:00 GMT+0000 (Coordinated Universal Time)'
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
summary: Terraform에서 자주 나오는 핵심 이론을 먼저 정리한 글 !
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
[Terraform] 핵심 블록 빠르게 이해하기

Terraform은 원하는 상태를 코드로 선언하고 실제 인프라를 그 상태로 수렴시키는 도구입니다. 처음에는 블록 역할만 정확히 구분하셔도 코드 해석이 훨씬 쉬워집니다.

  - 이 글에서는 실무에서 자주 보는 블록을 중심으로, 어떤 상황에서 무엇을 써야 하는지 간단히 정리해 드리겠습니다.
1) terraform 블록: 실행 기준(버전, required_providers)을 정의합니다.

![image.png](/images/posts/terraform-theory/image1.png)

2) provider 블록: 어떤 클라우드/리전/계정을 대상으로 작업할지 지정합니다.

3) resource 블록: 실제로 생성·수정·삭제할 인프라를 선언합니다.

4) data 블록: 이미 존재하는 리소스 정보를 조회해 참조합니다.

5) variable 블록: 환경별로 달라지는 값을 입력 변수로 분리합니다.

6) locals 블록: 중복 값을 정리하고 표현식을 단순화합니다.

7) output 블록: apply 이후 확인해야 하는 값을 외부로 노출합니다.

![image.png](/images/posts/terraform-theory/image2.png)

## 예시 코드

```Plain Text
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-2"
}

resource "aws_s3_bucket" "logs" {
  bucket = "example-logs-bucket-1234"
}
```

## 마무리

블록별 역할을 기준으로 코드를 읽으시면 Terraform 학습 속도가 크게 빨라집니다. 이후에는 module과 state 관리 전략까지 확장해 보시면 좋습니다.
