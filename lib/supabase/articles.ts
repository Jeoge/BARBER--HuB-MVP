import type { SupabaseClient } from "@supabase/supabase-js";
import { stripArticleImageMarkers } from "@/lib/articleMedia";
import {
  fallbackTopicSlugsForRelatedArticles,
  primaryTopicSlugForArticleCategory,
  topicCategoriesForArticle,
  type ArticleTopicSlug,
} from "@/lib/articleCategories";

export type ArticleAuthorProfile = {
  id: string;
  display_name: string | null;
  job_type: string | null;
  salon_name: string | null;
  region: string | null;
  avatar_url: string | null;
};

export type ArticleRecord = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  category: string | null;
  youtube_url: string | null;
  image_url: string | null;
  image_path: string | null;
  is_published: boolean | null;
  is_deleted: boolean | null;
  editor_pick_at?: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ArticleMetrics = {
  like_count: number;
  thanks_count: number;
  save_count: number;
  comment_count: number;
  viewer_has_liked: boolean;
  viewer_has_thanked: boolean;
  viewer_has_saved: boolean;
};

export type ArticleWithAuthor = ArticleRecord &
  ArticleMetrics & {
    profiles: ArticleAuthorProfile | null;
    images: ArticleDisplayImage[];
  };

export type ArticleImageRecord = {
  id: string;
  article_id: string;
  storage_path: string | null;
  display_order: number | null;
  width: number | null;
  height: number | null;
  byte_size: number | null;
  mime_type: string | null;
};

export type ArticleDisplayImage = {
  id: string;
  url: string | null;
  storage_path: string | null;
  display_order: number;
  width: number | null;
  height: number | null;
  byte_size: number | null;
  mime_type: string | null;
};

