import type { TPost } from "../../src/types"

export function buildFrontmatterFromPost(post: TPost) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    date: post.date,
    createdTime: post.createdTime,
    status: post.status,
    type: post.type,
    tags: post.tags ?? [],
    category: post.category ?? [],
    summary: post.summary ?? "",
    thumbnail: post.thumbnail ?? null,
    author: post.author ?? [],
    fullWidth: post.fullWidth ?? false,
  }
}

