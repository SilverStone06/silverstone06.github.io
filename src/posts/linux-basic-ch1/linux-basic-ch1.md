---
id: 2b6be0b2-87a1-8008-ae88-d2c6890da63d
title: '[Linux] Basic Ch.1 (명령어, 파일권한, 사용자/그룹 관리)'
slug: linux-basic-ch1
date:
  start_date: '2025-11-05'
createdTime: 'Tue Nov 25 2025 07:39:06 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - Linux
category:
  - Linux
summary: 리눅스 기초 ❗
author:
  - id: 29ad872b-594c-816f-bc65-000286fbcef6
    name: 송은석
fullWidth: false
---
## 1) 개요

Linux를 처음 사용할 때 반드시 익혀야 하는 핵심 명령어에 대해 알아보죠. 쓰다보면 손에 익어 외워지지만, 다시 정리해 보도록 하겠습니다.

  - 기본 명령어(pwd, ls, cat, grep 등)
  - 파일 및 디렉토리 권한(chmod, chown, umask)
  - 사용자/그룹 생성 및 관리(useradd, groupadd 등)
Linux 서버를 다루기 위한 기초 명령어 모음이라고 생각하면 편합니다~

---

# 2) 기본 명령어 정리

## 2-1) 디렉토리 / 파일 탐색

### ls

현재 경로의 파일과 디렉토리를 확인합니다.

**형식(Format)**

```Plain Text
ls [옵션] [경로]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -l | 상세 목록 출력 |
| -a | 숨김 파일 포함 출력 |
| -al | 상세 + 숨김 파일 포함 출력 |
| -h | 용량을 사람이 읽기 쉬운 형태로 출력 |
| -R | 하위 디렉토리 재귀 출력 |

**예시**

```Bash
ls -al
ls -lh /var/log
```

**실행결과**

![image.png](/images/posts/linux-basic-ch1/image1.png)

---

### pwd

현재 작업 중인 절대 경로를 출력합니다.

**형식(Format)**

```Plain Text
pwd
```

**예시**

```Bash
pwd
```

**실행결과**

![image.png](/images/posts/linux-basic-ch1/image2.png)

---

### cd

디렉토리를 이동합니다.

**형식(Format)**

```Plain Text
cd [경로]
```

**예시**

```Bash
cd ..
cd /etc
```

**실행 결과**

![image.png](/images/posts/linux-basic-ch1/image3.png)

---

## 2-2) 파일 생성 / 수정 / 삭제

### touch

빈 파일을 생성합니다.

**형식(Format)**

```Plain Text
touch [파일명]
```

**예시**

```Bash
touch test.txt
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image4.png)

---

### mkdir

디렉토리를 생성합니다.

**형식(Format)**

```Plain Text
mkdir [옵션] [디렉토리명]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -p | 상위 디렉토리가 없으면 함께 생성 |
| -v | 생성 과정 상세 메시지 출력 |
| -m | 생성되는 디렉토리의 권한 지정 |

**예시**

```Bash
mkdir project
mkdir -p test1/test2

mkdir -v new_folder
mkdir -m 755 secure_dir
```

**실행결과**

![image.png](/images/posts/linux-basic-ch1/image5.png)

---

### rm

파일 또는 디렉토리를 삭제합니다.

**형식(Format)**

```Plain Text
rm [옵션] [파일/디렉토리]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -r | 디렉토리 재귀 삭제 |
| -f | 강제 삭제 |
| -rf | 재귀 + 강제 삭제 |

**예시**

```Bash
rm test.txt
rm -rf test2
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image6.png)

---

## 2-3) 파일 읽기 / 출력

### cat

파일 내용을 출력합니다.

**형식(Format)**

```Plain Text
cat [파일명]
```

**예시**

```Bash
cat line.txt
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image7.png)

---

### head

파일 상단 일부를 출력합니다.

**형식(Format)**

```Plain Text
head [옵션] [파일명]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -n | 출력 줄 수 지정
기본값 : 10 |

**예시**

```Bash
head -5 line.txt
head line.txt
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image8.png)