export type ArticleComment = {
  id: string;
  article_id: string;
  user_id: string;
  body: string;
  created_at: string | null;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type RawArticleWithAuthor = ArticleRecord & {
  profiles: ArticleAuthorProfile | ArticleAuthorProfile[] | null;
};

type RawArticleComment = Omit<ArticleComment, "profiles"> & {
  profiles: ArticleComment["profiles"] | ArticleComment["profiles"][] | null;
};

type ArticleReactionRow = {
  article_id: string;
  user_id: string;
  reaction_type: "like" | "thanks" | "save";
};

export type ArticleReactionCountRow = {
  article_id: string;
  thanks_count: number;
  like_count: number;
  save_count: number;
  comment_count: number;
  total_count: number;
};

type ArticleCommentCountRow = {
  article_id: string;
};

export const articleSelect = `
  id,
  author_id,
  title,
  body,
  category,
  youtube_url,
  image_url,
  image_path,
  is_published,
  is_deleted,
  published_at,
  created_at,
  updated_at,
  profiles:author_id (
    id,
    display_name,
    job_type,
    salon_name,
    region,
    avatar_url
  )
`;

const articleBaseSelect = `
  id,
  author_id,
  title,
  body,
  category,
  image_url,
  image_path,
  is_published,
  is_deleted,
  published_at,
  created_at,
  updated_at
`;

const articleSelectWithEditorPick = `
  id,
  author_id,
  title,
  body,
  category,
  youtube_url,
  image_url,
  image_path,
  is_published,
  is_deleted,
  editor_pick_at,
  published_at,
  created_at,
  updated_at,
  profiles:author_id (
    id,
    display_name,
    job_type,
    salon_name,
    region,
    avatar_url
  )
`;

const articleSelectWithEditorPickLegacy = `
  id,
  author_id,
  title,
  body,
  category,
  image_url,
  image_path,
  is_published,
  is_deleted,
  editor_pick_at,
  published_at,
  created_at,
  updated_at,
  profiles:author_id (
    id,
    display_name,
    job_type,
    salon_name,
    region,
    avatar_url
  )
`;

const emptyMetrics: ArticleMetrics = {
  like_count: 0,
  thanks_count: 0,
  save_count: 0,
  comment_count: 0,
  viewer_has_liked: false,
  viewer_has_thanked: false,
  viewer_has_saved: false,
};

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function isMissingEditorPickColumnError(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  if (message.includes("youtube_url")) return false;
  return message.includes("editor_pick_at") || (message.includes("schema cache") && message.includes("articles"));
}

function fallbackArticleImages(article: Pick<ArticleRecord, "id" | "image_path" | "image_url">): ArticleDisplayImage[] {
  const storagePath = article.image_path?.trim() || null;
  const legacyUrl = storagePath == null ? article.image_url?.trim() || null : null;

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

function articleWithDefaults(article: RawArticleWithAuthor): ArticleWithAuthor {
  return {
    ...article,
    youtube_url: article.youtube_url ?? null,
    profiles: Array.isArray(article.profiles) ? article.profiles[0] ?? null : article.profiles ?? null,
    images: fallbackArticleImages(article),
    ...emptyMetrics,
  };
}

function normalizeArticles(data: unknown): ArticleWithAuthor[] {
  return ((data ?? []) as RawArticleWithAuthor[]).map(articleWithDefaults);
}

function normalizeArticle(data: unknown): ArticleWithAuthor | null {
  const article = data as RawArticleWithAuthor | null;
  if (article == null) return null;

  return articleWithDefaults(article);
}

function normalizeComments(data: unknown): ArticleComment[] {
  return ((data ?? []) as RawArticleComment[]).map((comment) => ({
    ...comment,
    profiles: Array.isArray(comment.profiles) ? comment.profiles[0] ?? null : comment.profiles,
  }));
}

function isMissingArticleImagesTableError(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return message.includes("article_images") || (message.includes("schema cache") && message.includes("article"));
}

function normalizeArticleImageRows(rows: ArticleImageRecord[]) {
  const seenPaths = new Set<string>();

  return rows
    .map((row) => ({
      id: row.id,
      url: null,
      storage_path: row.storage_path?.trim() || null,
      display_order: Number(row.display_order ?? 0),
      width: row.width ?? null,
      height: row.height ?? null,
      byte_size: row.byte_size ?? null,
      mime_type: row.mime_type ?? null,
    }))
    .filter((image) => {
      if (image.storage_path == null) return false;
      if (seenPaths.has(image.storage_path)) return false;
      seenPaths.add(image.storage_path);
      return true;
    })
    .sort((first, second) => first.display_order - second.display_order)
    .slice(0, 4);
}

async function withArticleImages(supabase: SupabaseClient, articles: ArticleWithAuthor[]) {
  const articleIds = articles.map((article) => article.id).filter(isUuid);
  if (articleIds.length === 0) return articles;

  try {
    const { data, error } = await supabase
      .from("article_images")
      .select("id, article_id, storage_path, display_order, width, height, byte_size, mime_type")
      .in("article_id", articleIds)
      .order("display_order", { ascending: true })
      .returns<ArticleImageRecord[]>();

    if (error) {
      if (!isMissingArticleImagesTableError(error)) {
        console.error("Article images select failed", {
          articleCount: articles.length,
          message: error.message,
        });
      }
      return articles;
    }

    const rowsByArticleId = new Map<string, ArticleImageRecord[]>();
    (data ?? []).forEach((row) => {
      rowsByArticleId.set(row.article_id, [...(rowsByArticleId.get(row.article_id) ?? []), row]);
    });

    return articles.map((article) => {
      const images = normalizeArticleImageRows(rowsByArticleId.get(article.id) ?? []);
      return images.length > 0 ? { ...article, images } : article;
    });
  } catch (error) {
    if (!isMissingArticleImagesTableError(error)) {
      console.error("Article images select threw", {
        articleCount: articles.length,
        message: errorMessage(error),
      });
    }
    return articles;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function articleAuthorName(article: ArticleWithAuthor) {
  return article.profiles?.display_name?.trim() || article.profiles?.salon_name?.trim() || "プロフィール未設定";
}

export function articleAuthorMeta(article: ArticleWithAuthor) {
  return [article.profiles?.job_type, article.profiles?.salon_name, article.profiles?.region]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(" / ");
}

export function articleDateLabel(article: Pick<ArticleRecord, "published_at" | "created_at">) {
  const source = article.published_at ?? article.created_at;
  if (!source) return "投稿日時未設定";

  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return "投稿日時未設定";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
}

export function articleExcerpt(body: string, maxLength = 72) {
  const singleLine = stripArticleImageMarkers(body).replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) return singleLine;
  return `${singleLine.slice(0, maxLength)}...`;
}

export async function listMyArticleReactionCounts(supabase: SupabaseClient): Promise<ArticleReactionCountRow[]> {
  const { data, error } = await supabase.rpc("get_my_article_reaction_counts");

  if (error) {
    console.error("My article reaction counts RPC failed", {
      message: error.message,
    });
    return [];
  }

  return ((data ?? []) as ArticleReactionCountRow[]).map((counts) => ({
    ...counts,
    thanks_count: Number(counts.thanks_count ?? 0),
    like_count: Number(counts.like_count ?? 0),
    save_count: Number(counts.save_count ?? 0),
    comment_count: Number(counts.comment_count ?? 0),
    total_count: Number(counts.total_count ?? 0),
  }));
}

export async function getArticleEngagement(supabase: SupabaseClient, articleId: string, authorId?: string | null, viewerId?: string | null) {
  const metrics: ArticleMetrics = { ...emptyMetrics };

  if (viewerId != null) {
    try {
      const { data, error } = await supabase
        .from("article_reactions")
        .select("article_id, user_id, reaction_type")
        .eq("article_id", articleId)
        .eq("user_id", viewerId)
        .returns<ArticleReactionRow[]>();

      if (error) {
        console.error("Article engagement viewer reactions select failed", {
          articleId,
          message: error.message,
        });
      } else {
        (data ?? []).forEach((reaction) => {
          const isAuthorReaction = authorId != null && reaction.user_id === authorId;

          if (reaction.reaction_type === "save" || !isAuthorReaction) {
            if (reaction.reaction_type === "like") metrics.viewer_has_liked = true;
            if (reaction.reaction_type === "thanks") metrics.viewer_has_thanked = true;
            if (reaction.reaction_type === "save") metrics.viewer_has_saved = true;
          }
        });
      }
    } catch (error) {
      console.error("Article engagement viewer reactions select threw", {
        articleId,
        message: errorMessage(error),
      });
    }
  }

  try {
    const { data, error } = await supabase
      .from("article_comments")
      .select("article_id")
      .eq("article_id", articleId)
      .eq("is_deleted", false)
      .returns<ArticleCommentCountRow[]>();

    if (error) {
      console.error("Article engagement comments select failed", {
        articleId,
        message: error.message,
      });
    } else {
      metrics.comment_count = (data ?? []).length;
    }
  } catch (error) {
    console.error("Article engagement comments select threw", {
      articleId,
      message: errorMessage(error),
    });
  }

  return metrics;
}

async function withArticleEngagement(supabase: SupabaseClient, articles: ArticleWithAuthor[], viewerId?: string | null) {
  const articleIds = articles.map((article) => article.id).filter(Boolean);
  if (articleIds.length === 0) return articles;

  const authorByArticleId = new Map(articles.map((article) => [article.id, article.author_id]));
  const commentByArticleId = new Map<string, number>();
  const viewerLiked = new Set<string>();
  const viewerThanked = new Set<string>();
  const viewerSaved = new Set<string>();

  if (viewerId != null) {
    try {
      const { data, error } = await supabase
        .from("article_reactions")
        .select("article_id, user_id, reaction_type")
        .in("article_id", articleIds)
        .eq("user_id", viewerId)
        .returns<ArticleReactionRow[]>();

      if (error) {
        console.error("Article viewer reactions select failed", {
          message: error.message,
        });
      } else {
        (data ?? []).forEach((reaction) => {
          const authorId = authorByArticleId.get(reaction.article_id);
          const isAuthorReaction = authorId != null && reaction.user_id === authorId;

          if (reaction.reaction_type === "save" || !isAuthorReaction) {
            if (reaction.reaction_type === "like") viewerLiked.add(reaction.article_id);
            if (reaction.reaction_type === "thanks") viewerThanked.add(reaction.article_id);
            if (reaction.reaction_type === "save") viewerSaved.add(reaction.article_id);
          }
        });
      }
    } catch (error) {
      console.error("Article viewer reactions select threw", {
        message: errorMessage(error),
      });
    }
  }

  try {
    const { data, error } = await supabase
      .from("article_comments")
      .select("article_id")
      .in("article_id", articleIds)
      .eq("is_deleted", false)
      .returns<ArticleCommentCountRow[]>();

    if (error) {
      console.error("Article comment counts select failed", {
        message: error.message,
      });
    } else {
      (data ?? []).forEach((comment) => {
        commentByArticleId.set(comment.article_id, (commentByArticleId.get(comment.article_id) ?? 0) + 1);
      });
    }
  } catch (error) {
    console.error("Article comment counts select threw", {
      message: errorMessage(error),
    });
  }

  return articles.map((article) => ({
    ...article,
    comment_count: commentByArticleId.get(article.id) ?? 0,
    viewer_has_liked: viewerId != null && viewerId !== article.author_id && viewerLiked.has(article.id),
    viewer_has_thanked: viewerId != null && viewerId !== article.author_id && viewerThanked.has(article.id),
    viewer_has_saved: viewerId != null && viewerSaved.has(article.id),
  }));
}

async function hydrateArticles(supabase: SupabaseClient, articles: ArticleWithAuthor[], viewerId?: string | null) {
  const withImages = await withArticleImages(supabase, articles);
  return withArticleEngagement(supabase, withImages, viewerId);
}

export async function getPublishedArticleById(supabase: SupabaseClient, id: string, viewerId?: string | null) {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select(articleSelect)
      .eq("id", id)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .maybeSingle();

    if (error) {
      console.error("Article detail joined select failed", {
        articleId: id,
        message: error.message,
      });

      const fallback = await supabase
        .from("articles")
        .select(articleBaseSelect)
        .eq("id", id)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .maybeSingle();

      if (!fallback.error) {
        const article = normalizeArticle(fallback.data);
        const withEngagement = article ? await hydrateArticles(supabase, [article], viewerId) : [];
        return { article: withEngagement[0] ?? null, error: null };
      }

      console.error("Article detail fallback select failed", {
        articleId: id,
        message: fallback.error.message,
      });
    }

    const article = normalizeArticle(data);
    const withEngagement = article ? await hydrateArticles(supabase, [article], viewerId) : [];
    return { article: withEngagement[0] ?? null, error };
  } catch (error) {
    console.error("Article detail select threw", {
      articleId: id,
      message: errorMessage(error),
    });
    return { article: null, error };
  }
}

export async function listUserArticles(supabase: SupabaseClient, userId: string, limit = 20, viewerId?: string | null) {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select(articleSelect)
      .eq("author_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("User articles joined select failed", {
        userId,
        message: error.message,
      });

      const fallback = await supabase
        .from("articles")
        .select(articleBaseSelect)
        .eq("author_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!fallback.error) {
        return { articles: await hydrateArticles(supabase, normalizeArticles(fallback.data), viewerId), error: null };
      }

      console.error("User articles fallback select failed", {
        userId,
        message: fallback.error.message,
      });
    }

    return { articles: await hydrateArticles(supabase, normalizeArticles(data), viewerId), error };
  } catch (error) {
    console.error("User articles select threw", {
      userId,
      message: errorMessage(error),
    });
    return { articles: [], error };
  }
}

