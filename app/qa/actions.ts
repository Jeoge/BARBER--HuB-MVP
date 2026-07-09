"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function qaPath(questionId: string, params?: Record<string, string | undefined>) {
  return pathWithParams(`/qa/${questionId}`, params ?? {});
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function answerErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("relation") && message.includes("qa_answers")) {
    return "回答を保存できませんでした。時間をおいて再度お試しください。";
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後に回答できます。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "回答を保存できませんでした。時間をおいて再度お試しください。";
  }

  return "回答を保存できませんでした。";
}

export async function createQaAnswerAction(formData: FormData) {
  const questionId = cleanText(formData.get("questionId"));
  const body = cleanText(formData.get("body"));

  if (!questionId) {
    redirect("/qa");
  }

  if (!body) {
    redirect(qaPath(questionId, { answerError: "回答を入力してください。" }));
  }

  if (body.length > 2000) {
    redirect(qaPath(questionId, { answerError: "回答は2000文字以内で入力してください。" }));
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Q&A answer auth lookup failed", {
        questionId,
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: `/qa/${questionId}`, message: "回答にはログインしてください。" }));
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    console.error("Q&A answer profile lookup failed", {
      questionId,
      userId: user.id,
      message: profileError.message,
    });
    redirect(qaPath(questionId, { answerError: "プロフィール情報を確認できませんでした。時間をおいて再度お試しください。" }));
  }

  const permissionRedirect = getPostPermissionRedirect(profile, "qa", `/qa/${questionId}`);
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("qa_answers").insert({
    question_id: questionId,
    user_id: user.id,
    body,
    is_deleted: false,
    is_best_answer: false,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error("Q&A answer insert failed", {
      questionId,
      userId: user.id,
      message: error.message,
    });
    redirect(qaPath(questionId, { answerError: answerErrorMessage(error) }));
  }

  revalidatePath("/qa");
  revalidatePath("/mypage");
  revalidatePath(`/qa/${questionId}`);
  redirect(qaPath(questionId, { answer: "posted" }));
}
