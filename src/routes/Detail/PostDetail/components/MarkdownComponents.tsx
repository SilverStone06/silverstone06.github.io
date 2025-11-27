import React from "react"
import Image from "next/image"
import { slugify } from "../utils/slugify"
import { isLocalImagePath } from "../../../../libs/utils/image"
import type {
  MarkdownHeadingProps,
  MarkdownBlockquoteProps,
  MarkdownCodeProps,
  MarkdownTableProps,
  MarkdownImageProps
} from "../../../../types/markdown"

export function createMarkdownComponents(postSlug: string) {
  return {
    h1: ({ node, ...props }: MarkdownHeadingProps) => {
      const text = String(props.children ?? "")
      const id = slugify(text)
      return <h1 id={id} {...props} />
    },

    h2: ({ node, ...props }: MarkdownHeadingProps) => {
      const text = String(props.children ?? "")
      const id = slugify(text)
      return <h2 id={id} {...props} />
    },

    h3: ({ node, ...props }: MarkdownHeadingProps) => {
      const text = String(props.children ?? "")
      const id = slugify(text)
      return <h3 id={id} {...props} />
    },

    blockquote: ({ node, ...props }: MarkdownBlockquoteProps) => {
      return <blockquote {...props} />
    },

    code: ({ node, inline, className, children, ...props }: MarkdownCodeProps) => {
      const match = /language-(\w+)/.exec(className || "")
      return !inline && match ? (
        <pre className={className} {...props}>
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },

    table: ({ node, ...props }: MarkdownTableProps) => {
      return (
        <div css={{ overflowX: "auto", margin: "1.5rem 0" }}>
          <table {...props} />
        </div>
      )
    },

    img: ({ node, ...props }: MarkdownImageProps) => {
      const src = props.src || ""

      if (isLocalImagePath(src)) {
        return (
          <Image
            src={src}
            alt={props.alt || ""}
            width={800}
            height={600}
            style={{ width: "100%", height: "auto", borderRadius: "0.5rem", margin: "2rem 0" }}
            unoptimized
          />
        )
      }

      return (
        <Image
          src={src}
          alt={props.alt || "image"}
          width={800}
          height={600}
          style={{ width: "100%", height: "auto", borderRadius: "0.5rem", margin: "2rem 0" }}
          unoptimized
        />
      )
    },

    br: () => {
      return <br />
    },
  }
}

