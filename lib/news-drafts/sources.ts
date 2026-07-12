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
    sourceName: "経済産業省 ニュースリリース",
    feedUrl: "https://www.meti.go.jp/ml_index_release_atom.xml",
    sourceType: "official_atom",
    categoryHint: "店舗経営・制度",
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
