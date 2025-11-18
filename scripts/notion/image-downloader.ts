import fs from "fs"
import path from "path"
import { customMapImageUrl } from "../../src/libs/utils/notion/customMapImageUrl"
import { 
  extractExtensionFromUrl, 
  getExtensionFromContentType, 
  generateImageFileName,
  getImagePath,
  type ImageExtension
} from "../../src/libs/utils/image"
import { ImageDownloadError, logError } from "../../src/libs/utils/error-handler"

const POSTS_DIR = path.join(process.cwd(), "src", "posts")

interface DownloadImageOptions {
  imageUrl: string
  imageIndex: number
  postSlug: string
  blockId: string
}

export async function downloadAndSaveImage(options: DownloadImageOptions): Promise<string> {
  const { imageUrl, imageIndex, postSlug, blockId } = options

  try {
    const postImagesDir = path.join(POSTS_DIR, postSlug)
    if (!fs.existsSync(postImagesDir)) {
      fs.mkdirSync(postImagesDir, { recursive: true })
    }
    
    let ext = extractExtensionFromUrl(imageUrl)
    const fileName = generateImageFileName(imageIndex, ext)
    const filePath = path.join(postImagesDir, fileName)
    
    if (fs.existsSync(filePath)) {
      console.log(`  [DEBUG] Image already exists: ${fileName}`)
      return getImagePath(postSlug, fileName)
    }
    
    const notionImageUrl = customMapImageUrl(imageUrl, { id: blockId, parent_table: "block" } as any)
    
    console.log(`  [DEBUG] Downloading image ${imageIndex}: ${notionImageUrl.substring(0, 100)}...`)
    const response = await fetch(notionImageUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }
    
    const contentTypeExt = getExtensionFromContentType(response.headers.get("content-type"))
    if (contentTypeExt) {
      ext = contentTypeExt
    }
    
    const finalFileName = generateImageFileName(imageIndex, ext)
    const finalFilePath = path.join(postImagesDir, finalFileName)
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    fs.writeFileSync(finalFilePath, buffer)
    console.log(`  [DEBUG] Saved image: ${finalFileName} (${buffer.length} bytes) to ${finalFilePath}`)
    
    return getImagePath(postSlug, finalFileName)
  } catch (error) {
    logError('Image Download', error, {
      imageIndex,
      imageUrl,
      postSlug,
    })
    return ""
  }
}

