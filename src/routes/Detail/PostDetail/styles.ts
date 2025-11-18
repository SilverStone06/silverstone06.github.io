import styled from "@emotion/styled"

export const StyledWrapper = styled.div`
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

  .notion-callout *,
  .notion-quote * {
    font-size: 0.875rem !important;
    line-height: 1.6 !important;
  }

  .notion-hr {
    border: none;
    border-top: 2px solid
      ${({ theme }) =>
        theme.scheme === "light"
          ? "rgba(148, 163, 184, 0.7)"
          : "rgba(148, 163, 184, 0.4)"};
    margin: 1.75rem 0;
  }
`

export const StyledMarkdownContent = styled.div`
  h1 {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.2;
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.gray12};
    border-bottom: 2px solid ${({ theme }) => theme.colors.gray6};
    padding-bottom: 0.5rem;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    color: ${({ theme }) => theme.colors.gray12};
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.4;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.colors.gray11};
  }

  p {
    margin: 1rem 0;
    line-height: 1.75;
    color: ${({ theme }) => theme.colors.gray11};
  }

  blockquote {
    margin: 1.5rem 0;
    padding: 1rem 1.25rem;
    border-left: 4px solid ${({ theme }) => theme.colors.gray8};
    background-color: ${({ theme }) =>
      theme.scheme === "light" ? "rgba(248, 250, 252, 1)" : "rgba(30, 41, 59, 0.5)"};
    border-radius: 0.375rem;
    color: ${({ theme }) => theme.colors.gray11};
    font-style: italic;
    font-size: 0.875rem;
    line-height: 1.6;

    p {
      margin: 0;
      font-size: inherit;
      line-height: inherit;
    }
  }

  pre {
    margin: 1.5rem 0;
    padding: 1rem;
    background-color: ${({ theme }) =>
      theme.scheme === "light" ? "rgba(15, 23, 42, 0.05)" : "rgba(15, 23, 42, 0.8)"};
    border-radius: 0.5rem;
    overflow-x: auto;
    border: 1px solid ${({ theme }) => theme.colors.gray6};

    code {
      font-family: "Fira Code", "Consolas", "Monaco", monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      color: ${({ theme }) => theme.colors.gray12};
    }
  }

  code:not(pre code) {
    padding: 0.125rem 0.375rem;
    background-color: ${({ theme }) =>
      theme.scheme === "light" ? "rgba(241, 245, 249, 1)" : "rgba(30, 41, 59, 0.5)"};
    border-radius: 0.25rem;
    font-family: "Fira Code", "Consolas", "Monaco", monospace;
    font-size: 0.875em;
    color: ${({ theme }) => theme.scheme === "light" ? "rgba(220, 38, 38, 1)" : "rgba(248, 113, 113, 1)"};
  }

  ul, ol {
    margin: 1rem 0;
    padding-left: 1.75rem;
    line-height: 1.75;

    li {
      margin: 0.5rem 0;
      color: ${({ theme }) => theme.colors.gray11};
    }
  }

  ul {
    list-style-type: disc;
  }

  ol {
    list-style-type: decimal;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.875rem;

    th, td {
      padding: 0.75rem;
      text-align: left;
      border: 1px solid ${({ theme }) => theme.colors.gray6};
    }

    th {
      background-color: ${({ theme }) =>
        theme.scheme === "light" ? "rgba(248, 250, 252, 1)" : "rgba(30, 41, 59, 0.5)"};
      font-weight: 600;
      color: ${({ theme }) => theme.colors.gray12};
    }

    td {
      color: ${({ theme }) => theme.colors.gray11};
    }

    tr:nth-of-type(even) {
      background-color: ${({ theme }) =>
        theme.scheme === "light" ? "rgba(248, 250, 252, 0.5)" : "rgba(30, 41, 59, 0.3)"};
    }
  }

  a {
    color: ${({ theme }) => theme.scheme === "light" ? "rgba(59, 130, 246, 1)" : "rgba(96, 165, 250, 1)"};
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: ${({ theme }) => theme.scheme === "light" ? "rgba(37, 99, 235, 1)" : "rgba(147, 197, 253, 1)"};
    }
  }

  hr {
    margin: 2rem 0;
    border: none;
    border-top: 2px solid ${({ theme }) => theme.colors.gray6};
  }

  > *:first-child {
    margin-top: 0;
  }

  > *:last-child {
    margin-bottom: 0;
  }
`

