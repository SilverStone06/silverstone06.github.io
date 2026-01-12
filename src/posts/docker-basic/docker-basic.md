---
id: 2b7be0b2-87a1-806c-9bd6-fefab2b14cc2
title: '[Docker] 기본 명령어'
slug: docker-basic
createdTime: 'Wed Nov 26 2025 05:43:50 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - Docker
category:
  - docker
summary: Docker 감잡기 ! +) 양 방대 주의
thumbnail: >-
  https://www.notion.so/image/attachment%3A41c9d296-99fc-4475-bd92-d73f7f3f5810%3Adocker-black.jpg?table=block&id=2b7be0b2-87a1-806c-9bd6-fefab2b14cc2&cache=v2
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
# 1) Docker란?

Docker는 **애플리케이션을 만들고(build), 배포하고(ship), 실행(run)** 하기 위한 **컨테이너 플랫폼**입니다.

애플리케이션을 컨테이너라는 표준 단위로 패키징해서 개발 환경(내 노트북)에서 테스트 서버, 운영 서버, 클라우드까지 **어디서나 똑같이 실행되도록** 도와주는 도구 세트라고 보면 됩니다.

![image.png](/images/posts/docker-basic/image1.png)

>  참고 :  [Docker Docs](https://docs.docker.com/get-started/docker-overview/?utm_source=chatgpt.com)

Docker가 해주는 핵심 역할은 크게 세 가지 정도로 요약할 수 있습니다.

  1. **이미지 만들기**
    - Dockerfile을 기반으로 애플리케이션 + 런타임 + 설정을 하나의 이미지로 만든다.
  1. **컨테이너 실행하기**
    - 이미지를 기반으로 격리된 실행 환경(컨테이너)을 띄운다.
  1. **동일한 방식으로 배포하기**
    - 로컬이든, 온프레미스 서버든, 클라우드든 **같은 이미지 + 같은 명령어**로 배포/실행.
그래서 Docker는 편리해서 자주 쓰이고 있고, 리눅스 운영체제를 전제로 만들어졌기에 리눅스 운영체제가 필요하고 이에 대한 이해도 필요합니다.

> 도커는 환경 차이 때문에 안 돌아가는 문제를 줄여주는, 컨테이너 기반 배포 플랫폼

---

# 2) 컨테이너(Container)란?

![image.png](/images/posts/docker-basic/image2.png)

컨테이너는 **애플리케이션이 실행되는데 필요한 모든 것**을 한 덩어리로 묶어놓은 **표준 실행 단위**입니다.

컨테이너 안에는 뭐가 있냐면

  - 애플리케이션 코드
  - 필요한 라이브러리 / 런타임 (JDK, Node.js, Python 등)
  - 시스템 툴, 설정 파일 등
즉, 컨테이너 하나만 다른 서버에 옮겨 띄워도, **별도 세팅 없이 똑같이 동작**할 수 있도록 패키징한 거예요.

조금 더 기술적인 표현으로는

  - 컨테이너는 **호스트 OS 위에서 돌아가는 격리된 프로세스**
각 컨테이너는 자신만의 파일시스템, 네트워크, 프로세스 트리를 가진 것처럼 보이지만 실제로는 **같은 커널을 공유**해서 VM보다 훨씬 가볍고 빠릅니다. 

---

## 3) 왜 굳이 컨테이너를 쓰지? (VM vs Container)

![image.png](/images/posts/docker-basic/image3.png)

간단하게 비교만 하고 갑시다.

  - **VM(가상머신)**
    - 하이퍼바이저 위에 **OS 통째로 + 앱**을 올리는 구조
    - 각각이 자기 OS 커널을 가져서 무겁고, 부팅도 느림
  - **컨테이너**
    - 호스트 OS의 커널을 공유하고,
**앱 + 필요한 것들만** 따로 싸서 실행

    - 훨씬 가볍고, 시작/종료 속도가 매우 빠름
그래서 컨테이너는

  - **코드만 잘 짜면 어디에 올려도 똑같이 돈다 **를 실현해주는 실행 방식
  - 환경 설정에서 일어나는 문제가 없다. 실행이 됐다면, 어디서든 실행을 보장한다.
정도로 이해하고, 세부적인 커널/namespace 이야기는 나중에 더 깊게 알아봅시다.

---

## 4) docker 명령어들의 흐름

위 내용까지 이해했다면, 이제 아래에서 나오는 명령어들의 역할을 이렇게 연결해서 볼 수 있습니다.

  - `docker pull / images / build / rmi / tag / push`
→ **이미지(템플릿)를 관리하는 명령어**

  - `docker run / start / stop / ps / logs / exec`
→ **컨테이너(실행 중인 인스턴스)를 관리하는 명령어**

  - `docker network *`, `docker volume *`, `docker system *`
→ **컨테이너들이 쓰는 네트워크/스토리지/리소스를 관리하는 명령어**

  - `docker compose *`
→ 여러 컨테이너로 이뤄진 **하나의 서비스 스택**을 관리하는 명령어

이제부터는 **“Docker = 컨테이너 관리 도구”**, **“컨테이너 = 앱 실행 단위”** 라고 머릿속에 잡아두고, Docker부터 설치하고 위 명령어 하나씩 살펴보겠습니다.

---

## ⚙️ 4-0) Docker 설치 (VM / Ubuntu 기준)

> 전제

    - VM(또는 WSL2) 안에 **Ubuntu**가 설치되어 있고
    - 그 안에 **Docker Engine**을 설치해서 실습한다.
### 4-0-1) 환경 확인 (커널 / 아키텍처)

도커 엔진이 동작하려면 기본적으로

  - 리눅스 커널 **3.10 이상**
  - **64비트(x86_64)** 아키텍처
가 필요하다. `uname -a` 명령어로 확인하고 시작하면 됩니다~

---

### 4-0-2) 간편 설치 스크립트(get.docker.sh)로 설치/재설치

위처럼 리포지토리를 직접 설정하는 방법도 있지만, 시간은 금 이기에 저희는 **Docker에서 제공하는 설치 스크립트**로 한 번에 설치하겠습니다.

![image.png](/images/posts/docker-basic/image4.png)

sh 파일은 [https://github.com/docker/docker-install/](https://github.com/docker/docker-install/) 에서 제공합니다. 자세한 사항은 사이트를 통해 확인해주세요 !

### 1) 스크립트 다운로드

```Bash
curl -fsSL https://get.docker.com -o get-docker.sh
```

### 2) 내용 구경하기

```Bash
# 잘 들어왔는지 확인 !
ls
# vim에서 나올때는 :q로 나오기
# vim이 없으면 cat으로 확인
vim get-docker.sh
```

어떤 패키지를 깔고, 어떤 리포지토리를 등록하는지 알면 좋으니 한 번 열어보고 읽어보면 도움이 됩니다~

```Shell
sudo sh get-docker.sh
```

![image.png](/images/posts/docker-basic/image5.png)

다음과 같은 로그가 뜬다면 설치가 성공적으로 된겁니다. 밑에 WARNING은 default로 노출되는 경고이니 넘어가도 괜찮습니다 ~

> Docker 데몬은 root 권한으로 실행 중이므로 **TCP 포트로 외부에 Docker API를 노출하면 보안 위험이 있다**는 이야기 !

> 💡 도커 데몬(dockerd)은 컨테이너를 실제로 실행하고 관리하는 서버 프로그램(백그라운드 프로세스)

---

### 4-0-3) sudo 없이 docker 사용하기 (docker 그룹)

기본적으로 도커 소켓(`/var/run/docker.sock`)의 소유주는 `root`이기 때문에,

처음에는 `docker` 명령에 항상 `sudo`를 붙여야 합니다.

매번 `sudo`를 붙이는 게 번거로우니 현재 사용자를 `docker` 그룹에 추가하도록 하겠습니다.

```Bash
sudo usermod -aG docker $USER
```

> ⚠️ 주의

    - 이 명령을 실행한 뒤에는 **로그아웃 후 재로그인(또는 재부팅)** 해야 반영된다.
    - 그 전에 `docker run hello-world`를 그냥 실행하면 `permission denied`가 나는 게 **정상**이다.
재로그인 후 아래처럼 테스트:

```Bash
docker run hello-world
```

정상이라면 “Hello from Docker!” 메시지가 출력됩니다.
이제 설치를 완료했으니 명령어들을 보기전에 image들을 다운받아오는 Docker Hub에 대해 알고 가시죠 !

---

## **🗂️ etc) Docker Hub란? (이미지 관리로 넘어가기 전 필수 개념 !)**

Docker를 설치했다면, 이제 컨테이너를 실행하기 위해 **이미지를 가져올 저장소**가 필요하다.

그 저장소 역할을 하는 것이 바로 **Docker Hub**이다.

`docker pull`, `docker push`, `docker search` 같은 명령은 모두 Docker Hub를 기반으로 작동한다.

---

### **etc-1) Docker Hub 개념**

Docker Hub는 도커에서 운영하는 **공식 컨테이너 이미지 레지스트리(Registry)** 로,

컨테이너 이미지를 저장하고 배포하는 중앙 창고 역할을 합니다.

GitHub가 **코드 저장소**라면, Docker Hub는 **이미지 저장소**라고 생각하면 됩니다.

  - 주소: [https://hub.docker.com](https://hub.docker.com/)
여기에는

  - 공식 이미지(Official Images)
    - ubuntu, nginx, mysql, redis, node 등
  - Verified Publisher 이미지
    - AWS, Microsoft 등 검증된 기업
  - 개인 계정 커스텀 이미지
등이 있습니다.

---

### **2) Repository / Tag 구조 이해**

Docker Hub는 아래와 같은 구조로 이미지가 관리됩니다.

```Plain Text
docker.i/<계정 또는 조직>/<리포지토리>:<태그>
```

예시:

| 형태 | 의미 |
| --- | --- |
| `ubuntu:22.04` | library/ubuntu 리포지토리의 22.04 태그 |
| `nginx:1.29.3` | nginx 리포지토리의 특정 버전 |
| `songeunsuk/my-nginx:1.0` | 개인 계정 이미지 |

태그가 없으면 자동으로 `:latest` 로 처리된다.

---

### **3) 왜 Docker Hub가 중요한가?**

컨테이너 실습의 95%는 다음 둘을 반복합니다.

  1. 이미지 가져오기 → `docker pull`
  1. 컨테이너 실행하기 → `docker run`
이때 이미지 출처가 Docker Hub입니다.

즉:

  - ubuntu 이미지 pull
  - Docker Hub에서 다운로드 전 버전 확인 = Docker Hub의 리포지토리에서 Tag 목록 확인
![image.png](/images/posts/docker-basic/image6.png)

---

### **4) Docker Hub 로그인(**`**docker login**`**)이 필요한 이유**

Docker Hub는 **IP 기반 이미지 다운로드 제한(rate limit)** 정책이 있습니다.

**로그인하지 않은 상태 (anonymous)**

  - 같은 IP 대역당 6시간 최대 100회 pull 제한
**로그인한 상태**

  - 계정 기준으로 할당량 적용 → 계정당 6시간에 최대 200회 pull 제한
그래서 회원가입을 진행하고 `docker login -u <docker_id>` 로그인하고 진행해야 좋습니다~~

> 내가 만든 이미지(`my-nginx:1.0`)를 **push**하려면 무조건 로그인 필요 !
> `docker info | grep Username` 으로 로그인 확인 !

---

### **5) Docker Hub에서 이미지를 찾는 흐름**

실습 기본 패턴:

  1. Docker Hub에서 원하는 이미지 검색
[https://hub.docker.com/search](https://hub.docker.com/search)

  1. 다운로드 가능한 버전(Tag) 확인
  1. 해당 버전으로 pull
예:

```Bash
# docker login 후 !
docker pull ubuntu:22.04
docker pull nginx:1.29.3

# docker image 확인 !
docker images
```

이렇게 **Docker Hub → 이미지 pull → 컨테이너 실행** 순으로 진행하면 됩니다.

---

## 📦 4-1) 이미지 관리 (Image Management)

### docker pull

원격 레지스트리(Docker Hub 등)에서 이미지를 다운로드합니다.

**형식(Format)**

```Plain Text
docker pull [OPTIONS] NAME[:TAG|@DIGEST]
```

**예시**

```Bash
# 태그를 주지 않으면 자동으로 latest로 받아 옴
docker pull nginx
docker pull nginx:1.29.3
```

**실행결과**

![image.png](/images/posts/docker-basic/image7.png)

---

### docker images

로컬에 저장된 Docker 이미지 목록을 확인합니다.

**형식(Format)**

```Plain Text
docker images [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -q | 이미지 ID만 출력 |

**예시**

```Bash
docker images
docker images -q
```

**실행결과**

![image.png](/images/posts/docker-basic/image8.png)

---

### docker build

Dockerfile을 기반으로 이미지를 생성합니다.

**형식(Format)**

```Plain Text
docker build [OPTIONS] [IMAGE_NAME] PATH
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -t | 이미지 이름/태그 지정 |
| -f | 특정 Dockerfile 경로 지정 |

**예시**

```Bash
###################
# vim Dockerfile

# 베이스 이미지
FROM ubuntu:22.04

# 이미지 빌드 시 실행되는 명령
RUN echo "Hello from Docker!" > /message.txt

# 컨테이너 실행 시 출력될 명령
CMD ["cat", "/message.txt"]

# esc :wq 입력
###################

docker build -t myapp:1.0 .
```

**실행결과**

![image.png](/images/posts/docker-basic/image9.png)

> docker file 형식은 다음에 자세히 뜯어봅시다~ 추후에 링크 넣어드릴게요 !

---

### docker rmi

로컬 Docker 이미지를 삭제합니다.

**형식(Format)**

```Plain Text
docker rmi [OPTIONS] IMAGE
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -f | 사용 중인 이미지 강제 삭제 |

**예시**

```Bash
docker rmi nginx:1.29.3
docker rmi -f myapp:1.0
```

**실행결과**

![image.png](/images/posts/docker-basic/image10.png)

---

### docker tag

이미지에 새로운 이름 또는 태그를 부여합니다. 

윈도우의 다른이름으로 저장이라고 생각하면 됩니다.

**형식(Format)**

```Plain Text
docker tag [SOURCE_IMAGE:TAG] [TARGET_IMAGE:TAG]
```

**예시**

```Bash
docker pull nginx:1.29.3-alpine
# 본인의 계정 이름으로 ! <nickname/dir_name:tag>
docker tag nginx:1.29.3-alpine songeunsuk/nginx:test-1.0
```

**실행결과**

![image.png](/images/posts/docker-basic/image11.png)

> docker tag를 생성할때는 꼭 이미지가 있어야 합니다 !

---

### docker push

로컬 이미지를 레지스트리에 업로드합니다.

**형식(Format)**

```Plain Text
docker push [NAME:TAG]
```

**예시**

```Bash
# 본인의 계정 이름으로 만들어주셔야합니다 ! 아니면 push 실패 ! 
docker push songeunsuk/nginx:test-1.0
```

**실행결과**

![image.png](/images/posts/docker-basic/image12.png)

---

## 🚀 4-2) 컨테이너 실행 & 수명주기 관리

---

### docker run

이미지로부터 컨테이너를 생성하고 실행합니다.

**형식(Format)**

```Plain Text
docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -d | 백그라운드 실행 |
| -p HOST:CONTAINER | 포트 매핑 |
| -v HOST:CONTAINER | 볼륨 마운트 |
| --name | 컨테이너 이름 지정 |
| -it | 터미널 인터랙티브 모드 (bash 접속용) |
| --net | 특정 네트워크 지정 |
| -e KEY=VALUE | 환경 변수 설정 |
| --rm | stop, exited시 컨테이너 자동 삭제 |

**예시**

```Bash
# 이미지가 없으면 자동으로 pull해서 컨테이너를 올림 !
docker run -d -p 8080:80 --name=test-cont nginx:1.29.3
# 컨테이너를 올리게 되면 바로 쉘을 실행 시켜 줌 !
docker run --name=test-bash -it ubuntu /bin/bash
docker run --rm -d -p 80:80 --name=test-rm songeunsuk/nginx:test-1.0
docker stop test-rm
```

**실행결과**

![image.png](/images/posts/docker-basic/image13.png)

---

### docker start

중지된 컨테이너를 실행합니다.

**형식(Format)**

```Plain Text
docker start CONTAINER
```

**예시**

```Bash
# Container ID로도 가능 !
docker start test-bash
```

**실행결과**

![image.png](/images/posts/docker-basic/image14.png)

---

### docker stop

실행 중인 컨테이너를 중지합니다.

**형식(Format)**

```Plain Text
docker stop [OPTIONS] CONTAINER
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -t SECONDS | 강제 종료까지 대기 시간 설정 |

**예시**

```Bash
docker stop myapp
docker stop -t 3 myapp 
```

**실행결과**

![image.png](/images/posts/docker-basic/image15.png)

---

### docker restart

컨테이너를 재시작합니다.

**형식(Format)**

```Plain Text
docker restart [OPTIONS] CONTAINER
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -t SECONDS | 재시작 전 대기 시간 |

**예시**

```Bash
docker restart myapp
```

**실행결과**

![image.png](/images/posts/docker-basic/image16.png)

---

### docker rm

중지된 컨테이너를 삭제합니다.

**형식(Format)**

```Plain Text
docker rm [OPTIONS] CONTAINER
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -f | 실행 중 컨테이너 강제 삭제 |
| -v | 연결된 볼륨 함께 삭제 |

**예시**

```Bash
# 실행중이면 삭제가 되지 않으니 멈추고 삭제 !
docker rm myapp
docker rm -f myapp
```

**실행결과**

![image.png](/images/posts/docker-basic/image17.png)

---

### docker rename

컨테이너 이름을 변경합니다.

**형식(Format)**

```Plain Text
docker rename OLD_NAME NEW_NAME
```

**예시**

```Bash
docker rename test-1 test-2
```

**실행결과**

![image.png](/images/posts/docker-basic/image18.png)

---

### docker pause

컨테이너의 모든 프로세스를 일시 중지합니다.

**형식(Format)**

```Plain Text
docker pause CONTAINER
```

**예시**

```Bash
docker pause test-2
```

**실행결과**

![image.png](/images/posts/docker-basic/image19.png)

---

### docker unpause

일시 중지된 컨테이너를 다시 실행합니다.

**형식(Format)**

```Plain Text
docker unpause CONTAINER
```

**예시**

```Bash
docker unpause myapp
```

**실행결과**

![image.png](/images/posts/docker-basic/image20.png)

## 🔍 4-3) 컨테이너 상태 확인 & 디버깅

---

### docker ps

실행 중인(또는 전체) 컨테이너 목록을 확인합니다.

**형식(Format)**

```Plain Text
docker ps [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -a | 중지된 컨테이너 포함 전체 출력 |
| -q | 컨테이너 ID만 출력 |
| -f | 조건 필터링 (name, status 등) |
| --format | 출력 형식 지정 |

**예시**

```Bash
docker ps
docker ps -a
docker ps -q
docker ps -f "status=exited"
```

**실행결과**

![image.png](/images/posts/docker-basic/image21.png)

---

### docker logs

컨테이너의 로그를 출력합니다.

**형식(Format)**

```Plain Text
docker logs [OPTIONS] CONTAINER
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -f | 실시간 로그 출력 (follow) |
| --tail N | 마지막 N줄만 출력 |
| -t | 타임스탬프 포함 |

**예시**

```Bash
docker logs myapp
docker logs -f myapp
docker logs --tail 100 myapp
```

**실행결과**

![image.png](/images/posts/docker-basic/image22.png)

---

### docker exec

실행 중인 컨테이너 내부에서 명령을 실행합니다.

**형식(Format)**

```Plain Text
docker exec [OPTIONS] CONTAINER COMMAND
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -it | 터미널 인터랙티브 모드(bash 접속) |
| -d | 백그라운드 실행 |

**예시**

```Bash
# 컨테이너가 올라가 있어야 가능 !
docker exec -it my-ubuntu /bin/bash
docker exec my-ubuntu ls /var/log
```

**실행결과**

![image.png](/images/posts/docker-basic/image23.png)

---

### docker inspect

컨테이너 또는 이미지의 상세 정보를 JSON 형식으로 출력합니다.

**형식(Format)**

```Plain Text
docker inspect [OPTIONS] NAME
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -f | Go 템플릿을 사용한 출력 포맷팅 |

**예시**

```Bash
docker inspect myapp
docker inspect -f '{{ .State.Status }}' myapp
```

주로 포트 번호나 환경변수, 볼륨 마운트, IP 대역 등 정보를 확인할 때 사용됩니다~

---

### docker top

컨테이너 내부에서 실행 중인 프로세스를 표시합니다.

**형식(Format)**

```Plain Text
docker top CONTAINER
```

**예시**

```Bash
docker top myapp
```

---

### docker stats

컨테이너의 CPU, 메모리, I/O 사용량을 실시간으로 확인합니다.

**형식(Format)**

```Plain Text
docker stats [OPTIONS] [CONTAINER...]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| --no-stream | 한 번만 출력하고 종료 |
| 없음 | 실시간 스트리밍 출력 |

**예시**

```Bash
docker stats
docker stats myapp
```

**실행결과**

![image.png](/images/posts/docker-basic/image24.png)

---

### docker events

Docker 데몬에서 발생하는 실시간 이벤트 스트림을 출력합니다.

**형식(Format)**

```Plain Text
docker events [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -f | 이벤트 필터링 (type, name 등) |

**예시**

```Bash
docker events
docker events -f "type=container"
```

## 📁 4-4) 파일 / 스냅샷 / 백업

---

### docker cp

호스트와 컨테이너 간에 파일 또는 디렉토리를 복사합니다.

**형식(Format)**

```Plain Text
docker cp CONTAINER:SRC_PATH DEST_PATH
```

**예시**

```Bash
docker cp myapp:/var/log/app.log ./app.log
docker cp ./config.json myapp:/app/config.json
```

---

### docker commit

실행 중인 컨테이너의 상태를 새로운 이미지로 저장합니다.

(컨테이너 → 이미지 스냅샷)

**형식(Format)**

```Plain Text
docker commit [OPTIONS] CONTAINER_NAME NEW_IMAGE_NAME[:TAG]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -a | Author 정보 설정 |
| -m | 커밋 메시지 작성 |

**예시**

```Bash
docker commit my-nginx-1 new-image-nginx:1.29.3-alpine
docker commit -a "songeunsuk" -m "update:index.html" my-nginx-1 new-nginx:1.29.3-alpine
```

**실행결과**

![image.png](/images/posts/docker-basic/image25.png)

---

### docker export

컨테이너의 파일 시스템을 tar 파일로 내보냅니다.

(컨테이너 → tar 파일, 레이어 정보 없음)

**형식(Format)**

```Plain Text
docker export [OPTIONS] CONTAINER
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -o | 출력 파일 지정 |

**예시**

```Bash
docker export myapp -o myapp.tar
```

---

### docker import

`docker export`로 만든 tar 파일을 이미지로 가져옵니다.

**형식(Format)**

```Plain Text
docker import [OPTIONS] FILE|URL|- [REPOSITORY[:TAG]]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| 없음 | 기본적인 import 기능으로 옵션 거의 없음 |

**예시**

```Bash
docker import myapp.tar myapp:restored
```

---

### docker save

Docker 이미지를 tar 파일로 저장합니다.

(이미지 → tar 파일, 레이어 포함)

**형식(Format)**

```Plain Text
docker save [OPTIONS] IMAGE
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -o | 출력 파일 지정 |

**예시**

```Bash
docker save -o nginx.tar nginx:latest
```

---

### docker load

`docker save`로 만든 이미지 tar 파일을 Docker로 불러옵니다.

**형식(Format)**

```Plain Text
docker load [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -i | 입력 파일 지정 |

**예시**

```Bash
docker load -i nginx.tar
```

## 🌐 4-5) 네트워크 관리 (Network Management)

---

### docker network ls

도커 네트워크 목록을 확인합니다.

**형식(Format)**

```Plain Text
docker network ls [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| --filter, -f | 조건 필터링(name, driver 등) |
| --format | 출력 형식 지정 |

**예시**

```Bash
docker network ls
docker network ls -f "driver=bridge"
```

**실행결과**

![image.png](/images/posts/docker-basic/image26.png)

---

### docker network create

새로운 사용자 정의 네트워크를 생성합니다.

**형식(Format)**

```Plain Text
docker network create [OPTIONS] NAME
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| --driver | 네트워크 드라이버 지정(bridge, overlay 등) |
| --subnet | 서브넷 CIDR 지정 |
| --gateway | 게이트웨이 주소 지정 |

**예시**

```Bash
docker network create --driver bridge custom-net
docker network create --subnet 172.20.0.0/16 my-subnet-net
```

**실행결과**

![image.png](/images/posts/docker-basic/image27.png)

---

### docker network inspect

도커 네트워크의 상세 정보를 JSON 형태로 확인합니다.

**형식(Format)**

```Plain Text
docker network inspect [OPTIONS] NAME
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -f | 출력 형식(Go 템플릿) 지정 |

**예시**

```Bash
docker network inspect my-subnet-net
```

**실행결과**

![image.png](/images/posts/docker-basic/image28.png)

---

### docker network connect

특정 컨테이너를 네트워크에 연결합니다.

**형식(Format)**

```Plain Text
docker network connect [OPTIONS] NETWORK CONTAINER
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| --ip | 컨테이너에 할당할 IP 설정 |
| --alias | 네트워크 내부에서 사용할 별칭 지정 |

**예시**

```Bash
docker network connect mynet myapp
docker network connect --ip 172.20.0.10 my-subnet-net myapp
```

---

### docker network disconnect

네트워크에서 특정 컨테이너를 분리합니다.

**형식(Format)**

```Plain Text
docker network disconnect [OPTIONS] NETWORK CONTAINER
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -f | 강제 분리 |

**예시**

```Bash
docker network disconnect mynet myapp
docker network disconnect -f mynet myapp
```

---

### docker network rm

네트워크를 삭제합니다.

**형식(Format)**

```Plain Text
docker network rm NAME
```

**예시**

```Bash
docker network rm custom-net my-subnet-net
```

**실행결과**

![image.png](/images/posts/docker-basic/image29.png)

## 🗄️ 4-6) 볼륨 / 스토리지 관리 (Volume / Storage Management)

---

### docker volume ls

도커 볼륨 목록을 확인합니다.

**형식(Format)**

```Plain Text
docker volume ls [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -f, --filter | 이름/드라이버 등으로 필터링 |
| --format | 출력 형식 지정 |

**예시**

```Bash
docker volume ls
docker volume ls -f "name=db"
```

실행결과

[사진]

---

### docker volume create

새로운 볼륨을 생성합니다.

**형식(Format)**

```Plain Text
docker volume create [OPTIONS] NAME
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| --driver | 볼륨 드라이버 지정 |
| --label | 라벨 지정 |

**예시**

```Bash
docker volume create myvol
docker volume create --label env=prod datavol
```

실행결과

[사진]

---

### docker volume inspect

볼륨의 상세 정보를 확인합니다.

**형식(Format)**

```Plain Text
docker volume inspect [OPTIONS] NAME
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -f | Go 템플릿 기반 출력 형식 지정 |

**예시**

```Bash
docker volume inspect myvol
docker volume inspect -f '{{ .Mountpoint }}' myvol
```

실행결과

[사진]

---

### docker volume rm

볼륨을 삭제합니다.

**형식(Format)**

```Plain Text
docker volume rm NAME
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| 없음 | (옵션 없음) |

**예시**

```Bash
docker volume rm myvol
```

실행결과

[사진]

---

### docker volume prune

사용하지 않는 모든 볼륨을 정리합니다.

**형식(Format)**

```Plain Text
docker volume prune [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -f | 확인 메시지 없이 강제 실행 |

**예시**

```Bash
docker volume prune
docker volume prune -f
```

실행결과

[사진]

## 🧹 4-7) 시스템 정보 & 정리 (System Info & Cleanup)

---

### docker info

Docker 엔진과 시스템의 전체 환경 정보를 확인합니다.

**형식(Format)**

```Plain Text
docker info
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| 없음 | (옵션 없음) |

**예시**

```Bash
docker info
```

실행결과

[사진]

---

### docker version

Docker 클라이언트/서버 버전을 확인합니다.

**형식(Format)**

```Plain Text
docker version [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| --format | 출력 형식 지정 |

**예시**

```Bash
docker version
docker version --format '{{ .Server.Version }}'
```

실행결과

[사진]

---

### docker system df

Docker가 사용 중인 디스크 용량을 확인합니다.

**형식(Format)**

```Plain Text
docker system df [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -v | 상세 정보 출력 |

**예시**

```Bash
docker system df
docker system df -v
```

실행결과

[사진]

---

### docker system prune

사용하지 않는 Docker 리소스를 일괄 정리합니다.

(중지된 컨테이너, dangling 이미지, 네트워크 등)

**형식(Format)**

```Plain Text
docker system prune [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -a | 사용하지 않는 모든 이미지 삭제(주의) |
| -f | 확인 메시지 없이 강제 실행 |
| --volumes | 사용하지 않는 볼륨도 함께 삭제 |

**예시**

```Bash
docker system prune
docker system prune -a
docker system prune -a --volumes
```

실행결과

[사진]

---

### docker stats

컨테이너 리소스 사용량(CPU, 메모리, I/O)을 실시간 모니터링합니다.

**형식(Format)**

```Plain Text
docker stats [OPTIONS] [CONTAINER...]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| --no-stream | 한 번만 출력하고 종료 |

**예시**

```Bash
docker stats
docker stats myapp
docker stats --no-stream
```

실행결과

[사진]

---

### docker events

Docker 데몬에서 발생하는 이벤트를 실시간 스트리밍으로 확인합니다.

**형식(Format)**

```Plain Text
docker events [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -f | 필터링(type, container 등) |

**예시**

```Bash
docker events
docker events -f "type=container"
```

실행결과

[사진]

## 🧩 4-8) Docker Compose 관리 (Compose Management)

---

### docker compose up

`docker-compose.yml` 파일을 기반으로 서비스를 생성하고 실행합니다.

**형식(Format)**

```Plain Text
docker compose up [OPTIONS] [SERVICE...]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -d | 백그라운드(detached) 실행 |
| --build | 실행 전 이미지 빌드 |
| --force-recreate | 컨테이너 강제 재생성 |
| --remove-orphans | compose에 정의되지 않은 컨테이너 제거 |

**예시**

```Bash
docker compose up
docker compose up -d
docker compose up --build
```

실행결과

[사진]

---

### docker compose down

생성된 컨테이너, 네트워크, 볼륨 등을 정리합니다.

**형식(Format)**

```Plain Text
docker compose down [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| --volumes | 관련된 볼륨도 함께 삭제 |
| --rmi all | 생성된 이미지도 삭제 |
| --remove-orphans | compose 설정에 없는 컨테이너 삭제 |

**예시**

```Bash
docker compose down
docker compose down --volumes
docker compose down --rmi all
```

실행결과

[사진]

---

### docker compose ps

Compose 서비스들의 상태를 확인합니다.

**형식(Format)**

```Plain Text
docker compose ps [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -a | 중지된 서비스 포함 전체 출력 |

**예시**

```Bash
docker compose ps
docker compose ps -a
```

실행결과

[사진]

---

### docker compose logs

Compose 서비스들의 로그를 조회합니다.

**형식(Format)**

```Plain Text
docker compose logs [OPTIONS] [SERVICE...]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -f | 실시간 로그 출력 |
| --tail N | 마지막 N줄만 출력 |

**예시**

```Bash
docker compose logs
docker compose logs -f web
docker compose logs --tail 50
```

실행결과

[사진]

---

### docker compose build

Compose 파일에 정의된 이미지들을 빌드합니다.

**형식(Format)**

```Plain Text
docker compose build [OPTIONS] [SERVICE...]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| --no-cache | 캐시 없이 빌드 |
| --pull | 최신 이미지 pull 후 빌드 |

**예시**

```Bash
docker compose build
docker compose build --no-cache
docker compose build web
```

실행결과

[사진]

---

### docker compose stop

Compose 서비스들을 중지합니다.

**형식(Format)**

```Plain Text
docker compose stop [OPTIONS] [SERVICE...]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| 없음 | (옵션 없음) |

**예시**

```Bash
docker compose stop
docker compose stop web
```

실행결과

[사진]

---

### docker compose start

중지된 Compose 서비스를 다시 실행합니다.

**형식(Format)**

```Plain Text
docker compose start [SERVICE...]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| 없음 | (옵션 없음) |

**예시**

```Bash
docker compose start
docker compose start web
```

실행결과

[사진]

---

### docker compose exec

Compose로 실행된 컨테이너 내부에서 명령을 실행합니다.

**형식(Format)**

```Plain Text
docker compose exec [OPTIONS] SERVICE COMMAND
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -it | 터미널 인터랙티브 모드 |
| -d | 백그라운드 실행 |

**예시**

```Bash
docker compose exec web bash
docker compose exec db sh -c "ls /var/lib/mysql"
```

실행결과

[사진]

---

### docker compose config

Compose 설정 파일을 검증하고 병합된 설정을 출력합니다.

**형식(Format)**

```Plain Text
docker compose config [OPTIONS]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| --services | 서비스 목록만 출력 |
| --volumes | 볼륨 목록만 출력 |

**예시**

```Bash
docker compose config
docker compose config --services
```

실행결과

[사진]
