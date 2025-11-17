---
id: 2a9be0b2-87a1-8171-8f74-cc3ab09dad0c
title: Dynamically create sitemap.xml in Next.js
slug: hot-to-make-sitemap-in-next-js
date:
  start_date: '2022-07-01'
createdTime: 'Wed Nov 12 2025 13:47:44 GMT+0000 (Coordinated Universal Time)'
status:
  - Public
type:
  - Post
tags:
  - SEO
  - Blog
  - Next.js
category:
  - "\U0001F4BB Frontend"
summary: Let's load the sitemap dynamically
thumbnail: null
author:
  - id: e5ed41b6-1017-4d12-bdba-ee217703dd05
    name: morethanmin
    profile_photo: >-
      https://lh5.googleusercontent.com/-lr5pjNrudeM/AAAAAAAAAAI/AAAAAAAAAAA/AMZuuck_j3l31Z6ws1a44V8GfS68MDZZvg/photo.jpg
fullWidth: false
---
## Getting Started

I was making my blog based on nobelium, but when I checked it, it was structured to scrape and create posts written in the case of sitemap distribution.
In this form, since sitemaps are not created for posts written after distribution, there is a disadvantage from the standpoint of seo.

## Create a sitemap.xml component in your Pages directory

In general, sitemap.xml is specified in robots.txt as [url]/sitemap.xml, so create the corresponding component.

Here, if you use getServerSideProps provided by next.js, you can create a sitemap on the server side and respond.

```JavaScript
// pages/sitemap.xml.js

const Sitemap = () => {
  return null
}

export const getServerSideProps = async ({ res }) => {
  // You can create a sitemap here.
}

export default Sitemap
```

## Create a sitemap dynamically and respond

The code I use in my blog is below.

```JavaScript
export const getServerSideProps = async ({ res }) => {
  // get post url
  const posts = await getAllPosts({ includePages: true })
  const dynamicPaths = posts.map(post => {
    return `${link}/${post.slug}`
  })

  const allPaths = [...dynamicPaths]

  const sitemap = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/0.7" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
      <url>
        <loc>${link}</loc>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
      </url>
      <url>
        <loc>${link}/feed</loc>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
        <lastmod>${new Date().toISOString()}</lastmod>
      </url>
    ${allPaths
      .map((url) => {
        return `
          <url>
            <loc>${url}</loc>
            <changefreq>daily</changefreq>
            <priority>0.7</priority>
            <lastmod>${new Date().toISOString()}</lastmod>
          </url>
        `
      })
      .join("")}
    </urlset>
  `

  res.setHeader('Content-Type', 'text/xml')
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}
```

I created a sitemap by importing the data I want to dynamically import. All you have to do is bring the data that suits you and put it in randomly.

In the case of a static page, there are few, so I just wrote it.

## concluding

Even if I registered in the google search console, it was annoying because it was not constantly recognized and not reflected immediately, but after waiting a few days, it was recognized normally 👍
