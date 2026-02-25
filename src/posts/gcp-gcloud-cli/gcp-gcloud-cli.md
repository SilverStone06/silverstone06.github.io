---
id: 305be0b2-87a1-8059-9bc2-fba9b3f8b336
title: '[GCP] Gcloud CLI'
slug: gcp-gcloud-cli
date:
  start_date: '2026-01-19'
createdTime: 'Thu Feb 12 2026 00:37:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - GCP
category:
  - GCP
summary: gcloud CLI 설치·인증부터 네트워크·MIG·오토스케일링까지 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## 실습 목표

이 문서는 `gcloud CLI 설치/인증 → 프로젝트 연결 확인 → 네트워크/보안 구성 → 인스턴스 템플릿·MIG·오토스케일링` 흐름을 콘솔 스크린샷 기준으로 정리한 기록입니다.

## Gcloud CLI 설치

  - Windows: `GoogleCloudSDKInstaller.exe`로 설치
  - macOS/Linux: `curl https://sdk.cloud.google.com | bash`
설치 후에는 새 터미널을 열어 `gcloud --version`으로 설치 여부를 먼저 확인합니다.

## 연결 정보 확인

```Bash
# 계정 인증
gcloud auth login

# 기본 프로젝트 선택
gcloud config set project <PROJECT_ID>

# 연결 정보 확인
gcloud config list
```

아래 스크린샷은 인증/프로젝트 선택/설정 확인 순서를 보여줍니다.

#

```

```

![image.png](/images/posts/gcp-gcloud-cli/image1.png)

![image.png](/images/posts/gcp-gcloud-cli/image2.png)

![image.png](/images/posts/gcp-gcloud-cli/image3.png)

![image.png](/images/posts/gcp-gcloud-cli/image4.png)

![image.png](/images/posts/gcp-gcloud-cli/image5.png)

![image.png](/images/posts/gcp-gcloud-cli/image6.png)

![image.png](/images/posts/gcp-gcloud-cli/image7.png)

## 네트워크 구성

이 구간 스크린샷은 `Cloud Router → Cloud NAT → Firewall Rule` 순서로 외부 통신 경로를 구성하는 단계입니다.

  - `Cloud Router`: NAT가 붙을 라우터 생성
  - `Cloud NAT`: 프라이빗 인스턴스의 아웃바운드 인터넷 통신 구성
  - `Firewall`: 서비스 포트/소스 범위에 맞는 허용 규칙 생성
![image.png](/images/posts/gcp-gcloud-cli/image8.png)

![image.png](/images/posts/gcp-gcloud-cli/image9.png)

![image.png](/images/posts/gcp-gcloud-cli/image10.png)

![image.png](/images/posts/gcp-gcloud-cli/image11.png)

![image.png](/images/posts/gcp-gcloud-cli/image12.png)

## 스토리지와 인스턴스 연계

버킷 생성 후 테스트 데이터를 업로드하고, 인스턴스에서 접근 가능한 권한 구조를 맞춥니다.

![image.png](/images/posts/gcp-gcloud-cli/image13.png)

버킷 권한을 점검한 뒤, 해당 데이터를 사용하는 프라이빗 인스턴스를 생성합니다.

![image.png](/images/posts/gcp-gcloud-cli/image14.png)

인스턴스 템플릿을 생성해 동일 스펙으로 확장 가능한 기반을 만듭니다.

![image.png](/images/posts/gcp-gcloud-cli/image15.png)

헬스체크를 생성해 비정상 인스턴스를 자동으로 제외할 수 있도록 구성합니다.

스테이트리스 관리형 인스턴스 그룹(MIG)을 생성해 템플릿 기반으로 인스턴스를 운영합니다. 관리형 인스턴스 그룹 생성


![image.png](/images/posts/gcp-gcloud-cli/image16.png)

오토스케일링 정책(CPU/로드 기준)을 설정해 트래픽 변화에 따라 인스턴스 수가 자동 조절되도록 마무리합니다.

## 최종 점검 체크리스트

  - `gcloud auth login` 및 프로젝트 설정이 올바른지
  - Router/NAT/Firewall가 같은 VPC/리전에 맞게 연결됐는지
  - 버킷 권한과 인스턴스 접근 권한이 충돌하지 않는지
  - 헬스체크 상태가 정상(Healthy)으로 확인되는지
  - MIG 오토스케일링 최소/최대 수치가 실습 목적에 맞는지
## 마무리

이번 문서는 Gcloud CLI 기반으로 네트워크부터 스토리지, 인스턴스 그룹, 오토스케일링까지 이어지는 전체 흐름을 정리한 기록입니다. 다음 단계에서는 Load Balancer와 결합해 트래픽 분산까지 확장하면 운영 시나리오에 더 가까워집니다.
