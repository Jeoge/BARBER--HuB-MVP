"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { isMissingSnapCommentLikesError, listPublicSnapCommentLikeCounts } from "@/lib/supabase/comments";
import { createClient } from "@/lib/supabase/server";

// Snapコメントの投稿/削除。投稿者は必ずサーバー側の auth.uid()。

export type CommentResult = { status: "ok" } | { status: "error"; message: string };
export type CommentLikeResult =
  | { status: "ok"; active: boolean; count: number; message?: string }
  | { status: "error"; message: string; count?: number; active?: boolean };

type SnapCommentForLike = {
  id: string;
  snap_id: string;
  user_id: string;
};

type SnapForCommentLike = {
  id: string;
  is_published: boolean | null;
  is_deleted: boolean | null;
};

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  if (error instanceof Error) return error.message;
  return String(error || "");
}

async function countSnapCommentLikes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  commentId: string
) {
  const counts = await listPublicSnapCommentLikeCounts(supabase, [commentId]);
  return counts.get(commentId) ?? 0;
}

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
  revalidatePath("/");
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
  revalidatePath("/");
  revalidatePath("/snap");
  return { status: "ok" };
}

export async function toggleSnapCommentLikeAction(commentId: string, snapIdHint?: string): Promise<CommentLikeResult> {
  const cleanCommentId = commentId.trim();
  const fallbackSnapPath = snapIdHint ? `/posts/${snapIdHint}` : "/snap";

  if (!cleanCommentId) return { status: "error", message: "コメントが不明です。" };

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Snap comment like auth lookup failed", {
        commentId: cleanCommentId,
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: fallbackSnapPath, message: "コメントにいいねするにはログインしてください。" }));
  }

  const { data: comment, error: commentError } = await supabase
    .from("snap_comments")
    .select("id, snap_id, user_id")
    .eq("id", cleanCommentId)
    .maybeSingle<SnapCommentForLike>();

  if (commentError) {
    console.error("Snap comment like target lookup failed", {
      commentId: cleanCommentId,
      userId: user.id,
      message: commentError.message,
    });
    return { status: "error", message: "コメントを確認できませんでした。" };
  }

  if (comment == null) {
    return { status: "error", message: "このコメントにはいいねできません。" };
  }

  const { data: snap, error: snapError } = await supabase
    .from("snaps")
    .select("id, is_published, is_deleted")
    .eq("id", comment.snap_id)
    .maybeSingle<SnapForCommentLike>();

  if (snapError) {
    console.error("Snap comment like snap lookup failed", {
      commentId: cleanCommentId,
      snapId: comment.snap_id,
      userId: user.id,
      message: snapError.message,
    });
    return { status: "error", message: "コメントを確認できませんでした。" };
  }

  if (snap == null || snap.is_deleted || snap.is_published === false) {
    return { status: "error", message: "このコメントにはいいねできません。" };
  }

  if (comment.user_id === user.id) {
    return {
      status: "error",
      message: "自分のコメントにはいいねできません。",
      count: await countSnapCommentLikes(supabase, comment.id),
      active: false,
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from("snap_comment_likes")
    .select("id")
    .eq("comment_id", comment.id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    if (isMissingSnapCommentLikesError(existingError)) {
      return { status: "error", message: "コメントいいね機能の準備中です。しばらく時間をおいて再度お試しください。" };
    }

    console.error("Snap comment like existing lookup failed", {
      commentId: comment.id,
      userId: user.id,
      message: existingError.message,
    });
    return { status: "error", message: "いいね状態を確認できませんでした。" };
  }

  if (existing) {
    const { error } = await supabase
      .from("snap_comment_likes")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);

    if (error) {
      if (isMissingSnapCommentLikesError(error)) {
        return { status: "error", message: "コメントいいね機能の準備中です。しばらく時間をおいて再度お試しください。" };
      }

      console.error("Snap comment like delete failed", {
        commentId: comment.id,
        userId: user.id,
        message: error.message,
      });
      return { status: "error", message: "いいねを取り消せませんでした。" };
    }

    revalidatePath(`/posts/${comment.snap_id}`);
    revalidatePath("/notifications");

    return {
      status: "ok",
      active: false,
      count: await countSnapCommentLikes(supabase, comment.id),
      message: "いいねを取り消しました。",
    };
  }

  const { error: insertError } = await supabase.from("snap_comment_likes").insert({
    comment_id: comment.id,
    user_id: user.id,
  });

  if (insertError) {
    if (isMissingSnapCommentLikesError(insertError)) {
      return { status: "error", message: "コメントいいね機能の準備中です。しばらく時間をおいて再度お試しください。" };
    }

    console.error("Snap comment like insert failed", {
      commentId: comment.id,
      userId: user.id,
      message: insertError.message,
    });

    if (errorMessage(insertError).toLowerCase().includes("duplicate")) {
      return {
        status: "ok",
        active: true,
        count: await countSnapCommentLikes(supabase, comment.id),
        message: "いいね済みです。",
      };
    }

    return { status: "error", message: "いいねできませんでした。" };
  }

  revalidatePath(`/posts/${comment.snap_id}`);
  revalidatePath("/notifications");

  return {
    status: "ok",
    active: true,
    count: await countSnapCommentLikes(supabase, comment.id),
    message: "コメントにいいねしました。",
  };
}
