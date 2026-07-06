"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function redirectToEdit(error: string) {
  redirect(pathWithParams("/mypage/profile/edit", { error }));
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "";
}

function profileSaveErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "プロフィールを保存できませんでした。profilesテーブルの権限設定を確認してください。";
  }

  return "プロフィールを保存できませんでした。入力内容を確認して、もう一度お試しください。";
}

export async function saveProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Profile auth user lookup failed", {
        message: userError.message,
      });
    }

    redirect(
      pathWithParams("/login", {
        next: "/mypage/profile/edit",
        message: "プロフィールを編集するにはログインしてください。",
      })
    );
  }

  const now = new Date().toISOString();
  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("id, avatar_url")
    .eq("id", user.id)
    .maybeSingle<{ id: string; avatar_url: string | null }>();

  if (existingError) {
    console.error("Profile lookup before save failed", {
      userId: user.id,
      userEmail: user.email ?? null,
      message: existingError.message,
    });
    redirectToEdit("プロフィールの確認に失敗しました。profilesテーブルの権限設定を確認してください。");
  }

  const profilePayload = {
    id: user.id,
    display_name: cleanText(formData.get("display_name")),
    job_type: cleanText(formData.get("job_type")),
    salon_name: cleanText(formData.get("salon_name")),
    region: cleanText(formData.get("region")),
    bio: cleanText(formData.get("bio")),
    avatar_url: existingProfile?.avatar_url ?? null,
    updated_at: now,
    ...(existingProfile ? {} : { created_at: now }),
  };

  const { data: savedProfile, error } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("Profile upsert failed", {
      userId: user.id,
      userEmail: user.email ?? null,
      message: error.message,
    });
    redirectToEdit(profileSaveErrorMessage(error));
  }

  if (savedProfile?.id !== user.id) {
    console.error("Profile save verification failed", {
      userId: user.id,
      savedProfileId: savedProfile?.id ?? null,
    });
    redirectToEdit("プロフィールを保存できませんでした。ログイン中ユーザーとの紐づきを確認してください。");
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/profile/edit");
  redirect(pathWithParams("/mypage", { profile: "updated" }));
}
