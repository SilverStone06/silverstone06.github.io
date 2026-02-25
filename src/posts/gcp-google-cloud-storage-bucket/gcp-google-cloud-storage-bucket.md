---
id: 304be0b2-87a1-8009-8a60-d707091196fd
title: '[GCP] Google Cloud Storage Bucket'
slug: gcp-google-cloud-storage-bucket
date:
  start_date: '2026-01-15'
createdTime: 'Wed Feb 11 2026 00:40:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - GCP
category:
  - GCP
summary: GCS 버킷 생성부터 정적 웹사이트/LB 연계까지 단계별 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## 실습 목표

이번 문서는 `GCS 버킷 생성 → 정적 웹사이트 설정 → 권한/조직정책 확인 → HTTP(S) 부하분산기 연결` 흐름을 한 번에 정리한 기록입니다.

## 버킷 이름 작성 시 주의점

  - 버킷 이름은 전역에서 유일해야 합니다.
  - 정적 웹사이트 도메인으로 쓸 경우, 실제 서비스 도메인과 네이밍 규칙을 미리 맞춰두면 운영 시 혼선을 줄일 수 있습니다.
  - 이후 Load Balancer와 결합할 계획이라면, 버킷 공개 범위와 IAM 정책을 먼저 결정해두는 것이 좋습니다.
## Google Cloud Storage 생성

Cloud Storage → Bucket → 만들기

이 구간의 스크린샷은 버킷 생성 마법사의 필수 입력값(이름, 리전, 접근 제어)을 순서대로 보여줍니다. 실습에서는 먼저 비공개 기본값으로 만들고, 이후 필요 시 공개 권한을 단계적으로 여는 방식이 안전합니다.

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image1.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image2.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image3.png)

  - 정적 웹사이트를 외부에 공개할 계획이면, 생성 단계에서 `Public Access Prevention` 관련 옵션을 목적에 맞게 확인합니다.
  - 이 옵션은 공개 접근을 제어하는 안전장치 역할을 하므로, 실습/운영 목적을 구분해 설정하는 것이 좋습니다.
![image.png](/images/posts/gcp-google-cloud-storage-bucket/image4.png)

## 정적 웹사이트로 활용

외부 접근이 필요한 경우에만 공개 설정을 적용합니다.

이 구간 이미지는 `웹사이트 구성(기본 페이지/에러 페이지)`을 설정하는 흐름입니다. 정적 사이트라면 `index.html`을 기본 페이지로 지정하고, 에러 페이지가 준비되면 `404.html`도 같이 연결합니다.

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image5.png)

버킷설정 → 웹사이트 구성 수정

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image6.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image7.png)

  - 현재는 404 페이지가 없으니 생략
버킷 → 버킷 세부정보 → 권한 → 액세스 권한 부여

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image8.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image9.png)

### 권한 설정

버킷 공개 URL이 열리지 않거나 `allUsers` 권한 부여가 막히는 경우, 조직 정책 제약을 먼저 확인해야 합니다.

조직 정책에서 아래 항목을 검색해 현재 조직/프로젝트 제약 상태를 확인합니다.

  - `Domain restricted sharing`
  - `iam.allowedPolicyMemberDomains`
이 구간 스크린샷은 정책 위치 확인과 제한 여부 점검 흐름입니다.

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image10.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image11.png)

인지 확인

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image12.png)

공개 URL 복사를 클릭해 주소창에 넣기

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image13.png)

## 로드밸런서로 배포

부하분산 검색 → 생성

이 단계에서는 `정적 IP 예약 → 백엔드 연결 → 헬스체크 생성 → 프론트엔드 규칙 연결` 순서로 진행합니다. 스크린샷 순서대로 클릭하면 되며, 헬스체크 경로와 포트를 실제 서비스와 일치시키는 것이 핵심입니다.

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image14.png)

IP 주소 만들기

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image15.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image16.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image17.png)

## 인스턴스 생성

private, public에 nginx 설치

## 인스턴스 그룹 만들기

로드밸런서 백엔드로 묶기 위해 VM을 인스턴스 그룹으로 구성합니다.

이후 단계에서는 VM 기반 그룹 선택, 템플릿 맞춤설정, 네트워크 태그 지정, 방화벽 규칙 연결 순서로 진행합니다.

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image18.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image19.png)

만들기 클릭

부하분산 → 부하분산기 만들기

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image20.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image21.png)

백엔드 서비스 만들기 클릭

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image22.png)

상태 확인 만들기 클릭

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image23.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image24.png)

만들기 하면 완료

다시 vm으로 이동 → 인스턴스 그룹으로 만들어둔 vm 선택 → VM 기반으로 그룹 만들기 선택

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image25.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image26.png)

인스턴스 템플릿 맞춤설정 클릭

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image27.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image28.png)

새로운 네트워크 태그 하나 만들어주기

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image29.png)

방화벽 규칙 만들기 / 아까 만든 네트워크 태그로 만들어야 함.

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image30.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image31.png)

![image.png](/images/posts/gcp-google-cloud-storage-bucket/image32.png)

## 인스턴스 템플릿 만들기

== 오토스케일링

오토스케일링을 함께 구성할 경우, 템플릿에 포함된 시작 스크립트/네트워크 태그/헬스체크 조건이 일관되어야 합니다. 템플릿과 MIG 설정이 어긋나면 인스턴스는 생성되지만 트래픽이 정상 분배되지 않을 수 있습니다.

## 최종 점검 체크리스트

  - 버킷 공개/비공개 정책이 목적에 맞게 설정되었는지
  - 웹사이트 구성에서 기본 페이지가 올바르게 지정되었는지
  - 조직 정책 때문에 공개 권한이 막히지 않는지
  - Load Balancer 백엔드와 헬스체크가 정상(Healthy)인지
  - 인스턴스 그룹 태그와 방화벽 규칙이 일치하는지
## 마무리

이번 구성은 `GCS 정적 호스팅 + LB + 인스턴스 그룹`을 한 흐름으로 묶어보는 실습입니다. 다음 단계에서는 HTTPS 인증서 적용과 Cloud CDN 연계까지 확장하면 실제 운영에 더 가까운 구조를 만들 수 있습니다.
