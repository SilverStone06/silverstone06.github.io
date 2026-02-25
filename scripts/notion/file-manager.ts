import fs from "fs"
import path from "path"

const POSTS_DIR = path.join(process.cwd(), "src", "posts")

export function ensurePostsDir(): void {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }
}

export function deleteExistingMarkdownFiles(): void {
  if (!fs.existsSync(POSTS_DIR)) {
    return
  }

  const items = fs.readdirSync(POSTS_DIR)
  let deletedCount = 0

  for (const item of items) {
    const itemPath = path.join(POSTS_DIR, item)
    const stat = fs.statSync(itemPath)
    
    if (stat.isDirectory()) {
      fs.rmSync(itemPath, { recursive: true, force: true })
      deletedCount++
      console.log(`Deleted folder: ${item}/`)
    } else if (item.endsWith(".md")) {
      fs.unlinkSync(itemPath)
      deletedCount++
      console.log(`Deleted: ${item}`)
    }
  }

  if (deletedCount > 0) {
    console.log(`Deleted ${deletedCount} existing post(s).`)
  }
}

export function deletePostsBySlugs(slugs: string[]): void {
  if (!fs.existsSync(POSTS_DIR)) {
    return
  }

  const uniqueSlugs = [...new Set(slugs.filter(Boolean))]
  if (uniqueSlugs.length === 0) return

  for (const slug of uniqueSlugs) {
    const folderPath = path.join(POSTS_DIR, slug)
    if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
      fs.rmSync(folderPath, { recursive: true, force: true })
      console.log(`Deleted folder: ${slug}/`)
    }

    const legacyFilePath = path.join(POSTS_DIR, `${slug}.md`)
    if (fs.existsSync(legacyFilePath)) {
      fs.unlinkSync(legacyFilePath)
      console.log(`Deleted file: ${slug}.md`)
    }
  }
}

export function createPostDir(slug: string): string {
  const postDir = path.join(POSTS_DIR, slug)
  if (!fs.existsSync(postDir)) {
    fs.mkdirSync(postDir, { recursive: true })
  }
  return postDir
}

export function saveMarkdownFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, "utf8")
}
