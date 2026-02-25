export function slugify(text: string): string {
  const normalized = text
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")

  if (normalized) return normalized.toLowerCase()

  return encodeURIComponent(text.trim().toLowerCase()).replace(/%/g, "-")
}
