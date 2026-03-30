---
id: 332be0b2-87a1-8124-8d67-f1e5faa03c24
title: '[Trouble Shooting] 서브도메인 리다이렉트 문제'
slug: trouble-redirect
date:
  start_date: '2026-03-29'
createdTime: 'Sun Mar 29 2026 10:15:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - AWS
  - Kubernetes
  - Network
  - Project
  - Cloud
  - TroubleShooting
category:
  - TroubleShooting
summary: CloudFront에서 서브도메인이 메인 도메인으로 리다이렉트되던 문제 !
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
# TL;DR

`admin.izones.cloud/argocd`를 CloudFront 뒤로 붙였더니 `izones.cloud/argocd`로 리다이렉트되며 Argo CD가 정상 노출되지 않았습니다. 이 문제를 해결하는 과정에서 CloudFront를 추가로 분리하는 방법, ALB 쪽에 WAF를 중복 적용하는 방법도 검토했지만, 가장 적절한 해결책은 **CloudFront Behavior의 Origin Request Policy를 조정하는 것**이었습니다.

이번 글은 최종 정답만 적기보다, 실제로 어떤 선택지를 검토했고 왜 버렸는지까지 함께 남기는 트러블슈팅 기록에 가깝습니다.

---

# 시작 전 상황

프로젝트 구조는 `CloudFront -> ALB -> Argo CD (EKS)`였습니다. 일반 사용자는 `izones.cloud`, 관리자는 `admin.izones.cloud/argocd`로 접근하도록 나누어 두었습니다.

원래 의도는 관리자용 서브도메인에만 WAF IP 제한을 적용해 허용된 대역에서만 Argo CD에 접근하도록 만드는 것이었습니다.

---

# 문제 1) 관리자 도메인에 WAF가 기대대로 적용되지 않음

## 현상

  - 관리자 도메인에 접근 제한을 걸었는데도 차단 없이 접속되었습니다.
  - 일반 사용자 도메인과 달리 관리자 도메인 쪽에서 WAF 효과가 적용되지 않았습니다.
## 원인

![image.png](/images/posts/trouble-redirect/image1.png)

위 구조처럼 `admin.izones.cloud`가 Route 53에서 ALB로 직접 연결되어 있으면 CloudFront를 거치지 않습니다. 그래서 CloudFront에 연결한 WAF 정책이 관리자 서브도메인 요청에는 애초에 적용되지 않는 상태였습니다.

## 해결 시도

![image.png](/images/posts/trouble-redirect/image2.png)

  1. 아래처럼 관리자 도메인도 CloudFront를 타도록 구조를 바꿨습니다. WAF를 적용하는 위치를 CloudFront로 일원화하려는 의도였습니다.
이 변경으로 WAF 적용 위치 문제는 정리됐지만, 바로 다음 문제가 생겼습니다.

---

# 문제 2) admin 서브도메인으로 접속해도 메인 도메인으로 리다이렉트됨

## 현상

  - `admin.izones.cloud/argocd`로 접속해도 `izones.cloud/argocd` 기준으로 응답하거나 리다이렉트되었습니다.
  - 로그인 화면이나 세션 흐름이 기대한 서브도메인 문맥을 유지하지 못했습니다.
## 해결 시도

CloudFront 설정을 다시 보면서, admin 요청이 기대한 경로로 origin까지 전달되지 않는 지점을 먼저 확인했습니다.

![image.png](/images/posts/trouble-redirect/image3.png)

이 과정에서 원본이 하나만 있거나 behavior가 충분히 분리되지 않으면, admin 요청이 기대한 방식으로 ALB와 Argo CD까지 전달되지 않는다는 점을 확인했습니다.

![image.png](/images/posts/trouble-redirect/image4.png)

![image.png](/images/posts/trouble-redirect/image5.png)

그래서 admin 요청을 위한 origin과 behavior를 추가해 경로를 분리해보았지만, 리다이렉트 문제는 여전히 남아 있었습니다.

  - CloudFront behavior 설정 문제
  - ALB listener 또는 rule 문제
  - Argo CD의 base path 또는 redirect URL 설정 문제
하지만 실제로는 애플리케이션 설정 하나만의 문제가 아니라, **CloudFront가 origin으로 어떤 요청 정보를 전달하느냐**가 핵심이었습니다.

---

# 검토했던 해결법들

## 해결법 A. 관리자용 CloudFront와 WAF를 별도로 하나 더 만든다

