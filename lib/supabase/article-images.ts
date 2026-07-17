import "server-only";

import { safeDisplayImageSrc } from "@/lib/imageValidation";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";
import type { ArticleDisplayImage, ArticleWithAuthor } from "@/lib/supabase/articles";

const ARTICLE_IMAGE_BUCKET = "article-images";
const ARTICLE_IMAGE_SIGNED_URL_EXPIRES_IN_SECONDS = 30 * 60;

function isPublicArticle(article: ArticleWithAuthor) {
  return article.is_published === true && article.is_deleted === false;
}

function normalizedStoragePath(path: string | null | undefined) {
  const value = path?.trim();
  return value && value.length > 0 ? value : null;
}

function fallbackArticleImages(article: ArticleWithAuthor): ArticleDisplayImage[] {
  const storagePath = normalizedStoragePath(article.image_path);
  const legacyUrl = storagePath == null ? safeDisplayImageSrc(article.image_url) : null;

  if (storagePath == null && legacyUrl == null) return [];

  return [
    {
      id: `${article.id}:legacy-image`,
      url: legacyUrl,
      storage_path: storagePath,
      display_order: 0,
      width: null,
      height: null,
      byte_size: null,
      mime_type: null,
    },
  ];
}

function normalizedArticleImages(article: ArticleWithAuthor) {
  return article.images.length > 0 ? article.images : fallbackArticleImages(article);
}

function storagePathsForSigning(article: ArticleWithAuthor) {
  if (!isPublicArticle(article)) return [];

  return normalizedArticleImages(article)
    .map((image) => normalizedStoragePath(image.storage_path))
    .filter((path): path is string => path != null);
}

function resolveImage(article: ArticleWithAuthor, image: ArticleDisplayImage, signedUrlByPath: Map<string, string>): ArticleDisplayImage {
  const storagePath = normalizedStoragePath(image.storage_path);

  if (storagePath == null) {
    return {
      ...image,
      url: safeDisplayImageSrc(image.url),
      storage_path: null,
    };
  }

  return {
    ...image,
    url: isPublicArticle(article) ? signedUrlByPath.get(storagePath) ?? null : null,
    storage_path: storagePath,
  };
}

function articleWithResolvedImages<T extends ArticleWithAuthor>(article: T, signedUrlByPath: Map<string, string>): T {
  const images = normalizedArticleImages(article).map((image) => resolveImage(article, image, signedUrlByPath));

  return {
    ...article,
    images,
    image_url: images[0]?.url ?? null,
  };
}

export async function resolveArticleImageUrls<T extends ArticleWithAuthor>(articles: T[]): Promise<T[]> {
  if (articles.length === 0) return articles;

  const uniquePaths = Array.from(new Set(articles.flatMap(storagePathsForSigning)));

  if (uniquePaths.length === 0) {
    const emptySignedUrls = new Map<string, string>();
    return articles.map((article) => articleWithResolvedImages(article, emptySignedUrls));
  }

  const adminStatus = getSupabaseAdminConfigStatus();

  if (!adminStatus.ready) {
    console.error("Article signed image URL generation skipped because admin Supabase config is missing", {
      articleCount: articles.length,
      imageCount: uniquePaths.length,
      missingCount: adminStatus.missing.length,
    });

    const emptySignedUrls = new Map<string, string>();
    return articles.map((article) => articleWithResolvedImages(article, emptySignedUrls));
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

  return articles.map((article) => articleWithResolvedImages(article, signedUrlByPath));
}

export async function resolveArticleImageUrl<T extends ArticleWithAuthor>(article: T | null): Promise<T | null> {
  if (article == null) return null;
  const [resolved] = await resolveArticleImageUrls([article]);
  return resolved ?? null;
}
