export type ArticleTopicSlug = "management" | "marketing" | "ai" | "technique" | "tools";

export const ARTICLE_CATEGORIES = [
  "経営",
  "技術",
  "集客",
  "AI活用",
  "AI",
  "独立",
  "道具",
  "メーカー新商品",
  "店販",
  "開業準備",
  "求人",
  "講習会",
  "講習会レポート",
  "コンクールレポート",
  "経験記事",
] as const;

export const ARTICLE_TOPIC_CATEGORY_MAP: Record<ArticleTopicSlug, string[]> = {
  management: ["経営", "独立", "求人", "経験記事"],
  marketing: ["集客"],
  ai: ["AI活用", "AI"],
  technique: ["技術", "講習会", "講習会レポート", "コンクールレポート"],
  tools: ["道具", "メーカー新商品", "店販", "開業準備"],
};

export const ARTICLE_TOPIC_NAV: Array<{ slug: ArticleTopicSlug; label: string; href: string }> = [
  { slug: "management", label: "経営", href: "/topics/management" },
  { slug: "marketing", label: "集客", href: "/topics/marketing" },
  { slug: "ai", label: "AI", href: "/topics/ai" },
  { slug: "technique", label: "技術", href: "/topics/technique" },
  { slug: "tools", label: "道具", href: "/topics/tools" },
];

export const ARTICLE_RELATED_FALLBACK_TOPICS: Record<ArticleTopicSlug, ArticleTopicSlug[]> = {
  management: ["marketing", "ai"],
  marketing: ["management", "ai"],
  ai: ["management", "marketing"],
  technique: ["tools"],
  tools: ["technique", "management"],
};

const EDITOR_PICK_TAGS: Record<string, string> = {
  経営: "BUSINESS",
  技術: "TECHNIQUE",
  集客: "MARKETING",
  AI活用: "AI",
  AI: "AI",
  独立: "BUSINESS",
  道具: "TOOLS",
  求人: "RECRUIT",
  講習会: "SEMINAR",
  講習会レポート: "SEMINAR",
  コンクールレポート: "CONTEST",
  経験記事: "FEATURE",
};

const IMAGE_VARIANTS: Record<string, string> = {
  技術: "haircut",
  道具: "tool",
  メーカー新商品: "tool",
  店販: "tool",
  講習会: "seminar",
  講習会レポート: "seminar",
  コンクールレポート: "haircut",
  求人: "student",
  AI活用: "tool",
  AI: "tool",
};

export function isArticleCategory(value: string) {
  return ARTICLE_CATEGORIES.includes(value as (typeof ARTICLE_CATEGORIES)[number]);
}

export function isPaidEligibleArticleCategory(category: string | null | undefined) {
  return category === "経験記事" || category === "講習会レポート";
}

export function defaultArticleCategory(categoryParam: string | undefined, typeParam: string | undefined) {
  const value = categoryParam ?? typeParam;
  if (value === "seminar_report") return "講習会レポート";
  if (value === "competition_report") return "コンクールレポート";
  if (value && isArticleCategory(value)) return value;
  return "経営";
}

export function topicCategoriesForArticle(slug: string) {
  return ARTICLE_TOPIC_CATEGORY_MAP[slug as ArticleTopicSlug] ?? [];
}

export function isArticleTopicSlug(value: string): value is ArticleTopicSlug {
  return Object.hasOwn(ARTICLE_TOPIC_CATEGORY_MAP, value);
}

export function articleTopicLabel(slug: ArticleTopicSlug | string | null | undefined) {
  return ARTICLE_TOPIC_NAV.find((topic) => topic.slug === slug)?.label ?? "";
}

export function primaryTopicSlugForArticleCategory(category: string | null | undefined) {
  return topicSlugsForArticleCategory(category)[0] ?? null;
}

export function fallbackTopicSlugsForRelatedArticles(slug: ArticleTopicSlug | null | undefined) {
  return slug == null ? [] : ARTICLE_RELATED_FALLBACK_TOPICS[slug] ?? [];
}

export function topicSlugsForArticleCategory(category: string | null | undefined) {
  const value = category?.trim();
  if (!value) return [];

  return Object.entries(ARTICLE_TOPIC_CATEGORY_MAP)
    .filter(([, categories]) => categories.includes(value))
    .map(([slug]) => slug as ArticleTopicSlug);
}

export function editorPickTagForArticleCategory(category: string | null | undefined) {
  return EDITOR_PICK_TAGS[category?.trim() || ""] ?? "FEATURE";
}

export function imageVariantForArticleCategory(category: string | null | undefined) {
  return IMAGE_VARIANTS[category?.trim() || ""] ?? "news";
}

export function supportsArticleYoutubeUrl(category: string | null | undefined) {
  const value = category?.trim();
  return value === "講習会" || value === "講習会レポート" || value === "コンクールレポート";
}
