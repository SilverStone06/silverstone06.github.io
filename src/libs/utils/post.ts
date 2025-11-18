import { TPost } from "src/types"

export function getPostDate(post: TPost): Date {
  return new Date(post?.date?.start_date || post.createdTime)
}

export function getPostDateTimestamp(post: TPost): number {
  return getPostDate(post).getTime()
}

export function comparePostsByDate(a: TPost, b: TPost, order: "asc" | "desc" = "desc"): number {
  const dateA = getPostDateTimestamp(a)
  const dateB = getPostDateTimestamp(b)
  return order === "desc" ? dateB - dateA : dateA - dateB
}

export function sortPostsByDate(posts: TPost[], order: "asc" | "desc" = "desc"): TPost[] {
  return [...posts].sort((a, b) => comparePostsByDate(a, b, order))
}

