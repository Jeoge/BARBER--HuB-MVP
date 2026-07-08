"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

// Snapの保存/解除サーバーアクション。
// - 保存主(user_id)は必ずサーバー側の auth.uid() を使う。
// - 未ログイン時はログインページへ誘導する。

export type SaveResult = { status: "ok"; saved: boolean } | { status: "error" };

function loginRedirect(): never {
  redirect(pathWithParams("/login", { next: "/snap", message: "保存するにはログインしてください。" }));
}

// 既に保存済みでのinsert（主キー重複）は成功とみなす。
function isDuplicateError(error: { code?: string; message?: string }) {
  return error.code === "23505" || (error.message ?? "").toLowerCase().includes("duplicate");
}

export async function saveSnapAction(snapId: string): Promise<SaveResult> {
  if (!snapId) return { status: "error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) loginRedirect();

  const { error } = await supabase.from("saved_snaps").insert({ user_id: user.id, snap_id: snapId });

  if (error && !isDuplicateError(error)) {
    console.error("save snap failed", { userId: user.id, snapId, message: error.message });
    return { status: "error" };
  }

  revalidatePath("/mypage");
  return { status: "ok", saved: true };
}

export async function unsaveSnapAction(snapId: string): Promise<SaveResult> {
  if (!snapId) return { status: "error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) loginRedirect();

  const { error } = await supabase
    .from("saved_snaps")
    .delete()
    .eq("user_id", user.id)
    .eq("snap_id", snapId);

  if (error) {
    console.error("unsave snap failed", { userId: user.id, snapId, message: error.message });
    return { status: "error" };
  }

  revalidatePath("/mypage");
  return { status: "ok", saved: false };
}
