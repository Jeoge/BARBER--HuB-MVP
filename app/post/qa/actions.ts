"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { isSafetyConfirmed, SAFETY_CONFIRMATION_ERROR } from "@/lib/safety";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { isQaCategory } from "@/lib/supabase/qa";
import { createClient } from "@/lib/supabase/server";

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function redirectToQaPost(params: { error?: string }): never {
  redirect(pathWithParams("/post/qa", params));
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function saveErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("relation") && message.includes("qa_questions")) {
    return "Q&A投稿に必要なSQLが未適用です。Supabase SQL Editorで最新migrationを実行してください。";
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後に質問できます。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "質問を保存できませんでした。権限設定を確認してください。";
  }

  return "質問を保存できませんでした。入力内容を確認して、もう一度お試しください。";
}

export async function createQaQuestionAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Q&A post auth lookup failed", {
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: "/post/qa", message: "質問するにはログインしてください。" }));
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    console.error("Q&A post profile lookup failed", {
      userId: user.id,
      userEmail: user.email ?? null,
      message: profileError.message,
    });
    redirectToQaPost({ error: "プロフィール情報を確認できませんでした。時間をおいて再度お試しください。" });
  }

  if (profile == null) {
    const permissionRedirect = getPostPermissionRedirect(null, "qa", "/post/qa");
    redirect(permissionRedirect ?? pathWithParams("/mypage/profile/edit", { error: "プロフィール設定後に質問できます。" }));
  }

  const permissionRedirect = getPostPermissionRedirect(profile, "qa", "/post/qa");
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }

  const title = cleanText(formData.get("title"));
  const body = cleanText(formData.get("body"));
  const category = cleanText(formData.get("category"));

  if (!title) {
    redirectToQaPost({ error: "タイトルを入力してください。" });
  }

  if (title.length > 120) {
    redirectToQaPost({ error: "タイトルは120文字以内で入力してください。" });
  }

  if (!body) {
    redirectToQaPost({ error: "本文を入力してください。" });
  }

  if (body.length > 6000) {
    redirectToQaPost({ error: "本文は6000文字以内で入力してください。" });
  }

  if (!isQaCategory(category)) {
    redirectToQaPost({ error: "Q&Aカテゴリーを選択してください。" });
  }

  if (!isSafetyConfirmed(formData, "qaPrivacyConfirmed")) {
    redirectToQaPost({ error: SAFETY_CONFIRMATION_ERROR });
  }

  const questionId = randomUUID();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("qa_questions")
    .insert({
      id: questionId,
      user_id: user.id,
      title,
      body,
      category,
      is_deleted: false,
      is_resolved: false,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("Q&A question insert failed", {
      userId: user.id,
      userEmail: user.email ?? null,
      message: error.message,
    });
    redirectToQaPost({ error: saveErrorMessage(error) });
  }

  if (data?.id !== questionId) {
    console.error("Q&A question insert verification failed", {
      userId: user.id,
      questionId,
      savedId: data?.id ?? null,
    });
    redirectToQaPost({ error: "質問を保存できませんでした。もう一度お試しください。" });
  }

  revalidatePath("/qa");
  revalidatePath("/mypage");
  revalidatePath(`/profiles/${user.id}`);
  revalidatePath(`/qa/${questionId}`);
  redirect(pathWithParams(`/qa/${questionId}`, { posted: "1" }));
}
