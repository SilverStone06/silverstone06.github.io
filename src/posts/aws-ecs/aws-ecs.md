---
id: 2f4be0b2-87a1-8066-be79-cab43b2381f1
title: '[AWS] ECS(Elastic Container Service) 써보기'
slug: aws-ecs
date:
  start_date: '2025-11-17'
createdTime: 'Mon Jan 26 2026 08:00:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
category:
  - AWS
summary: ECS를 실제로 사용해보며 서비스 구성과 배포 흐름을 정리
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## TL;DR

이 글은 EC2 기반 ECS를 직접 구성하면서 필요한 네트워크(VPC/보안그룹), 클러스터, 태스크, 서비스, ALB 연동까지 한 번에 정리한 기록입니다.

핵심 흐름은 `VPC/SG 준비 -> ECS 클러스터 -> 태스크 정의 -> 서비스 생성 -> 대상그룹/ALB로 검증` 입니다.

## 시작 전 목표

  - VPC와 보안그룹을 ECS 서비스 흐름에 맞게 준비한다.
  - ECS 클러스터/태스크/서비스를 순서대로 생성한다.
  - 대상그룹과 ALB DNS로 실제 트래픽 유입을 검증한다.
---

## 1) VPC 확인 및 보안그룹 준비

먼저 VPC 리소스 맵에서 퍼블릭/프라이빗 서브넷, 라우팅, IGW/NAT 구성을 확인합니다.

이후 ECS에 필요한 보안그룹을 역할별로 분리합니다.

![image.png](/images/posts/aws-ecs/image1.png)

## 2) 보안그룹 구성

보안그룹은 역할별로 분리해 두면 이후 트래픽 경로를 추적하기 쉽습니다.

  - `song-sg-http-https`: ALB용 80/443 허용
  - `song-sg-ssh`: 관리 접속용 22 허용
  - `song-sg-ec2`: ECS 인스턴스용 동적 포트 범위 허용
![image.png](/images/posts/aws-ecs/image2.png)

![image.png](/images/posts/aws-ecs/image3.png)

![image.png](/images/posts/aws-ecs/image4.png)

  - `song-sg-ec2`에는 사용자 지정 TCP 포트 범위를 열고, 소스로 `song-sg-http-https`를 지정합니다.
  - 목적은 ALB에서 들어온 트래픽만 ECS 인스턴스로 전달되게 만드는 것입니다.
  - 전체 포트 오픈 대신 범위를 명시해 관리 범위를 줄입니다.
## 3) ECS 클러스터 생성

ECS 콘솔에서 클러스터를 생성합니다.

  - 클러스터 이름을 지정하고
  - 인프라는 **Fargate 및 자체 관리형 인스턴스(EC2)** 조합으로 선택합니다.
  - ASG 생성 옵션을 사용하면 초기 인스턴스 그룹 구성이 빠릅니다.
![image.png](/images/posts/aws-ecs/image5.png)

![image.png](/images/posts/aws-ecs/image6.png)

클러스터 생성 시 추가 메모:

  - EC2 인스턴스 프로파일(예: `ecsInstanceRole`)을 올바르게 연결합니다.
  - 서비스 트래픽을 받을 워크로드라면 서브넷 전략(Private 권장)을 먼저 확정합니다.
  - 인스턴스에 직접 `http/https`를 여는 방식보다, ALB 보안그룹을 소스로 참조하는 방식이 안전합니다.
## 4) 대상 그룹 생성

ec2 -> 대상 그룹 -> 대상 그룹 생성

  - ECS 서비스 연결 전, 대상 그룹을 먼저 만들어 둡니다.
  - 초기 생성 시 대상 등록은 비워둬도 됩니다. (서비스 생성 후 자동 등록)
  - 헬스체크 경로/포트는 컨테이너 애플리케이션 기준으로 다시 확인합니다.
## 5) ALB 생성

