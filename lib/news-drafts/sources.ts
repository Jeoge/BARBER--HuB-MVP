import "server-only";

export type NewsSource = {
  sourceName: string;
  feedUrl: string;
  sourceType: "official_atom" | "official_rss" | "media_rss";
  categoryHint: string;
  enabled: boolean;
  sourceGroup:
    | "health_labor"
    | "business_money"
    | "digital_security"
    | "product_safety"
    | "industry_media"
    | "fashion_beauty"
    | "music_entertainment"
    | "sports_talk";
  contentPillar: "work" | "style" | "talk";
  topicHint: string;
  relevanceDirection: "direct" | "proposal" | "conversation";
  allowedSourceHosts: string[];
  usageNote: string;
  priority: number;
  maxCandidatesPerRun: number;
};

export const NEWS_SOURCES: NewsSource[] = [
  {
    sourceName: "厚生労働省 新着情報",
    feedUrl: "https://www.mhlw.go.jp/stf/news.rdf",
    sourceType: "official_rss",
    categoryHint: "安全・衛生・制度",
    enabled: true,
    sourceGroup: "health_labor",
    contentPillar: "work",
    topicHint: "policy_safety",
    relevanceDirection: "direct",
    allowedSourceHosts: ["mhlw.go.jp", "www.mhlw.go.jp"],
    usageNote: "公式RSS。労務、衛生、制度など理容店運営に関係するものだけを候補化する。",
    priority: 90,
    maxCandidatesPerRun: 2,
  },
  {
    sourceName: "IPA 重要なセキュリティ情報",
    feedUrl: "https://www.ipa.go.jp/security/alert-rss.rdf",
    sourceType: "official_rss",
    categoryHint: "AI・デジタル・セキュリティ",
    enabled: true,
    sourceGroup: "digital_security",
    contentPillar: "work",
    topicHint: "digital_security",
    relevanceDirection: "direct",
    allowedSourceHosts: ["ipa.go.jp", "www.ipa.go.jp"],
    usageNote: "公式RSS。予約台帳、顧客情報、店舗端末の安全管理に関係する注意喚起を優先する。",
    priority: 95,
    maxCandidatesPerRun: 2,
  },
  {
    sourceName: "金融庁 新着情報",
    feedUrl: "https://www.fsa.go.jp/fsaNewsListAll_rss2.xml",
    sourceType: "official_rss",
    categoryHint: "経営・お金・制度",
    enabled: true,
    sourceGroup: "business_money",
    contentPillar: "work",
    topicHint: "business_money",
    relevanceDirection: "direct",
    allowedSourceHosts: ["fsa.go.jp", "www.fsa.go.jp"],
    usageNote: "公式RSS。小規模店舗の金融、詐欺、決済、資金繰りに関係するものだけを候補化する。",
    priority: 65,
    maxCandidatesPerRun: 2,
  },
  {
    sourceName: "総務省 新着情報",
    feedUrl: "https://www.soumu.go.jp/news.rdf",
    sourceType: "official_rss",
    categoryHint: "デジタル・通信・制度",
    enabled: true,
    sourceGroup: "digital_security",
    contentPillar: "work",
    topicHint: "digital_security",
    relevanceDirection: "direct",
    allowedSourceHosts: ["soumu.go.jp", "www.soumu.go.jp"],
    usageNote: "公式RSS。通信、デジタル、災害・消防など店舗運営と接点があるものだけを候補化する。",
    priority: 55,
    maxCandidatesPerRun: 1,
  },
  {
    sourceName: "FASHIONSNAP",
    feedUrl: "https://www.fashionsnap.com/rss.xml",
    sourceType: "media_rss",
    categoryHint: "メンズファッション・身だしなみ",
    enabled: true,
    sourceGroup: "fashion_beauty",
    contentPillar: "style",
    topicHint: "mens_fashion",
    relevanceDirection: "proposal",
    allowedSourceHosts: ["fashionsnap.com", "www.fashionsnap.com"],
    usageNote: "大手ファッション媒体のRSS。メンズ、香水、スニーカー、身だしなみなど提案・会話に使える話題に限定する。",
    priority: 82,
    maxCandidatesPerRun: 1,
  },
  {
    sourceName: "WWDJAPAN",
    feedUrl: "https://www.wwdjapan.com/feed",
    sourceType: "media_rss",
    categoryHint: "ファッション・ビューティ業界",
    enabled: true,
    sourceGroup: "fashion_beauty",
    contentPillar: "style",
    topicHint: "fashion_beauty",
    relevanceDirection: "proposal",
    allowedSourceHosts: ["wwdjapan.com", "www.wwdjapan.com"],
    usageNote: "ファッション・ビューティ業界媒体のRSS。男性客への提案、店販、ヘア・美容トレンドに関係するものに限定する。",
    priority: 76,
    maxCandidatesPerRun: 1,
  },
  {
    sourceName: "音楽ナタリー 最新ニュース",
    feedUrl: "https://natalie.mu/music/feed/news",
    sourceType: "media_rss",
    categoryHint: "音楽・店内BGM・会話ネタ",
    enabled: true,
    sourceGroup: "music_entertainment",
    contentPillar: "talk",
    topicHint: "music_bgm",
    relevanceDirection: "conversation",
    allowedSourceHosts: ["natalie.mu"],
    usageNote: "音楽ニュース媒体のRSS。広く会話に使える作品・イベント・アーティスト情報に限定し、歌詞や音源は扱わない。",
    priority: 68,
    maxCandidatesPerRun: 1,
  },
  {
    sourceName: "映画ナタリー 最新ニュース",
    feedUrl: "https://natalie.mu/eiga/feed/news",
    sourceType: "media_rss",
    categoryHint: "映画・ドラマ・エンタメ",
    enabled: true,
    sourceGroup: "music_entertainment",
    contentPillar: "talk",
    topicHint: "entertainment",
    relevanceDirection: "conversation",
    allowedSourceHosts: ["natalie.mu"],
    usageNote: "映画・ドラマニュース媒体のRSS。作品、イベント、公式発表中心に限定し、ゴシップや私生活消費は除外する。",
    priority: 62,
    maxCandidatesPerRun: 1,
  },
  {
    sourceName: "NHKニュース スポーツ",
    feedUrl: "https://www3.nhk.or.jp/rss/news/cat7.xml",
    sourceType: "official_rss",
    categoryHint: "スポーツ・会話ネタ",
    enabled: true,
    sourceGroup: "sports_talk",
    contentPillar: "talk",
    topicHint: "sports",
    relevanceDirection: "conversation",
    allowedSourceHosts: ["nhk.or.jp", "www3.nhk.or.jp"],
    usageNote: "公共放送のスポーツRSS。主要大会、日本代表、日本人選手の大きな話題だけを候補化し、速報の網羅はしない。",
    priority: 70,
    maxCandidatesPerRun: 1,
  },
];

export const DEFAULT_NEWS_DRAFT_MAX_ITEMS = 6;
export const HARD_NEWS_DRAFT_MAX_ITEMS = 6;
export const DEFAULT_RELEVANCE_THRESHOLD = 55;

export function newsDraftMaxItems() {
  const value = Number.parseInt(process.env.NEWS_DRAFT_MAX_ITEMS ?? "", 10);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_NEWS_DRAFT_MAX_ITEMS;
  return Math.min(value, HARD_NEWS_DRAFT_MAX_ITEMS);
}

export function newsRelevanceThreshold() {
  const value = Number.parseInt(process.env.NEWS_RELEVANCE_THRESHOLD ?? "", 10);
  if (!Number.isFinite(value)) return DEFAULT_RELEVANCE_THRESHOLD;
  return Math.max(0, Math.min(value, 100));
}