---

### tail

파일 하단 일부를 출력합니다.

**형식(Format)**

```Plain Text
tail [옵션] [파일명]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -n | 출력 줄 수 지정 |
| -f | 파일 변경 내용을 실시간 출력 |

**예시**

```Bash
tail -5 line.txt
tail line.txt
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image9.png)

---

## 2-4) 문자열 검색

### grep

특정 문자열을 검색합니다.

**형식(Format)**

```Plain Text
grep [옵션] [문자열] [파일/경로]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -r | 재귀 검색 |
| -i | 대소문자 무시 검색 |
| -n | 줄 번호 출력 |
| -v | 문자열 제외 라인 출력 |

**예시**

```Bash
grep "song" /etc/passwd
grep -in "root" /etc/passwd
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image10.png)

---

## 2-5) 파일 찾기

### find

파일 또는 디렉토리를 검색합니다.

**형식(Format)**

```Plain Text
find [경로] [옵션] [조건]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -name | 파일명으로 검색 |
| -type | 파일 유형 조건
d: dir / f : file |
| -size | 파일 크기 조건 |
| -mtime | 수정 날짜 조건 |

**예시**

```Bash
find -name "line.txt"
find -type f -name "line.txt"
find -type d -name "line.txt"
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image11.png)

---

# **3) 파일 권한 관리(chmod / chown / umask)**

파일과 디렉토리의 접근 권한을 설정하고 제어하는 기능입니다.

Linux 보안 및 사용자 권한 분리에 매우 중요한 구성 요소입니다.

---

## **3-1) 권한 구조**

파일과 디렉토리에 적용되는 읽기(r), 쓰기(w), 실행(x) 권한을 정의하는 구조입니다.

권한 종류는 다음과 같습니다.

  - r : 읽기 :  2진수 4에 해당
  - w : 쓰기 : 2진수 2에 해당
  - x : 실행 : 2진수 1에 해당
**예시**

```Bash
ls -l
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image12.png)

---

## **3-2) chmod**

파일 또는 디렉토리의 권한을 변경하는 기능입니다.

### 숫자 방식

**형식(Format)**

```Plain Text
chmod [권한값] [파일명]
```

**예시**

```Bash
# 7 = rwx, 6 = rw-, 5 = r-x, 4 = r--, 3 = -wx, 2 = -w-, 1 = --x, 0 = --- 
chmod 777 line.txt # 소유자 : rwx, 그룹 : rwx, 다른 사용자 : rwx
chmod 644 line.txt # 소유자 : rw, 그룹 : r--, 다른 사용자 : r--
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image13.png)

---

### 기호 방식

**형식(Format)**

```Plain Text
chmod [대상][+/−][권한] [파일명]
```

**예시**

```Bash
chmod u+x run.sh # 소유자에게 실행(x)권한 추가(+)
chmod g-w config.txt # 그룹에게 쓰기(w)권한 회수(-)
chmod o-r secret.txt # 다른 사용자에게 읽기(r)권한 회수(-)
```

---

## **3-3) chown**

파일 또는 디렉토리의 소유자와 그룹을 변경하는 기능입니다.

**형식(Format)**

```Plain Text
chown [사용자] [파일명]
chown [사용자]:[그룹] [파일명]
```

**예시**

```Bash
chown user1 file.txt
chown user1:dev file.txt
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image14.png)

---

## **3-4) umask**

새로 생성되는 파일·디렉토리의 기본 권한을 결정하는 기능입니다.

**형식(Format)**

```Plain Text
umask
umask [권한값]
```

**예시**

```Bash
umask
umask 022
```

---

# **4) 사용자 및 그룹 관리**

Linux 시스템에서 사용자 계정과 그룹을 관리하여 접근 권한을 체계적으로 분배하는 기능입니다.

---

## **4-1) 그룹 생성**

### groupadd, addgroup

그룹은 여러 사용자에게 동일한 권한을 부여하기 위해 사용하는 단위입니다.

**형식(Format)**

```Plain Text
groupadd [그룹명]
addgroup [그룹명]
```

**예시**

```Bash
groupadd dev1
addgroup dev2
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image15.png)

