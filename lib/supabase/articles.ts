import type { SupabaseClient } from "@supabase/supabase-js";

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
  image_url: string | null;
  image_path: string | null;
  is_published: boolean | null;
  is_deleted: boolean | null;
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

type ArticleCommentCountRow = {
  article_id: string;
  user_id: string;
};

export const articleSelect = `
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

function normalizeArticles(data: unknown): ArticleWithAuthor[] {
  return ((data ?? []) as RawArticleWithAuthor[]).map((article) => ({
    ...article,
    profiles: Array.isArray(article.profiles) ? article.profiles[0] ?? null : article.profiles,
    ...emptyMetrics,
  }));
}

function normalizeArticle(data: unknown): ArticleWithAuthor | null {
  const article = data as RawArticleWithAuthor | null;
  if (article == null) return null;

  return {
    ...article,
    profiles: Array.isArray(article.profiles) ? article.profiles[0] ?? null : article.profiles,
    ...emptyMetrics,
  };
}

function normalizeComments(data: unknown): ArticleComment[] {
  return ((data ?? []) as RawArticleComment[]).map((comment) => ({
    ...comment,
    profiles: Array.isArray(comment.profiles) ? comment.profiles[0] ?? null : comment.profiles,
  }));
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
  const singleLine = body.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) return singleLine;
  return `${singleLine.slice(0, maxLength)}...`;
}

export async function getArticleEngagement(supabase: SupabaseClient, articleId: string, authorId?: string | null, viewerId?: string | null) {
  const metrics: ArticleMetrics = { ...emptyMetrics };

  try {
    const { data, error } = await supabase
      .from("article_reactions")
      .select("article_id, user_id, reaction_type")
      .eq("article_id", articleId)
      .returns<ArticleReactionRow[]>();

    if (error) {
      console.error("Article engagement reactions select failed", {
        articleId,
        message: error.message,
      });
    } else {
      (data ?? []).forEach((reaction) => {
        const isAuthorReaction = authorId != null && reaction.user_id === authorId;

        if (!isAuthorReaction) {
          if (reaction.reaction_type === "like") metrics.like_count += 1;
          if (reaction.reaction_type === "thanks") metrics.thanks_count += 1;
          if (reaction.reaction_type === "save") metrics.save_count += 1;
        }

        if (viewerId && reaction.user_id === viewerId && !isAuthorReaction) {
          if (reaction.reaction_type === "like") metrics.viewer_has_liked = true;
          if (reaction.reaction_type === "thanks") metrics.viewer_has_thanked = true;
          if (reaction.reaction_type === "save") metrics.viewer_has_saved = true;
        }
      });
    }
  } catch (error) {
    console.error("Article engagement reactions select threw", {
      articleId,
      message: errorMessage(error),
    });
  }

  try {
    const { data, error } = await supabase
      .from("article_comments")
      .select("article_id, user_id")
      .eq("article_id", articleId)
      .eq("is_deleted", false)
      .returns<ArticleCommentCountRow[]>();

    if (error) {
      console.error("Article engagement comments select failed", {
        articleId,
        message: error.message,
      });
    } else {
      metrics.comment_count = (data ?? []).filter((comment) => authorId == null || comment.user_id !== authorId).length;
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
  const likeByArticleId = new Map<string, number>();
  const thanksByArticleId = new Map<string, number>();
  const saveByArticleId = new Map<string, number>();
  const commentByArticleId = new Map<string, number>();
  const viewerLiked = new Set<string>();
  const viewerThanked = new Set<string>();
  const viewerSaved = new Set<string>();

  try {
    const { data, error } = await supabase
      .from("article_reactions")
      .select("article_id, user_id, reaction_type")
      .in("article_id", articleIds)
      .returns<ArticleReactionRow[]>();

    if (error) {
      console.error("Article reactions select failed", {
        message: error.message,
      });
    } else {
      (data ?? []).forEach((reaction) => {
        const authorId = authorByArticleId.get(reaction.article_id);
        const isAuthorReaction = authorId != null && reaction.user_id === authorId;

        if (!isAuthorReaction) {
          if (reaction.reaction_type === "like") {
            likeByArticleId.set(reaction.article_id, (likeByArticleId.get(reaction.article_id) ?? 0) + 1);
          }
          if (reaction.reaction_type === "thanks") {
            thanksByArticleId.set(reaction.article_id, (thanksByArticleId.get(reaction.article_id) ?? 0) + 1);
          }
          if (reaction.reaction_type === "save") {
            saveByArticleId.set(reaction.article_id, (saveByArticleId.get(reaction.article_id) ?? 0) + 1);
          }
        }

        if (viewerId && reaction.user_id === viewerId && !isAuthorReaction) {
          if (reaction.reaction_type === "like") viewerLiked.add(reaction.article_id);
          if (reaction.reaction_type === "thanks") viewerThanked.add(reaction.article_id);
          if (reaction.reaction_type === "save") viewerSaved.add(reaction.article_id);
        }
      });
    }
  } catch (error) {
    console.error("Article reactions select threw", {
      message: errorMessage(error),
    });
  }

  try {
    const { data, error } = await supabase
      .from("article_comments")
      .select("article_id, user_id")
      .in("article_id", articleIds)
      .eq("is_deleted", false)
      .returns<ArticleCommentCountRow[]>();

    if (error) {
      console.error("Article comment counts select failed", {
        message: error.message,
      });
    } else {
      (data ?? []).forEach((comment) => {
        const authorId = authorByArticleId.get(comment.article_id);
        if (authorId != null && comment.user_id === authorId) return;

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
    like_count: likeByArticleId.get(article.id) ?? 0,
    thanks_count: thanksByArticleId.get(article.id) ?? 0,
    save_count: saveByArticleId.get(article.id) ?? 0,
    comment_count: commentByArticleId.get(article.id) ?? 0,
    viewer_has_liked: viewerId != null && viewerId !== article.author_id && viewerLiked.has(article.id),
    viewer_has_thanked: viewerId != null && viewerId !== article.author_id && viewerThanked.has(article.id),
    viewer_has_saved: viewerId != null && viewerId !== article.author_id && viewerSaved.has(article.id),
  }));
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
        const withEngagement = article ? await withArticleEngagement(supabase, [article], viewerId) : [];
        return { article: withEngagement[0] ?? null, error: null };
      }

      console.error("Article detail fallback select failed", {
        articleId: id,
        message: fallback.error.message,
      });
    }

    const article = normalizeArticle(data);
    const withEngagement = article ? await withArticleEngagement(supabase, [article], viewerId) : [];
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
        return { articles: await withArticleEngagement(supabase, normalizeArticles(fallback.data), viewerId), error: null };
      }

      console.error("User articles fallback select failed", {
        userId,
        message: fallback.error.message,
      });
    }

    return { articles: await withArticleEngagement(supabase, normalizeArticles(data), viewerId), error };
  } catch (error) {
    console.error("User articles select threw", {
      userId,
      message: errorMessage(error),
    });
    return { articles: [], error };
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
    const normalized = await withArticleEngagement(supabase, normalizeArticles(data), viewerId);
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
