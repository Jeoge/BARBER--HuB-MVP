"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

// フォロー/フォロー解除のサーバーアクション。
// - フォロー主(follower_id)は必ずログイン中ユーザーの auth.uid() をサーバー側で取得する
//   （クライアントから渡された値は信用しない）。
// - 未ログイン時はログインページへ誘導する。
// - 自分自身へのフォローは行わない（DBのRLSでも禁止されている）。

export type FollowResult = { status: "ok"; following: boolean } | { status: "error" };

function loginRedirect(targetId: string): never {
  redirect(
    pathWithParams("/login", {
      next: `/profiles/${targetId}`,
      message: "フォローするにはログインしてください。",
    })
  );
}

// 既にフォロー済みでのinsert（主キー重複）は成功とみなす。
function isDuplicateError(error: { code?: string; message?: string }) {
  return error.code === "23505" || (error.message ?? "").toLowerCase().includes("duplicate");
}

export async function followAction(targetId: string): Promise<FollowResult> {
  if (!targetId) return { status: "error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) loginRedirect(targetId);
  if (user.id === targetId) return { status: "error" }; // 自分自身は不可

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: targetId,
  });

  if (error && !isDuplicateError(error)) {
    console.error("follow insert failed", { followerId: user.id, targetId, message: error.message });
    return { status: "error" };
  }

  revalidatePath(`/profiles/${targetId}`);
  revalidatePath(`/profiles/${user.id}`);
  revalidatePath("/mypage");
  return { status: "ok", following: true };
}

export async function unfollowAction(targetId: string): Promise<FollowResult> {
  if (!targetId) return { status: "error" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) loginRedirect(targetId);

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetId);

  if (error) {
    console.error("unfollow delete failed", { followerId: user.id, targetId, message: error.message });
    return { status: "error" };
  }

  revalidatePath(`/profiles/${targetId}`);
  revalidatePath(`/profiles/${user.id}`);
  revalidatePath("/mypage");
  return { status: "ok", following: false };
}
