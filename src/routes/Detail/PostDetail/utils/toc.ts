import { slugify } from "./slugify"
import { normalizeHeadingText } from "./heading"

export interface TocItem {
  id: string
  indentLevel: number
  text: string
}

export function buildTocFromMarkdown(content: string): TocItem[] {
  if (!content || typeof content !== 'string') return []
  
  const lines = content.split("\n")
  const toc: TocItem[] = []
  let inCodeFence = false
  let currentFenceMarker: "`" | "~" | null = null

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Ignore headings inside fenced code blocks.
    const fenceMatch = /^([`~]{3,})/.exec(trimmedLine)
    if (fenceMatch) {
      const marker = fenceMatch[1][0] as "`" | "~"
      if (!inCodeFence) {
        inCodeFence = true
        currentFenceMarker = marker
      } else if (currentFenceMarker === marker) {
        inCodeFence = false
        currentFenceMarker = null
      }
      continue
    }

    if (inCodeFence) continue
    if (!trimmedLine.startsWith("#")) continue

    const h1Match = /^#\s+(.+)$/.exec(trimmedLine)
    const h2Match = /^##\s+(.+)$/.exec(trimmedLine)
    const h3Match = /^###\s+(.+)$/.exec(trimmedLine)

    let text: string | null = null
    let indentLevel = 0

    if (h1Match) {
      text = h1Match[1].trim()
      indentLevel = 0
    } else if (h2Match) {
      text = h2Match[1].trim()
      indentLevel = 0
    } else if (h3Match) {
      text = h3Match[1].trim()
      indentLevel = 1
    }

    if (text) {
      const normalizedText = normalizeHeadingText(text)
      if (!normalizedText) continue
      toc.push({
        id: slugify(normalizedText),
        text: normalizedText,
        indentLevel,
      })
    }
  }

  return toc
}

export function scrollToHeading(id: string): void {
  if (typeof document === "undefined" || typeof window === "undefined") return
  if (!id) return

  const target = document.getElementById(id)
  if (!target) return

  const headerOffset = 80
  const rect = target.getBoundingClientRect()
  const scrollTop = window.scrollY || window.pageYOffset
  const targetY = rect.top + scrollTop - headerOffset

  window.scrollTo({
    top: targetY,
    behavior: "smooth",
  })

  history.replaceState(null, "", `#${id}`)
}
