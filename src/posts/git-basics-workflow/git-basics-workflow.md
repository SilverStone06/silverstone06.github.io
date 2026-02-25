---
id: 2fcbe0b2-87a1-8065-b4bd-fc8ed5056c90
title: '[Git] 다시 정리하기'
slug: git-basics-workflow
date:
  start_date: '2025-12-04'
createdTime: 'Tue Feb 03 2026 00:38:00 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - Git
category:
  - Git
summary: Git 기본 명령과 작업 흐름을 다시 정리한 문서
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## TL;DR

FastAPI 예제 프로젝트를 기준으로 `Git 초기화 -> GitHub 연결 -> GitHub Actions 설정 -> Secrets 등록 -> 배포 워크플로 확장` 흐름을 한 번에 정리합니다.

## 시작 전 목표

  - 로컬 프로젝트를 GitHub 원격 저장소와 연결한다.
  - 기본 CI 워크플로를 생성하고 실패 포인트를 정리한다.
  - 배포에 필요한 Secrets와 Docker Hub 토큰을 등록한다.
---

## 1) Git 레포 만들기

먼저 GitHub에서 빈 저장소를 만들고, 로컬 프로젝트를 연결합니다.

  - 저장소 가시성은 상황에 맞게 선택합니다.
  - README는 로컬에서 만들 예정이므로 저장소 생성 시 추가하지 않습니다.
  - 원격 저장소 주소: `https://github.com/<GITHUB_USERNAME>/<REPOSITORY_NAME>.git`
```Bash
# .gitignore 파일 형식
# === 1. 보안 및 환경 변수 (최우선 제외) ===
.env                # API 키, DB 비밀번호 등 민감 정보
*.pem               # AWS 접속용 키 페어
*.key               # 암호화 키 파일

# === 2. Python 가상 환경 및 패키지 ===
venv/               # 가상 환경 폴더 (주로 사용하는 이름)
.venv/              # 표준 가상 환경 폴더
env/
bin/
lib/
include/

# === 3. Python 캐시 및 컴파일 파일 ===
__pycache__/        # 런타임 시 생성되는 바이트코드 캐시
*.py[cod]           # .pyc, .pyo, .pyd 파일
*$py.class

# === 4. 운영체제 및 도구 설정 ===
.DS_Store           # macOS 전용 시스템 파일
Thumbs.db           # Windows 전용 썸네일 파일
.vscode/            # VS Code 개인 설정 (팀별로 다를 수 있음)
.idea/              # PyCharm 설정 파일

# === 5. 빌드 및 배포 결과물 ===
build/
dist/
*.egg-info/
```

```Bash
# 가상환경 빌드
python -m venv .venv

# 가상환경 활성화 / 만약 쉘이 아니라 cmd 창이면 activate.bat으로 활성화
.\.venv\Scripts\activate.ps1

# 맥 OS 활성화
source .venv/bin/activate

# 비활성화
# deactivate

# pip library
code requirements.txt
---
fastapi==0.109.0
uvicorn==0.27.0
pytest==8.0.0
httpx==0.26.0
---

# main.py
---
from fastapi import FastAPI
import uvicorn

# 1. FastAPI 인스턴스 생성
app = FastAPI()

# 2. 기본 경로(Root Path) 설정
@app.get("/")
def read_root():
    return {"Hello": "World", "status": "Success"}

# 3. 경로 파리미터 예시(아이템 조회)
# @app.get("/items/{item_id}")
# def read_item(item_id: int, q: str = None):
#     return {"item_id": item_id, "query": q}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
---
pip install -r requirements.txt

# main.py 테스트
uvicorn main:app --host 0.0.0.0 --port 8000
# 웹페이지에서 확인
# 나올때는 ctrl + c

# 깃 연결 전 작업
# 초기화
git init

# README.md 추가
echo "# cicd test" > README.md

git add .
git commit -m "첫번째 커밋 : fastapi Project"

# Branch를 main으로 지정
git branch -M main

# 로컬저장소와 리모트 저장소의 연결
git remote add origin https://github.com/<GITHUB_USERNAME>/<REPOSITORY_NAME>.git

# git push
git push -u origin main
```

