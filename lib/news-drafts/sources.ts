import "server-only";

export type NewsSource = {
  sourceName: string;
  feedUrl: string;
  sourceType: "official_atom" | "official_rss";
  categoryHint: string;
  enabled: boolean;
  sourceGroup: "health_labor" | "business_money" | "digital_security" | "product_safety";
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
    priority: 55,
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
