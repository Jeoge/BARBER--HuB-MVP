import type { SupabaseClient } from "@supabase/supabase-js";

// public.follows テーブル (follower_id, following_id, created_at) を読むための共通ヘルパー。
// RLS: select は全員可なので、サーバー・ブラウザどちらのクライアントからでも呼べる。

/** follower が following をフォロー済みかどうか。 */
export async function isFollowing(supabase: SupabaseClient, followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle<{ follower_id: string }>();

  if (error) {
    console.error("follows lookup failed", { followerId, followingId, message: error.message });
    return false;
  }

  return data != null;
}

/** userId のフォロワー数・フォロー中数を数える。 */
export async function getFollowCounts(supabase: SupabaseClient, userId: string) {
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);

  if (followers.error) {
    console.error("follower count failed", { userId, message: followers.error.message });
  }
  if (following.error) {
    console.error("following count failed", { userId, message: following.error.message });
  }

  return {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}
