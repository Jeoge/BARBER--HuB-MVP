import type { SupabaseClient } from "@supabase/supabase-js";

// saved_snaps（本人だけのブックマーク）を読むための共通ヘルパー。

export type SavedSnapItem = {
  id: string;
  caption: string | null;
  category: string | null;
  image_url: string | null;
  created_at: string | null;
};

/** userId が snapId を保存済みか。 */
export async function isSnapSaved(supabase: SupabaseClient, userId: string, snapId: string) {
  const { data, error } = await supabase
    .from("saved_snaps")
    .select("snap_id")
    .eq("user_id", userId)
    .eq("snap_id", snapId)
    .maybeSingle<{ snap_id: string }>();

  if (error) {
    console.error("saved lookup failed", { userId, snapId, message: error.message });
    return false;
  }

  return data != null;
}

/** userId が保存したSnap一覧（保存が新しい順・削除済みは除外）。 */
export async function listSavedSnaps(supabase: SupabaseClient, userId: string): Promise<SavedSnapItem[]> {
  const { data: rows, error } = await supabase
    .from("saved_snaps")
    .select("snap_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("saved list failed", { userId, message: error.message });
    return [];
  }

  const ids = (rows ?? []).map((row) => row.snap_id as string);
  if (ids.length === 0) return [];

  const { data: snaps, error: snapError } = await supabase
    .from("snaps")
    .select("id, caption, category, image_url, created_at, is_deleted")
    .in("id", ids)
    .eq("is_deleted", false);

  if (snapError) {
    console.error("saved snaps fetch failed", { userId, message: snapError.message });
    return [];
  }

  const byId = new Map((snaps ?? []).map((snap) => [snap.id as string, snap]));

  // 保存した新しい順を保ちつつ、削除済み（一覧に無いid）は自然に除外される。
  return ids
    .map((id) => byId.get(id))
    .filter((snap): snap is NonNullable<typeof snap> => snap != null)
    .map((snap) => ({
      id: snap.id as string,
      caption: (snap.caption as string | null) ?? null,
      category: (snap.category as string | null) ?? null,
      image_url: (snap.image_url as string | null) ?? null,
      created_at: (snap.created_at as string | null) ?? null,
    }));
}
