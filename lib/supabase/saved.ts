import type { SupabaseClient } from "@supabase/supabase-js";
import type { SnapDisplayImage, SnapImageRecord } from "@/lib/supabase/snaps";

// saved_snaps（本人だけのブックマーク）を読むための共通ヘルパー。

export type SavedSnapItem = {
  id: string;
  caption: string | null;
  category: string | null;
  image_url: string | null;
  image_path: string | null;
  images: SnapDisplayImage[];
  created_at: string | null;
};

type RawSavedSnap = {
  id: string;
  caption: string | null;
  category: string | null;
  image_url: string | null;
  image_path: string | null;
  created_at: string | null;
  is_deleted: boolean | null;
  snap_images?: SnapImageRecord | SnapImageRecord[] | null;
};

const savedSnapSelect = `
  id,
  caption,
  category,
  image_url,
  image_path,
  created_at,
  is_deleted,
  snap_images (
    id,
    snap_id,
    storage_path,
    public_url,
    display_order,
    width,
    height,
    byte_size,
    mime_type,
    created_at
  )
`;

const savedSnapFallbackSelect = "id, caption, category, image_url, image_path, created_at, is_deleted";

function savedSnapImages(snap: RawSavedSnap): SnapDisplayImage[] {
  const images = Array.isArray(snap.snap_images)
    ? snap.snap_images
    : snap.snap_images
      ? [snap.snap_images]
      : [];
  const orderedImages = images
    .filter((image) => typeof image.public_url === "string" && image.public_url.trim().length > 0)
    .map((image) => ({
      id: image.id,
      url: image.public_url.trim(),
      storage_path: image.storage_path || null,
      display_order: Number(image.display_order ?? 0),
      width: image.width ?? null,
      height: image.height ?? null,
      byte_size: image.byte_size ?? null,
      mime_type: image.mime_type ?? null,
    }))
    .sort((first, second) => first.display_order - second.display_order)
    .slice(0, 4);

  if (orderedImages.length > 0) return orderedImages;

  const fallbackUrl = snap.image_url?.trim();

  if (!fallbackUrl) return [];

  return [
    {
      id: `${snap.id}-legacy-image`,
      url: fallbackUrl,
      storage_path: snap.image_path ?? null,
      display_order: 0,
      width: null,
      height: null,
      byte_size: null,
      mime_type: null,
    },
  ];
}

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
    .select(savedSnapSelect)
    .in("id", ids)
    .eq("is_deleted", false)
    .returns<RawSavedSnap[]>();

  if (snapError) {
    console.error("saved snaps fetch failed", { userId, message: snapError.message });

    const { data: fallbackSnaps, error: fallbackError } = await supabase
      .from("snaps")
      .select(savedSnapFallbackSelect)
      .in("id", ids)
      .eq("is_deleted", false)
      .returns<RawSavedSnap[]>();

    if (fallbackError) {
      console.error("saved snaps fallback fetch failed", { userId, message: fallbackError.message });
      return [];
    }

    const fallbackById = new Map((fallbackSnaps ?? []).map((snap) => [snap.id, snap]));

    return ids
      .map((id) => fallbackById.get(id))
      .filter((snap): snap is RawSavedSnap => snap != null)
      .map((snap) => ({
        id: snap.id,
        caption: snap.caption ?? null,
        category: snap.category ?? null,
        image_url: snap.image_url ?? null,
        image_path: snap.image_path ?? null,
        images: savedSnapImages(snap),
        created_at: snap.created_at ?? null,
      }));
  }

  const byId = new Map((snaps ?? []).map((snap) => [snap.id, snap]));

  // 保存した新しい順を保ちつつ、削除済み（一覧に無いid）は自然に除外される。
  return ids
    .map((id) => byId.get(id))
    .filter((snap): snap is RawSavedSnap => snap != null)
    .map((snap) => ({
      id: snap.id,
      caption: snap.caption ?? null,
      category: snap.category ?? null,
      image_url: snap.image_url ?? null,
      image_path: snap.image_path ?? null,
      images: savedSnapImages(snap),
      created_at: snap.created_at ?? null,
    }));
}
