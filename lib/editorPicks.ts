import {
  editorPickTagForArticleCategory,
  imageVariantForArticleCategory,
} from "@/lib/articleCategories";
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

export function rotateEditorPicks<T>(items: T[], offset: number) {
  return items.map((_, index) => items[(index + offset) % items.length]);
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
  return selectedArticles.slice(0, limit).map(articleToHomeEditorPick);
}
