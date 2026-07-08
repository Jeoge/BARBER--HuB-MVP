"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function backroomPath(postId: string, params?: Record<string, string | undefined>) {
  return pathWithParams(`/backroom/${postId}`, params ?? {});
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function commentErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("relation") && message.includes("backroom_comments")) {
    return "コメント保存に必要なSQLが未適用です。";
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後にコメントできます。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "コメントを保存できませんでした。権限設定を確認してください。";
  }

  return "コメントを保存できませんでした。";
}

export async function createBackroomCommentAction(formData: FormData) {
  const postId = cleanText(formData.get("postId"));
  const body = cleanText(formData.get("body"));

  if (!postId) {
    redirect("/backroom");
  }

  if (!body) {
    redirect(backroomPath(postId, { commentError: "コメントを入力してください。" }));
  }

  if (body.length > 1000) {
    redirect(backroomPath(postId, { commentError: "コメントは1000文字以内で入力してください。" }));
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Back Room comment auth lookup failed", {
        postId,
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: `/backroom/${postId}`, message: "コメントにはログインしてください。" }));
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("backroom_comments").insert({
    post_id: postId,
    user_id: user.id,
    body,
    is_deleted: false,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error("Back Room comment insert failed", {
      postId,
      userId: user.id,
      message: error.message,
    });
    redirect(backroomPath(postId, { commentError: commentErrorMessage(error) }));
  }

  revalidatePath("/backroom");
  revalidatePath("/mypage");
  revalidatePath(`/backroom/${postId}`);
  redirect(backroomPath(postId, { comment: "posted" }));
}
