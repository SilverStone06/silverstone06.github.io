export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotionError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NOTION_ERROR', context)
    this.name = 'NotionError'
  }
}

export class ImageDownloadError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'IMAGE_DOWNLOAD_ERROR', context)
    this.name = 'ImageDownloadError'
  }
}

export function isError(error: unknown): error is Error {
  return error instanceof Error
}

export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error occurred'
}

export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const message = getErrorMessage(error)
  const errorDetails = {
    context,
    message,
    ...additionalInfo,
    ...(isError(error) && error.stack ? { stack: error.stack } : {}),
  }
  
  console.error(`[ERROR] ${context}:`, message)
  if (additionalInfo) {
    Object.entries(additionalInfo).forEach(([key, value]) => {
      console.error(`  ${key}:`, value)
    })
  }
  
  if (isError(error) && error.stack && isDevelopment()) {
    console.error('Stack trace:', error.stack)
  }
}

function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

