export type NewsDiversityGroup =
  | "health_labor"
  | "business_money"
  | "digital_security"
  | "product_safety"
  | "industry_media"
  | "fashion_beauty"
  | "music_entertainment"
  | "sports_talk";

export type NewsContentPillar = "work" | "style" | "talk";
export type NewsRelevanceDirection = "direct" | "proposal" | "conversation";

export type NewsQualityItem = {
  sourceTitle: string;
  sourceExcerpt?: string | null;
  sourceName?: string | null;
  sourceGroup?: NewsDiversityGroup;
  sourcePublishedAt?: string | null;
  contentPillar?: NewsContentPillar;
  topicHint?: string | null;
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
  { pattern: /(不倫|離婚|熱愛|交際|破局|匂わせ|炎上|暴露|謝罪|文春|スキャンダル|私生活|家族問題)/, reason: "芸能ゴシップ・私生活消費につながる話題" },
  { pattern: /(逮捕|書類送検|疑惑|容疑).{0,24}(か|可能性|報道|SNS|関係者)/, reason: "未確認情報や事件憶測につながりやすい話題" },
  { pattern: /(容姿|激太り|劣化|老けた|顔面|体形|体型いじり|すっぴん).{0,24}(話題|反響|炎上)/, reason: "容姿や年齢への揶揄につながる話題" },
  { pattern: /(セール|クーポン|割引|値下げ|在庫処分|福袋|ポイント還元|送料無料|タイムセール)/, reason: "セール・価格訴求だけの記事" },
  { pattern: /(ランキング|売れ筋).{0,20}(だけ|発表|一覧)/, reason: "商品価格やランキングだけで理容師への価値が弱い記事" },
];

const MEDICAL_CLAIM_PATTERNS = [
  /(発毛|育毛|薄毛|AGA|脱毛症|シミ|しわ|ニキビ|アトピー|皮膚疾患).{0,32}(治る|改善|解消|効果|再生|若返り|必ず|絶対)/,
  /(医薬品|治療薬|クリニック|施術).{0,32}(効果|治療|改善|保証|実証)/,
];

const SPORTS_MINOR_RESULT_PATTERN = /(初戦|予選|リーグ戦|練習試合|オープン戦|白星|黒星|勝利|敗れる|連勝|連敗|試合結果|第\d+戦|[0-9０-９]+勝[0-9０-９]+敗)/;
const SPORTS_MAJOR_PATTERN = /(日本代表|侍ジャパン|SAMURAI BLUE|ワールドカップ|W杯|五輪|オリンピック|世界選手権|国際大会|決勝|準決勝|優勝|大谷|八村|久保|三笘|大坂|日本人選手)/i;
const JAPANESE_TEXT_PATTERN = /[ぁ-んァ-ン一-龯]/;
const TOO_OLD_DAYS = 14;

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
  const compactTitle = normalizeNewsTitle(item.sourceTitle);

  if (compactTitle.length < 8) return "タイトルが短すぎて内容を判断しにくい";
  if (!JAPANESE_TEXT_PATTERN.test(text)) return "日本語記事として扱いにくい候補";

  const oldReason = oldArticleRejectReason(item.sourcePublishedAt);
  if (oldReason) return oldReason;

  const patternReason = LOW_VALUE_PATTERNS.find((entry) => entry.pattern.test(text))?.reason;
  if (patternReason) return patternReason;

  if (MEDICAL_CLAIM_PATTERNS.some((pattern) => pattern.test(text))) {
    return "医療・美容効果を断定する可能性がある候補";
  }

  if (item.sourceGroup === "sports_talk" && SPORTS_MINOR_RESULT_PATTERN.test(text) && !SPORTS_MAJOR_PATTERN.test(text)) {
    return "スポーツ速報・細かな試合結果に寄りすぎる候補";
  }

  return null;
}

export function oldArticleRejectReason(value: string | null | undefined, now = new Date()) {
  if (!value) return null;
  const publishedAt = new Date(value);
  if (Number.isNaN(publishedAt.getTime())) return null;
  const ageMs = now.getTime() - publishedAt.getTime();
  if (ageMs < 0) return null;
  return ageMs > TOO_OLD_DAYS * 24 * 60 * 60 * 1000 ? "公開から時間が経ちすぎている候補" : null;
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
