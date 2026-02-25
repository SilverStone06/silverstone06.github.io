import styled from "@emotion/styled"
import React, { useEffect, useMemo, useState } from "react"
import { Emoji } from "src/components/Emoji"
import { CONFIG } from "site.config"

type VisitorCounts = {
  daily: number | null
  total: number | null
}

type VisitorCounterConfig = {
  enable?: boolean
  namespace?: string
  key?: string
  timezone?: string
  apiBaseUrl?: string
}

function formatDateInTimeZone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date())
}

function parseCountValue(data: any): number | null {
  if (typeof data?.value === "number") return data.value
  if (typeof data?.value === "string") {
    const parsed = Number(data.value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

async function fetchCount(
  action: "hit" | "get",
  namespace: string,
  key: string,
  apiBaseUrl: string
) {
  const base = apiBaseUrl.replace(/\/+$/, "")
  const encodedUrl = `${base}/${action}/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`
  const rawUrl = `${base}/${action}/${namespace}/${key}`
  const urls = [encodedUrl, rawUrl]

  for (const url of urls) {
    const response = await fetch(url, { cache: "no-store" })
    if (!response.ok) continue
    const data = await response.json()
    const value = parseCountValue(data)
    if (value !== null) return value
  }

  throw new Error("Count API request failed")
}

function getSessionItemSafely(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function setSessionItemSafely(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Ignore storage failures (private mode / blocked storage).
  }
}

const VisitorCard: React.FC = () => {
  const visitorCounter = ((CONFIG as any).visitorCounter ?? {}) as VisitorCounterConfig
  const enable = Boolean(visitorCounter.enable)
  const namespace = String(visitorCounter.namespace ?? "").trim()
  const key = String(visitorCounter.key ?? "").trim()
  const timeZone = String(visitorCounter.timezone ?? "Asia/Seoul")
  const apiBaseUrl = String(visitorCounter.apiBaseUrl ?? "https://api.countapi.xyz")
  const [counts, setCounts] = useState<VisitorCounts>({ daily: null, total: null })

  const dayKey = useMemo(() => {
    const dateKey = formatDateInTimeZone(timeZone)
    return `${key}-${dateKey}`
  }, [key, timeZone])

  useEffect(() => {
    if (!enable || !namespace || !key) return

    const sessionKey = `visitor-counted:${namespace}:${dayKey}`
    const shouldIncrement = !getSessionItemSafely(sessionKey)
    const action: "hit" | "get" = shouldIncrement ? "hit" : "get"

    Promise.all([
      fetchCount(action, namespace, key, apiBaseUrl),
      fetchCount(action, namespace, dayKey, apiBaseUrl),
    ])
      .then(([total, daily]) => {
        if (shouldIncrement) {
          setSessionItemSafely(sessionKey, "1")
        }
        setCounts({ total, daily })
      })
      .catch(() => {
        setCounts({ total: null, daily: null })
      })
  }, [apiBaseUrl, dayKey, enable, key, namespace])

  if (!enable || !namespace || !key) return null

  return (
    <>
      <StyledTitle>
        <Emoji>📊</Emoji> Visitor
      </StyledTitle>
      <StyledWrapper>
        <div className="row">
          <span>Today</span>
          <strong>{counts.daily ?? "-"}</strong>
        </div>
        <div className="row">
          <span>Total</span>
          <strong>{counts.total ?? "-"}</strong>
        </div>
      </StyledWrapper>
    </>
  )
}

export default VisitorCard

const StyledTitle = styled.div`
  padding: 0.25rem;
  margin-bottom: 0.75rem;
`

const StyledWrapper = styled.div`
  margin-bottom: 2.25rem;
  border-radius: 1rem;
  padding: 0.75rem 0.875rem;
  background-color: ${({ theme }) =>
    theme.scheme === "light" ? "white" : theme.colors.gray4};

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.25rem;
    color: ${({ theme }) => theme.colors.gray11};
  }

  .row + .row {
    border-top: 1px solid ${({ theme }) => theme.colors.gray6};
  }

  strong {
    color: ${({ theme }) => theme.colors.gray12};
    font-size: 1rem;
  }
`
