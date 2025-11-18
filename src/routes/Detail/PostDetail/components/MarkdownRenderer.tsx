import React, { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import rehypeRaw from "rehype-raw"
import { createMarkdownComponents } from "./MarkdownComponents"

interface MarkdownRendererProps {
  content: string
  postSlug: string
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, postSlug }) => {
  const components = useMemo(() => createMarkdownComponents(postSlug), [postSlug])
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
}

export default React.memo(MarkdownRenderer)

