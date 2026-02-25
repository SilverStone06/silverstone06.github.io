import styled from "@emotion/styled"
import React, { useEffect, useMemo, useState } from "react"
import { Emoji } from "src/components/Emoji"
import { CONFIG } from "site.config"

type VisitorCounts = {
  daily: number
  total: number
}

type GoatCounterConfig = {
  enable?: boolean
  code?: string
  host?: string
  aggregatePath?: string
  timezone?: string
}

declare global {
  interface Window {
    goatcounter?: {
      count?: (options?: { path?: string; title?: string }) => void
    }
  }
}

function formatDateInTimeZone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date())
}

function resolveGoatBaseUrl(config: GoatCounterConfig): string {
  if (config.host) {
    return `https://${config.host.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`
  }
  if (config.code) {
    return `https://${config.code}.goatcounter.com`
  }
  return ""
}

function getLocalStorageNumber(key: string): number {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return 0
    const parsed = Number(raw)
    return Number.isNaN(parsed) ? 0 : parsed
  } catch {
    return 0
  }
}

function setLocalStorageNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Ignore storage failures.
  }
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
    // Ignore storage failures.
  }
}

async function fetchGoatCounterCount(
  baseUrl: string,
  path: string,
  start?: string
): Promise<number> {
  const encodedPath = encodeURIComponent(path)
  const params = new URLSearchParams()
  if (start) params.set("start", start)
  const query = params.toString()
  const url = `${baseUrl}/counter/${encodedPath}.json${query ? `?${query}` : ""}`

  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`GoatCounter request failed: ${response.status}`)
  }
  const data = await response.json()
  const count = Number(data?.count)
  if (Number.isNaN(count)) {
    throw new Error("GoatCounter response does not include numeric count")
  }
  return count
}

function countAggregatePathWithRetry(path: string, retry: number = 6): void {
  const run = (remaining: number) => {
    if (typeof window === "undefined") return
    const counter = window.goatcounter?.count
    if (typeof counter === "function") {
      counter({ path, title: "Visitors Aggregate" })
      return
    }
    if (remaining <= 0) return
    window.setTimeout(() => run(remaining - 1), 400)
  }
  run(retry)
}

const VisitorCard: React.FC = () => {
  const goat = ((CONFIG as any).goatCounter ?? {}) as GoatCounterConfig
  const enable = Boolean(goat.enable)
  const baseUrl = resolveGoatBaseUrl(goat)
  const aggregatePath = String(goat.aggregatePath ?? "/__visitors__")
  const timeZone = String(goat.timezone ?? "Asia/Seoul")
  const [counts, setCounts] = useState<VisitorCounts>({ daily: 0, total: 0 })

  const dateKey = useMemo(() => formatDateInTimeZone(timeZone), [timeZone])

  useEffect(() => {
    if (!enable || !baseUrl) return

    const sessionKey = `visitor-counted-goat:${dateKey}:${aggregatePath}`
    const localTotalKey = `visitor-goat-total:${aggregatePath}`
    const localDailyKey = `visitor-goat-daily:${dateKey}:${aggregatePath}`
    const shouldIncrement = !getSessionItemSafely(sessionKey)

    const localTotal = getLocalStorageNumber(localTotalKey)
    const localDaily = getLocalStorageNumber(localDailyKey)
    const fallbackTotal = shouldIncrement ? localTotal + 1 : localTotal
    const fallbackDaily = shouldIncrement ? localDaily + 1 : localDaily
    setCounts({ total: fallbackTotal, daily: fallbackDaily })

    if (shouldIncrement) {
      countAggregatePathWithRetry(aggregatePath)
      setSessionItemSafely(sessionKey, "1")
      setLocalStorageNumber(localTotalKey, fallbackTotal)
      setLocalStorageNumber(localDailyKey, fallbackDaily)
    }

    Promise.all([
      fetchGoatCounterCount(baseUrl, aggregatePath),
      fetchGoatCounterCount(baseUrl, aggregatePath, dateKey),
    ])
      .then(([total, daily]) => {
        setLocalStorageNumber(localTotalKey, total)
        setLocalStorageNumber(localDailyKey, daily)
        setCounts({ total, daily })
      })
      .catch((error) => {
        console.warn("[VisitorCard] GoatCounter fetch failed, using local fallback.", error)
        setCounts({ total: fallbackTotal, daily: fallbackDaily })
      })
  }, [aggregatePath, baseUrl, dateKey, enable])

  if (!enable) return null

  return (
    <>
      <StyledTitle>
        <Emoji>📊</Emoji> Visitor
      </StyledTitle>
      <StyledWrapper>
        <div className="row">
          <span>Today</span>
          <strong>{counts.daily}</strong>
        </div>
        <div className="row">
          <span>Total</span>
          <strong>{counts.total}</strong>
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
