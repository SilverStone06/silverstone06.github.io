---
id: 31abe0b2-87a1-81c1-935d-e449ed8291ad
title: '[Terraform] Bastion, RDS, DB Subnet'
slug: bastion-rds-db-subnet-separation
date:
  start_date: '2026-03-05'
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
summary: 'Terraform으로 Bastion, RDS, DB Subnet을 구성하는 흐름을 정리한 글 !'
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
# [Terraform] Bastion, RDS, DB Subnet

## TL;DR

terraform/ex-05 코드를 기준으로 public/private/db subnet 분리, Bastion 진입, RDS 배치를 한 번에 정리합니다. 핵심은 DB를 외부에서 직접 노출하지 않고 접근 경로를 강제하는 설계입니다.

## 시작 전 목표

  - AZ별 subnet 자동 생성을 코드로 이해합니다.
  - Bastion을 운영 접근 단일 진입점으로 두는 이유를 정리합니다.
  - RDS 보안/백업/삭제보호 설정의 의미를 구분합니다.
## Problem

DB를 public subnet에 두거나 공인 접근을 허용하면 공격면이 급격히 넓어집니다. ex-05는 네트워크를 레이어로 나누고 Bastion 경유 접근을 강제하는 구조를 실습합니다.

## 1) public/private/db subnet 분리

```HCL
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "public_subnet" {
  for_each = toset(data.aws_availability_zones.available.names)
  cidr_block = "10.0.${index(data.aws_availability_zones.available.names, each.value)}.0/24"
}

resource "aws_subnet" "private_subnet" {
  for_each = toset(data.aws_availability_zones.available.names)
  cidr_block = "10.0.${index(data.aws_availability_zones.available.names, each.value) + 3}.0/24"
}

resource "aws_subnet" "db_subnet" {
  for_each = toset(data.aws_availability_zones.available.names)
  cidr_block = "10.0.${index(data.aws_availability_zones.available.names, each.value) + 6}.0/24"
}
```

같은 AZ 집합을 반복하면서 용도별 대역을 나눈 점이 좋습니다. 이 패턴은 환경이 커져도 규칙을 유지하기 쉽습니다.

## 2) Bastion Host와 SG 경계

```HCL
resource "aws_security_group" "ssh_sg" {
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "bastion_instance" {
  subnet_id = aws_subnet.public_subnet[data.aws_availability_zones.available.names[0]].id
  key_name  = var.key_pair
  vpc_security_group_ids = [aws_security_group.ssh_sg.id]
}
```

Bastion은 운영자가 내부 자원에 접근하는 단일 진입점입니다. 현재 코드는 SSH 소스가 전체 개방이라 학습용으로는 단순하지만, 운영에서는 고정 IP 또는 Session Manager 방식이 더 안전합니다.

## 3) RDS subnet group과 접근 제한

```HCL
resource "aws_db_subnet_group" "db_subnet_group" {
  subnet_ids = [for az in aws_subnet.db_subnet : az.id]
}

resource "aws_security_group" "rds_sg" {
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ssh_sg.id]
  }
}
```

RDS는 DB 전용 subnet group에 배치하고, 보안 그룹에서 Bastion 경로만 허용해 접근면을 좁힙니다. `publicly_accessible = false`와 함께 써야 의도가 완성됩니다.

## 4) Multi-AZ와 Replica, 보호 설정

```HCL
resource "aws_db_instance" "mysql_master" {
  engine                  = "mysql"
  engine_version          = "8.0"
  username                = "song"
  password                = "song1234!"
  multi_az                = true
  publicly_accessible     = false
  storage_encrypted       = true
  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false
}

resource "aws_db_instance" "mysql_replica" {
  replicate_source_db = aws_db_instance.mysql_master.identifier
  count               = 1
}
```

`multi_az = true`는 장애 대비 가용성, replica는 읽기 부하 분산 목적입니다. 둘은 이름이 비슷해도 목적이 다릅니다.

## 개선 포인트

  - `password = "song1234!"` 하드코딩은 Secrets Manager 또는 SSM Parameter Store로 분리해야 합니다.
  - `skip_final_snapshot = true`, `deletion_protection = false`는 학습용 설정이므로 운영에서는 반대로 두는 것이 일반적입니다.
  - SSH `0.0.0.0/0`는 반드시 축소하고, 가능하면 Session Manager로 대체하세요.
## 마무리

ex-05는 실무형 네트워크 분리 감각을 익히기에 좋은 예제입니다. 운영 전환에서는 비밀값 분리, 접근 경계 축소, 데이터 보호 옵션 강화 순서로 개선하시면 됩니다.
