export type SponsorPlacement = "home" | "article" | "jobs";

export type SponsorItem = {
  id: string;
  type: "sponsored" | "partner" | "pr";
  label: "Sponsored" | "PR" | "協賛" | "Partner" | "提供";
  title: string;
  description: string;
  sponsorName: string;
  imageUrl?: string;
  href: string;
  external?: boolean;
  placement: SponsorPlacement[];
  category: "tools" | "seminar" | "career" | "school" | "regional";
};

export const sponsorItems: SponsorItem[] = [
  {
    id: "sponsor-clipper-001",
    type: "sponsored",
    label: "Sponsored",
    title: "静音バリカン特集",
    description: "朝イチ施術にも使いやすい道具を、編集部目線で整理。",
    sponsorName: "PRO CLIPPER LAB",
    imageUrl: "/images/tools-stilllife.jpg",
    href: "/articles/silent-clipper",
    placement: ["home", "article"],
    category: "tools",
  },
  {
    id: "sponsor-fade-seminar",
    type: "partner",
    label: "協賛",
    title: "フェード講習会のお知らせ",
    description: "地域で学べる技術講習を、後から見返せる形で紹介。",
    sponsorName: "サンプル講習会パートナー",
    imageUrl: "/images/fade-cut.jpg",
    href: "/seminars",
    placement: ["home", "article"],
    category: "seminar",
  },
  {
    id: "career-school-001",
    type: "partner",
    label: "協賛",
    title: "理容学生向けオープンキャンパス",
    description: "学校選び・就職前に知っておきたい情報。",
    sponsorName: "サンプル理容学校",
    imageUrl: "/images/shop-interior.jpg",
    href: "/jobs",
    placement: ["home", "jobs"],
    category: "school",
  },
  {
    id: "career-regional-001",
    type: "pr",
    label: "PR",
    title: "地域サロン見学会",
    description: "若手理容師と学生が、地域のサロンを見つけるための協賛企画。",
    sponsorName: "地域求人パートナー",
    imageUrl: "/images/shop-interior.jpg",
    href: "/jobs/register",
    placement: ["jobs"],
    category: "career",
  },
];

export function sponsorsForPlacement(placement: SponsorPlacement) {
  return sponsorItems.filter((item) => item.placement.includes(placement));
}

// Advertising policy:
// BARBER HUB uses sponsorship as a revenue source without damaging the reading experience.
// Every paid or provided placement must be labeled as PR, Sponsored, 協賛, Partner, or 提供.
// Prioritize ads that are useful to barbers and connected to tools, education, hiring, or regional industry support.
// Avoid loud banner ads, misleading placements, and anything that harms editorial trust.
