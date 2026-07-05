"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export async function deleteMySnapAction(formData: FormData) {
  const snapId = String(formData.get("snapId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect(pathWithParams("/login", { next: "/mypage", message: "ログインが必要です。" }));
  }

  if (!snapId) {
    redirect(pathWithParams("/mypage", { snapError: "削除するSnapが見つかりません。" }));
  }

  const { data, error } = await supabase
    .from("snaps")
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq("id", snapId)
    .eq("author_id", user.id)
    .select("id");

  if (error || data == null || data.length === 0) {
    redirect(pathWithParams("/mypage", { snapError: "Snapを削除できませんでした。" }));
  }

  revalidatePath("/");
  revalidatePath("/snap");
  revalidatePath("/mypage");
  redirect(pathWithParams("/mypage", { snap: "deleted" }));
}