생성 -> ALB 생성

  - 가용 영역은 퍼블릭 서브넷 기준으로 최소 2개 AZ를 선택합니다.
  - ALB 보안그룹은 `song-sg-http-https`를 사용합니다.
  - 리스너 규칙에서 앞서 만든 대상 그룹을 연결합니다.
참고:

  - 태스크 생성 전에는 대상 그룹/로드밸런서에 등록 대상이 비어 있는 것이 정상입니다.
## 6) ECS 태스크 정의

ECS -> 태스크 정의 -> 새 태스크 생성

핵심 설정:

  - 네트워크 모드: `awsvpc` / `bridge` / `host` 중 운영 방식에 맞게 선택
  - CPU/메모리: 태스크 상한을 넘지 않도록 하드/소프트 제한을 일관되게 설정
  - 호스트 포트: 동적 포트 구성이 필요하면 고정 포트를 비워둠
  - 리소스 여유: OS/에이전트 오버헤드를 고려해 인스턴스 자원 일부를 남겨둠
주의 메모:

  - GPU 옵션은 필요할 때만 명시적으로 설정
  - 인스턴스 타입 대비 태스크 자원 배분은 보수적으로 시작 후 점진적으로 조정
## 7) 서비스 생성

태스크정의 → 배포 → 서비스 생성

![image.png](/images/posts/aws-ecs/image7.png)

![image.png](/images/posts/aws-ecs/image8.png)

![image.png](/images/posts/aws-ecs/image9.png)

![image.png](/images/posts/aws-ecs/image10.png)

서비스 생성 시 체크:

  - 배포 컨트롤러/클러스터/태스크 정의 버전을 먼저 고정합니다.
  - ALB 연결 오류가 나면 `기존 로드밸런서 + 기존 리스너 + 기존 대상 그룹` 연결 상태를 우선 점검합니다.
  - 초기에는 최소/최대 태스크 수를 작게 시작해 메모리 사용량을 관찰합니다.
![image.png](/images/posts/aws-ecs/image11.png)

운영 팁:

  - 메모리 여유가 부족하면 서비스 최소/최대 태스크 수를 낮게 시작해 점진적으로 확장합니다.
  - AZ 균형 분산은 기본값을 유지하되, 실제 트래픽과 비용을 보며 조정합니다.
  - 기본값 항목은 우선 유지하고, 운영 지표를 본 뒤 조정합니다.
## 8) 배포 결과 확인

### 대상그룹으로 확인

대상그룹 → 등록된 대상 확인

![image.png](/images/posts/aws-ecs/image12.png)

  - 대상 그룹에서 기존 테스트 포트(예: 과거 80 포트) 이력이 보일 수 있습니다.
  - 현재 서비스가 사용하는 리스너/포트와 헬스체크 상태를 기준으로 판단합니다.
### 로드 밸런서로 확인

로드밸런서 → DNS 이름을 통해 확인

![image.png](/images/posts/aws-ecs/image13.png)

![image.png](/images/posts/aws-ecs/image14.png)

ALB DNS 접근 시 응답이 확인되면 서비스 경로가 정상입니다.

## 9) 정리(리소스 삭제 순서)

클러스터 정리 시에는 아래 순서를 권장합니다.

  - 서비스/태스크 종료
  - 오토 스케일링 그룹 축소 또는 삭제
  - 클러스터 삭제
## 확인 체크리스트

  - 보안그룹 역할(`http-https`, `ssh`, `ec2`)이 분리되어 있다.
  - ECS 서비스가 대상 그룹에 정상 등록된다.
  - ALB DNS 접근 시 애플리케이션 응답이 확인된다.
  - 동적 포트/리소스 설정으로 배포 오류 없이 기동된다.
## 마무리

이번 구성으로 EC2 기반 ECS의 기본 배포 경로를 끝까지 확인할 수 있습니다.

다음 단계는 오토스케일링 정책 튜닝, 헬스체크 기준 조정, 배포 자동화(CI/CD) 연결입니다.
