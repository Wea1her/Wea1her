import type { SocialLinkId, SocialLinkItem } from "../types/social";

export const socialLinks: readonly SocialLinkItem[] = [
  {
    id: "mail",
    icon: "mail",
    name: "Mail",
    href: "",
    handle: "",
    enabled: false,
  },
  {
    id: "github",
    icon: "github",
    name: "GitHub",
    href: "https://github.com/Wea1her",
    handle: "Wea1her",
    enabled: true,
  },
  {
    id: "x",
    icon: "x",
    name: "X",
    href: "https://x.com/jaycupup",
    handle: "jaycupup",
    enabled: true,
  },
  {
    id: "telegram",
    icon: "telegram",
    name: "Telegram",
    href: "https://t.me/weathercosmos",
    handle: "weathercosmos",
    enabled: true,
  },
] satisfies readonly SocialLinkItem[];

export const socialDisplay = {
  home: ["github", "telegram", "x"],
  about: ["github", "telegram", "x"],
} as const satisfies Record<string, readonly SocialLinkId[]>;