## 2) GitHub Actions 기본 워크플로 생성

GitHub 저장소의 **Actions** 탭에서 `Python application` 템플릿을 선택하고 `Configure`를 클릭합니다.

![image.png](/images/posts/git-basics-workflow/image1.png)

초기 생성 후 아래 내용을 먼저 확인합니다.

  - Python 버전은 로컬 개발 버전과 맞춥니다.
  - 기본 템플릿의 `Test with pytest` 단계는 테스트 파일이 없으면 실패합니다.
  - `test_app.py`를 추가하거나, 해당 테스트 구간을 주석 처리합니다.
수정 후 `Commit changes`를 눌러 워크플로 파일을 저장합니다.

```Python
# git pull
git pull origin main

# python-app.yml 37~39번째 줄 주석처리

git add .
git commit -m "Fix : Actions"
git push -u origin main
```

![image.png](/images/posts/git-basics-workflow/image2.png)

## 3) GitHub Secrets 등록

배포에 필요한 민감 정보는 모두 GitHub Secrets로 관리합니다.

경로: `Settings -> Secrets and variables -> Actions -> New repository secret`

  - 먼저 EC2 접속용 SSH 키(`SSH_KEY`)를 등록합니다.
![image.png](/images/posts/git-basics-workflow/image3.png)

추가로 아래 값도 함께 등록합니다.

  - `HOST`: EC2 퍼블릭 IP
  - `USERNAME`: EC2 접속 사용자(예: `ec2-user`)
![image.png](/images/posts/git-basics-workflow/image4.png)

EC2 보안 그룹은 SSH(22), 서비스 포트(예: 80/8000) 접근 규칙을 확인한 뒤 생성합니다.

![image.png](/images/posts/git-basics-workflow/image5.png)

## 4) Docker Hub PAT 생성

Docker 이미지 푸시를 위해 Docker Hub Personal Access Token(PAT)을 발급합니다.

경로: `Account settings -> Settings -> Personal access tokens`

보안 규칙(중요):

  - 토큰 값(`dckr_pat_...`)이 보이는 화면은 캡처/공유하지 않습니다.
  - 문서에는 토큰 원문 대신 `dckr_pat_<MASKED>` 형태로만 표기합니다.
  - 토큰을 한 번이라도 노출했다면 즉시 Revoke 후 새 토큰을 발급합니다.
GitHub Secrets 등록 예시(설명형):

  - `DOCKERHUB_USERNAME`: Docker Hub 계정명
  - `DOCKERHUB_TOKEN`: Docker Hub Personal Access Token(PAT)
## 5) `python-app.yml` 수정

아래 워크플로는 CI(의존성 설치/테스트)와 CD(도커 빌드/푸시, EC2 배포)를 한 번에 수행합니다.