export async function listUserArticlesWithEditorPick(supabase: SupabaseClient, userId: string, limit = 20, viewerId?: string | null) {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select(articleSelectWithEditorPick)
      .eq("author_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("User articles editor pick select failed", {
        userId,
        message: error.message,
      });

      const legacy = await supabase
        .from("articles")
        .select(articleSelectWithEditorPickLegacy)
        .eq("author_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!legacy.error) {
        return { articles: await hydrateArticles(supabase, normalizeArticles(legacy.data), viewerId), error: null };
      }

      return listUserArticles(supabase, userId, limit, viewerId);
    }

    return { articles: await hydrateArticles(supabase, normalizeArticles(data), viewerId), error };
  } catch (error) {
    console.error("User articles editor pick select threw", {
      userId,
      message: errorMessage(error),
    });
    return listUserArticles(supabase, userId, limit, viewerId);
  }
}

export async function listPublishedArticles(supabase: SupabaseClient, limit = 5, viewerId?: string | null) {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select(articleSelect)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Published articles joined select failed", {
        message: error.message,
      });

      const fallback = await supabase
        .from("articles")
        .select(articleBaseSelect)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!fallback.error) {
        return { articles: await hydrateArticles(supabase, normalizeArticles(fallback.data), viewerId), error: null };
      }

      console.error("Published articles fallback select failed", {
        message: fallback.error.message,
      });
    }

    return { articles: await hydrateArticles(supabase, normalizeArticles(data), viewerId), error };
  } catch (error) {
    console.error("Published articles select threw", {
      message: errorMessage(error),
    });
    return { articles: [], error };
  }
}

