import { getTextContent, idToUuid } from "notion-utils"
import { getRecordMap } from "../../src/apis/notion-client/getRecordMap"
import { downloadAndSaveImage } from "./image-downloader"
import type { NotionBlock, BlockMap, RecordMap, ImageCounter } from "./types"
import { NotionError, logError } from "../../src/libs/utils/error-handler"

export async function convertNotionPageToMarkdown(pageId: string, postSlug: string): Promise<string> {
  try {
    console.log(`  [DEBUG] Fetching recordMap for page: ${pageId}`)
    const recordMap = await getRecordMap(pageId)
    console.log(`  [DEBUG] RecordMap fetched, blocks count: ${Object.keys(recordMap?.block || {}).length}`)
    const markdown = await convertRecordMapToMarkdown(recordMap, pageId, postSlug)
    console.log(`  [DEBUG] Converted markdown length: ${markdown.length} characters`)
    return markdown
  } catch (error) {
    logError('Convert Notion Page', error, { pageId, postSlug })
    return ""
  }
}

async function convertRecordMapToMarkdown(recordMap: RecordMap, pageId: string, postSlug: string): Promise<string> {
  const blocks: string[] = []
  const blockMap = recordMap.block || {}

  const imageCounter: ImageCounter = { count: 0 }

  console.log(`    [DEBUG] Total blocks in recordMap: ${Object.keys(blockMap).length}`)

  const rootBlockId = findRootBlockId(blockMap, pageId)

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
    const markdown = await convertBlockWithChildren(rootBlock, blockMap, rootBlockId, 0, postSlug, imageCounter)
    if (markdown) {
      blocks.push(markdown)
    }
  }

  return blocks.join("")
}

function findRootBlockId(blockMap: BlockMap, pageId: string): string | undefined {
  const pageUuid = idToUuid(pageId)
  const pageIdNoHyphens = pageId.replace(/-/g, '')
  const pageUuidFromNoHyphens = idToUuid(pageIdNoHyphens)

  console.log(`    [DEBUG] Original pageId: ${pageId}`)
  console.log(`    [DEBUG] Converted pageUuid: ${pageUuid}`)
  console.log(`    [DEBUG] pageUuidFromNoHyphens: ${pageUuidFromNoHyphens}`)

  const possibleIds = [pageUuid, pageId, pageUuidFromNoHyphens, pageIdNoHyphens]

  for (const testId of possibleIds) {
    if (blockMap[testId]?.value?.type === "page") {
      console.log(`    [DEBUG] Found root page block by direct ID: ${testId}`)
      return testId
    }
  }

  const pageBlocks = Object.keys(blockMap).filter((id) => {
    const block = blockMap[id]?.value
    return block?.type === "page"
  })
  console.log(`    [DEBUG] Found ${pageBlocks.length} page blocks: ${pageBlocks.slice(0, 3).join(', ')}`)

  const rootBlockId = pageBlocks.find((id) => {
    const block = blockMap[id]?.value
    const hasNoParent = !block?.parent_id
    const parentMatches = possibleIds.includes(block?.parent_id || "")
    return hasNoParent || parentMatches
  })

  if (rootBlockId) {
    return rootBlockId
  }

  if (pageBlocks.length > 0) {
    console.log(`    [DEBUG] Using first page block as root: ${pageBlocks[0]}`)
    return pageBlocks[0]
  }

  return undefined
}

async function convertBlockWithChildren(
  block: NotionBlock,
  blockMap: BlockMap,
  blockId: string,
  depth: number,
  postSlug: string,
  imageCounter: ImageCounter
): Promise<string> {
  const result: string[] = []

  // Handle table specially
  if (block.type === "table") {
    return await convertTable(block, blockMap)
  }

  if (block.type !== "page") {
    const markdown = await convertBlockToMarkdown(block, blockMap, depth, postSlug, imageCounter)
    if (markdown) {
      result.push(markdown)
    }
  }

  const children = block.content || []
  for (const childId of children) {
    const childBlock = blockMap[childId]?.value
    if (childBlock) {
      const childMarkdown = await convertBlockWithChildren(childBlock, blockMap, childId, depth + 1, postSlug, imageCounter)
      if (childMarkdown) {
        result.push(childMarkdown)
      }
    }
  }

  return result.join("")
}