```Python
name: Python application

# 어떤 상황에서 이 작업이 작동할지 결정합니다.
on:
  push:
    branches: ["main"] # main 브랜치에 코드가 올라오면 실행
  pull_request:
    branches: ["main"] # PR이 생성되면 실행 : PR이란 코드 변경 요청입니다.

permissions:    # GitHub 토큰 권한 설정, 여기서 토큰은 GitHub가 자동으로 만들어주는 비밀번호 같은 것으로 별도의 설정 없이도 사용할 수 있습니다.
  contents: read

jobs:
  build-and-deploy: # 작업의 ID입니다. 자유롭게 바꿔도 무방합니다. 
    runs-on: ubuntu-latest # 최신 우분투 가상 환경에서 실행
    steps:  # 작업을 수행하기 위한 구체적인 단계 정의
      - uses: actions/checkout@v4 # 현재 GitHub의 코드를 가상환경으로 가져옵니다. 변경되지 않습니다.

      # --- [CI 영역 시작으로 파이썬 설치를 위한 설정부] ---
      - name: Set up Python 3.14.0  # 파이썬 3.14.0 버전 설정
        uses: actions/setup-python@v4 # 파이썬 설정 액션 사용, 일반적으로 python setup github action식으로 검색을 통해 값을 확인 합니다.
        with:                         # 버전의 경우 깃허브에 검색된 페이지 사이드 메뉴의 Releases를 확인 하면 됩니다.  
          python-version: "3.14.0" # 요청하신 최신 파이썬 버전 설정

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install flake8 pytest # 검사 도구 설치
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
      # --- [CI 영역 끝] ---
      # --- [CD 영역 시작: 도커 이미지 생성] ---
      # 1. 도커 허브 계정에 로그인합니다. (비밀번호 대신 Token 사용)
      - name: Login to Docker Hub
        uses: docker/login-action@v3    # docker login github action으로 검색
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}   # 도커 허브 아이디 환경변수(Secrets에서 가져옴)
          password: ${{ secrets.DOCKERHUB_TOKEN }}    # 도커 허브 비밀번호 대신 토큰 환경변수(Secrets에서 가져옴)

      # 2. Dockerfile을 읽어 이미지를 만들고(Build), 도커 허브로 전송(Push)합니다.
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: . # 현재 위치의 파일을 소스로 사용
          push: true # 빌드 성공 시 자동으로 도커 허브에 업로드
          tags: "${{ secrets.DOCKERHUB_USERNAME }}/fastapi-app:latest" # 이미지 이름표
      # --- [CD 영역 끝: 도커 이미지 생성] ---

      # --- [CD 영역 시작: EC2 실 배포] ---
      # 3. SSH를 통해 EC2 서버에 접속합니다. 이후 script에 적힌 명령어들을 순서대로 실행합니다.
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }} # EC2의 주소 (Secrets에서 가져옴)
          username: ${{ secrets.USERNAME }} # 접속 계정 (ubuntu)
          key: ${{ secrets.SSH_KEY }} # .pem 키 파일 내용

          # 접속 성공 후 EC2 안에서 실행할 리눅스 명령어들입니다. 파이프 기호 다음에 띄워서는 안됩니다.
          script: |
            # 도커 허브에서 방금 만든 이미지를 내려받습니다.
            sudo docker pull ${{ secrets.DOCKERHUB_USERNAME }}/fastapi-app:latest

            # 기존에 돌아가던 구버전 컨테이너를 끄고 삭제합니다. (없으면 통과)
            sudo docker stop fastapi-server || true
            sudo docker rm fastapi-server || true

            # 새 이미지를 8000번 포트로 실행합니다. (-d: 백그라운드 실행)
            sudo docker run -d --name fastapi-server -p 8000:8000 ${{ secrets.DOCKERHUB_USERNAME }}/fastapi-app:latest
      # --- [신규 CD 영역 끝: EC2 실 배포] ---
```

## 6) Nginx 워크플로 추가

애플리케이션 워크플로와 별도로 Nginx 이미지를 빌드/배포하는 워크플로를 추가합니다.

