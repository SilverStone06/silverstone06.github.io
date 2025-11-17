// scripts/notion-to-md.ts
// 노션에서 포스트 메타데이터를 가져와서 src/posts/*.md 로 저장/업데이트하는 스크립트
// 실행 예시: npx ts-node scripts/notion-to-md.ts

// @ts-nocheck

import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { getTextContent } from "notion-utils"

import { getPosts } from "src/apis/notion-client/getPosts"
import { getRecordMap } from "src/apis/notion-client/getRecordMap"
import { customMapImageUrl } from "src/libs/utils/notion/customMapImageUrl"
import { TPosts, TPost } from "src/types"

const POSTS_DIR = path.join(process.cwd(), "src", "posts")

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }
}

/**
 * 기존 md 파일이 있으면 삭제하고 새로 생성합니다.
 * Notion에서 체크박스로 선택한 포스트만 가져오므로,
 * 기존 파일을 삭제하고 새로 생성하는 것이 안전합니다.
 */
function deleteExistingMarkdownFiles() {
  if (!fs.existsSync(POSTS_DIR)) {
    return
  }

  const files = fs.readdirSync(POSTS_DIR)
  let deletedCount = 0

  for (const file of files) {
    if (file.endsWith(".md")) {
      const filePath = path.join(POSTS_DIR, file)
      fs.unlinkSync(filePath)
      deletedCount++
      console.log(`🗑️  Deleted: ${file}`)
    }
  }

  if (deletedCount > 0) {
    console.log(`✅ Deleted ${deletedCount} existing markdown file(s).`)
  }
}

/**
 * Notion 페이지 ID를 받아서 Markdown 본문으로 변환합니다.
 * 이미지도 포함하여 변환합니다.
 */
async function convertNotionPageToMarkdown(pageId: string): Promise<string> {
  try {
    const recordMap = await getRecordMap(pageId)
    return convertRecordMapToMarkdown(recordMap)
  } catch (error) {
    console.error(`❌ Failed to get recordMap for page ${pageId}:`, error)
    return ""
  }
}

/**
 * Notion recordMap을 Markdown 문자열로 변환합니다.
 * 블록의 계층 구조를 고려하고, 이미지도 포함합니다.
 */
function convertRecordMapToMarkdown(recordMap: any): string {
  const blocks: string[] = []
  const blockMap = recordMap.block || {}
  
  // 루트 페이지 블록 찾기
  const rootBlockId = Object.keys(blockMap).find((id) => {
    const block = blockMap[id]?.value
    return block?.type === "page" && !block?.parent_id
  })
  
  if (!rootBlockId) {
    return ""
  }
  
  const rootBlock = blockMap[rootBlockId]?.value
  if (rootBlock) {
    const markdown = convertBlockWithChildren(rootBlock, blockMap, rootBlockId, 0)
    if (markdown) {
      blocks.push(markdown)
    }
  }
  
  return blocks.join("")
}

/**
 * 블록과 그 자식들을 재귀적으로 Markdown으로 변환합니다.
 */
function convertBlockWithChildren(
  block: any,
  blockMap: any,
  blockId: string,
  depth: number
): string {
  const result: string[] = []
  
  // 현재 블록 변환 (페이지 블록은 제외)
  if (block.type !== "page") {
    const markdown = convertBlockToMarkdown(block, blockMap, depth)
    if (markdown) {
      result.push(markdown)
    }
  }
  
  // 자식 블록들 처리
  const children = block.content || []
  for (const childId of children) {
    const childBlock = blockMap[childId]?.value
    if (childBlock) {
      const childMarkdown = convertBlockWithChildren(childBlock, blockMap, childId, depth + 1)
      if (childMarkdown) {
        result.push(childMarkdown)
      }
    }
  }
  
  return result.join("")
}

/**
 * 단일 블록을 Markdown으로 변환합니다.
 * 이미지 블록도 처리합니다.
 */
