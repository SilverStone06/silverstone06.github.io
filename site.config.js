const CONFIG = {
  // profile setting (required)
  profile: {
    name: "SongSuk",
    image: "/avatar.svg", // If you want to create your own notion avatar, check out https://notion-avatar.vercel.app
    role: "Aspiring Cloud/ML Engineer",
    bio: "Building my foundations in Cloud while preparing for Machine Learning.",
    email: "ses0609@gmail.com",
    linkedin: "",
    github: "SilverStone06",
    instagram: "suk_cess__v",
  },
  projects: [
    {
      name: `공사중`,
      href: "https://github.com/SilverStone06",
    },
  ],
  // blog setting (required)
  blog: {
    title: "SongSuk.log",
    description: "Cloud, network, ML and  notes.",
    scheme: "dark", // 'light' | 'dark' | 'system'
  },

  // CONFIG configration (required)
  link: "https://silverstone06.github.io",
  since: 2025, // If leave this empty, current year will be used.
  lang: "en-US", // ['en-US', 'zh-CN', 'zh-HK', 'zh-TW', 'ja-JP', 'es-ES', 'ko-KR']
  ogImageGenerateURL: "https://og-image-korean.vercel.app", // The link to generate OG image, don't end with a slash

  // notion configuration (required)
  notionConfig: {
    pageId: process.env.NOTION_PAGE_ID,
  },

  // plugin configuration (optional)
  googleAnalytics: {
    enable: false,
    config: {
      measurementId: process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID || "",
    },
  },
  googleSearchConsole: {
    enable: false,
    config: {
      siteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    },
  },
  naverSearchAdvisor: {
    enable: false,
    config: {
      siteVerification: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
    },
  },
  utterances: {
    enable: true,
    config: {
      repo: "SilverStone06/silverstone06.github.io",
      "issue-term": "og:title",
      label: "💬 Utterances",
    },
  },
  cusdis: {
    enable: false,
    config: {
      host: "https://cusdis.com",
      appid: "", // Embed Code -> data-app-id value
    },
  },
  visitorCounter: {
    enable: true,
    namespace: "silverstone06-blog",
    key: "visits-total",
    timezone: "Asia/Seoul",
  },
  isProd: process.env.VERCEL_ENV === "production", // distinguish between development and production environment (ref: https://vercel.com/docs/environment-variables#system-environment-variables)
  revalidateTime: 21600 * 7, // revalidate time for [slug], index
}

module.exports = { CONFIG }
