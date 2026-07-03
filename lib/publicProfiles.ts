export type PublicProfileType = "individual" | "salon" | "school" | "maker" | "dealer" | "organization" | "company" | "editor";

export type ProfileLinkKey = "instagram" | "x" | "youtube" | "tiktok" | "website" | "map";

export type ProfileEventItem = {
  title: string;
  meta: string;
  href: string;
};

export type PublicProfile = {
  id: string;
  displayName: string;
  type: PublicProfileType;
  badges: string[];
  verified?: boolean;
  area: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  bio: string;
  specialtyTags?: string[];
  links?: Partial<Record<ProfileLinkKey, string>>;
  isHiring?: boolean;
  jobId?: string;
  recentPostIds?: string[];
  recentArticleIds?: string[];
  eventItems?: ProfileEventItem[];
  detailRows?: { label: string; value: string }[];
  pr?: boolean;
};

export const publicProfiles: PublicProfile[] = [
  {
    id: "fukuoka-barber",
    displayName: "福岡の理容師",
    type: "individual",
    badges: ["個人理容師"],
    verified: true,
    area: "福岡県",
    avatarUrl: "/images/fade-cut.jpg",
    coverImageUrl: "/images/fade-cut.jpg",
    bio: "メンズカット、フェード、顔剃りを中心に、営業中の気づきや技術メモを共有しています。",
    specialtyTags: ["フェード", "メンズカット", "顔剃り", "白髪ぼかし", "一人営業", "集客"],
    links: {
      instagram: "https://example.com",
      x: "https://example.com",
      youtube: "https://example.com",
    },
    recentPostIds: ["fade-voice", "practice-report"],
    recentArticleIds: ["fukuoka-seminar"],
    eventItems: [{ title: "福岡フェード練習会レポート", meta: "講習会参加投稿", href: "/articles/fukuoka-seminar" }],
  },
  {
    id: "barber-sample-fukuoka-nishi",
    displayName: "BARBER SAMPLE 福岡西",
    type: "salon",
    badges: ["サロン"],
    area: "福岡県 福岡市西区",
    avatarUrl: "/images/shop-interior.jpg",
    coverImageUrl: "/images/shop-interior.jpg",
    bio: "地域の男性客に支持されるメンズ特化サロンです。フェード、顔剃り、白髪ぼかしに力を入れています。",
    specialtyTags: ["メンズ特化", "フェード", "顔剃りあり", "白髪ぼかし", "少人数サロン", "教育あり"],
    links: {
      instagram: "https://example.com",
      website: "https://example.com",
      map: "https://example.com",
    },
    isHiring: true,
    jobId: "barber-sample-fukuoka-nishi",
    recentPostIds: ["owner-retention"],
    recentArticleIds: ["freee-api-cost", "google-review-growth"],
    eventItems: [
      { title: "サロン見学受付中", meta: "求人 / 見学", href: "/jobs/barber-sample-fukuoka-nishi/apply?type=tour" },
      { title: "営業後の技術練習を公開予定", meta: "Snap連動", href: "/snap" },
    ],
    detailRows: [
      { label: "営業時間", value: "9:00 - 19:00" },
      { label: "定休日", value: "月曜 / 不定休" },
      { label: "客層", value: "30代から50代の男性客が中心" },
    ],
  },
  {
    id: "barber-hub-editor",
    displayName: "BARBER HUB編集部",
    type: "editor",
    badges: ["編集部"],
    verified: true,
    area: "全国",
    avatarUrl: "/images/shop-interior.jpg",
    coverImageUrl: "/images/shop-interior.jpg",
    bio: "理容師の経験、ニュース、講習会、メーカー情報を集め、営業前に読みやすい形へ編集します。",
    specialtyTags: ["経営", "集客", "AI", "技術", "講習会", "メーカー情報"],
    links: {
      website: "https://example.com",
      instagram: "https://example.com",
    },
    recentPostIds: ["editor-weekly"],
    recentArticleIds: ["rakuten-ai", "cti-pos", "gray-blending-40s-article"],
    eventItems: [{ title: "今週の理容業界まとめ", meta: "編集部更新", href: "/" }],
  },
  {
    id: "anonymous-barber",
    displayName: "匿名理容師",
    type: "individual",
    badges: ["個人理容師"],
    area: "関西",
    bio: "表では言いにくい経営や接客の悩みを、個人が特定されない形で共有しています。",
    specialtyTags: ["経営", "価格改定", "一人営業", "接客"],
    recentPostIds: ["price-change"],
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
    specialtyTags: ["理容学生", "オープンキャンパス", "就職支援", "サロン見学"],
    links: {
      website: "https://example.com",
      instagram: "https://example.com",
    },
    eventItems: [
      { title: "オープンキャンパス案内", meta: "学校イベント", href: "/seminars" },
      { title: "学生向け就職相談", meta: "就職支援", href: "/jobs" },
    ],
    detailRows: [
      { label: "所在地", value: "東京都" },
      { label: "案内", value: "オープンキャンパス情報を掲載予定" },
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
    specialtyTags: ["バリカン", "トリマー", "道具レビュー", "講習会"],
    links: {
      website: "https://example.com",
      youtube: "https://example.com",
    },
    recentArticleIds: ["silent-clipper"],
    eventItems: [
      { title: "静音バリカン体験会", meta: "メーカー講習", href: "/seminars" },
      { title: "商品情報を見る", meta: "プロ向け商品", href: "/partners" },
    ],
  },
  {
    id: "dealer-west-demo",
    displayName: "WEST BARBER DEALER",
    type: "dealer",
    badges: ["ディーラー"],
    area: "西日本",
    avatarUrl: "/images/tools-stilllife.jpg",
    coverImageUrl: "/images/tools-stilllife.jpg",
    bio: "地域サロン向けに、道具・材料・講習会情報を届けるディーラーアカウントです。",
    specialtyTags: ["材料", "道具", "講習会", "サロン支援"],
    links: {
      website: "https://example.com",
    },
    eventItems: [{ title: "取り扱い商品と講習会情報", meta: "ディーラー情報", href: "/partners" }],
  },
  {
    id: "regional-union-demo",
    displayName: "サンプル理容組合",
    type: "organization",
    badges: ["組合"],
    area: "九州",
    avatarUrl: "/images/shop-interior.jpg",
    coverImageUrl: "/images/shop-interior.jpg",
    bio: "地域講習会や理容業界の支援情報を発信する、組合向けのサンプルプロフィールです。",
    specialtyTags: ["地域支援", "講習会", "共済案内", "若手支援"],
    links: {
      website: "https://example.com",
    },
    eventItems: [
      { title: "地域講習会のお知らせ", meta: "組合イベント", href: "/seminars" },
      { title: "若手理容師支援", meta: "支援情報", href: "/jobs" },
    ],
  },
];

export function findPublicProfile(id: string | undefined) {
  if (id == null) return undefined;
  return publicProfiles.find((profile) => profile.id === id);
}

export function profileHref(id: string | undefined) {
  return `/profiles/${id ?? "barber-hub-editor"}`;
}

export function profileName(id: string | undefined, fallback = "BARBER HUB") {
  return findPublicProfile(id)?.displayName ?? fallback;
}
