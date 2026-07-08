"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

const DELETE_ERROR = "Snapを削除できませんでした。少し時間をおいて再度お試しください。";

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
    redirect(pathWithParams("/mypage", { snapError: DELETE_ERROR }));
  }

  // 1) 削除前に「自分のSnapとして存在するか」を確認する。
  //    この時点なら is_deleted=false なので、公開SELECTポリシーで読める。
  const { data: existing, error: findError } = await supabase
    .from("snaps")
    .select("id")
    .eq("id", snapId)
    .eq("author_id", user.id)
    .maybeSingle();

  if (findError) {
    console.error("Failed to look up snap before delete", {
      snapId,
      userId: user.id,
      code: findError.code,
      message: findError.message,
      details: findError.details,
      hint: findError.hint,
    });
    redirect(pathWithParams("/mypage", { snapError: DELETE_ERROR }));
  }

  if (existing == null) {
    console.error("Snap to delete not found or not owned", { snapId, userId: user.id });
    redirect(pathWithParams("/mypage", { snapError: DELETE_ERROR }));
  }

  // 2) ソフト削除。
  //    UPDATEで is_deleted=true にすると、その行は公開SELECTポリシー
  //    (is_deleted=false) の対象外になり読み返せない。そのため .select() は使わず、
  //    error の有無だけで成否を判定する（読み返すと必ず null になり誤判定するため）。
  const { error: updateError } = await supabase
    .from("snaps")
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq("id", snapId)
    .eq("author_id", user.id);

  if (updateError) {
    console.error("Failed to soft delete snap", {
      snapId,
      userId: user.id,
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    });
    redirect(pathWithParams("/mypage", { snapError: DELETE_ERROR }));
  }

  revalidatePath("/");
  revalidatePath("/snap");
  revalidatePath("/mypage");
  revalidatePath(`/posts/${snapId}`);
  redirect(pathWithParams("/mypage", { snap: "deleted" }));
}