export async function listPublishedArticlesByCategories(
  supabase: SupabaseClient,
  categories: string[],
  limit = 8,
  viewerId?: string | null
) {
  const cleanedCategories = Array.from(new Set(categories.map((category) => category.trim()).filter(Boolean)));
  if (cleanedCategories.length === 0) return { articles: [], error: null };

  try {
    const { data, error } = await supabase
      .from("articles")
      .select(articleSelect)
      .in("category", cleanedCategories)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Category published articles joined select failed", {
        categories: cleanedCategories,
        message: error.message,
      });

      const fallback = await supabase
        .from("articles")
        .select(articleBaseSelect)
        .in("category", cleanedCategories)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!fallback.error) {
        return { articles: await hydrateArticles(supabase, normalizeArticles(fallback.data), viewerId), error: null };
      }

      console.error("Category published articles fallback select failed", {
        categories: cleanedCategories,
        message: fallback.error.message,
      });
    }

    return { articles: await hydrateArticles(supabase, normalizeArticles(data), viewerId), error };
  } catch (error) {
    console.error("Category published articles select threw", {
      categories: cleanedCategories,
      message: errorMessage(error),
    });
    return { articles: [], error };
  }
}

export async function listPublishedArticlesByTopic(supabase: SupabaseClient, topicSlug: string, limit = 8, viewerId?: string | null) {
  const categories = topicCategoriesForArticle(topicSlug);
  if (categories.length === 0) return { articles: [], error: null };

  try {
    const { data, error } = await supabase
      .from("articles")
      .select(articleSelect)
      .in("category", categories)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Topic published articles joined select failed", {
        topicSlug,
        message: error.message,
      });

      const fallback = await supabase
        .from("articles")
        .select(articleBaseSelect)
        .in("category", categories)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!fallback.error) {
        return { articles: await hydrateArticles(supabase, normalizeArticles(fallback.data), viewerId), error: null };
      }

      console.error("Topic published articles fallback select failed", {
        topicSlug,
        message: fallback.error.message,
      });
    }

    return { articles: await hydrateArticles(supabase, normalizeArticles(data), viewerId), error };
  } catch (error) {
    console.error("Topic published articles select threw", {
      topicSlug,
      message: errorMessage(error),
    });
    return { articles: [], error };
  }
}