```Python
# nginx.yml
name: Nginx application

# 어떤 상황에서 이 작업이 작동할지 결정합니다.
on:
  push:
    branches: ["main"] # main 브랜치에 코드가 올라오면 실행
  pull_request:
    branches: ["main"] # PR이 생성되면 실행 : PR이란 코드 변경 요청입니다.

permissions:    # GitHub 토큰 권한 설정, 여기서 토큰은 GitHub가 자동으로 만들어주는 비밀번호 같은 것으로 별도의 설정 없이도 사용할 수 있습니다.
  contents: read

jobs:
  build-and-deploy: # 작업의 ID입니다. 자유롭게 바꿔도 무방합니다. 
    runs-on: ubuntu-latest # 최신 우분투 가상 환경에서 실행
    steps:  # 작업을 수행하기 위한 구체적인 단계 정의
      - uses: actions/checkout@v4 # 현재 GitHub의 코드를 가상환경으로 가져옵니다. 변경되지 않습니다.

      # --- [CI 영역 시작으로 파이썬 설치를 위한 설정부] ---
      - name: Set up Python 3.14.0  # 파이썬 3.14.0 버전 설정
        uses: actions/setup-python@v4 # 파이썬 설정 액션 사용, 일반적으로 python setup github action식으로 검색을 통해 값을 확인 합니다.
        with:                         # 버전의 경우 깃허브에 검색된 페이지 사이드 메뉴의 Releases를 확인 하면 됩니다.  
          python-version: "3.14.0" # 요청하신 최신 파이썬 버전 설정

      # --- [CI 영역 끝] ---
      # --- [CD 영역 시작: 도커 이미지 생성] ---
      # 1. 도커 허브 계정에 로그인합니다. (비밀번호 대신 Token 사용)
      - name: Login to Docker Hub
        uses: docker/login-action@v3    # docker login github action으로 검색
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}   # 도커 허브 아이디 환경변수(Secrets에서 가져옴)
          password: ${{ secrets.DOCKERHUB_TOKEN }}    # 도커 허브 비밀번호 대신 토큰 환경변수(Secrets에서 가져옴)

      # 2. Dockerfile을 읽어 이미지를 만들고(Build), 도커 허브로 전송(Push)합니다.
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: nginx-app # 현재 위치의 파일을 소스로 사용
          push: true # 빌드 성공 시 자동으로 도커 허브에 업로드
          tags: "${{ secrets.DOCKERHUB_USERNAME }}/nginx-app:latest" # 이미지 이름표
      # --- [CD 영역 끝: 도커 이미지 생성] ---

      # --- [CD 영역 시작: EC2 실 배포] ---
      # 3. SSH를 통해 EC2 서버에 접속합니다. 이후 script에 적힌 명령어들을 순서대로 실행합니다.
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }} # EC2의 주소 (Secrets에서 가져옴)
          username: ${{ secrets.USERNAME }} # 접속 계정 (ubuntu)
          key: ${{ secrets.SSH_KEY }} # .pem 키 파일 내용

          # 접속 성공 후 EC2 안에서 실행할 리눅스 명령어들입니다. 파이프 기호 다음에 띄워서는 안됩니다.
          script: |
            # 도커 허브에서 방금 만든 이미지를 내려받습니다.
            sudo docker pull ${{ secrets.DOCKERHUB_USERNAME }}/nginx-app:latest

            # 기존에 돌아가던 구버전 컨테이너를 끄고 삭제합니다. (없으면 통과)
            sudo docker stop nginx-server || true
            sudo docker rm nginx-server || true

            # 새 이미지를 80번 포트로 실행합니다. (-d: 백그라운드 실행)
            sudo docker run -d --name nginx-server -p 80:80 ${{ secrets.DOCKERHUB_USERNAME }}/nginx-app:latest
      # --- [신규 CD 영역 끝: EC2 실 배포] ---
      
```

저장소 디렉토리 구조를 아래처럼 분리해 두면 워크플로 관리가 훨씬 쉬워집니다.

![image.png](/images/posts/git-basics-workflow/image6.png)

## 확인 체크리스트

  - `main` 브랜치 푸시 시 Actions가 자동 실행되는지 확인했다.
  - `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `HOST`, `USERNAME`, `SSH_KEY`가 모두 등록되어 있다.
  - EC2에서 신규 컨테이너가 올라오고 기존 컨테이너가 정상 교체된다.
  - 서비스 포트(예: `80`, `8000`)가 보안 그룹에 올바르게 열려 있다.
## 마무리

이번 정리는 Git 초기화부터 GitHub Actions 기반 배포 자동화까지 한 번에 다시 점검하는 흐름입니다. 다음 단계로는 브랜치 전략(`dev`/`main`)과 환경 분리(`staging`/`prod`)를 추가하면 더 안정적으로 운영할 수 있습니다.

---

자세한 사항 참고
