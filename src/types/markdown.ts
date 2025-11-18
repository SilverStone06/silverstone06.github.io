import { ReactNode } from "react"

export interface MarkdownNodeProps {
  node?: any
  children?: ReactNode
}

export interface MarkdownHeadingProps extends MarkdownNodeProps {}

export interface MarkdownBlockquoteProps extends MarkdownNodeProps {}

export interface MarkdownCodeProps extends MarkdownNodeProps {
  inline?: boolean
  className?: string
}

export interface MarkdownTableProps extends MarkdownNodeProps {}

export interface MarkdownImageProps extends MarkdownNodeProps {
  src?: string
  alt?: string
}

