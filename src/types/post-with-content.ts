import { TPost, PostDetail } from "./index"

export type PostWithContent = (TPost | PostDetail) & {
  content?: string
}

