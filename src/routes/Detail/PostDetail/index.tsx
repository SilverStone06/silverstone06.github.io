import React, { useMemo, useRef } from "react"
import PostHeader from "./PostHeader"
import Footer from "./PostFooter"
import CommentBox from "./CommentBox"
import Category from "src/components/Category"
import usePostQuery from "src/hooks/usePostQuery"
import useScroll from "src/hooks/useScroll"
import ReadingProgressBar from "src/components/ReadingProgressBar"
import MarkdownRenderer from "./components/MarkdownRenderer"
import TopTableOfContents from "./components/TopTableOfContents"
import RightTableOfContents from "./components/RightTableOfContents"
import { buildTocFromMarkdown } from "./utils/toc"
import { StyledWrapper, StyledMarkdownContent } from "./styles"
import type { PostWithContent } from "src/types/post-with-content"

const PostDetail: React.FC = () => {
  const data = usePostQuery()
  const articleRef = useRef<HTMLDivElement | null>(null)
  const progress = useScroll(articleRef)

  const content = (data as PostWithContent)?.content || ""

  const toc = useMemo(() => {
    if (!content) return []
    return buildTocFromMarkdown(content)
  }, [content])

  const topTocItems = useMemo(
    () => toc.filter((item) => item.indentLevel <= 0),
    [toc]
  )

  if (!data) return null

  const category = data.category?.[0]

  return (
    <>
      <ReadingProgressBar progress={progress} />

      <StyledWrapper>
        <article>
          {category && (
            <div css={{ marginBottom: "0.5rem" }}>
              <Category readOnly={data.status?.[0] === "PublicOnDetail"}>
                {category}
              </Category>
            </div>
          )}

          {data.type[0] === "Post" && <PostHeader data={data} />}

          {data.type[0] === "Post" && <TopTableOfContents items={topTocItems} />}

          <StyledMarkdownContent ref={articleRef}>
            <MarkdownRenderer 
              content={content} 
              postSlug={data?.slug || ""}
            />
          </StyledMarkdownContent>

          {data.type[0] === "Post" && (
            <>
              <Footer />
              <CommentBox data={data} />
            </>
          )}
        </article>
      </StyledWrapper>

      {data.type[0] === "Post" && <RightTableOfContents items={toc} />}
    </>
  )
}

export default PostDetail
