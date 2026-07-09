"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

type ArticleReactionType = "like" | "thanks" | "save";

const reactionTypes = new Set<ArticleReactionType>(["like", "thanks", "save"]);

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function articlePath(articleId: string, params?: Record<string, string | undefined>) {
  return pathWithParams(`/articles/${articleId}`, params ?? {});
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function reactionErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("relation") && message.includes("article_reactions")) {
    return "リアクションを保存できませんでした。時間をおいて再度お試しください。";
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後にリアクションできます。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "リアクションを保存できませんでした。時間をおいて再度お試しください。";
  }

  return "リアクションを保存できませんでした。";
}

function commentErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("relation") && message.includes("article_comments")) {
    return "コメントを保存できませんでした。時間をおいて再度お試しください。";
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後にコメントできます。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "コメントを保存できませんでした。時間をおいて再度お試しください。";
  }

  return "コメントを保存できませんでした。";
}

export async function toggleArticleReactionAction(formData: FormData) {
  const articleId = cleanText(formData.get("articleId"));
  const reactionType = cleanText(formData.get("reactionType")) as ArticleReactionType;

  if (!articleId || !reactionTypes.has(reactionType)) {
    redirect("/");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Article reaction auth lookup failed", {
        articleId,
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: `/articles/${articleId}`, message: "リアクションにはログインしてください。" }));
  }

  if (isUuid(articleId)) {
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id, author_id, is_published, is_deleted")
      .eq("id", articleId)
      .maybeSingle<{ id: string; author_id: string; is_published: boolean | null; is_deleted: boolean | null }>();

    if (articleError) {
      console.error("Article reaction target lookup failed", {
        articleId,
        userId: user.id,
        message: articleError.message,
      });
    }

    if (article != null && (article.is_deleted || article.is_published === false)) {
      redirect(articlePath(articleId, { reactionError: "この記事にはリアクションできません。" }));
    }

    if (article?.author_id === user.id) {
      redirect(articlePath(articleId, { reactionError: "自分の記事へのリアクションはカウントされません。" }));
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from("article_reactions")
    .select("id")
    .eq("article_id", articleId)
    .eq("user_id", user.id)
    .eq("reaction_type", reactionType)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    console.error("Article reaction existing lookup failed", {
      articleId,
      userId: user.id,
      reactionType,
      message: existingError.message,
    });
    redirect(articlePath(articleId, { reactionError: reactionErrorMessage(existingError) }));
  }

  if (existing) {
    const { error } = await supabase
      .from("article_reactions")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Article reaction delete failed", {
        articleId,
        userId: user.id,
        reactionType,
        message: error.message,
      });
      redirect(articlePath(articleId, { reactionError: reactionErrorMessage(error) }));
    }
  } else {
    const { error } = await supabase.from("article_reactions").insert({
      article_id: articleId,
      user_id: user.id,
      reaction_type: reactionType,
    });

    if (error) {
      console.error("Article reaction insert failed", {
        articleId,
        userId: user.id,
        reactionType,
        message: error.message,
      });
      redirect(articlePath(articleId, { reactionError: reactionErrorMessage(error) }));
    }
  }

  revalidatePath("/");
  revalidatePath("/mypage");
  revalidatePath(`/articles/${articleId}`);
  redirect(articlePath(articleId));
}

export async function createArticleCommentAction(formData: FormData) {
  const articleId = cleanText(formData.get("articleId"));
  const body = cleanText(formData.get("body"));

  if (!articleId) {
    redirect("/");
  }

  if (!body) {
    redirect(articlePath(articleId, { commentError: "コメントを入力してください。" }));
  }

  if (body.length > 1000) {
    redirect(articlePath(articleId, { commentError: "コメントは1000文字以内で入力してください。" }));
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Article comment auth lookup failed", {
        articleId,
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: `/articles/${articleId}`, message: "コメントにはログインしてください。" }));
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("article_comments").insert({
    article_id: articleId,
    user_id: user.id,
    body,
    is_deleted: false,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error("Article comment insert failed", {
      articleId,
      userId: user.id,
      message: error.message,
    });
    redirect(articlePath(articleId, { commentError: commentErrorMessage(error) }));
  }

  revalidatePath("/mypage");
  revalidatePath(`/articles/${articleId}`);
  redirect(articlePath(articleId, { comment: "posted" }));
}
