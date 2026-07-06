import type { SupabaseClient } from "@supabase/supabase-js";

export type SnapAuthorProfile = {
  id: string;
  display_name: string | null;
  job_type: string | null;
  salon_name: string | null;
  region: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export type SnapRecord = {
  id: string;
  author_id: string;
  caption: string | null;
  category: string | null;
  region: string | null;
  image_url: string | null;
  image_path: string | null;
  is_published: boolean | null;
  is_deleted: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type SnapWithAuthor = SnapRecord & {
  profiles: SnapAuthorProfile | null;
};

type RawSnapWithAuthor = SnapRecord & {
  profiles: SnapAuthorProfile | SnapAuthorProfile[] | null;
};

export const snapSelect = `
  id,
  author_id,
  caption,
  category,
  region,
  image_url,
  image_path,
  is_published,
  is_deleted,
  created_at,
  updated_at,
  profiles:author_id (
    id,
    display_name,
    job_type,
    salon_name,
    region,
    bio,
    avatar_url
  )
`;

const snapBaseSelect = `
  id,
  author_id,
  caption,
  category,
  region,
  image_url,
  image_path,
  is_published,
  is_deleted,
  created_at,
  updated_at
`;

export function snapAuthorName(snap: SnapWithAuthor) {
  return snap.profiles?.display_name?.trim() || "プロフィール未設定";
}

export function snapAuthorMeta(snap: SnapWithAuthor) {
  return [snap.profiles?.job_type, snap.profiles?.salon_name, snap.region || snap.profiles?.region]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(" / ");
}

export function snapDateLabel(snap: SnapWithAuthor) {
  if (!snap.created_at) return "投稿日時未設定";
  const createdAt = new Date(snap.created_at);

  if (Number.isNaN(createdAt.getTime())) return "投稿日時未設定";

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(createdAt);
}

function normalizeSnaps(data: unknown): SnapWithAuthor[] {
  return ((data ?? []) as RawSnapWithAuthor[]).map((snap) => ({
    ...snap,
    profiles: Array.isArray(snap.profiles) ? snap.profiles[0] ?? null : snap.profiles,
  }));
}

function normalizeSnap(data: unknown): SnapWithAuthor | null {
  const snap = data as RawSnapWithAuthor | null;
  if (snap == null) return null;

  return {
    ...snap,
    profiles: Array.isArray(snap.profiles) ? snap.profiles[0] ?? null : snap.profiles,
  };
}

export async function listPublishedSnaps(supabase: SupabaseClient, limit = 20) {
  try {
    const { data, error } = await supabase
      .from("snaps")
      .select(snapSelect)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Published snap joined select failed", {
        message: error.message,
      });

      const fallback = await supabase
        .from("snaps")
        .select(snapBaseSelect)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!fallback.error) {
        return { snaps: normalizeSnaps(fallback.data), error: null };
      }

      console.error("Published snap fallback select failed", {
        message: fallback.error.message,
      });
    }

    return { snaps: normalizeSnaps(data), error };
  } catch (error) {
    console.error("Published snap select threw", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { snaps: [], error };
  }
}

export async function listUserSnaps(supabase: SupabaseClient, userId: string, limit = 30) {
  try {
    const { data, error } = await supabase
      .from("snaps")
      .select(snapSelect)
      .eq("author_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("User snap joined select failed", {
        userId,
        message: error.message,
      });

      const fallback = await supabase
        .from("snaps")
        .select(snapBaseSelect)
        .eq("author_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!fallback.error) {
        return { snaps: normalizeSnaps(fallback.data), error: null };
      }

      console.error("User snap fallback select failed", {
        userId,
        message: fallback.error.message,
      });
    }

    return { snaps: normalizeSnaps(data), error };
  } catch (error) {
    console.error("User snap select threw", {
      userId,
      message: error instanceof Error ? error.message : String(error),
    });
    return { snaps: [], error };
  }
}

export async function getPublishedSnapById(supabase: SupabaseClient, id: string) {
  try {
    const { data, error } = await supabase
      .from("snaps")
      .select(snapSelect)
      .eq("id", id)
      .eq("is_published", true)
      .eq("is_deleted", false)
      .maybeSingle();

    if (error) {
      console.error("Snap detail joined select failed", {
        snapId: id,
        message: error.message,
      });

      const fallback = await supabase
        .from("snaps")
        .select(snapBaseSelect)
        .eq("id", id)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .maybeSingle();

      if (!fallback.error) {
        return { snap: normalizeSnap(fallback.data), error: null };
      }

      console.error("Snap detail fallback select failed", {
        snapId: id,
        message: fallback.error.message,
      });
    }

    return { snap: normalizeSnap(data), error };
  } catch (error) {
    console.error("Snap detail select threw", {
      snapId: id,
      message: error instanceof Error ? error.message : String(error),
    });
    return { snap: null, error };
  }
}
