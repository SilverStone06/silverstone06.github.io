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

interface CheckboxValue {
  checked: boolean
  value: any
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

/**
 * "gitCommit" 체크박스가 체크된 포스트만 가져옵니다.
 */
export async function getPostsWithCheckboxFilter(): Promise<{ posts: TPosts; schema: any }> {
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
        
        if (propName === "gitCommit" && propType === "checkbox") {
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
      if (value?.name === "commitStatus" && value?.type === "checkbox") {
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

