import "server-only";

export type NewsSource = {
  sourceName: string;
  feedUrl: string;
  sourceType: "official_atom" | "official_rss";
  categoryHint: string;
  enabled: boolean;
};

export const NEWS_SOURCES: NewsSource[] = [
  {
    sourceName: "厚生労働省 新着情報",
    feedUrl: "https://www.mhlw.go.jp/stf/news.rdf",
    sourceType: "official_rss",
    categoryHint: "安全・衛生・制度",
    enabled: true,
  },
];

export const DEFAULT_NEWS_DRAFT_MAX_ITEMS = 8;
export const HARD_NEWS_DRAFT_MAX_ITEMS = 20;
export const DEFAULT_RELEVANCE_THRESHOLD = 35;

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
