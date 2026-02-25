import styled from "@emotion/styled"
import React, { useEffect, useMemo, useState } from "react"
import { Emoji } from "src/components/Emoji"
import { CONFIG } from "site.config"

type VisitorCounts = {
  daily: number | null
  total: number | null
}

function formatDateInTimeZone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date())
}

async function fetchCount(action: "hit" | "get", namespace: string, key: string) {
  const url = `https://api.countapi.xyz/${action}/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Count API request failed: ${response.status}`)
  }
  const data = await response.json()
  return typeof data?.value === "number" ? data.value : null
}

const VisitorCard: React.FC = () => {
  const visitorCounter = (CONFIG as any).visitorCounter ?? {}
  const enable = Boolean(visitorCounter.enable)
  const namespace = String(visitorCounter.namespace ?? "").trim()
  const key = String(visitorCounter.key ?? "").trim()
  const timeZone = String(visitorCounter.timezone ?? "Asia/Seoul")
  const [counts, setCounts] = useState<VisitorCounts>({ daily: null, total: null })

  const dayKey = useMemo(() => {
    const dateKey = formatDateInTimeZone(timeZone)
    return `${key}-${dateKey}`
  }, [key, timeZone])

  useEffect(() => {
    if (!enable || !namespace || !key) return

    const sessionKey = `visitor-counted:${namespace}:${dayKey}`
    const shouldIncrement = !sessionStorage.getItem(sessionKey)
    const action: "hit" | "get" = shouldIncrement ? "hit" : "get"

    Promise.all([
      fetchCount(action, namespace, key),
      fetchCount(action, namespace, dayKey),
    ])
      .then(([total, daily]) => {
        if (shouldIncrement) {
          sessionStorage.setItem(sessionKey, "1")
        }
        setCounts({ total, daily })
      })
      .catch(() => {
        setCounts({ total: null, daily: null })
      })
  }, [dayKey, enable, key, namespace])

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
