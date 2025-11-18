import React, { useCallback } from "react"
import styled from "@emotion/styled"
import type { TocItem } from "../utils/toc"
import { scrollToHeading } from "../utils/toc"

interface TopTableOfContentsProps {
  items: TocItem[]
}

const TopTableOfContents: React.FC<TopTableOfContentsProps> = ({ items }) => {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    scrollToHeading(id)
  }, [])

  if (items.length === 0) return null

  return (
    <StyledTopToc>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={(e) => handleClick(e, item.id)}
        >
          {item.text}
        </a>
      ))}
    </StyledTopToc>
  )
}

export default React.memo(TopTableOfContents)

const StyledTopToc = styled.nav`
  margin: 1.5rem 0 2rem;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(148, 163, 184, 0.4);
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.875rem;

  a {
    color: rgba(100, 116, 139, 1);
    text-decoration: none;
    padding: 0.15rem 0.25rem;
    border-radius: 0.375rem;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:hover {
      background-color: rgba(248, 250, 252, 1);
      color: rgba(15, 23, 42, 1);
    }
  }
`

