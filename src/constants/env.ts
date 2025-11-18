export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  notionToken: process.env.NOTION_TOKEN,
} as const

export function getNotionToken(): string | undefined {
  return ENV.notionToken
}

export function isDevelopment(): boolean {
  return ENV.isDevelopment
}

export function isProduction(): boolean {
  return ENV.isProduction
}

