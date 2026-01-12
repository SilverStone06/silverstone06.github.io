// scripts/notion-to-md.ts

import path from "path"
import matter from "gray-matter"
import { ensurePostsDir, deleteExistingMarkdownFiles, createPostDir, saveMarkdownFile } from "./notion/file-manager"
import { getPostsWithCheckboxFilter, updateCommitStatusCheckbox } from "./notion/notion-api"
import { convertNotionPageToMarkdown } from "./notion/markdown-converter"
import { buildFrontmatterFromPost } from "./notion/frontmatter-builder"
import { logError } from "../src/libs/utils/error-handler"

async function syncNotionToMd() {
  ensurePostsDir()

  console.log("Deleting existing markdown files...")
  deleteExistingMarkdownFiles()

  console.log("Fetching posts from Notion (gitCommit checkbox checked only)...")
  const { posts, schema } = await getPostsWithCheckboxFilter()

  console.log(`Got ${posts.length} posts from Notion (with gitCommit checkbox checked).`)

  const successfullyProcessed: string[] = []

  for (const post of posts) {
    if (!post.slug) {
      console.warn(`Skip post without slug (id: ${post.id})`)
      continue
    }

    const postDir = createPostDir(post.slug)
    const fileName = `${post.slug}.md`
    const filePath = path.join(postDir, fileName)

    console.log(`Processing: ${post.title} (${post.slug}/${fileName})`)

    const frontmatter = buildFrontmatterFromPost(post)

    let finalContent = ""
    try {
      finalContent = await convertNotionPageToMarkdown(post.id, post.slug)
      console.log(`  [DEBUG] Content length: ${finalContent.length} characters`)
      
      if (!finalContent) {
        console.warn(`No content found for ${post.title}`)
      } else {
        console.log(`  [DEBUG] First 200 chars of content: ${finalContent.substring(0, 200)}`)
      }
    } catch (error) {
      logError('Convert Post Content', error, { 
        postId: post.id, 
        postTitle: post.title, 
        postSlug: post.slug 
      })
      finalContent = ""
    }
    // undefined 값 제거 함수
    function removeUndefined(obj: any): any {
      if (obj === null || obj === undefined) return undefined;
      if (typeof obj !== "object") return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(removeUndefined).filter(v => v !== undefined);
      }
      
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleaned = removeUndefined(value);
        if (cleaned !== undefined) {
          result[key] = cleaned;
        }
      }
      return result;
    }

    // frontmatter에서 undefined 제거
    const cleanedFrontmatter = removeUndefined(frontmatter);
    
    console.log(`  [DEBUG] Frontmatter keys:`, Object.keys(cleanedFrontmatter))
    console.log(`  [DEBUG] Frontmatter:`, JSON.stringify(cleanedFrontmatter, null, 2))
    
    const md = matter.stringify(finalContent.trim() + "\n", cleanedFrontmatter)
    console.log(`  [DEBUG] Final markdown length: ${md.length} characters`)
    
    saveMarkdownFile(filePath, md)
    console.log(`Created: ${post.slug}/${fileName}`)
    
    successfullyProcessed.push(post.id)
  }

  if (successfullyProcessed.length > 0) {
    console.log(`\nUpdating commitStatus checkbox for ${successfullyProcessed.length} post(s)...`)
    for (const pageId of successfullyProcessed) {
      const success = await updateCommitStatusCheckbox(pageId, schema, true)
      if (success) {
        console.log(`Updated commitStatus for page ${pageId}`)
      }
    }
  }

  console.log("Notion to MD sync finished.")
}

syncNotionToMd().catch((err) => {
  console.error("Notion to MD sync failed:")
  console.error(err)
  process.exit(1)
})
