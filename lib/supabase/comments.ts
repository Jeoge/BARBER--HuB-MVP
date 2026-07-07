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
};

/** Snapのコメント一覧（古い順）＋投稿者プロフィール。 */
export async function listSnapComments(supabase: SupabaseClient, snapId: string): Promise<SnapComment[]> {
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

  if (userIds.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);

  if (profileError) {
    console.error("comment authors fetch failed", { snapId, message: profileError.message });
  }

  const byId = new Map((profiles ?? []).map((profile) => [profile.id as string, profile]));

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
    };
  });
}

/** Snapのコメント数。 */
export async function countSnapComments(supabase: SupabaseClient, snapId: string) {
  const { count, error } = await supabase
    .from("snap_comments")
    .select("*", { count: "exact", head: true })
    .eq("snap_id", snapId);

  if (error) {
    console.error("comment count failed", { snapId, message: error.message });
    return 0;
  }

  return count ?? 0;
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
