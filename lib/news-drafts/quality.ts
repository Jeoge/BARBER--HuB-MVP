export type NewsDiversityGroup = "health_labor" | "business_money" | "digital_security" | "product_safety";

export type NewsQualityItem = {
  sourceTitle: string;
  sourceExcerpt?: string | null;
  sourceName?: string | null;
  sourceGroup?: NewsDiversityGroup;
};

export type SimilarNewsRecord = {
  id: string;
  source_title?: string | null;
  draft_title?: string | null;
  duplicate_key?: string | null;
  source_name?: string | null;
};

const LOW_VALUE_PATTERNS = [
  { pattern: /(入札|調達|落札|公募型プロポーザル|企画競争)/, reason: "入札・調達など官公庁内部向けの告知" },
  { pattern: /(人事異動|幹部名簿|任命|採用試験|職員募集)/, reason: "人事・採用など一般閲覧者への実用性が低い告知" },
  { pattern: /(審議会|研究会|委員会).{0,18}(開催|資料|議事録|配付資料)/, reason: "会議開催・資料公開だけの行政告知" },
  { pattern: /(統計表|月例報告|年報).{0,18}(掲載|公表)/, reason: "統計掲載のみで現場の行動につながりにくい告知" },
  { pattern: /(意見募集|パブリックコメント).{0,24}(結果|実施)/, reason: "理容師との接点が弱い手続き告知" },
  { pattern: /(都道府県|市町村|自治体).{0,24}(募集|開催)/, reason: "地域限定の小さな募集・開催告知" },
];

const STOP_WORDS = [
  "について",
  "お知らせ",
  "に関する",
  "関する",
  "公表",
  "掲載",
  "開催",
  "募集",
  "実施",
  "結果",
  "資料",
  "令和",
  "年度",
  "第",
  "報道発表",
  "新着情報",
  "します",
  "しました",
  "する",
  "を",
  "の",
];

export function normalizeNewsTitle(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[「」『』【】（）()\[\]。、，,.!！?？:：;；"'“”‘’\s]/g, "")
    .trim();
}

export function newsDuplicateKey(title: string) {
  return STOP_WORDS.reduce((value, word) => value.replaceAll(word, ""), normalizeNewsTitle(title)).slice(0, 120);
}

export function lowValueRejectReason(item: NewsQualityItem) {
  const text = `${item.sourceTitle} ${item.sourceExcerpt ?? ""}`.normalize("NFKC");
  return LOW_VALUE_PATTERNS.find((entry) => entry.pattern.test(text))?.reason ?? null;
}

function significantTerms(value: string) {
  const normalized = normalizeNewsTitle(value);
  const terms = new Set<string>();

  for (const token of normalized.match(/[a-z0-9]{3,}|[一-龯ぁ-んァ-ンー]{2,}/g) ?? []) {
    if (STOP_WORDS.some((word) => token.includes(word))) continue;
    if (token.length < 2) continue;
    terms.add(token);
  }

  return terms;
}

export function titleSimilarityScore(a: string, b: string) {
  const aTerms = significantTerms(a);
  const bTerms = significantTerms(b);
  if (aTerms.size === 0 || bTerms.size === 0) return 0;

  let shared = 0;
  for (const term of aTerms) {
    if (bTerms.has(term)) shared += 1;
  }

  const smaller = Math.min(aTerms.size, bTerms.size);
  const union = new Set([...aTerms, ...bTerms]).size;
  return Math.max(shared / smaller, shared / union);
}

export function findSimilarRecentNews(item: NewsQualityItem, recentNews: SimilarNewsRecord[]) {
  const key = newsDuplicateKey(item.sourceTitle);

  for (const recent of recentNews) {
    if (key && recent.duplicate_key === key) return recent;

    const titles = [recent.source_title, recent.draft_title].filter((value): value is string => Boolean(value));
    if (key && titles.some((title) => newsDuplicateKey(title) === key)) return recent;
    if (titles.some((title) => titleSimilarityScore(item.sourceTitle, title) >= 0.72)) return recent;
  }

  return null;
}

export function isPublishedWithinHours(value: string | null | undefined, now: Date, hours: number) {
  if (!value) return false;
  const publishedAt = new Date(value);
  if (Number.isNaN(publishedAt.getTime())) return false;
  const ageMs = now.getTime() - publishedAt.getTime();
  return ageMs >= 0 && ageMs <= hours * 60 * 60 * 1000;
}
