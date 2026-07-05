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

export async function saveProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
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
    redirectToEdit("プロフィールの確認に失敗しました。少し時間をおいてもう一度お試しください。");
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

  const { error } = await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });

  if (error) {
    redirectToEdit("プロフィールを保存できませんでした。入力内容を確認して、もう一度お試しください。");
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/profile/edit");
  redirect(pathWithParams("/mypage", { profile: "updated" }));
}
