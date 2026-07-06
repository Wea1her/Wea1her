export interface FriendLinkItem {
  name: string;
  description: string;
  href: string;
  avatarSrc: string;
}

export interface LostLinkItem {
  name: string;
  description: string;
  href: string;
}

export interface LinkApplyOwner {
  name: string;
  description: string;
  href: string;
  avatarSrc: string;
}

export const linkApplyOwner = {
  name: "Ghaith",
  description: "Stay hungry, stay foolish, be water.",
  href: "https://www.0xweather.com/",
  avatarSrc: "https://www.0xweather.com/avatar.png",
} satisfies LinkApplyOwner;

export const friendLinks = [
  {
    name: "Arthals' ink",
    description: "所见高山远木，阔云流风；所幸岁月盈余，了无拘束",
    href: "https://arthals.ink/",
    avatarSrc: "https://cdn.arthals.ink/Arthals.png",
  },
  {
    name: "CWorld Site",
    description: "求知若愚，虚怀若谷",
    href: "https://cworld0.com/",
    avatarSrc:
      "https://cravatar.cn/avatar/1ffe42aa45a6b1444a786b1f32dfa8aa?s=200",
  },
  {
    name: "Khalil Fong",
    description:
      "This website is dedicated to Khalil. Good night, May the world be one.",
    href: "https://www.miss-someone.com/",
    avatarSrc: "https://r2.khalil-fong.com/assets/about/img1.jpg",
  },
] satisfies readonly FriendLinkItem[];

export const lostLinks = [] satisfies readonly LostLinkItem[];
