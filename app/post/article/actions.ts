"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { hasSafetyConfirmations, SAFETY_CONFIRMATION_ERROR, safetyMigrationErrorMessage } from "@/lib/safety";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const ARTICLE_SAFETY_FIELDS = ["articleExperienceConfirmed", "articleNoHarmConfirmed", "articlePrDisclosureChecked"];

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function redirectToArticlePost(params: { error?: string }): never {
  redirect(pathWithParams("/post/article", params));
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function articleSaveErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("relation") && message.includes("articles")) {
    return "記事保存に必要なarticlesテーブルが見つかりません。Supabase SQL Editorで最新migrationを実行してください。";
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後に記事投稿できます。先にプロフィールを保存してください。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "記事を保存できませんでした。articlesテーブルの権限設定を確認してください。";
  }

  if (message.includes("safety_confirmed_at") || message.includes("guidelines_confirmed") || message.includes("pr_disclosure_checked")) {
    return safetyMigrationErrorMessage("記事");
  }

  return "記事を保存できませんでした。入力内容を確認して、もう一度お試しください。";
}

export async function createArticleAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Article post auth lookup failed", {
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: "/post/article", message: "記事を書くにはログインしてください。" }));
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    console.error("Article post profile lookup failed", {
      userId: user.id,
      userEmail: user.email ?? null,
      message: profileError.message,
    });
    redirectToArticlePost({ error: "プロフィール情報を確認できませんでした。時間をおいて再度お試しください。" });
  }

  if (profile == null) {
    const permissionRedirect = getPostPermissionRedirect(null, "article", "/post/article");
    redirect(permissionRedirect ?? pathWithParams("/mypage/profile/edit", { error: "プロフィール設定後に記事投稿できます。" }));
  }

  const category = cleanText(formData.get("category")) || "経験記事";
  const capability = category === "講習会レポート" || category === "コンクールレポート" ? "report" : "article";
  const permissionRedirect = getPostPermissionRedirect(profile, capability, "/post/article");
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }

  const title = cleanText(formData.get("title"));
  const body = cleanText(formData.get("body"));
  const takeaway = cleanText(formData.get("takeaway"));

  if (!title) {
    redirectToArticlePost({ error: "タイトルを入力してください。" });
  }

  if (title.length > 120) {
    redirectToArticlePost({ error: "タイトルは120文字以内で入力してください。" });
  }

  if (!body) {
    redirectToArticlePost({ error: "本文を入力してください。" });
  }

  if (!hasSafetyConfirmations(formData, ARTICLE_SAFETY_FIELDS)) {
    redirectToArticlePost({ error: SAFETY_CONFIRMATION_ERROR });
  }

  const articleId = randomUUID();
  const now = new Date().toISOString();
  const articleBody = takeaway ? `${body}\n\nこの記事で伝えたいこと\n${takeaway}` : body;

  const { data, error } = await supabase
    .from("articles")
    .insert({
      id: articleId,
      author_id: user.id,
      title,
      category,
      body: articleBody,
      is_published: true,
      is_deleted: false,
      safety_confirmed_at: now,
      guidelines_confirmed: true,
      pr_disclosure_checked: true,
      published_at: now,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("Article insert failed", {
      userId: user.id,
      userEmail: user.email ?? null,
      message: error.message,
    });
    redirectToArticlePost({ error: articleSaveErrorMessage(error) });
  }

  if (data?.id !== articleId) {
    console.error("Article insert verification failed", {
      userId: user.id,
      articleId,
      savedId: data?.id ?? null,
    });
    redirectToArticlePost({ error: "記事を保存できませんでした。もう一度お試しください。" });
  }

  revalidatePath("/");
  revalidatePath("/mypage");
  revalidatePath(`/profiles/${user.id}`);
  revalidatePath(`/articles/${articleId}`);
  redirect(pathWithParams(`/articles/${articleId}`, { posted: "1" }));
}
