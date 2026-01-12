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
    function findUndefinedPaths(obj: any, path = "frontmatter", out: string[] = []): string[] {
  if (obj === undefined) out.push(path);
  if (!obj || typeof obj !== "object") return out;

  if (Array.isArray(obj)) {
    obj.forEach((v, i) => findUndefinedPaths(v, `${path}[${i}]`, out));
  } else {
    for (const [k, v] of Object.entries(obj)) {
      findUndefinedPaths(v, `${path}.${k}`, out);
    }
  }
  return out;
}

// matter.stringify 직전
const bad = findUndefinedPaths(frontmatter);
if (bad.length) {
  console.log("[notion-md] undefined paths:", bad);
  console.log("[notion-md] page:", post?.id, post?.title);
  console.log("[notion-md] frontmatter raw:", JSON.stringify(frontmatter, null, 2));
  throw new Error("frontmatter contains undefined");
}

    const md = matter.stringify(finalContent.trim() + "\n", frontmatter)
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
