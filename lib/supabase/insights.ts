import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingSnapReactionsTableError } from "@/lib/supabase/snaps";

export type MySnapStats = {
  snapCount: number;
  thanksReceived: number;
  commentsReceived: number;
};

// 自分の投稿が「他の人から」受け取った反応を集計する。
// - Thanks: snap_reactions（全員SELECT可）から、自分以外が押した分。
// - コメント: snap_comments から、自分以外が書いた分。
// ※ 保存数は saved_snaps が本人のみ閲覧のため、投稿者側からは集計できない（設計上プライベート）。
export async function getMySnapStats(supabase: SupabaseClient, userId: string): Promise<MySnapStats> {
  const { data: snaps, error } = await supabase
    .from("snaps")
    .select("id")
    .eq("author_id", userId)
    .eq("is_deleted", false);

  if (error) {
    console.error("my snap ids fetch failed", { userId, message: error.message });
    return { snapCount: 0, thanksReceived: 0, commentsReceived: 0 };
  }

  const ids = (snaps ?? []).map((snap) => snap.id as string);
  if (ids.length === 0) {
    return { snapCount: 0, thanksReceived: 0, commentsReceived: 0 };
  }

  const [thanks, comments] = await Promise.all([
    supabase
      .from("snap_reactions")
      .select("*", { count: "exact", head: true })
      .in("snap_id", ids)
      .eq("reaction_type", "thanks")
      .neq("user_id", userId),
    supabase
      .from("snap_comments")
      .select("*", { count: "exact", head: true })
      .in("snap_id", ids)
      .neq("user_id", userId),
  ]);

  if (thanks.error && !isMissingSnapReactionsTableError(thanks.error)) {
    console.error("thanks received count failed", { userId, message: thanks.error.message });
  }
  if (comments.error) {
    console.error("comments received count failed", { userId, message: comments.error.message });
  }

  return {
    snapCount: ids.length,
    thanksReceived: thanks.count ?? 0,
    commentsReceived: comments.count ?? 0,
  };
}