async function convertBlockToMarkdown(
  block: NotionBlock,
  blockMap: BlockMap,
  depth: number,
  postSlug: string,
  imageCounter: ImageCounter
): Promise<string> {
  const blockType = block.type as string
  const richText = block.properties?.title || []
  const content = convertRichText(richText)
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
      const codeContent = getTextContent(block.properties?.title || []) || ""
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
      const emoji = block.format?.page_icon || ""
      return `> ${emoji} ${content}\n\n`
    }

    case "bookmark": {
      const link = block.properties?.link?.[0]?.[0] || ""
      const title = convertRichText(block.properties?.title || []) || link
      const description = convertRichText(block.properties?.description || [])
      const thumbnail = block.format?.bookmark_cover || ""

      // Create a compact card-style bookmark
      let cardContent = "> "

      // Add thumbnail if available (200px width)
      if (thumbnail) {
        cardContent += `<img src="${thumbnail}" alt="" width="200" />\n>\n> `
      }

      cardContent += `🔗 **[${title}](${link})**\n`

      // Add description if available
      if (description) {
        cardContent += `>\n> ${description}\n`
      }

      return cardContent + "\n"
    }

    case "image": {
      return await convertImageBlock(block, postSlug, imageCounter)
    }

    case "text":
    case "paragraph":
    default: {
      if (isEmpty && blockType !== "paragraph") {
        return ""
      }
      return `${content}\n\n`
    }
  }
}

async function convertImageBlock(
  block: NotionBlock,
  postSlug: string,
  imageCounter: ImageCounter
): Promise<string> {
  try {
    const imageUrl = extractImageUrl(block)

    if (!imageUrl) {
      console.warn(`Image block found but no URL could be extracted`)
      return ""
    }

    const blockId = block.id || ""
    if (!blockId) {
      console.warn(`Image block found but no blockId, skipping`)
      return ""
    }

    imageCounter.count++
    const imageIndex = imageCounter.count

    const localPath = await downloadAndSaveImage({
      imageUrl,
      imageIndex,
      postSlug,
      blockId
    })

    if (!localPath) {
      console.warn(`Failed to download image ${imageIndex}, skipping`)
      return ""
    }

    const caption = block.properties?.caption?.[0]?.[0] || getTextContent(block.properties?.title || []) || ""
    return `![${caption}](${localPath})\n\n`
  } catch (error) {
    logError('Convert Image Block', error, { postSlug })
    return ""
  }
}

function extractImageUrl(block: NotionBlock): string {
  if (block.format?.display_source) {
    return block.format.display_source
  }

  if (block.properties?.source?.[0]?.[0]) {
    return block.properties.source[0][0]
  }

  if (block.properties?.file?.[0]?.[1]?.[0]?.[1]) {
    return block.properties.file[0][1][0][1]
  }

  if (block.format?.page_cover) {
    return block.format.page_cover
  }

  return ""
}


function convertRichText(textArray: any[]): string {
  if (!textArray) return ""

  return textArray.map(item => {
    const [text, modifiers] = item
    let final = text

    if (modifiers) {
      for (const mod of modifiers) {
        const [type, param] = mod
        switch (type) {
          case "b": final = `**${final}**`; break;
          case "i": final = `*${final}*`; break;
          case "s": final = `~~${final}~~`; break;
          case "c": final = `\`${final}\``; break;
          case "a": final = `[${final}](${param})`; break;
        }
      }
    }
    return final
  }).join("")
}

async function convertTable(block: NotionBlock, blockMap: BlockMap): Promise<string> {
  const children = block.content || []
  const rows = children.map(id => blockMap[id]?.value).filter(b => b?.type === 'table_row')

  if (rows.length === 0) return ""

  const columnOrder = block.format?.table_block_column_order || []

  const rowStrings = rows.map(row => {
    const cells = columnOrder.map((colId: string) => {
      const cellContent = row?.properties?.[colId] || []
      return convertRichText(cellContent)
    })
    return `| ${cells.join(" | ")} |`
  })

  // Add separator after first row
  const separator = `| ${columnOrder.map(() => "---").join(" | ")} |`

  return [rowStrings[0], separator, ...rowStrings.slice(1)].join("\n") + "\n\n"
}
