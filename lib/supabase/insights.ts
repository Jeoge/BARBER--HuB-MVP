import type { SupabaseClient } from "@supabase/supabase-js";

export type MySnapStats = {
  snapCount: number;
  thanksReceived: number;
  likesReceived: number;
  commentsReceived: number;
};

// 自分の投稿が「他の人から」受け取った反応を集計する。
// - Thanks / いいね / コメント: 個別行を返さないRPCから、自分以外が押した/書いた分。
// ※ 保存数は saved_snaps が本人のみ閲覧のため、投稿者側からは集計できない（設計上プライベート）。
export async function getMySnapStats(supabase: SupabaseClient, userId: string): Promise<MySnapStats> {
  const { data: snaps, error } = await supabase
    .from("snaps")
    .select("id")
    .eq("author_id", userId)
    .eq("is_deleted", false);

  if (error) {
    console.error("my snap ids fetch failed", { userId, message: error.message });
    return { snapCount: 0, thanksReceived: 0, likesReceived: 0, commentsReceived: 0 };
  }

  const ids = (snaps ?? []).map((snap) => snap.id as string);
  if (ids.length === 0) {
    return { snapCount: 0, thanksReceived: 0, likesReceived: 0, commentsReceived: 0 };
  }

  const { data: counts, error: countsError } = await supabase.rpc("get_my_snap_reaction_counts");

  if (countsError) {
    console.error("my snap reaction counts RPC failed", { userId, message: countsError.message });
    return { snapCount: ids.length, thanksReceived: 0, likesReceived: 0, commentsReceived: 0 };
  }

  const rows = (counts ?? []) as Array<{ thanks_count: number; like_count: number; comment_count: number }>;

  return {
    snapCount: ids.length,
    thanksReceived: rows.reduce((sum, row) => sum + Number(row.thanks_count ?? 0), 0),
    likesReceived: rows.reduce((sum, row) => sum + Number(row.like_count ?? 0), 0),
    commentsReceived: rows.reduce((sum, row) => sum + Number(row.comment_count ?? 0), 0),
  };
}
