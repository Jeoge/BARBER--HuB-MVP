export type ProfileType = "individual" | "salon" | "school" | "maker" | "dealer" | "organization" | "editor";

export type ProfileLinkKey = "instagram" | "x" | "youtube" | "tiktok" | "website" | "map";

export type Profile = {
  id: string;
  displayName: string;
  type: ProfileType;
  badges: string[];
  verified?: boolean;
  area: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  bio: string;
  links?: Partial<Record<ProfileLinkKey, string>>;
  isHiring?: boolean;
  jobId?: string;
  recentPostIds?: string[];
  recentArticleIds?: string[];
  detailRows?: { label: string; value: string }[];
  pr?: boolean;
};

export const profiles: Profile[] = [
  {
    id: "fukuoka-barber",
    displayName: "福岡の理容師",
    type: "individual",
    badges: ["個人理容師", "認証済み"],
    verified: true,
    area: "福岡県",
    avatarUrl: "/images/fade-cut.jpg",
    coverImageUrl: "/images/fade-cut.jpg",
    bio: "メンズカット、フェード、顔剃りを中心に、営業中の気づきや技術メモを共有しています。",
    links: {
      instagram: "https://example.com",
      x: "https://example.com",
      youtube: "https://example.com",
    },
    recentPostIds: ["fade-voice", "practice-report"],
    recentArticleIds: ["fukuoka-seminar"],
  },
  {
    id: "barber-sample-fukuoka-nishi",
    displayName: "BARBER SAMPLE 福岡西",
    type: "salon",
    badges: ["サロン", "求人中"],
    area: "福岡県 福岡市西区",
    avatarUrl: "/images/shop-interior.jpg",
    coverImageUrl: "/images/shop-interior.jpg",
    bio: "地域の男性客に支持されるメンズ特化サロンです。フェード、顔剃り、白髪ぼかしに力を入れています。",
    links: {
      instagram: "https://example.com",
      website: "https://example.com",
      map: "https://example.com",
    },
    isHiring: true,
    jobId: "barber-sample-fukuoka-nishi",
    recentPostIds: ["owner-retention"],
    recentArticleIds: ["freee-api-cost", "google-review-growth"],
    detailRows: [
      { label: "営業時間", value: "9:00 - 19:00" },
      { label: "定休日", value: "月曜 / 不定休" },
      { label: "得意技術", value: "フェード / 顔剃り / 白髪ぼかし" },
    ],
  },
  {
    id: "barber-hub-editor",
    displayName: "BARBER HUB編集部",
    type: "editor",
    badges: ["編集部", "認証済み"],
    verified: true,
    area: "全国",
    avatarUrl: "/images/shop-interior.jpg",
    coverImageUrl: "/images/shop-interior.jpg",
    bio: "理容師の経験、ニュース、講習会、メーカー情報を集め、営業前に読みやすい形へ編集します。",
    links: {
      website: "https://example.com",
      instagram: "https://example.com",
    },
    recentPostIds: ["editor-weekly"],
    recentArticleIds: ["rakuten-ai", "cti-pos", "gray-blending-40s-article"],
  },
  {
    id: "anonymous-barber",
    displayName: "匿名理容師",
    type: "individual",
    badges: ["個人理容師"],
    area: "関西",
    bio: "表では言いにくい経営や接客の悩みを、個人が特定されない形で共有しています。",
    recentPostIds: ["price-change"],
    recentArticleIds: [],
  },
  {
    id: "barber-school-demo",
    displayName: "BARBER ACADEMY SAMPLE",
    type: "school",
    badges: ["理容学校"],
    area: "東京都",
    avatarUrl: "/images/shop-interior.jpg",
    coverImageUrl: "/images/shop-interior.jpg",
    bio: "理容学生の学びとサロン見学をつなぐ、学校向けの情報発信アカウントです。",
    links: {
      website: "https://example.com",
      instagram: "https://example.com",
    },
    detailRows: [
      { label: "所在地", value: "東京都" },
      { label: "将来枠", value: "オープンキャンパス情報を掲載予定" },
    ],
  },
  {
    id: "maker-tools-demo",
    displayName: "PRO CLIPPER LAB",
    type: "maker",
    badges: ["メーカー", "PR"],
    pr: true,
    area: "全国",
    avatarUrl: "/images/tools-stilllife.jpg",
    coverImageUrl: "/images/tools-stilllife.jpg",
    bio: "プロ向けバリカン、トリマー、シェービング用品の情報を発信します。PR投稿は必ず明記します。",
    links: {
      website: "https://example.com",
      youtube: "https://example.com",
    },
    recentArticleIds: ["silent-clipper"],
  },
];

export function findProfile(id: string | undefined) {
  if (id == null) return undefined;
  return profiles.find((profile) => profile.id === id);
}

export function profileHref(id: string | undefined) {
  return `/profiles/${id ?? "barber-hub-editor"}`;
}

export function profileName(id: string | undefined, fallback = "BARBER HUB") {
  return findProfile(id)?.displayName ?? fallback;
}
