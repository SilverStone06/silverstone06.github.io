---
id: 31abe0b2-87a1-81ad-b710-dc36d26dd22c
title: '[Terraform] 기초 문법 정리'
slug: terraform-start-provider-variable-count-foreach
date:
  start_date: '2026-02-12'
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
summary: Terraform의 기초 문법과 자주 쓰는 개념을 한 번에 정리한 글 !
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
# [Terraform] 기초 문법 정리

## TL;DR

이 글은 terraform/ex-01, ex-04 코드를 기준으로 Provider, variable, locals, count, for_each, backend를 한 흐름으로 정리한 입문 가이드입니다. 핵심은 “어디에 무엇을 선언해야 유지보수가 쉬워지는가”입니다.

## 시작 전 목표

  - Terraform 프로젝트의 최소 구성 블록을 구분합니다.
  - 반복문(count/for_each) 선택 기준을 코드로 이해합니다.
  - state/backend 설정이 왜 협업 품질에 직결되는지 확인합니다.
## 1) Provider와 terraform 블록

ex-01, ex-04에서 공통으로 보이는 시작점은 `terraform.required_providers`와 `provider "aws"`입니다. 이 둘은 “어떤 플러그인을 어떤 버전대로, 어느 리전에 연결할지”를 고정합니다.

```HCL
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.default_region
  default_tags {
    tags = var.default_tag
  }
}
```

`version = "~> 5.0"`처럼 경계를 두면 팀원이 실행해도 큰 동작 차이를 줄일 수 있습니다. 또한 `default_tags`를 provider에 두면 리소스마다 중복 태그를 반복하지 않아도 됩니다.

## 2) variable과 locals를 나누는 기준

작성하신 코드에서 variable은 외부 입력값, locals는 내부 조합값으로 역할이 분명합니다. 이 분리가 잘 되어 있으면 tfvars를 바꾸는 것만으로 환경 전환이 쉬워집니다.

```HCL
variable "default_tag" {
  type = map(string)
  default = {
    Username    = "song"
    Team        = "team2"
    Environmnet = "test"
  }
}

locals {
  service_name = "${var.default_tag["Username"]}-${var.default_tag["Environmnet"]}-ec2"
}
```

현재 코드에는 `Environment`와 `Environmnet` 표기가 혼재됩니다. 학습 단계에서는 문제없지만, 운영 태그 필터를 자동화할 때는 키를 하나로 통일해 두는 편이 좋습니다.

## 3) count와 for_each 반복 문법

count는 인덱스 기반 반복, for_each는 키 기반 반복입니다. 인스턴스처럼 순번이 중요한 리소스는 count가 단순하고, 버킷처럼 이름 단위 식별이 중요한 리소스는 for_each가 안전합니다.

```HCL
resource "aws_instance" "this" {
  count         = 3
  ami           = "ami-0ba8d27d35e9915fb"
  instance_type = "t3.micro"
}

resource "aws_s3_bucket" "song_buckets" {
  for_each = toset(["logs", "media", "backups"])
  bucket_prefix = "${local.suffix}-${each.key}-"
}
```

## 4) 상태 파일과 backend

ex-04의 backend는 S3를 사용합니다. 핵심은 상태를 로컬이 아니라 공유 저장소에 두어 팀 실행 결과를 맞추는 것입니다.

```HCL
backend "s3" {
  bucket       = "song-tf-bucket"
  key          = "study/terraform.tfstate"
  region       = "ap-southeast-2"
  encrypt      = true
  use_lockfile = false
  # 이 블록 안에서는 변수 사용을 할 수 없음
}
```

주석대로 backend 블록은 변수 사용이 제한됩니다. 또한 `use_lockfile = false`는 동시에 apply가 일어날 때 충돌 위험을 키울 수 있으므로, 협업 단계에서는 잠금 전략을 반드시 검토해야 합니다.

## 개선 포인트

  - 태그 키 표기(`Environment`/`Environmnet`)를 통일하세요.
  - backend 잠금 비활성화는 학습용으로만 두고, 협업 시 잠금 전략을 활성화하세요.
  - output 값은 민감 정보가 섞이지 않도록 범위를 제한하세요.
## 마무리

기초 문법은 “선언 위치를 맞추는 습관”이 핵심입니다. 마지막으로 실습 종료 시에는 아래 명령으로 생성 리소스를 정리해 비용 누수를 막을 수 있습니다.

```HCL
terraform init
terraform plan
terraform apply
terraform destroy
```
