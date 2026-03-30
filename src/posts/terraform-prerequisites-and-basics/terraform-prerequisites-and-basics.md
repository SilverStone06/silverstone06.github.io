---
id: 30cbe0b2-87a1-80ef-89ab-fc3585c3d270
title: '[TerraForm] 사용하기 위한 사전 작업 및 기초'
slug: terraform-prerequisites-and-basics
date:
  start_date: '2026-01-29'
createdTime: 'Thu Feb 19 2026 00:38:00 GMT+0000 (Coordinated Universal Time)'
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
summary: Terraform을 시작하기 전에 필요한 사전 작업과 기본 개념을 정리한 글 !
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
테라폼 공식 사이트에서 설치 파일 다운로드

C:\terraform_1.14.5 에 압축해제 

terrraform.exe가 있는 폴더를 Path에 신규 등록

시스템 변수에서 Path 편집 클릭 → 찾아보기를 통해 디렉토리 추가

powerShell 에서 `terraform —version` 으로 확인

시작전 `aws sts get-caller-indentity` 로 자격증명 확인

파일을 분리하는 이유

provider.tf

main.tf

variables.tf

outputs.tf

terraform.tfvars

```Bash
# provider.tf
# 설정 파일에서 사용할 프로바이더를 정의합니다.
# 개발 환경 구성 : CSP, 라이브러리, 버전, 리전
terraform {
  required_providers {
    aws = {
      # 다운받을 라이브러리 경로
      source  = "hashicorp/aws"
      version = "~> 5.0" # 5.0 버전 이상 중 최신 버전 사용
    }
  }
}

# 리전 설정
provider "aws" {
  region = "ap-southeast-2" # 시드니 리전 사용
}

# terraform init 실행

```

![image.png](/images/posts/terraform-prerequisites-and-basics/image1.png)

```Bash
# main.tf
# AWS EC2 인스턴스를 생성하는 리소스 블록입니다.
# 별칭 : 프로젝트 내에서 테라폼이 사용할 이름, 콘솔에서는 확인되지 않음.
# 대쉬는 언더스코어로 대체해야 합니다.
resource "aws_instance" "song_test_ec2" {
  ami           = "ami-0ba8d27d35e9915fb" # Ubuntu Server 22.04 LTS (HVM), SSD Volume
  instance_type = "t3.micro"              # 무료 티어에 해당하는 인스턴스 유형

  tags = {
    Name = "song_test_ec2" # 인스턴스에 태그를 추가하여 식별하기 쉽게 만듭니다.
  }
}

# teffaform plan -out=planfile 실행
# terraform show planfile 실행하여 계획된 변경 사항을 확인할 수 있습니다.
# terraform apply 실행해 인스턴스를 생성합니다.
# terraform destroy 실행해 인스턴스를 삭제합니다.

```

![image.png](/images/posts/terraform-prerequisites-and-basics/image2.png)

혹은 `terraform show planfile > planfile.txt` 로 txt파일로 저장해 읽을 수 있다.

plan으로 저장하고, terraform apply 로 실행

![image.png](/images/posts/terraform-prerequisites-and-basics/image3.png)

![image.png](/images/posts/terraform-prerequisites-and-basics/image4.png)

### 정리(삭제) 명령어

```Bash
terraform destroy
# plan 파일을 사용했다면
terraform destroy -auto-approve
```

실습이 끝난 뒤에는 위 명령어로 생성한 리소스를 정리해 비용이 발생하지 않도록 관리하세요.

### 마무리

요약하면, Terraform 설치와 PATH 설정, AWS 자격증명 확인, 그리고 init/plan/apply/destroy 기본 흐름까지 한 번에 정리했습니다.
