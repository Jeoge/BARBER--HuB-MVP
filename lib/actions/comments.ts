"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

// Snapコメントの投稿/削除。投稿者は必ずサーバー側の auth.uid()。

export type CommentResult = { status: "ok" } | { status: "error"; message: string };

export async function addSnapCommentAction(snapId: string, body: string): Promise<CommentResult> {
  const text = body.trim();
  if (!snapId) return { status: "error", message: "投稿先が不明です。" };
  if (text.length === 0) return { status: "error", message: "コメントを入力してください。" };
  if (text.length > 1000) return { status: "error", message: "コメントは1000文字までです。" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect(pathWithParams("/login", { next: `/posts/${snapId}`, message: "コメントするにはログインしてください。" }));
  }

  const { data: snap, error: snapError } = await supabase
    .from("snaps")
    .select("id, is_published, is_deleted")
    .eq("id", snapId)
    .maybeSingle<{ id: string; is_published: boolean | null; is_deleted: boolean | null }>();

  if (snapError) {
    console.error("add comment target lookup failed", { snapId, userId: user.id, message: snapError.message });
    return { status: "error", message: "コメントを投稿できませんでした。" };
  }

  if (snap == null || snap.is_deleted || snap.is_published === false) {
    return { status: "error", message: "このSnapにはコメントできません。" };
  }

  const { error } = await supabase.from("snap_comments").insert({ snap_id: snapId, user_id: user.id, body: text });

  if (error) {
    console.error("add comment failed", { snapId, userId: user.id, message: error.message });
    return { status: "error", message: "コメントを投稿できませんでした。" };
  }

  revalidatePath(`/posts/${snapId}`);
  revalidatePath("/snap");
  revalidatePath("/mypage");
  return { status: "ok" };
}

export async function deleteSnapCommentAction(commentId: string): Promise<CommentResult> {
  if (!commentId) return { status: "error", message: "コメントが不明です。" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) return { status: "error", message: "ログインが必要です。" };

  const { error } = await supabase
    .from("snap_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("delete comment failed", { commentId, userId: user.id, message: error.message });
    return { status: "error", message: "コメントを削除できませんでした。" };
  }

  revalidatePath("/mypage");
  return { status: "ok" };
}
