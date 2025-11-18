import React, { Component, ReactNode } from 'react'
import styled from '@emotion/styled'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <StyledErrorContainer>
          <StyledErrorContent>
            <h1>앗, 문제가 발생했습니다</h1>
            <p>페이지를 불러오는 중 오류가 발생했습니다.</p>
            <StyledButton onClick={() => window.location.reload()}>
              새로고침
            </StyledButton>
          </StyledErrorContent>
        </StyledErrorContainer>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

const StyledErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
`

const StyledErrorContent = styled.div`
  text-align: center;
  max-width: 500px;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.gray12};
  }

  p {
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.gray11};
    margin-bottom: 2rem;
  }
`

const StyledButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }
`

