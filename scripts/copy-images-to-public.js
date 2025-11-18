// scripts/copy-images-to-public.js

const fs = require('fs')
const path = require('path')

const postsDir = path.join(process.cwd(), 'src', 'posts')
const publicDir = path.join(process.cwd(), 'public', 'images', 'posts')

if (!fs.existsSync(postsDir)) {
  console.log('📁 src/posts/ directory not found, skipping image copy')
  process.exit(0)
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

let copiedCount = 0

fs.readdirSync(postsDir).forEach((slug) => {
  const postDir = path.join(postsDir, slug)
  
  if (!fs.statSync(postDir).isDirectory()) {
    return
  }
  
  const publicPostDir = path.join(publicDir, slug)
  
  if (!fs.existsSync(publicPostDir)) {
    fs.mkdirSync(publicPostDir, { recursive: true })
  }
  
  fs.readdirSync(postDir).forEach((file) => {
    if (/^image\d+\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(file)) {
      const src = path.join(postDir, file)
      const dest = path.join(publicPostDir, file)
      
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

