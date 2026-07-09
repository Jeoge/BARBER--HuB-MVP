"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams, safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function redirectToSetup(params: { error?: string; next?: string }) {
  redirect(pathWithParams("/backroom/setup", params));
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

  if (message.includes("relation") && message.includes("backroom_profiles")) {
    return "Back Room参加設定を保存できませんでした。時間をおいて再度お試しください。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "Back Room参加設定を保存できませんでした。時間をおいて再度お試しください。";
  }

  return "Back Room参加設定を保存できませんでした。入力内容を確認して、もう一度お試しください。";
}

export async function saveBackroomProfileAction(formData: FormData) {
  const next = safeNextPath(cleanText(formData.get("next")), "/backroom");
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Back Room setup auth lookup failed", {
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: "/backroom/setup", message: "Back Room参加設定にはログインしてください。" }));
  }

  const nickname = cleanText(formData.get("nickname"));

  if (!nickname) {
    redirectToSetup({ error: "Back Room専用ニックネームを入力してください。", next });
  }

  if (nickname.length > 20) {
    redirectToSetup({ error: "Back Room専用ニックネームは20文字以内で入力してください。", next });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("backroom_profiles")
    .upsert(
      {
        user_id: user.id,
        nickname,
        updated_at: now,
      },
      { onConflict: "user_id" }
    )
    .select("user_id")
    .maybeSingle<{ user_id: string }>();

  if (error) {
    console.error("Back Room profile upsert failed", {
      userId: user.id,
      message: error.message,
    });
    redirectToSetup({ error: saveErrorMessage(error), next });
  }

  if (data?.user_id !== user.id) {
    console.error("Back Room profile upsert verification failed", {
      userId: user.id,
      savedUserId: data?.user_id ?? null,
    });
    redirectToSetup({ error: "Back Room参加設定を保存できませんでした。もう一度お試しください。", next });
  }

  revalidatePath("/backroom");
  revalidatePath("/post/backroom");
  revalidatePath("/mypage");
  redirect(pathWithParams(next, { joined: "1" }));
}
