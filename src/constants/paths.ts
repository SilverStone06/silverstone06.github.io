export const PATHS = {
  POSTS_DIR: 'src/posts',
  PUBLIC_IMAGES_DIR: 'public/images/posts',
  IMAGES_PREFIX: '/images/posts',
} as const

export const ROUTES = {
  HOME: '/',
  POST: (slug: string) => `/${slug}`,
  FEED: '/feed',
} as const

