import {
  editorPickTagForArticleCategory,
  imageVariantForArticleCategory,
} from "@/lib/articleCategories";
import { articles, posts, qaItems } from "@/lib/mockData";
import { articleAuthorName, type ArticleWithAuthor } from "@/lib/supabase/articles";

export type HomeEditorPickItem = {
  key: string;
  href: string;
  tag: string;
  title: string;
  imageUrl?: string;
  imageVariant?: string;
  profileId?: string;
  authorName: string;
  avatarUrl?: string | null;
};

type FallbackPickSource =
  | { type: "article"; tag: string; item: (typeof articles)[number]; title: string }
  | { type: "post"; tag: string; item: (typeof posts)[number]; title: string }
  | { type: "qa"; tag: string; item: (typeof qaItems)[number]; title: string };

const fallbackPickSources: FallbackPickSource[] = [
  { type: "article", tag: "FEATURE", item: articles[0], title: "仕上げ前の一言で、次回予約が変わる" },
  { type: "post", tag: "SNAP", item: posts[0], title: "今日のフェード投稿" },
  { type: "article", tag: "TOOLS", item: articles.find((article) => article.id === "silent-clipper") ?? articles[0], title: "静音バリカンを朝イチ施術で試す" },
  { type: "qa", tag: "Q&A", item: qaItems[0], title: "フェードのぼかしがつながらない" },
  { type: "article", tag: "SEMINAR", item: articles.find((article) => article.id === "fukuoka-seminar") ?? articles[0], title: "講習会に行けない人の全国レポート" },
];

function hrefForFallbackPick(pick: FallbackPickSource) {
  if (pick.type === "post") return `/posts/${pick.item.id}`;
  if (pick.type === "qa") return `/qa/${pick.item.id}`;
  return `/articles/${pick.item.id}`;
}

function authorForFallbackPick(pick: FallbackPickSource) {
  if ("authorLabel" in pick.item) return pick.item.authorLabel;
  if ("author" in pick.item) return pick.item.author;
  return "BARBER HUB EDIT";
}

function profileIdForFallbackPick(pick: FallbackPickSource) {
  if ("profileId" in pick.item) return pick.item.profileId;
  return "barber-hub-editor";
}

function imageForFallbackPick(pick: FallbackPickSource) {
  if ("imageUrl" in pick.item) return pick.item.imageUrl;
  return undefined;
}

function variantForFallbackPick(pick: FallbackPickSource) {
  return "accent" in pick.item ? pick.item.accent : "haircut";
}

export function rotateEditorPicks<T>(items: T[], offset: number) {
  return items.map((_, index) => items[(index + offset) % items.length]);
}

export function fallbackEditorPickItems() {
  return fallbackPickSources.map((pick) => ({
    key: `fallback-${pick.type}-${pick.item.id}`,
    href: hrefForFallbackPick(pick),
    tag: pick.tag,
    title: pick.title,
    imageUrl: imageForFallbackPick(pick),
    imageVariant: variantForFallbackPick(pick),
    profileId: profileIdForFallbackPick(pick),
    authorName: authorForFallbackPick(pick),
    avatarUrl: null,
  }));
}

export function articleToHomeEditorPick(article: ArticleWithAuthor): HomeEditorPickItem {
  return {
    key: `article-${article.id}`,
    href: `/articles/${article.id}`,
    tag: editorPickTagForArticleCategory(article.category),
    title: article.title,
    imageUrl: article.image_url ?? undefined,
    imageVariant: imageVariantForArticleCategory(article.category),
    profileId: article.author_id,
    authorName: articleAuthorName(article),
    avatarUrl: article.profiles?.avatar_url ?? null,
  };
}

export function composeHomeEditorPicks(selectedArticles: ArticleWithAuthor[], limit = 3) {
  const selected = selectedArticles.slice(0, limit).map(articleToHomeEditorPick);
  const seenHrefs = new Set(selected.map((item) => item.href));
  const fallback = fallbackEditorPickItems().filter((item) => !seenHrefs.has(item.href));

  return [...selected, ...fallback].slice(0, limit);
}
