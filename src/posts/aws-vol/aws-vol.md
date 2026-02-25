---
id: 2f4be0b2-87a1-8026-ba85-ce3db56cf9c6
title: '[AWS] Volume 알아보기'
slug: aws-vol
date:
  start_date: '2025-11-10'
createdTime: 'Mon Jan 26 2026 07:52:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
category:
  - AWS
summary: EBS 볼륨 개념과 생성·연결·확장 과정을 실습 기준으로 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
# [AWS] EBS Volume 알아보기

EC2에 볼륨을 연결한 뒤 `포맷 -> 마운트 -> /etc/fstab 등록`으로 영구 마운트를 구성합니다.

  - 웹 루트와 로그를 볼륨에 두면 인스턴스를 다시 만들어도 데이터 유지가 쉬워집니다.
  - 볼륨은 반드시 사용하려는 EC2와 **같은 가용 영역(AZ)** 에 생성해야 합니다.
## 문제

중요한 데이터를 EC2 내부에만 두면 인스턴스 교체 시 유실될 수 있습니다.

이번 글은 Volume(EBS)로 데이터를 분리해 관리하는 과정을 정리한 기록입니다.

---

## 1) EC2 생성

```Bash
# EC2 생성시 USER DATA

#!/bin/bash
sudo apt update -y
sudo apt install nginx -y
sudo systemctl enable ssh
sudo systemctl restart ssh
```

![image.png](/images/posts/aws-vol/image1.png)

생성할 때 볼륨을 추가합니다.

---

## 2) 볼륨 연결 후 장치 확인

EC2 접속 후 디스크를 확인합니다.

  1. ec2 들어가서 `lsblk` 
하면 15G disk가 추가된 걸 확인할 수 있습니다.
![image.png](/images/posts/aws-vol/image2.png)

연결만 된 상태이므로 포맷과 마운트가 필요합니다.

---

## 3) 볼륨 포맷/마운트

```Bash
# 새 볼륨에 xfs 파일시스템 생성(초기화)
sudo mkfs -t xfs /dev/xvdb
# 마운트 지점 생성
sudo mkdir -p /mnt/data1
# 볼륨을 마운트 지점에 연결
sudo mount /dev/xvdb /mnt/data1
```

![image.png](/images/posts/aws-vol/image3.png)

포맷 완료

```Bash
# 블록 디바이스/마운트 상태 확인
lsblk
# 파일시스템 용량/마운트 확인
df -h
```

---

## 4) `/etc/fstab`로 상시 마운트

UUID를 확인한 뒤 `fstab`에 등록합니다.

```Bash
# 디바이스 UUID 확인
sudo blkid /dev/xvdb
# fstab 편집
sudo vim /etc/fstab

########### 
# fstab

# /dev/xvdb UUID로 /mnt/data1 자동 마운트
UUID=b0e1ab55-ac64-4635-9138-fc09f9b976d7 /mnt/data1 xfs defaults,nofail 0 2
###########
```

```Bash
# 검증
# 마운트 경로 소유자 변경
sudo chown -R ubuntu:ubuntu /mnt/data1
# 수동 마운트 해제
sudo umount /mnt/data1
# fstab 기준 전체 마운트 재적용
sudo mount -a
# 재마운트 상태 확인
lsblk
# 파일시스템 상태 확인
df -h
```

![image.png](/images/posts/aws-vol/image4.png)

---

## 5) 추가 볼륨 연결

인스턴스 중지 후 Elastic Block Store을 이용해 볼륨을 연결하고 다시 시작한 뒤 반복합니다.

Elastic Block Store → 볼륨 → 볼륨 생성

![image.png](/images/posts/aws-vol/image5.png)

  - 유형 알아둘 것.
  - IOPS : 초당 처리할 수 있는 입/출력 작업 수
  - 처리량 : 볼륨이 동시에 처리할 수 있는 처리량 성능
  - 반드시 가용 영역은 사용하려는 ec2와 동일한 곳에 생성해야 함. 중요
