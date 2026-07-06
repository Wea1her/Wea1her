export type SocialLinkId =
  | "mail"
  | "github"
  | "x"
  | "bilibili"
  | "telegram"
  | "instagram";

export interface SocialLinkItem {
  id: SocialLinkId;
  icon: string;
  name: string;
  href: string;
  handle?: string;
  enabled: boolean;
}
