// scripts/notion-to-md.ts
// 노션에서 포스트 메타데이터를 가져와서 src/posts/*.md 로 저장/업데이트하는 스크립트
// 실행 예시: npx ts-node scripts/notion-to-md.ts

// @ts-nocheck

import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { getTextContent, idToUuid } from "notion-utils"
import crypto from "crypto"

import { CONFIG } from "site.config"
import { NotionAPI } from "notion-client"

import { getRecordMap } from "src/apis/notion-client/getRecordMap"
import getAllPageIds from "src/libs/utils/notion/getAllPageIds"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { customMapImageUrl } from "src/libs/utils/notion/customMapImageUrl"
import { TPosts, TPost } from "src/types"

const POSTS_DIR = path.join(process.cwd(), "src", "posts")

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }
}

/**
 * 이미지를 다운로드하여 포스트 폴더에 저장하고, 상대 경로를 반환합니다.
 */
async function downloadAndSaveImage(
  imageUrl: string,
  blockId: string,
  postSlug: string
): Promise<string> {
  try {
    // 포스트별 이미지 디렉토리
    const postImagesDir = path.join(POSTS_DIR, postSlug)
    if (!fs.existsSync(postImagesDir)) {
      fs.mkdirSync(postImagesDir, { recursive: true })
    }
    
    // 이미지 URL에서 확장자 추출
    let ext = "jpg" // 기본값
    try {
      const url = new URL(imageUrl)
      const pathname = url.pathname
      const match = pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
      if (match) {
        ext = match[1].toLowerCase()
      }
    } catch {
      // URL 파싱 실패 시 기본값 사용
    }
    
    // 고유한 파일명 생성 (blockId 기반)
    const hash = crypto.createHash("md5").update(imageUrl).digest("hex").substring(0, 8)
    const fileName = `${blockId}-${hash}.${ext}`
    const filePath = path.join(postImagesDir, fileName)
    
    // 이미 파일이 존재하면 다운로드하지 않음
    if (fs.existsSync(filePath)) {
      console.log(`  [DEBUG] Image already exists: ${fileName}`)
      return `/images/posts/${postSlug}/${fileName}`
    }
    
    // Notion 이미지 URL을 사용하여 다운로드
    const notionImageUrl = customMapImageUrl(imageUrl, { id: blockId, parent_table: "block" } as any)
    
    console.log(`  [DEBUG] Downloading image: ${notionImageUrl.substring(0, 100)}...`)
    const response = await fetch(notionImageUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    fs.writeFileSync(filePath, buffer)
    console.log(`  [DEBUG] Saved image: ${fileName} (${buffer.length} bytes)`)
    
    // public 폴더에도 복사 (Next.js에서 접근 가능하도록)
    const publicImagesDir = path.join(process.cwd(), "public", "images", "posts", postSlug)
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true })
    }
    const publicImagePath = path.join(publicImagesDir, fileName)
    fs.copyFileSync(filePath, publicImagePath)
    console.log(`  [DEBUG] Copied image to public: ${publicImagePath}`)
    
    // 절대 경로 반환 (Next.js public 폴더 기준)
    return `/images/posts/${postSlug}/${fileName}`
  } catch (error: any) {
    console.warn(`⚠️  Failed to download image: ${error.message}`)
    // 실패 시 원본 URL 반환
    return customMapImageUrl(imageUrl, { id: blockId, parent_table: "block" } as any)
  }
}

/**
 * 기존 포스트 폴더와 파일을 삭제합니다.
 * Notion에서 체크박스로 선택한 포스트만 가져오므로,
 * 기존 파일을 삭제하고 새로 생성하는 것이 안전합니다.
 */
