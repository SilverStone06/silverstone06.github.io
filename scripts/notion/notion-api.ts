import { NotionAPI } from "notion-client"
import { idToUuid, getTextContent } from "notion-utils"
import { CONFIG } from "../../site.config"
import getAllPageIds from "../../src/libs/utils/notion/getAllPageIds"
import getPageProperties from "../../src/libs/utils/notion/getPageProperties"
import type { TPosts } from "../../src/types"
import { logError } from "../../src/libs/utils/error-handler"

function getNotionToken(): string | undefined {
  return process.env.NOTION_TOKEN
}

function isCheckboxChecked(val: any): boolean {
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
  
  // 다양한 형태의 true 값 확인
  return (
    checkboxValue === true || 
    checkboxValue === "Yes" || 
    checkboxValue === "yes" ||
    checkboxValue === "True" || 
    checkboxValue === "true" ||
    checkboxValue === 1 ||
    checkboxValue === "1"
  )
}

function normalizePropertyName(name: string | undefined): string {
  return (name || "").replace(/\s+/g, "").toLowerCase()
}

function extractNotionId(input: string): string {
  if (!input) return input
  const trimmed = input.trim()
  const match = trimmed.match(/[0-9a-f]{32}/i)
  if (match) return match[0]
  return trimmed
}

function toUuid(id: string): string {
  if (!id) return id
  const normalized = extractNotionId(id)
  if (/^[0-9a-f]{32}$/i.test(normalized)) return idToUuid(normalized)
  return normalized
}

function getTextFromRichTextArray(items: any[] | undefined): string {
  if (!Array.isArray(items)) return ""
  return items.map((item) => item?.plain_text || "").join("")
}

function makeSlug(input: string): string {
  const normalized = (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
  return normalized || ""
}

function mapPagePropertiesFromOfficialApi(page: any): any {
  const properties = page?.properties || {}
  const mapped: any = {
    id: page?.id,
    slug: "",
    title: "",
    status: ["Public"],
    type: ["Post"],
    tags: [],
    category: [],
    summary: "",
    thumbnail: null,
    author: [],
    date: { start_date: page?.created_time || new Date().toISOString() },
    createdTime: new Date(page?.created_time || Date.now()).toString(),
    fullWidth: false,
  }

  for (const [name, prop] of Object.entries(properties) as [string, any][]) {
    const normalizedName = normalizePropertyName(name)
    const type = prop?.type
    if (!type) continue

    if (type === "title") {
      const value = getTextFromRichTextArray(prop.title)
      if (value && !mapped.title) mapped.title = value
      continue
    }

    if (type === "rich_text") {
      const value = getTextFromRichTextArray(prop.rich_text)
      if (normalizedName === "slug") mapped.slug = value
      if (normalizedName === "summary") mapped.summary = value
      if (normalizedName === "title" && !mapped.title) mapped.title = value
      continue
    }

    if (type === "select") {
      const value = prop?.select?.name
      if (!value) continue
      if (normalizedName === "status") mapped.status = [value]
      if (normalizedName === "type") mapped.type = [value]
      if (normalizedName === "category") mapped.category = [value]
      continue
    }

    if (type === "multi_select") {
      const values = (prop?.multi_select || []).map((item: any) => item?.name).filter(Boolean)
      if (normalizedName === "tags") mapped.tags = values
      if (normalizedName === "category") mapped.category = values
      if (normalizedName === "status" && values.length) mapped.status = values
      if (normalizedName === "type" && values.length) mapped.type = values
      continue
    }

    if (type === "date" && prop?.date?.start) {
      mapped.date = { start_date: prop.date.start }
      continue
    }

    if (type === "people") {
      mapped.author = (prop.people || []).map((person: any) => ({
        id: person?.id || "author",
        name: person?.name || "Unknown",
        profile_photo: person?.avatar_url || null,
      }))
      continue
    }

    if (type === "files") {
      const first = prop.files?.[0]
      const url = first?.external?.url || first?.file?.url || null
      if (normalizedName === "thumbnail") mapped.thumbnail = url
      continue
    }

    if (type === "url") {
      if (normalizedName === "thumbnail") mapped.thumbnail = prop?.url || null
      continue
    }
  }

  if (!mapped.title) {
    mapped.title = mapped.slug || page?.id || "Untitled"
  }
  if (!mapped.slug) {
    mapped.slug = makeSlug(mapped.title) || mapped.id
  }
  if (!Array.isArray(mapped.author)) mapped.author = []
  if (!mapped.author.length) {
    mapped.author = [{ id: "author", name: "Unknown", profile_photo: null }]
  }
  return mapped
}

async function getPostsWithOfficialDatabaseApi(
  notionToken: string,
  databaseId: string
): Promise<{ posts: TPosts; schema: any }> {
  const databaseUuid = toUuid(databaseId)
  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  }

  const dbRes = await fetch(`https://api.notion.com/v1/databases/${databaseUuid}`, {
    method: "GET",
    headers,
  })
  if (!dbRes.ok) {
    const text = await dbRes.text()
    throw new Error(`Failed to fetch database metadata: ${dbRes.status} ${text}`)
  }

  const dbJson: any = await dbRes.json()
  const dbProps = dbJson?.properties || {}
  const schema: any = {}
  for (const [name, prop] of Object.entries(dbProps) as [string, any][]) {
    if (!prop?.id || !prop?.type) continue
    schema[prop.id] = { name, type: prop.type }
  }

  let hasMore = true
  let cursor: string | undefined = undefined
  const rows: any[] = []

  while (hasMore) {
    const payload: any = {
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    }
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${databaseUuid}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })
    if (!queryRes.ok) {
      const text = await queryRes.text()
      throw new Error(`Failed to query database: ${queryRes.status} ${text}`)
    }

    const queryJson: any = await queryRes.json()
    rows.push(...(queryJson?.results || []))
    hasMore = Boolean(queryJson?.has_more)
    cursor = queryJson?.next_cursor || undefined
  }

  const posts = rows
    .filter((row) => {
      const props = row?.properties || {}
      for (const [name, prop] of Object.entries(props) as [string, any][]) {
        if (prop?.type !== "checkbox") continue
        const normalizedName = normalizePropertyName(name)
        if (
          normalizedName === "gitcommit" ||
          normalizedName === "git_commit"
        ) {
          return Boolean(prop?.checkbox)
        }
      }
      return false
    })
    .map((row) => mapPagePropertiesFromOfficialApi(row))
    .sort((a: any, b: any) => {
      const dateA = new Date(a?.date?.start_date || a?.createdTime || 0).getTime()
      const dateB = new Date(b?.date?.start_date || b?.createdTime || 0).getTime()
      return dateB - dateA
    })

  return { posts: posts as TPosts, schema }
}

