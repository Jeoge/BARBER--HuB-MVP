"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export async function deleteMySnapAction(formData: FormData) {
  const snapId = String(formData.get("snapId") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect(pathWithParams("/login", { next: "/mypage", message: "ログインが必要です。" }));
  }

  if (!snapId) {
    redirect(pathWithParams("/mypage", { snapError: "Snapを削除できませんでした。少し時間をおいて再度お試しください。" }));
  }

  const { data, error } = await supabase
    .from("snaps")
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq("id", snapId)
    .eq("author_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to soft delete snap", {
      snapId,
      userId: user.id,
      message: error.message,
    });
    redirect(pathWithParams("/mypage", { snapError: "Snapを削除できませんでした。少し時間をおいて再度お試しください。" }));
  }

  if (data == null) {
    console.error("Failed to soft delete snap: no matching owned snap", {
      snapId,
      userId: user.id,
    });
    redirect(pathWithParams("/mypage", { snapError: "Snapを削除できませんでした。少し時間をおいて再度お試しください。" }));
  }

  revalidatePath("/");
  revalidatePath("/snap");
  revalidatePath("/mypage");
  revalidatePath(`/posts/${snapId}`);
  redirect(pathWithParams("/mypage", { snap: "deleted" }));
}