function deleteExistingMarkdownFiles() {
  if (!fs.existsSync(POSTS_DIR)) {
    return
  }

  const items = fs.readdirSync(POSTS_DIR)
  let deletedCount = 0

  for (const item of items) {
    const itemPath = path.join(POSTS_DIR, item)
    const stat = fs.statSync(itemPath)
    
    if (stat.isDirectory()) {
      // 폴더인 경우: 포스트 폴더이므로 삭제
      fs.rmSync(itemPath, { recursive: true, force: true })
      deletedCount++
      console.log(`🗑️  Deleted folder: ${item}/`)
    } else if (item.endsWith(".md")) {
      // 루트에 있는 .md 파일도 삭제 (구버전 호환)
      fs.unlinkSync(itemPath)
      deletedCount++
      console.log(`🗑️  Deleted: ${item}`)
    }
  }

  if (deletedCount > 0) {
    console.log(`✅ Deleted ${deletedCount} existing post(s).`)
  }
}

/**
 * Notion 페이지 ID를 받아서 Markdown 본문으로 변환합니다.
 * 이미지도 포함하여 변환합니다.
 */
async function convertNotionPageToMarkdown(pageId: string, postSlug: string): Promise<string> {
  try {
    console.log(`  [DEBUG] Fetching recordMap for page: ${pageId}`)
    const recordMap = await getRecordMap(pageId)
    console.log(`  [DEBUG] RecordMap fetched, blocks count: ${Object.keys(recordMap?.block || {}).length}`)
    const markdown = await convertRecordMapToMarkdown(recordMap, pageId, postSlug)
    console.log(`  [DEBUG] Converted markdown length: ${markdown.length} characters`)
    return markdown
  } catch (error) {
    console.error(`❌ Failed to get recordMap for page ${pageId}:`, error)
    return ""
  }
}

/**
 * Notion recordMap을 Markdown 문자열로 변환합니다.
 * 블록의 계층 구조를 고려하고, 이미지도 포함합니다.
 */
async function convertRecordMapToMarkdown(recordMap: any, pageId: string, postSlug: string): Promise<string> {
  const blocks: string[] = []
  const blockMap = recordMap.block || {}
  
  console.log(`    [DEBUG] Total blocks in recordMap: ${Object.keys(blockMap).length}`)
  
  // 페이지 ID를 UUID 형식으로 변환 (여러 형식 시도)
  const pageUuid = idToUuid(pageId)
  const pageIdNoHyphens = pageId.replace(/-/g, '')
  const pageUuidFromNoHyphens = idToUuid(pageIdNoHyphens)
  
  console.log(`    [DEBUG] Original pageId: ${pageId}`)
  console.log(`    [DEBUG] Converted pageUuid: ${pageUuid}`)
  console.log(`    [DEBUG] pageUuidFromNoHyphens: ${pageUuidFromNoHyphens}`)
  
  // 루트 페이지 블록 찾기 (여러 방법 시도)
  let rootBlockId: string | undefined = undefined
  
  // 방법 1: 직접 페이지 ID로 찾기 (여러 형식 시도)
  const possibleIds = [pageUuid, pageId, pageUuidFromNoHyphens, pageIdNoHyphens]
  for (const testId of possibleIds) {
    if (blockMap[testId]?.value?.type === "page") {
      rootBlockId = testId
      console.log(`    [DEBUG] Found root page block by direct ID: ${rootBlockId}`)
      break
    }
  }
  
  // 방법 2: type이 "page"인 모든 블록 찾기
  if (!rootBlockId) {
    const pageBlocks = Object.keys(blockMap).filter((id) => {
      const block = blockMap[id]?.value
      return block?.type === "page"
    })
    console.log(`    [DEBUG] Found ${pageBlocks.length} page blocks: ${pageBlocks.slice(0, 3).join(', ')}`)
    
    // parent_id가 없거나, parent_id가 페이지 ID와 일치하는 블록 찾기
    rootBlockId = pageBlocks.find((id) => {
      const block = blockMap[id]?.value
      const hasNoParent = !block?.parent_id
      const parentMatches = possibleIds.includes(block?.parent_id)
      return hasNoParent || parentMatches
    })
    
    if (!rootBlockId && pageBlocks.length > 0) {
      // 첫 번째 페이지 블록 사용 (보통 루트 페이지)
      rootBlockId = pageBlocks[0]
      console.log(`    [DEBUG] Using first page block as root: ${rootBlockId}`)
    }
  }
  
  if (!rootBlockId) {
    console.log(`    [DEBUG] No root page block found. Available block types:`)
    Object.keys(blockMap).slice(0, 10).forEach((id) => {
      const block = blockMap[id]?.value
      console.log(`      - ${id}: type=${block?.type}, parent_id=${block?.parent_id}`)
    })
    return ""
  }
  
  const rootBlock = blockMap[rootBlockId]?.value
  if (rootBlock) {
    console.log(`    [DEBUG] Root block type: ${rootBlock.type}`)
    console.log(`    [DEBUG] Root block has ${rootBlock.content?.length || 0} children`)
    const markdown = await convertBlockWithChildren(rootBlock, blockMap, rootBlockId, 0, postSlug)
    if (markdown) {
      blocks.push(markdown)
    }
  }
  
  return blocks.join("")
}

