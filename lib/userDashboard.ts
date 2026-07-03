export type CurrentUser = {
  id: string;
  profileId: string;
  role: "individual" | "salon" | "student" | "maker";
  thanksPoints: number;
  pointsToNextReward: number;
  savedArticleIds: string[];
  savedPostIds: string[];
  savedJobIds: string[];
  followedProfileIds: string[];
};

export type DashboardItem = {
  id: string;
  title: string;
  meta: string;
  href: string;
};

export type ReactionSummary = {
  contentId: string;
  title: string;
  likes: number;
  thanks: number;
  saves: number;
  comments: number;
};

export const currentUser: CurrentUser = {
  id: "current-user",
  profileId: "barber-sample-fukuoka-nishi",
  role: "salon",
  thanksPoints: 320,
  pointsToNextReward: 180,
  savedArticleIds: ["rakuten-ai", "gray-blending-40s-article"],
  savedPostIds: ["fade-voice", "owner-retention"],
  savedJobIds: ["barber-sample-fukuoka-nishi", "classic-barber-shibuya"],
  followedProfileIds: ["barber-sample-fukuoka-nishi", "fukuoka-barber", "barber-school-demo", "maker-tools-demo", "regional-union-demo"],
};

export const savedArticles: DashboardItem[] = [
  { id: "rakuten-ai", title: "AIで楽天ビューティー閲覧数1位になった話", meta: "AI活用 / あとで読む", href: "/articles/rakuten-ai" },
  { id: "gray-blending-40s-article", title: "40代提案は“若返り”より“清潔感”", meta: "技術 / 提案メモ", href: "/articles/gray-blending-40s-article" },
];

export const savedSnaps: DashboardItem[] = [
  { id: "fade-voice", title: "仕上げ前の一言で、次回予約が変わる", meta: "Snap / 接客", href: "/posts/fade-voice" },
  { id: "owner-retention", title: "次回予約の声かけを施術中に変えた", meta: "Snap / 経営", href: "/posts/owner-retention" },
];

export const savedJobs: DashboardItem[] = [
  { id: "barber-sample-fukuoka-nishi", title: "BARBER SAMPLE 福岡西", meta: "見学候補 / 福岡県", href: "/jobs/barber-sample-fukuoka-nishi" },
  { id: "classic-barber-shibuya", title: "CLASSIC BARBER 渋谷", meta: "求人保存 / 東京都", href: "/jobs/classic-barber-shibuya" },
];

export const privateMemos = [
  "明日試したい声かけ",
  "気になるバリカン",
  "見学候補のサロン",
  "あとで読む技術記事",
];

export const reactionSummaries: ReactionSummary[] = [
  {
    contentId: "fade-voice",
    title: "仕上げ前の一言で、次回予約が変わる",
    likes: 42,
    thanks: 8,
    saves: 12,
    comments: 5,
  },
  {
    contentId: "silent-clipper-note",
    title: "静音バリカンを朝イチ施術で試す",
    likes: 31,
    thanks: 4,
    saves: 9,
    comments: 3,
  },
];

export const jobApplications = [
  {
    id: "application-001",
    salonName: "BARBER SAMPLE 福岡西",
    type: "見学申し込み",
    status: "受付済み",
  },
  {
    id: "application-002",
    salonName: "BARBER SAMPLE 天神",
    type: "面接申し込み",
    status: "送信済み",
  },
];

export const salonJobAdminItems = [
  "掲載中の求人",
  "応募者確認",
  "求人内容を編集",
  "注目掲載へアップグレード",
];

// Future policy note:
// Public profiles show trust-building information only.
// Private dashboard data such as saved items, memos, points, and reaction numbers
// should be tied to userId/contentId in a database when authentication is added.