async function listRelatedArticleCandidates(
  supabase: SupabaseClient,
  categories: string[] | null,
  excludeIds: string[],
  limit: number,
  viewerId?: string | null
) {
  try {
    let query = supabase
      .from("articles")
      .select(articleSelect)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (categories != null && categories.length > 0) {
      query = query.in("category", Array.from(new Set(categories)));
    }

    if (excludeIds.length === 1) {
      query = query.neq("id", excludeIds[0]);
    } else if (excludeIds.length > 1) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Related articles joined select failed", {
        categories,
        message: error.message,
      });

      let fallbackQuery = supabase
        .from("articles")
        .select(articleBaseSelect)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (categories != null && categories.length > 0) {
        fallbackQuery = fallbackQuery.in("category", Array.from(new Set(categories)));
      }

      if (excludeIds.length === 1) {
        fallbackQuery = fallbackQuery.neq("id", excludeIds[0]);
      } else if (excludeIds.length > 1) {
        fallbackQuery = fallbackQuery.not("id", "in", `(${excludeIds.join(",")})`);
      }

      const fallback = await fallbackQuery;
      if (!fallback.error) {
        return { articles: await hydrateArticles(supabase, normalizeArticles(fallback.data), viewerId), error: null };
      }

      console.error("Related articles fallback select failed", {
        categories,
        message: fallback.error.message,
      });
      return { articles: [], error: fallback.error };
    }

    return { articles: await hydrateArticles(supabase, normalizeArticles(data), viewerId), error: null };
  } catch (error) {
    console.error("Related articles select threw", {
      categories,
      message: errorMessage(error),
    });
    return { articles: [], error };
  }
}

