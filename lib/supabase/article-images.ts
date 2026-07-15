import "server-only";

import { safeDisplayImageSrc } from "@/lib/imageValidation";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";
import type { ArticleWithAuthor } from "@/lib/supabase/articles";

const ARTICLE_IMAGE_BUCKET = "article-images";
const ARTICLE_IMAGE_SIGNED_URL_EXPIRES_IN_SECONDS = 30 * 60;

function isPublicArticle(article: ArticleWithAuthor) {
  return article.is_published === true && article.is_deleted === false;
}

function normalizedStoragePath(article: ArticleWithAuthor) {
  const path = article.image_path?.trim();
  return path && path.length > 0 ? path : null;
}

function legacyImageUrl(article: ArticleWithAuthor) {
  if (normalizedStoragePath(article) != null) return null;
  return safeDisplayImageSrc(article.image_url);
}

function articleWithImageUrl<T extends ArticleWithAuthor>(article: T, imageUrl: string | null): T {
  return {
    ...article,
    image_url: imageUrl,
  };
}

export async function resolveArticleImageUrls<T extends ArticleWithAuthor>(articles: T[]): Promise<T[]> {
  if (articles.length === 0) return articles;

  const signedCandidates = articles
    .map((article) => ({
      id: article.id,
      path: normalizedStoragePath(article),
      canSign: isPublicArticle(article),
    }))
    .filter((item): item is { id: string; path: string; canSign: true } => item.path != null && item.canSign);
  const uniquePaths = Array.from(new Set(signedCandidates.map((item) => item.path)));

  if (uniquePaths.length === 0) {
    return articles.map((article) => articleWithImageUrl(article, legacyImageUrl(article)));
  }

  const adminStatus = getSupabaseAdminConfigStatus();

  if (!adminStatus.ready) {
    console.error("Article signed image URL generation skipped because admin Supabase config is missing", {
      articleCount: articles.length,
      imageCount: uniquePaths.length,
      missingCount: adminStatus.missing.length,
    });

    return articles.map((article) => articleWithImageUrl(article, legacyImageUrl(article)));
  }

  const signedUrlByPath = new Map<string, string>();

  try {
    const adminSupabase = createSupabaseAdminClient();
    const { data, error } = await adminSupabase.storage
      .from(ARTICLE_IMAGE_BUCKET)
      .createSignedUrls(uniquePaths, ARTICLE_IMAGE_SIGNED_URL_EXPIRES_IN_SECONDS);

    if (error) {
      console.error("Article signed image URL generation failed", {
        articleCount: articles.length,
        imageCount: uniquePaths.length,
        message: error.message,
      });
    } else {
      (data ?? []).forEach((item, index) => {
        const row = item as { path?: string | null; signedUrl?: string | null; error?: { message?: string } | null };
        const path = row.path?.trim() || uniquePaths[index];

        if (row.signedUrl && !row.error) {
          signedUrlByPath.set(path, row.signedUrl);
        }
      });
    }
  } catch (error) {
    console.error("Article signed image URL generation threw", {
      articleCount: articles.length,
      imageCount: uniquePaths.length,
      message: error instanceof Error ? error.message : String(error || ""),
    });
  }

  return articles.map((article) => {
    const path = normalizedStoragePath(article);

    if (path == null) {
      return articleWithImageUrl(article, legacyImageUrl(article));
    }

    if (!isPublicArticle(article)) {
      return articleWithImageUrl(article, null);
    }

    return articleWithImageUrl(article, signedUrlByPath.get(path) ?? null);
  });
}

export async function resolveArticleImageUrl<T extends ArticleWithAuthor>(article: T | null): Promise<T | null> {
  if (article == null) return null;
  const [resolved] = await resolveArticleImageUrls([article]);
  return resolved ?? null;
}
