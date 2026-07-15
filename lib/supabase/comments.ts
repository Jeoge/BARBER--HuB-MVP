import type { SupabaseClient } from "@supabase/supabase-js";

export type SnapCommentAuthor = {
  display_name: string | null;
  avatar_url: string | null;
};

export type SnapComment = {
  id: string;
  snap_id: string;
  user_id: string;
  body: string;
  created_at: string | null;
  author: SnapCommentAuthor | null;
  like_count: number;
  viewer_has_liked: boolean;
};

export type PublicSnapCommentCount = {
  snap_id: string;
  comment_count: number;
};

type SnapCommentLikeCountRow = {
  comment_id: string;
  like_count: number | string;
};

type SnapCommentLikeRow = {
  comment_id: string;
  user_id: string;
};

function errorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "";
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  if (error instanceof Error) return error.message;
  return String(error || "");
}

export function isMissingSnapCommentLikesError(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  return (
    errorCode(error) === "PGRST202" ||
    errorCode(error) === "PGRST205" ||
    ((message.includes("snap_comment_likes") || message.includes("get_public_snap_comment_like_counts")) &&
      (message.includes("could not find") ||
        message.includes("schema cache") ||
        message.includes("does not exist") ||
        message.includes("relation") ||
        message.includes("not found")))
  );
}

export async function listPublicSnapCommentLikeCounts(supabase: SupabaseClient, commentIds: string[]) {
  if (commentIds.length === 0) return new Map<string, number>();

  const { data, error } = await supabase.rpc("get_public_snap_comment_like_counts", {
    p_comment_ids: commentIds,
  });

  if (error) {
    if (!isMissingSnapCommentLikesError(error)) {
      console.error("Public snap comment like counts RPC failed", { message: error.message });
    }

    return new Map<string, number>();
  }

  return new Map(
    ((data ?? []) as SnapCommentLikeCountRow[]).map((row) => [row.comment_id, Number(row.like_count ?? 0)])
  );
}

async function listViewerSnapCommentLikes(supabase: SupabaseClient, commentIds: string[], viewerId?: string | null) {
  if (viewerId == null || commentIds.length === 0) return new Set<string>();

  const { data, error } = await supabase
    .from("snap_comment_likes")
    .select("comment_id, user_id")
    .in("comment_id", commentIds)
    .eq("user_id", viewerId)
    .returns<SnapCommentLikeRow[]>();

  if (error) {
    if (!isMissingSnapCommentLikesError(error)) {
      console.error("Viewer snap comment likes select failed", { message: error.message });
    }

    return new Set<string>();
  }

  return new Set((data ?? []).map((row) => row.comment_id));
}

/** Snapのコメント一覧（古い順）＋投稿者プロフィール。 */
export async function listSnapComments(supabase: SupabaseClient, snapId: string, viewerId?: string | null): Promise<SnapComment[]> {
  const { data: rows, error } = await supabase
    .from("snap_comments")
    .select("id, snap_id, user_id, body, created_at")
    .eq("snap_id", snapId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("comments list failed", { snapId, message: error.message });
    return [];
  }

  const comments = (rows ?? []) as Omit<SnapComment, "author">[];
  const userIds = Array.from(new Set(comments.map((comment) => comment.user_id)));
  const commentIds = comments.map((comment) => comment.id);

  if (userIds.length === 0 || commentIds.length === 0) return [];

  const [profileResult, likeCounts, viewerLikedCommentIds] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds),
    listPublicSnapCommentLikeCounts(supabase, commentIds),
    listViewerSnapCommentLikes(supabase, commentIds, viewerId),
  ]);

  if (profileResult.error) {
    console.error("comment authors fetch failed", { snapId, message: profileResult.error.message });
  }

  const byId = new Map((profileResult.data ?? []).map((profile) => [profile.id as string, profile]));

  return comments.map((comment) => {
    const profile = byId.get(comment.user_id);
    return {
      ...comment,
      author: profile
        ? {
            display_name: (profile.display_name as string | null) ?? null,
            avatar_url: (profile.avatar_url as string | null) ?? null,
          }
        : null,
      like_count: likeCounts.get(comment.id) ?? 0,
      viewer_has_liked: viewerLikedCommentIds.has(comment.id),
    };
  });
}

/** 公開Snapのコメント数を一括取得する。個別コメントやuser_idは返さない。 */
export async function listPublicSnapCommentCounts(supabase: SupabaseClient): Promise<PublicSnapCommentCount[]> {
  const { data, error } = await supabase.rpc("get_public_snap_comment_counts");

  if (!error) {
    return ((data ?? []) as Array<{ snap_id: string; comment_count: number | string }>).map((row) => ({
      snap_id: row.snap_id,
      comment_count: Number(row.comment_count ?? 0),
    }));
  }

  // RPC未適用時もカード単位のN+1には戻さず、公開RLS付きの一括取得へフォールバックする。
  console.error("Public snap comment counts RPC failed", { message: error.message });
  const fallback = await supabase.from("snap_comments").select("snap_id").returns<Array<{ snap_id: string }>>();

  if (fallback.error) {
    console.error("Public snap comment counts fallback failed", { message: fallback.error.message });
    return [];
  }

  const counts = new Map<string, number>();
  (fallback.data ?? []).forEach(({ snap_id }) => {
    counts.set(snap_id, (counts.get(snap_id) ?? 0) + 1);
  });

  return Array.from(counts, ([snap_id, comment_count]) => ({ snap_id, comment_count }));
}

/** 「今日」「◯時間前」などの相対表示。 */
export function commentTimeLabel(createdAt: string | null) {
  if (!createdAt) return "";
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "";

  const diffMs = Date.now() - created.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;

  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}時間前`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;

  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(created);
}
