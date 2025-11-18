// src/apis/local-posts/getPostsFromMd.ts
// @ts-nocheck

import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { TPosts } from "src/types"
import { CONFIG } from "site.config"
import { sortPostsByDate } from "src/libs/utils/post"

const POSTS_DIR = path.join(process.cwd(), "src", "posts")

/**
 * md 파일 기반 getPosts
 * - src/posts/*.md 를 읽어서
 * - frontmatter를 TPost 모양에 최대한 그대로 매핑해서 돌려줌
 */
export const getPostsFromMd = async (): Promise<TPosts> => {
  // src/posts 디렉터리가 없으면 빈 배열 반환 (빌드 시 CI에서는 로컬 md가 없을 수 있음)
  if (!fs.existsSync(POSTS_DIR)) {
    return [] as TPosts
  }

  // src/posts 안에 있는 포스트 폴더 또는 .md 파일 목록
  const items = fs.readdirSync(POSTS_DIR, { withFileTypes: true })
  
  const files: { slug: string; fullPath: string }[] = []
  
  for (const item of items) {
    if (item.isDirectory()) {
      // 폴더인 경우: {slug}/{slug}.md 형식
      const slug = item.name
      const mdPath = path.join(POSTS_DIR, slug, `${slug}.md`)
      if (fs.existsSync(mdPath)) {
        files.push({ slug, fullPath: mdPath })
      }
    } else if (item.isFile() && item.name.endsWith(".md")) {
      // 루트에 있는 .md 파일 (구버전 호환)
      const slugFromFile = item.name.replace(/\.md$/, "")
      files.push({ slug: slugFromFile, fullPath: path.join(POSTS_DIR, item.name) })
    }
  }

  const data = files.map(({ slug: slugFromFile, fullPath }) => {
    const raw = fs.readFileSync(fullPath, "utf8")

    const { data: fm, content } = matter(raw)

    // frontmatter에 slug가 있다면 그걸 우선, 없으면 파일명 기반
    const slug = fm.slug ?? slugFromFile

    // author가 문자열 또는 문자열 배열로 되어 있을 수 있어서 통일
   const rawAuthor = fm.author

  let author: Array<{ id: string; name: string; profile_photo?: string }> = []

  if (Array.isArray(rawAuthor)) {
    author = rawAuthor.map((a) =>
      typeof a === "string"
        ? { name: a, profile_photo: CONFIG.profile.image }
        : a
    )
  } else if (rawAuthor) {
    author = [
      typeof rawAuthor === "string"
        ? { name: rawAuthor, profile_photo: CONFIG.profile.image }
        : rawAuthor,
    ]
  }

    // date 형식 정규화: { start_date: string } 형식으로 변환
    let normalizedDate: { start_date: string }
    if (fm.date && typeof fm.date === "object" && "start_date" in fm.date) {
      // 이미 { start_date: string } 형식
      normalizedDate = fm.date as { start_date: string }
    } else if (fm.date && typeof fm.date === "string") {
      // 문자열인 경우 객체로 변환
      normalizedDate = { start_date: fm.date }
    } else {
      // date가 없으면 createdTime 사용
      const defaultDate = fm.createdTime ?? new Date().toISOString()
      normalizedDate = { start_date: defaultDate }
    }

    // createdTime / date가 비어있으면 기본값 세팅
    const createdTime =
      fm.createdTime ??
      normalizedDate.start_date ??
      new Date().toISOString()

    const post = {
      ...fm,
      id: fm.id ?? slug, // TPost 타입에 id 필드가 필요하므로 유지 (하지만 실제로는 사용하지 않음)
      slug,
      date: normalizedDate, // 정규화된 date 형식 사용
      createdTime,
      // status / type은 기존 코드에서 배열로 쓰니까 형태 맞춰줌
      status: Array.isArray(fm.status) ? fm.status : [fm.status ?? "Public"],
      type: Array.isArray(fm.type) ? fm.type : [fm.type ?? "Post"],
      tags: fm.tags ?? [],
      category: fm.category ?? [],
      summary: fm.summary ?? "",
      thumbnail: fm.thumbnail ?? null,
      author,
      fullWidth: fm.fullWidth ?? false, // fullWidth 필드 추가
      // 나중에 md 본문을 Detail에서 쓰고 싶으면 여기 content도 같이 넘길 수 있음
      content,
    }

    return post
  })

  const sortedData = sortPostsByDate(data)

  return sortedData as TPosts
}