/**
 * 블록과 그 자식들을 재귀적으로 Markdown으로 변환합니다.
 */
async function convertBlockWithChildren(
  block: any,
  blockMap: any,
  blockId: string,
  depth: number,
  postSlug: string
): Promise<string> {
  const result: string[] = []
  
  // 현재 블록 변환 (페이지 블록은 제외)
  if (block.type !== "page") {
    const markdown = await convertBlockToMarkdown(block, blockMap, depth, postSlug)
    if (markdown) {
      result.push(markdown)
    }
  }
  
  // 자식 블록들 처리
  const children = block.content || []
  for (const childId of children) {
    const childBlock = blockMap[childId]?.value
    if (childBlock) {
      const childMarkdown = await convertBlockWithChildren(childBlock, blockMap, childId, depth + 1, postSlug)
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
async function convertBlockToMarkdown(block: any, blockMap: any, depth: number, postSlug: string): Promise<string> {
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
          // 이미지를 다운로드하여 포스트 폴더에 저장
          const blockId = block.id || ""
          const localPath = await downloadAndSaveImage(imageUrl, blockId, postSlug)
          const caption = block.properties?.caption?.[0]?.[0] || content || ""
          return `![${caption}](${localPath})\n\n`
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

/**
 * Notion 페이지의 "commitStatus" 체크박스를 체크합니다.
 */
async function updateCommitStatusCheckbox(
  pageId: string,
  schema: any,
  checked: boolean = true
): Promise<boolean> {
  try {
    const notionToken = process.env.NOTION_TOKEN
    if (!notionToken) {
      console.warn("⚠️  NOTION_TOKEN not set, skipping commitStatus update")
      return false
    }

    // 스키마에서 "commitStatus" 속성의 ID 찾기
    let commitStatusPropertyId: string | null = null
    for (const [key, value]: any of Object.entries(schema)) {
      if (value?.name === "commitStatus" && value?.type === "checkbox") {
        commitStatusPropertyId = key
        break
      }
    }

    if (!commitStatusPropertyId) {
      console.warn("⚠️  commitStatus property not found in schema")
      return false
    }

    // 페이지 ID가 이미 UUID 형식인지 확인
    // UUID 형식: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (하이픈 포함 36자)
    let pageUuid = pageId
    if (!pageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      pageUuid = idToUuid(pageId)
    }
    
    console.log(`  [DEBUG] Updating commitStatus for page: ${pageUuid}`)
    
    // Notion API v1을 사용하여 페이지 속성 업데이트
    const response = await fetch(`https://api.notion.com/v1/pages/${pageUuid}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          [commitStatusPropertyId]: {
            checkbox: checked,
          },
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Failed to update commitStatus: ${response.status} ${errorText}`)
      return false
    }

    return true
  } catch (error: any) {
    console.error(`❌ Error updating commitStatus:`, error.message)
    return false
  }
}

/**
 * "gitCommit" 체크박스가 체크된 포스트만 가져옵니다.
 */
async function getPostsWithCheckboxFilter(): Promise<{ posts: TPosts; schema: any }> {
  let id = CONFIG.notionConfig.pageId as string
  const api = new NotionAPI()

  console.log("[DEBUG] Fetching Notion page...")
  const response = await api.getPage(id)
  id = idToUuid(id)
  const collection = Object.values(response.collection)[0]?.value
  const block = response.block
  const schema = collection?.schema

  console.log(`[DEBUG] Schema keys: ${Object.keys(schema || {}).length}`)
  console.log(`[DEBUG] Block keys: ${Object.keys(block || {}).length}`)

  const rawMetadata = block[id].value

  // Check Type
  if (
    rawMetadata?.type !== "collection_view_page" &&
    rawMetadata?.type !== "collection_view"
  ) {
    console.log(`[DEBUG] Invalid type: ${rawMetadata?.type}`)
    return { posts: [] as TPosts, schema: {} }
  }

  // Construct Data
  const pageIds = getAllPageIds(response)
  console.log(`[DEBUG] Found ${pageIds.length} page IDs`)
  const data = []
  
  for (let i = 0; i < pageIds.length; i++) {
    const pageId = pageIds[i]
    
    // 먼저 gitCommit 체크박스를 확인 (properties를 가져오기 전에)
    let gitCommitChecked = false
    let foundGitCommitProperty = false
    let tempTitle = pageId
    
    console.log(`\n[DEBUG] Processing page ${i + 1}/${pageIds.length}: ${pageId}`)
    console.log(`  [DEBUG] block[pageId] exists: ${!!block[pageId]}`)
    console.log(`  [DEBUG] block[pageId]?.value exists: ${!!block[pageId]?.value}`)
    console.log(`  [DEBUG] block[pageId]?.value?.properties exists: ${!!block[pageId]?.value?.properties}`)
    console.log(`  [DEBUG] schema exists: ${!!schema}`)
    
    if (block[pageId]?.value?.properties && schema) {
      // 모든 속성 확인 (디버깅용)
      tempTitle = getTextContent(block[pageId]?.value?.properties?.title || []) || pageId
      console.log(`  [DEBUG] Checking page: ${tempTitle}`)
      console.log(`  [DEBUG] Properties count: ${Object.keys(block[pageId].value.properties).length}`)
      
      for (const [key, val]: any of Object.entries(block[pageId].value.properties)) {
        const propName = schema[key]?.name
        const propType = schema[key]?.type
        
        // 체크박스 속성 모두 로깅
        if (propType === "checkbox") {
          console.log(`  [DEBUG] Found checkbox property: "${propName}" = ${JSON.stringify(val)}`)
        }
        
        if (propName === "gitCommit" && propType === "checkbox") {
          foundGitCommitProperty = true
          // 체크박스 값 확인: val은 배열 형태일 수 있음
          // Notion API에서 체크박스는 보통 [[true]] 또는 [[false]] 형태
          let checkboxValue: any = null
          
          if (Array.isArray(val) && val.length > 0) {
            if (Array.isArray(val[0]) && val[0].length > 0) {
              checkboxValue = val[0][0]
            } else {
              checkboxValue = val[0]
            }
          } else {
            checkboxValue = val
          }
          
          console.log(`  [DEBUG] gitCommit checkbox value: ${JSON.stringify(checkboxValue)} (type: ${typeof checkboxValue})`)
          
          // 다양한 형태의 true 값 확인
          gitCommitChecked = 
            checkboxValue === true || 
            checkboxValue === "Yes" || 
            checkboxValue === "yes" ||
            checkboxValue === "True" || 
            checkboxValue === "true" ||
            checkboxValue === 1 ||
            checkboxValue === "1"
          
          console.log(`  [DEBUG] gitCommit checked: ${gitCommitChecked}`)
          break
        }
      }
    } else {
      console.log(`  [DEBUG] Skipping property check - conditions not met`)
    }
    
    // gitCommit 체크박스가 없거나 체크되지 않았으면 스킵
    if (!foundGitCommitProperty) {
      console.log(`⏭️  Skipping ${tempTitle} (gitCommit property not found)`)
      continue
    }
    
    if (!gitCommitChecked) {
      console.log(`⏭️  Skipping ${tempTitle} (gitCommit checkbox not checked)`)
      continue
    }
    
    console.log(`✅ Including ${tempTitle} (gitCommit checkbox checked)`)
    
    // 필터링을 통과한 경우에만 properties 가져오기
    const properties = (await getPageProperties(pageId, block, schema)) || null

    // Add fullwidth, createdtime to properties
    properties.createdTime = new Date(
      block[pageId].value?.created_time
    ).toString()
    properties.fullWidth =
      (block[pageId].value?.format as any)?.page_full_width ?? false

    data.push(properties)
  }

  // Sort by date
  data.sort((a: any, b: any) => {
    const dateA: any = new Date(a?.date?.start_date || a.createdTime)
    const dateB: any = new Date(b?.date?.start_date || b.createdTime)
    return dateB - dateA
  })

  return { posts: data as TPosts, schema }
}

async function syncNotionToMd() {
  ensurePostsDir()

  // 기존 md 파일 삭제
  console.log("🗑️  Deleting existing markdown files...")
  deleteExistingMarkdownFiles()

  console.log("📥 Fetching posts from Notion (gitCommit checkbox checked only)...")
  const { posts, schema } = await getPostsWithCheckboxFilter()

  console.log(`✅ Got ${posts.length} posts from Notion (with gitCommit checkbox checked).`)

  const successfullyProcessed: string[] = []

  for (const post of posts) {
    if (!post.slug) {
      console.warn(`⚠️  Skip post without slug (id: ${post.id})`)
      continue
    }

    // 포스트별 폴더 생성
    const postDir = path.join(POSTS_DIR, post.slug)
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true })
    }

    const fileName = `${post.slug}.md`
    const filePath = path.join(postDir, fileName)

    console.log(`📝 Processing: ${post.title} (${post.slug}/${fileName})`)

    // Frontmatter 생성 (항상 Notion 기준으로 새로 생성)
    const frontmatter = buildFrontmatterFromPost(post)

    // Notion recordMap → markdown(본문) 변환 (이미지 포함)
    let finalContent = ""
    try {
      finalContent = await convertNotionPageToMarkdown(post.id, post.slug)
      console.log(`  [DEBUG] Content length: ${finalContent.length} characters`)
      if (!finalContent) {
        console.warn(`⚠️  No content found for ${post.title}`)
      } else {
        console.log(`  [DEBUG] First 200 chars of content: ${finalContent.substring(0, 200)}`)
      }
    } catch (error) {
      console.error(`❌ Failed to convert content for ${post.title}:`, error)
      finalContent = ""
    }

    const md = matter.stringify(finalContent.trim() + "\n", frontmatter)
    console.log(`  [DEBUG] Final markdown length: ${md.length} characters`)
    fs.writeFileSync(filePath, md, "utf8")
    console.log(`✅ Created: ${post.slug}/${fileName}`)
    
    // 성공적으로 처리된 포스트 ID 저장
    successfullyProcessed.push(post.id)
  }

  // 성공적으로 처리된 포스트의 "commitStatus" 체크박스 업데이트
  if (successfullyProcessed.length > 0) {
    console.log(`\n📝 Updating commitStatus checkbox for ${successfullyProcessed.length} post(s)...`)
    for (const pageId of successfullyProcessed) {
      const success = await updateCommitStatusCheckbox(pageId, schema, true)
      if (success) {
        console.log(`✅ Updated commitStatus for page ${pageId}`)
      }
    }
  }

  console.log("🎉 Notion → MD sync finished.")
}

// 직접 실행
syncNotionToMd().catch((err) => {
  console.error("❌ Notion → MD sync failed:")
  console.error(err)
  process.exit(1)
})
