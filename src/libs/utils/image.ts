export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'] as const

export type ImageExtension = typeof IMAGE_EXTENSIONS[number]

export function isValidImageExtension(ext: string): ext is ImageExtension {
  return IMAGE_EXTENSIONS.includes(ext.toLowerCase() as ImageExtension)
}

export function extractExtensionFromUrl(imageUrl: string): ImageExtension {
  try {
    const url = new URL(imageUrl)
    const pathname = url.pathname
    const match = pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i)
    
    if (match) {
      const ext = match[1].toLowerCase()
      return ext === "jpeg" ? "jpg" : ext as ImageExtension
    }
  } catch {
  }
  
  return "jpg"
}

export function getExtensionFromContentType(contentType: string | null): ImageExtension | null {
  if (!contentType) return null
  
  if (contentType.includes("png")) return "png"
  if (contentType.includes("gif")) return "gif"
  if (contentType.includes("webp")) return "webp"
  if (contentType.includes("svg")) return "svg"
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg"
  
  return null
}

export function generateImageFileName(index: number, extension: ImageExtension): string {
  return `image${index}.${extension}`
}

export function isImageFile(filename: string): boolean {
  return /^image\d+\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(filename)
}

export function getImagePath(slug: string, filename: string): string {
  return `/images/posts/${slug}/${filename}`
}

export function isLocalImagePath(src: string): boolean {
  return src.startsWith("/images/")
}

export function isNotionImageUrl(src: string): boolean {
  return src.includes("notion.so/image")
}

