---
id: 2a9be0b2-87a1-8182-b07b-c40a30255a0e
title: About open source license(revalidate)
slug: about-opensource-license
date:
  start_date: '2022-06-10'
createdTime: 'Wed Nov 12 2025 13:47:44 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - Open Source
  - Github
category:
  - "\U0001F916 Computer Science"
summary: "Briefly learn about the open source license, and apply the license to your source code uploaded on github \U0001F642"
thumbnail: >-
  https://www.notion.so/image/attachment%3Af0d06941-6ed5-4bc8-8ea3-affde64cd73f%3A%ED%99%94%EB%A9%B4_%EC%BA%A1%EC%B2%98_2025-11-28_105759.png?table=block&id=2a9be0b2-87a1-8182-b07b-c40a30255a0e&cache=v2
author:
  - id: e5ed41b6-1017-4d12-bdba-ee217703dd05
    name: morethanmin
    profile_photo: >-
      https://lh5.googleusercontent.com/-lr5pjNrudeM/AAAAAAAAAAI/AAAAAAAAAAA/AMZuuck_j3l31Z6ws1a44V8GfS68MDZZvg/photo.jpg
fullWidth: false
---
## Getting Started

If you look at many open source repositories on Github, most licenses are specified. I have also used a lot of open source so far, but I think I lacked knowledge about licenses in open source, so I'm going to try to simplify it for proper use of open source.

However, we do not explain the limitations of each license separately, so if you need an explanation about the license, let's check the notice about the license.

In general, there are cases of using open source and cases of distributing open source. Let's take a look at each case.

## If you redistribute (use) open source

The basic obligations of all open source licenses are notice and source code disclosure.

In general (at least on github), the restrictions on the license are indicated through the `LICENSE.md` (or `LICENSE`) file and the license is notified in the `README.md` file, so you can follow the restrictions of the license. Let's look at the example below.

The blog, morethan_log, is a project created by redistributing Nobelium. As described in the README.md file of Nobelium, the project follows the MIT License, and the original author is listed in the README.md file of morethan_log in accordance with the rules described in the LICENSE file.

### If you do not have a license

If the source code to be used is a source code for which the license is not specified, only the copyright holder has the right to use the code. Therefore, it is necessary to obtain permission for use through a request from the copyright holder of the corresponding code.

## If you are distributing open source

Conversely, if you publish an open source project, how do you define the license? In fact, it would be nice to find out by creating an open source licensor on github.

Create LICENSE through Add file in the Repository where you want to apply the license.

![Untitled](/images/posts/about-opensource-license/image1.png)

When the file name is entered as LICENSE, the Choose a license template button appears as follows.

![Untitled](/images/posts/about-opensource-license/image2.png)

Here, you can see the description of each license, select and create a license suitable for your open source. 🙂

![Untitled](/images/posts/about-opensource-license/image3.png)

## **concluding**

There were many cases where I didn't pay attention to the license because it was annoying, but from now on, I'm going to keep it and use open source.
