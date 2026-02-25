import { ReactNode } from "react"

export function extractPlainText(node: ReactNode): string {
  if (node === null || node === undefined) return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) {
    return node.map(extractPlainText).join("")
  }
  if (typeof node === "object" && "props" in (node as any)) {
    return extractPlainText((node as any).props?.children)
  }
  return ""
}

export function normalizeHeadingText(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
    .replace(/\\([`*_#[\]()!~\\-])/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
}