export type RelatedArticlesResult = {
  articles: ArticleWithAuthor[];
  heading: "関連記事" | "あわせて読む";
  topicSlug: ArticleTopicSlug | null;
  usedFallback: boolean;
};

export async function listRelatedPublishedArticles(
  supabase: SupabaseClient,
  currentArticle: Pick<ArticleRecord, "id" | "category">,
  limit = 3,
  viewerId?: string | null
): Promise<RelatedArticlesResult> {
  const topicSlug = primaryTopicSlugForArticleCategory(currentArticle.category);
  const selected: ArticleWithAuthor[] = [];
  const selectedIds = new Set([currentArticle.id]);
  let usedFallback = false;

  function pushUnique(articles: ArticleWithAuthor[], fallback: boolean) {
    for (const article of articles) {
      if (selected.length >= limit) return;
      if (selectedIds.has(article.id)) continue;
      selectedIds.add(article.id);
      selected.push(article);
      if (fallback) usedFallback = true;
    }
  }

  if (topicSlug != null) {
    const sameTopicCategories = topicCategoriesForArticle(topicSlug);
    const sameTopicResult = await listRelatedArticleCandidates(
      supabase,
      sameTopicCategories,
      Array.from(selectedIds),
      limit,
      viewerId
    );
    pushUnique(sameTopicResult.articles, false);
  }

  if (selected.length < limit && topicSlug != null) {
    const fallbackCategories = fallbackTopicSlugsForRelatedArticles(topicSlug).flatMap((slug) => topicCategoriesForArticle(slug));
    const fallbackResult = await listRelatedArticleCandidates(
      supabase,
      fallbackCategories,
      Array.from(selectedIds),
      Math.max(limit * 2, 6),
      viewerId
    );
    pushUnique(fallbackResult.articles, true);
  }

  if (selected.length < limit) {
    const latestResult = await listRelatedArticleCandidates(
      supabase,
      null,
      Array.from(selectedIds),
      Math.max(limit * 3, 9),
      viewerId
    );
    pushUnique(latestResult.articles, true);
  }

  return {
    articles: selected.slice(0, limit),
    heading: usedFallback || topicSlug == null ? "あわせて読む" : "関連記事",
    topicSlug,
    usedFallback,
  };
}

