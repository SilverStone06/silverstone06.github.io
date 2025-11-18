import React, { useCallback } from "react"
import styled from "@emotion/styled"
import type { TocItem } from "../utils/toc"
import { scrollToHeading } from "../utils/toc"

interface RightTableOfContentsProps {
  items: TocItem[]
}

const RightTableOfContents: React.FC<RightTableOfContentsProps> = ({ items }) => {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    scrollToHeading(id)
  }, [])

  if (items.length === 0) return null

  return (
    <StyledRightToc>
      <div className="toc-title">목차</div>
      <ul>
        {items.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${item.indentLevel * 0.75}rem` }}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </StyledRightToc>
  )
}

export default React.memo(RightTableOfContents)

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
  z-index: 10;

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

  @media (max-width: 900px) {
    display: none;
  }
`