볼륨 → 작업 → 볼륨 연결

![image.png](/images/posts/aws-vol/image6.png)

> 볼륨 연결할 때에는 해당 인스턴스를 중지시키고 해야 한다.

---

```Bash
# 두 번째 볼륨에 xfs 파일시스템 생성
sudo mkfs -t xfs /dev/xvdbb
# 두 번째 마운트 지점 생성
sudo mkdir -p /mnt/data2
# 두 번째 볼륨 마운트
sudo mount /dev/xvdbb /mnt/data2
# 두 번째 볼륨 UUID 확인
sudo blkid /dev/xvdbb
```

![image.png](/images/posts/aws-vol/image7.png)

```Bash
# fstab 편집
sudo vim /etc/fstab

########### 
# fstab
# /dev/xvdbb UUID로 /mnt/data2 자동 마운트
UUID=a1075f94-db9b-4001-b1f5-e91bdc0b231d /mnt/data2 xfs defaults,nofail 0 2
########### 
```

![image.png](/images/posts/aws-vol/image8.png)

```Bash
# 두 번째 마운트 경로 소유자 변경
sudo chown -R ubuntu:ubuntu /mnt/data2
# 수동 마운트 해제
sudo umount /mnt/data2
# fstab 기준 전체 마운트 재적용
sudo mount -a
# 재마운트 상태 확인
lsblk
```

---

## 6) Nginx 루트를 볼륨 경로로 변경

웹 파일과 로그를 마운트한 경로에서 관리합니다.

```Bash
# nginx Root 디렉토리 생성 및 권한 수정
sudo mkdir -p /mnt/data1/www/nginx/html
sudo chown -R nobody:nogroup /mnt/data1/www
sudo chmod -R 777 /mnt/data1/www

# 기본 언어 설정(권한 오류 => vim으로 만들 것)
sudo echo "charset utf-8;" > /etc/nginx/conf.d/charset.conf

# config 파일 변경 / 경로가 기존 설정파일과 다름.
sudo vim /etc/nginx/sites-enabled/default
# root /var/www/html; 을 /mnt/data1/www/nginx/html로 변경


# index.html 생성
sudo cat <<EOF > /mnt/data1/www/nginx/html/index.html
<!DOCTYPE html>
<html lang="ko">
<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, inital-scale=1.0">
		<title>Document</title>
</head>
<body>
	<h1>안녕하세요~</h1>
</body>
</html>
EOF

# restart
sudo systemctl restart nginx
curl localhost
```

## 7) AMI, 시작 템플릿, ASG, ALB

인스턴스 → 작업 → 이미지 및 템플릿→ 이미지 생성

![image.png](/images/posts/aws-vol/image9.png)

볼륨은 그대로 가져가고 싶으면 건들이면 안됩니다.

EC2 → 시작 템플릿 → 생성

키, 보안그룹만 포함해서 생성

![image.png](/images/posts/aws-vol/image10.png)

볼륨도 생성하는 것을 확인하고 넘어갑니다.

오토스케일그룹 생성 → 타겟 그룹 생성 → 로드밸런서 생성

템플릿 → 작업 → 오토 스케일 그룹 생성

![image.png](/images/posts/aws-vol/image11.png)

로드밸런서 없음으로  생성합니다.

![image.png](/images/posts/aws-vol/image12.png)

![image.png](/images/posts/aws-vol/image13.png)

이 이후는 크게 다를거 없이 대상 그룹, 로드밸런서, ALB 생성 하시면 됩니다. 

## 마무리

이번 설정의 핵심은 볼륨을 단순 연결하는 것이 아니라, 재시작과 인스턴스 교체 이후에도 같은 데이터 경로를 유지하는 것입니다.

`mkfs`, `mount`, `/etc/fstab`까지 한 흐름으로 묶어두면 EC2 운영이 훨씬 안정적입니다.

다음 단계로는 AMI, 시작 템플릿, ASG까지 연결해 확장 시나리오에서 동일하게 동작하는지 검증해보면 좋습니다.