export async function listEditorPickArticles(supabase: SupabaseClient, limit = 3, viewerId?: string | null) {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select(articleSelectWithEditorPick)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .not("editor_pick_at", "is", null)
      .order("editor_pick_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingEditorPickColumnError(error)) {
        return { articles: [], error: null, missingEditorPickColumn: true };
      }

      console.error("Editor pick articles select failed", {
        message: error.message,
      });

      const legacy = await supabase
        .from("articles")
        .select(articleSelectWithEditorPickLegacy)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .not("editor_pick_at", "is", null)
        .order("editor_pick_at", { ascending: false })
        .limit(limit);

      if (!legacy.error) {
        return {
          articles: await hydrateArticles(supabase, normalizeArticles(legacy.data), viewerId),
          error: null,
          missingEditorPickColumn: false,
        };
      }

      if (isMissingEditorPickColumnError(legacy.error)) {
        return { articles: [], error: null, missingEditorPickColumn: true };
      }

      return { articles: [], error: legacy.error, missingEditorPickColumn: false };
    }

    return {
      articles: await hydrateArticles(supabase, normalizeArticles(data), viewerId),
      error,
      missingEditorPickColumn: false,
    };
  } catch (error) {
    if (isMissingEditorPickColumnError(error)) {
      return { articles: [], error: null, missingEditorPickColumn: true };
    }

    console.error("Editor pick articles select threw", {
      message: errorMessage(error),
    });
    return { articles: [], error, missingEditorPickColumn: false };
  }
}

export async function listSavedArticles(supabase: SupabaseClient, userId: string, limit = 20, viewerId?: string | null) {
  try {
    const { data: savedRows, error: savedError } = await supabase
      .from("article_reactions")
      .select("article_id")
      .eq("user_id", userId)
      .eq("reaction_type", "save")
      .order("created_at", { ascending: false })
      .limit(limit)
      .returns<Array<{ article_id: string }>>();

    if (savedError) {
      console.error("Saved article ids select failed", {
        userId,
        message: savedError.message,
      });
      return { articles: [], error: savedError };
    }

    const articleIds = Array.from(new Set((savedRows ?? []).map((row) => row.article_id).filter(isUuid)));
    if (articleIds.length === 0) return { articles: [], error: null };

    const { data, error } = await supabase
      .from("articles")
      .select(articleSelect)
      .in("id", articleIds)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .limit(limit);

    if (error) {
      console.error("Saved articles select failed", {
        userId,
        message: error.message,
      });
      return { articles: [], error };
    }

    const order = new Map(articleIds.map((articleId, index) => [articleId, index]));
    const normalized = await hydrateArticles(supabase, normalizeArticles(data), viewerId);
    normalized.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));

    return { articles: normalized, error: null };
  } catch (error) {
    console.error("Saved articles select threw", {
      userId,
      message: errorMessage(error),
    });
    return { articles: [], error };
  }
}

export async function listArticleComments(supabase: SupabaseClient, articleId: string, limit = 30) {
  try {
    const { data, error } = await supabase
      .from("article_comments")
      .select(
        `
        id,
        article_id,
        user_id,
        body,
        created_at,
        profiles:user_id (
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq("article_id", articleId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Article comments joined select failed", {
        articleId,
        message: error.message,
      });

      const fallback = await supabase
        .from("article_comments")
        .select("id, article_id, user_id, body, created_at")
        .eq("article_id", articleId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!fallback.error) {
        return { comments: normalizeComments(fallback.data), error: null };
      }

      console.error("Article comments fallback select failed", {
        articleId,
        message: fallback.error.message,
      });
    }

    return { comments: normalizeComments(data), error };
  } catch (error) {
    console.error("Article comments select threw", {
      articleId,
      message: errorMessage(error),
    });
    return { comments: [], error };
  }
}
