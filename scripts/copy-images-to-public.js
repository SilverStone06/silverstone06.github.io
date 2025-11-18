// scripts/copy-images-to-public.js
// 빌드 전에 src/posts/{slug}/의 이미지를 public/images/posts/{slug}/로 복사

const fs = require('fs')
const path = require('path')

const postsDir = path.join(process.cwd(), 'src', 'posts')
const publicDir = path.join(process.cwd(), 'public', 'images', 'posts')

if (!fs.existsSync(postsDir)) {
  console.log('📁 src/posts/ directory not found, skipping image copy')
  process.exit(0)
}

// public/images/posts 디렉토리 생성
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

let copiedCount = 0

// 각 포스트 폴더 확인
fs.readdirSync(postsDir).forEach((slug) => {
  const postDir = path.join(postsDir, slug)
  
  // 디렉토리인지 확인
  if (!fs.statSync(postDir).isDirectory()) {
    return
  }
  
  const publicPostDir = path.join(publicDir, slug)
  
  // public/images/posts/{slug} 디렉토리 생성
  if (!fs.existsSync(publicPostDir)) {
    fs.mkdirSync(publicPostDir, { recursive: true })
  }
  
  // 이미지 파일 찾기 (image1.jpg, image2.png 등)
  fs.readdirSync(postDir).forEach((file) => {
    // image1, image2 형식의 파일만 복사
    if (/^image\d+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)) {
      const src = path.join(postDir, file)
      const dest = path.join(publicPostDir, file)
      
      // 파일 복사
      fs.copyFileSync(src, dest)
      copiedCount++
      console.log(`  ✅ Copied: ${slug}/${file}`)
    }
  })
})

if (copiedCount > 0) {
  console.log(`📸 Copied ${copiedCount} image(s) to public/images/posts/`)
} else {
  console.log('📸 No images to copy')
}