---

## **4-2) 그룹 삭제**

### groupdel, delgroup

그룹을 삭제하는 기능입니다.

**형식(Format)**

```Plain Text
groupdel [그룹명]
delgroup [그룹명]
```

**예시**

```Bash
groupdel dev1
delgroup dev2
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image16.png)

---

## **4-3) 사용자 생성**

### useradd, adduser

시스템에 새 사용자 계정을 생성하는 기능입니다.

**형식(Format)**

```Plain Text
useradd [옵션] [사용자명]

# 기본값을 지정해서 만든다.
adduser [옵션] [사용자명]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -m | 홈 디렉토리 생성 |
| -d | 홈 디렉토리 경로 지정 |
| -g | 기본 그룹 지정 |
| -G | 추가 그룹 지정 |

**예시**

```Bash
useradd user1
adduser user2
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image17.png)

---

## **4-4) 사용자 삭제**

### userdel, deluser

시스템에 기존 사용자 계정을 삭제하는 기능입니다.

**형식(Format)**

```Plain Text
userdel [사용자명]
deluser [사용자명]
```

**예시**

```Bash
useradd user1
adduser user2
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image18.png)

---

## **4-3) 사용자 그룹 추가**

### usermod

사용자에게 새로운 그룹 권한을 부여하거나 기존 그룹을 변경하는 기능입니다.

**형식(Format)**

```Plain Text
usermod [옵션] [사용자명]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -G | 그룹 지정 |
| -aG | 그룹 추가 (기존 그룹 유지) |

**예시**

```Bash
usermod -G dev user1
usermod -aG sudo user1
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image19.png)

---

## **4-4) 계정 정보 확인**

### id, getent

사용자의 UID, GID, 그룹 정보 및 계정 설정을 확인하는 기능입니다.

**형식(Format)**

```Plain Text
id [사용자명]
getent passwd [사용자명]
```

**예시**

```Bash
id user1
getent passwd user1
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image20.png)

---

## **4-5) 계정 만료 설정**

### chage

사용자 계정 또는 비밀번호의 만료 정책을 설정하는 기능입니다.

**형식(Format)**

```Plain Text
chage [옵션] [사용자명]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -E | 계정 만료일 설정 |
| -I | 비밀번호 만료 후 계정 비활성화까지의 일수 |
| -m | 비밀번호 최소 사용 기간 |
| -M | 비밀번호 최대 사용 기간 |
| -W | 비밀번호 만료 경고일 |
| -l | 계정 만료 정보 출력 |

**예시**

```Bash
chage -E 2025-12-31 user1
chage -l user1
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image21.png)

---

# 5) 심볼릭 링크(Symlink)

## 5-1) 링크 생성

### ln -s

다른 경로의 파일 또는 디렉토리를 가리키는 링크를 생성합니다.

**형식(Format)**

```Plain Text
ln -s [원본경로] [링크경로]
```

**옵션**

| 옵션 | 의미 |
| --- | --- |
| -s | 심볼릭 링크 생성 |
| -f | 기존 파일 또는 링크가 있어도 강제로 덮어쓰기 |
| -n | 링크가 이미 존재할 경우 원본 경로 추적 방지 |
| -v | 생성 과정을 화면에 출력 |
| -T | 링크를 디렉토리로 취급하지 않고 파일처럼 처리 |

**예시**

```Bash
ln -s /etc/passwd ~/passwd-link
ln -sf /etc/hosts ~/hosts-link
ln -sn /usr/bin ~/bin-link
ln -sv /var/log ~/logs-link
```

실행결과

![image.png](/images/posts/linux-basic-ch1/image22.png)

---

# 6) 마무리 정리

  - Linux 기본 명령어는 서버 운영의 핵심 기반입니다.
  - 파일 권한 관리는 보안과 직접 연결되므로 반드시 숙지해야 합니다.
  - 사용자 및 그룹 관리는 서버 권한 구조 설계의 중요한 요소입니다.