![Gemini_Generated_Image_253feg253feg253f.png](/images/posts/trouble-redirect/image6.png)

아래 그림처럼 관리자용 도메인만 별도 CloudFront와 WAF로 분리하는 방식도 검토했습니다. admin 트래픽만 따로 제어할 수 있다는 점은 분명한 장점이었습니다.

### 왜 보류했는가

  - CloudFront를 2개 운영해야 하고, WAF도 사실상 2세트 관리하게 됩니다.
  - 구조가 단순해지지 않고 오히려 배포 포인트와 운영 포인트가 늘어납니다.
  - 근본 원인을 해결한다기보다 우회에 가까운 방식이라고 판단했습니다.
## 해결법 B. ALB에도 WAF를 추가로 붙인다

![image.png](/images/posts/trouble-redirect/image7.png)

아래 구조처럼 CloudFront뿐 아니라 ALB에도 WAF를 추가해, 어느 경로로 들어오든 동일하게 차단하는 방법도 검토했습니다.

### 왜 보류했는가

  - 동일하거나 유사한 방어 규칙을 여러 지점에 중복 선언해야 합니다.
  - 비용과 운영 복잡도가 함께 증가합니다.
  - 트래픽 제어 위치를 분산시키면 나중에 장애 분석도 더 어려워질 수 있습니다.
---

# 최종 해결: Origin Request Policy 조정

결국 최종적으로는 CloudFront behavior에서 **Origin Request Policy**를 `Managed-AllViewer`로 변경했습니다.

![image.png](/images/posts/trouble-redirect/image8.png)

  - Cache Policy: `CachingDisabled`
  - Origin Request Policy: `Managed-AllViewer`
  - WAF: 기존 CloudFront에 계속 연결
이때 Cache Policy는 `CachingDisabled`로 두고, Origin Request Policy만 `Managed-AllViewer`로 조정하는 조합이 관리자용 트래픽에 더 적합했습니다.

![image.png](/images/posts/trouble-redirect/image9.png)

정책을 적용한 뒤에는 허용된 IP 대역이 아닐 경우 WAF에서 차단되는 것도 함께 확인했습니다.

즉, 접근 제어 자체는 CloudFront 단에서 원하는 방향으로 정리되었습니다.

![image.png](/images/posts/trouble-redirect/image10.png)

현재 보이는 403, 404 응답은 CloudFront 사용자 지정 오류 응답에서 `index.html`을 반환하도록 둔 영향이었습니다. 따라서 이 화면은 별도 설정의 결과이고, 이번 Argo CD 리다이렉트 이슈의 직접 원인은 아니었습니다.

![image.png](/images/posts/trouble-redirect/image11.png)

정리하면, 리소스를 더 추가하는 것보다 CloudFront가 origin에 어떤 요청 정보를 전달하느냐를 바로잡는 것이 핵심이었습니다.

AWS 문서에서도 origin request policy는 CloudFront가 origin으로 전달할 request values를 결정한다고 설명합니다. 인증이 있는 관리자 서비스는 이 forwarding 설정 차이가 바로 redirect 문제로 이어질 수 있습니다.

 [AWS 공식 문서](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html)

CloudFront가 origin에 전달하는 viewer request 정보 조합이 부족해서 Argo CD가 현재 요청의 호스트와 인증 문맥을 기대한 방식으로 해석하지 못했던 상황으로 볼 수 있었습니다.

---

# 적용 후 달라진 점

  - `admin.izones.cloud/argocd` 접속 시 메인 도메인으로 튀지 않았습니다.
  - 로그인 이후 redirect 흐름이 기대한 서브도메인 기준으로 유지되었습니다.
  - 관리자 도메인도 CloudFront를 통과하므로 WAF IP 제한을 한 곳에서 관리할 수 있었습니다.
---

# 마무리

이번 이슈에서 가장 중요했던 것은 정답 하나보다도, 어떤 해결법이 왜 적절하지 않았는지를 함께 정리한 점이었습니다. CloudFront를 늘리거나 WAF를 중복 선언하는 선택지도 가능은 했지만, 운영 구조를 단순하게 유지하려면 결국 현재 프록시 계층의 forwarding 정책을 바로잡는 쪽이 더 낫다고 판단했습니다.

비슷한 증상이 보인다면 ALB나 애플리케이션 설정만 보지 말고, 먼저 CloudFront의 Behavior와 Origin Request Policy를 함께 점검해보시는 것을 추천드립니다.
