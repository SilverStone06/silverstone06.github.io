import React, { useMemo, useRef } from "react"
import PostHeader from "./PostHeader"
import Footer from "./PostFooter"
import CommentBox from "./CommentBox"
import Category from "src/components/Category"
import styled from "@emotion/styled"
import NotionRenderer from "../components/NotionRenderer"
import usePostQuery from "src/hooks/usePostQuery"
import useScroll from "src/hooks/useScroll"
import ReadingProgressBar from "src/components/ReadingProgressBar"
import { getPageTableOfContents } from "notion-utils"

type Props = {}

type TocItem = {
  id: string
  indentLevel: number
  text: string
}

const PostDetail: React.FC<Props> = () => {
  const data = usePostQuery()
  const articleRef = useRef<HTMLDivElement | null>(null)
  const progress = useScroll(articleRef)

  const toc: TocItem[] = useMemo(() => {
    if (!data?.recordMap?.block) return []

    const blocks = (data.recordMap as any).block
    const firstBlockKey = Object.keys(blocks)[0]
    const pageBlock = blocks[firstBlockKey]?.value

    if (!pageBlock) return []

    // ⚠️ notion-utils의 getPageTableOfContents 시그니처:
    // getPageTableOfContents(pageBlock, recordMap)
    return getPageTableOfContents(pageBlock, data.recordMap as any) as TocItem[]
  }, [data?.recordMap])

  if (!data) return null

  const category = (data.category && data.category?.[0]) || undefined
  const topTocItems = toc.filter((item) => item.indentLevel <= 1)

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

          {topTocItems.length > 0 && (
            <StyledTopToc>
              {topTocItems.map((item) => (
                <a key={item.id} href={`#${item.id}`}>
                  {item.text}
                </a>
              ))}
            </StyledTopToc>
          )}

          <div ref={articleRef}>
            <NotionRenderer recordMap={data.recordMap} />
          </div>

          {data.type[0] === "Post" && (
            <>
              <Footer />
              <CommentBox data={data} />
            </>
          )}
        </article>
      </StyledWrapper>

      {toc.length > 0 && (
        <StyledRightToc>
          <div className="toc-title">목차</div>
          <ul>
            {toc.map((item) => (
              <li
                key={item.id}
                style={{
                  paddingLeft: `${item.indentLevel * 0.75}rem`,
                }}
              >
                <a href={`#${item.id}`}>{item.text}</a>
              </li>
            ))}
          </ul>
        </StyledRightToc>
      )}
    </>
  )
}

export default PostDetail

const StyledWrapper = styled.div`
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 3rem;
  padding-bottom: 3rem;
  border-radius: 1.5rem;
  max-width: 56rem;
  background-color: ${({ theme }) =>
    theme.scheme === "light" ? "white" : theme.colors.gray4};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin: 0 auto;

  > article {
    margin: 0 auto;
    max-width: 42rem;
  }

  /* 콜아웃 / 인용 블록 폰트 사이즈 & 여백 줄이기 */
  .notion-callout,
  .notion-quote {
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .notion-callout .notion-text,
  .notion-quote .notion-text {
    font-size: 0.9rem;
  }

  .notion-callout {
    padding: 0.6rem 0.75rem;
  }

  .notion-quote {
    padding-left: 0.9rem;
    border-left-width: 3px;
  }
`

const StyledTopToc = styled.nav`
  margin: 1.5rem 0 2rem;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(148, 163, 184, 0.4);
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.875rem;

  a {
    color: rgba(100, 116, 139, 1);
    text-decoration: none;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:hover {
      background-color: rgba(248, 250, 252, 1);
      color: rgba(15, 23, 42, 1);
    }
  }
`

const StyledRightToc = styled.nav`
  position: fixed;
  top: 6rem;
  right: 3rem;
  max-width: 220px;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: rgba(100, 116, 139, 1);
  padding: 0.75rem 0.75rem 0.75rem 0.5rem;
  border-radius: 0.75rem;
  background-color: rgba(15, 23, 42, 0.02);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(148, 163, 184, 0.4);

  .toc-title {
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: rgba(51, 65, 85, 1);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 60vh;
    overflow-y: auto;
  }

  li + li {
    margin-top: 0.25rem;
  }

  a {
    text-decoration: none;
    color: inherit;
    display: inline-block;
    padding: 0.125rem 0.25rem;
    border-radius: 0.375rem;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:hover {
      background-color: rgba(248, 250, 252, 1);
      color: rgba(15, 23, 42, 1);
    }
  }

  /* 너무 쉽게 안 사라지게 기준 살짝 낮춤 */
  @media (max-width: 900px) {
    display: none;
  }
`
