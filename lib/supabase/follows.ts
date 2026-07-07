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

export type FollowingProfileSummary = {
  id: string;
  display_name: string | null;
  job_type: string | null;
  salon_name: string | null;
  region: string | null;
};

/** userId がフォロー中の人のプロフィール一覧（フォローした新しい順）。 */
export async function listFollowingProfiles(
  supabase: SupabaseClient,
  userId: string
): Promise<FollowingProfileSummary[]> {
  const { data: rows, error } = await supabase
    .from("follows")
    .select("following_id, created_at")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("following list failed", { userId, message: error.message });
    return [];
  }

  const ids = (rows ?? []).map((row) => row.following_id as string);
  if (ids.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, job_type, salon_name, region")
    .in("id", ids);

  if (profileError) {
    console.error("following profiles fetch failed", { userId, message: profileError.message });
  }

  const byId = new Map((profiles ?? []).map((profile) => [profile.id as string, profile]));

  // フォロー順を保ったまま、プロフィール未作成の相手もIDだけで残す。
  return ids.map((id) => {
    const profile = byId.get(id);
    return {
      id,
      display_name: (profile?.display_name as string | null) ?? null,
      job_type: (profile?.job_type as string | null) ?? null,
      salon_name: (profile?.salon_name as string | null) ?? null,
      region: (profile?.region as string | null) ?? null,
    };
  });
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