function convertBlockToMarkdown(block: any, blockMap: any, depth: number): string {
  const blockType = block.type
  const content = getTextContent(block.properties?.title || [])
  
  const isEmpty = !content || content.trim() === ""
  
  switch (blockType) {
    case "header":
      return `# ${content}\n\n`
    case "sub_header":
      return `## ${content}\n\n`
    case "sub_sub_header":
      return `### ${content}\n\n`
    case "divider":
      return "---\n\n"
    case "code": {
      const language = block.properties?.language?.[0]?.[0] || ""
      const codeContent = content || ""
      return `\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`
    }
    case "bulleted_list":
    case "bulleted_list_item": {
      const indent = "  ".repeat(depth)
      return `${indent}- ${content}\n`
    }
    case "numbered_list":
    case "numbered_list_item": {
      const indent = "  ".repeat(depth)
      return `${indent}1. ${content}\n`
    }
    case "quote":
    case "quote_block": {
      const lines = content.split("\n")
      return lines.map((line: string) => `> ${line}`).join("\n") + "\n\n"
    }
    case "callout": {
      const emoji = block.format?.page_icon || "💡"
      return `> ${emoji} ${content}\n\n`
    }
    case "image": {
      try {
        // 이미지 URL 가져오기 (여러 가능한 위치에서 시도)
        let imageUrl = ""
        
        // 방법 1: format.display_source (가장 일반적)
        if (block.format?.display_source) {
          imageUrl = block.format.display_source
        }
        // 방법 2: properties.source
        else if (block.properties?.source?.[0]?.[0]) {
          imageUrl = block.properties.source[0][0]
        }
        // 방법 3: properties.file (파일 업로드)
        else if (block.properties?.file?.[0]?.[1]?.[0]?.[1]) {
          imageUrl = block.properties.file[0][1][0][1]
        }
        // 방법 4: format.page_cover (페이지 커버 이미지)
        else if (block.format?.page_cover) {
          imageUrl = block.format.page_cover
        }
        
        if (imageUrl) {
          // customMapImageUrl을 사용하여 Notion 이미지 URL 변환
          const mappedUrl = customMapImageUrl(imageUrl, block)
          const caption = block.properties?.caption?.[0]?.[0] || content || ""
          return `![${caption}](${mappedUrl})\n\n`
        } else {
          console.warn(`⚠️  Image block found but no URL could be extracted`)
        }
      } catch (error) {
        console.warn(`⚠️  Failed to process image block:`, error)
      }
      return ""
    }
    case "text":
    case "paragraph":
    default: {
      if (isEmpty && blockType !== "paragraph") {
        return ""
      }
      // 일반 텍스트 블록
      return `${content}\n\n`
    }
  }
}

/**
 * Notion 포스트에서 frontmatter를 생성합니다.
 * 항상 Notion 기준으로 새로 생성합니다.
 */
function buildFrontmatterFromPost(post: TPost) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    date: post.date, // { start_date: string }
    createdTime: post.createdTime,
    status: post.status, // ["Public"] 등
    type: post.type, // ["Post"] 등
    tags: post.tags ?? [],
    category: post.category ?? [],
    summary: post.summary ?? "",
    thumbnail: post.thumbnail ?? null,
    author: post.author ?? [],
    fullWidth: post.fullWidth ?? false,
  }
}

async function syncNotionToMd() {
  ensurePostsDir()

  // 기존 md 파일 삭제
  console.log("🗑️  Deleting existing markdown files...")
  deleteExistingMarkdownFiles()

  console.log("📥 Fetching posts from Notion...")
  const posts: TPosts = await getPosts()

  console.log(`✅ Got ${posts.length} posts from Notion.`)

  for (const post of posts) {
    if (!post.slug) {
      console.warn(`⚠️  Skip post without slug (id: ${post.id})`)
      continue
    }

    const fileName = `${post.slug}.md`
    const filePath = path.join(POSTS_DIR, fileName)

    console.log(`📝 Processing: ${post.title} (${fileName})`)

    // Frontmatter 생성 (항상 Notion 기준으로 새로 생성)
    const frontmatter = buildFrontmatterFromPost(post)

    // Notion recordMap → markdown(본문) 변환 (이미지 포함)
    let finalContent = ""
    try {
      finalContent = await convertNotionPageToMarkdown(post.id)
      if (!finalContent) {
        console.warn(`⚠️  No content found for ${post.title}`)
      }
    } catch (error) {
      console.error(`❌ Failed to convert content for ${post.title}:`, error)
      finalContent = ""
    }

    const md = matter.stringify(finalContent.trim() + "\n", frontmatter)
    fs.writeFileSync(filePath, md, "utf8")
    console.log(`✅ Created: ${fileName}`)
  }

  console.log("🎉 Notion → MD sync finished.")
}

// 직접 실행
syncNotionToMd().catch((err) => {
  console.error("❌ Notion → MD sync failed:")
  console.error(err)
  process.exit(1)
})
