export const site = {
  profile: {
    name: "Ghaith",
    avatarSrc: "/avatar.png",
    bio: "Stay hungry, stay foolish, be water.",
    intro:
      "天津研究生在读，一枚热爱编程、音乐、读书的 Vibe Coder，希望能成为更好的自己。",
    signatureSvg: `<svg width="320" height="112" viewBox="0 0 320 112" xmlns="http://www.w3.org/2000/svg">
<text x="16" y="78" fill="black" font-family="'Brush Script MT', 'Segoe Script', cursive" font-size="72" font-weight="500" letter-spacing="1">Ghaith</text>
</svg>`,
  },
  site: {
    name: "Ghaith",
    url: "https://www.0xweather.com",
    description: "Stay hungry, stay foolish, be water.",
    iconSrc: "/avatar.png",
    startYear: 2025,
    beian: {
      icp: {
        text: "",
        href: "",
      },
      moe: {
        text: "",
        href: "",
      },
    },
    codeRainKeywords: [
      "Ghaith",
      "Web3",
      "DApp",
      "Reading",
      "Music",
      "Vibe Coding",
      "Astro",
      "TypeScript",
      "Markdown",
    ],
    nav: [
      {
        label: "About",
        href: "/about/",
      },
      {
        label: "Blog",
        href: "/blog/",
      },
      {
        label: "Project",
        href: "/project/",
      },
      {
        label: "Links",
        href: "/links/",
      },
    ],
  },
  articleActions: {
    license: {
      name: "CC BY-NC-SA 4.0 - 非商业性使用 - 相同方式共享 4.0 国际",
      href: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      statement:
        "商业转载请联系站长获得授权，非商业转载请注明本文出处及文章链接，您可以自由地在任何媒体以任何形式复制和分发作品，也可以修改和创作，但是分发衍生作品时必须采用相同的许可协议。",
    },
    reward: {
      wechatQrSrc: "",
      alipayQrSrc: "",
    },
  },
} as const;

export type SiteConfig = typeof site;
