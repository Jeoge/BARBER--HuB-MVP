"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
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
    return "回答保存に必要なSQLが未適用です。";
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後に回答できます。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "回答を保存できませんでした。権限設定を確認してください。";
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