function findSchemaFromResponse(response: any, block: any): any {
  const collections = Object.entries(response?.collection || {})
  for (const [, collection] of collections) {
    const schema = (collection as any)?.value?.schema
    if (schema && Object.keys(schema).length > 0) {
      return schema
    }
  }

  // Fallback: find schema via collection_id referenced by collection_view blocks.
  for (const [, row] of Object.entries(block || {})) {
    const value = (row as any)?.value
    if (!value) continue
    const collectionId = value.collection_id
    if (!collectionId) continue
    const schema = response?.collection?.[collectionId]?.value?.schema
    if (schema && Object.keys(schema).length > 0) {
      return schema
    }
  }

  return {}
}

function fallbackPageIdsFromBlock(block: any): string[] {
  return Object.entries(block || {})
    .filter(([, row]) => {
      const value = (row as any)?.value
      return value?.type === "page" && value?.parent_table === "collection"
    })
    .map(([id]) => id)
}

/**
 * "gitCommit" 체크박스가 체크된 포스트만 가져옵니다.
 */
export async function getPostsWithCheckboxFilter(): Promise<{ posts: TPosts; schema: any }> {
  const id = extractNotionId(CONFIG.notionConfig.pageId as string)
  const api = new NotionAPI()
  const notionToken = getNotionToken()

  console.log("[DEBUG] Fetching Notion page...")
  const response = await api.getPage(id)
  const block = response.block || {}
  const schema = findSchemaFromResponse(response, block)

  console.log(`[DEBUG] Schema keys: ${Object.keys(schema || {}).length}`)
  console.log(`[DEBUG] Block keys: ${Object.keys(block || {}).length}`)

  if (!schema || Object.keys(schema).length === 0) {
    console.log("[DEBUG] Could not find collection schema from response")
    if (notionToken) {
      console.log("[DEBUG] Falling back to official Notion database API...")
      return await getPostsWithOfficialDatabaseApi(notionToken, id)
    }
    return { posts: [] as TPosts, schema: {} }
  }

  // Construct Data
  let pageIds = getAllPageIds(response)
  if (pageIds.length === 0) {
    pageIds = fallbackPageIdsFromBlock(block)
  }
  console.log(`[DEBUG] Found ${pageIds.length} page IDs`)
  const data = []
  
  for (let i = 0; i < pageIds.length; i++) {
    const pageId = pageIds[i]
    
    // gitCommit 체크박스를 확인
    let gitCommitChecked = false
    let foundGitCommitProperty = false
    let tempTitle = pageId
    
    console.log(`\n[DEBUG] Processing page ${i + 1}/${pageIds.length}: ${pageId}`)
    console.log(`  [DEBUG] block[pageId] exists: ${!!block[pageId]}`)
    console.log(`  [DEBUG] block[pageId]?.value exists: ${!!block[pageId]?.value}`)
    console.log(`  [DEBUG] block[pageId]?.value?.properties exists: ${!!block[pageId]?.value?.properties}`)
    console.log(`  [DEBUG] schema exists: ${!!schema}`)
    
    if (block[pageId]?.value?.properties && schema) {
      tempTitle = getTextContent(block[pageId]?.value?.properties?.title || []) || pageId
      console.log(`  [DEBUG] Checking page: ${tempTitle}`)
      console.log(`  [DEBUG] Properties count: ${Object.keys(block[pageId].value.properties).length}`)
      
      for (const [key, val] of Object.entries(block[pageId].value.properties) as [string, any][]) {
        const propName = schema[key]?.name
        const propType = schema[key]?.type
        
        // 체크박스 속성 모두 로깅
        if (propType === "checkbox") {
          console.log(`  [DEBUG] Found checkbox property: "${propName}" = ${JSON.stringify(val)}`)
        }
        
        const normalizedName = normalizePropertyName(propName)
        if (
          propType === "checkbox" &&
          (normalizedName === "gitcommit" || normalizedName === "git_commit")
        ) {
          foundGitCommitProperty = true
          gitCommitChecked = isCheckboxChecked(val)
          console.log(`  [DEBUG] gitCommit checked: ${gitCommitChecked}`)
          break
        }
      }
    } else {
      console.log(`  [DEBUG] Skipping property check - conditions not met`)
    }
    
    if (!foundGitCommitProperty) {
      console.log(`Skipping ${tempTitle} (gitCommit property not found)`)
      continue
    }
    
    if (!gitCommitChecked) {
      console.log(`Skipping ${tempTitle} (gitCommit checkbox not checked)`)
      continue
    }
    
    console.log(`Including ${tempTitle} (gitCommit checkbox checked)`)
    
    const properties = (await getPageProperties(pageId, block, schema)) || null

    properties.createdTime = new Date(
      block[pageId].value?.created_time
    ).toString()
    properties.fullWidth =
      (block[pageId].value?.format as any)?.page_full_width ?? false

    data.push(properties)
  }

  data.sort((a: any, b: any) => {
    const dateA: any = new Date(a?.date?.start_date || a.createdTime)
    const dateB: any = new Date(b?.date?.start_date || b.createdTime)
    return dateB - dateA
  })

  return { posts: data as TPosts, schema }
}

export async function updateCommitStatusCheckbox(
  pageId: string,
  schema: any,
  checked: boolean = true
): Promise<boolean> {
  try {
    const notionToken = getNotionToken()
    if (!notionToken) {
      console.warn("NOTION_TOKEN not set, skipping commitStatus update")
      return false
    }

    let commitStatusPropertyId: string | null = null
    for (const [key, value] of Object.entries(schema) as [string, any][]) {
      const normalizedName = normalizePropertyName(value?.name)
      if (
        value?.type === "checkbox" &&
        (normalizedName === "commitstatus" || normalizedName === "commit_status")
      ) {
        commitStatusPropertyId = key
        break
      }
    }

    if (!commitStatusPropertyId) {
      console.warn("commitStatus property not found in schema")
      return false
    }

    let pageUuid = pageId
    if (!pageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      pageUuid = idToUuid(pageId)
    }
    
    console.log(`  [DEBUG] Updating commitStatus for page: ${pageUuid}`)
    
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
      console.error(`Failed to update commitStatus: ${response.status} ${errorText}`)
      return false
    }

    return true
  } catch (error) {
    logError('Update CommitStatus', error, { pageId })
    return false
  }
}
