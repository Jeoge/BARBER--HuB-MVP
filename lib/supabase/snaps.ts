import type { SupabaseClient } from "@supabase/supabase-js";
import { listPublicSnapCommentCounts } from "@/lib/supabase/comments";

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

export type SnapImageRecord = {
  id: string;
  snap_id: string;
  storage_path: string;
  public_url: string;
  display_order: number;
  width: number | null;
  height: number | null;
  byte_size: number | null;
  mime_type: string | null;
  created_at: string | null;
};

export type SnapDisplayImage = {
  id: string;
  url: string;
  storage_path: string | null;
  display_order: number;
  width: number | null;
  height: number | null;
  byte_size: number | null;
  mime_type: string | null;
};

export type SnapWithAuthor = SnapRecord & {
  profiles: SnapAuthorProfile | null;
  images: SnapDisplayImage[];
  thanks_count: number;
  like_count: number;
  comment_count: number;
  viewer_has_thanked: boolean;
  viewer_has_liked: boolean;
};

type RawSnapWithAuthor = SnapRecord & {
  profiles?: SnapAuthorProfile | SnapAuthorProfile[] | null;
  snap_images?: SnapImageRecord | SnapImageRecord[] | null;
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
  ),
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

const snapProfileFallbackSelect = `
  ${snapBaseSelect},
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

function normalizeSnapImages(snap: RawSnapWithAuthor): SnapDisplayImage[] {
  const rawImages = Array.isArray(snap.snap_images)
    ? snap.snap_images
    : snap.snap_images
      ? [snap.snap_images]
      : [];
  const orderedImages = rawImages
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

export function snapDisplayImages(snap: {
  images?: SnapDisplayImage[] | null;
  image_url?: string | null;
  image_path?: string | null;
  id?: string;
}) {
  if (snap.images && snap.images.length > 0) return snap.images.slice(0, 4);

  const fallbackUrl = snap.image_url?.trim();

  if (!fallbackUrl) return [];

  return [
    {
      id: `${snap.id ?? "snap"}-legacy-image`,
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

export function primarySnapImageUrl(snap: Parameters<typeof snapDisplayImages>[0]) {
  return snapDisplayImages(snap)[0]?.url ?? null;
}

function normalizeSnaps(data: unknown): SnapWithAuthor[] {
  return ((data ?? []) as RawSnapWithAuthor[]).map((snap) => ({
    ...snap,
    profiles: Array.isArray(snap.profiles) ? snap.profiles[0] ?? null : snap.profiles ?? null,
    images: normalizeSnapImages(snap),
    thanks_count: 0,
    like_count: 0,
    comment_count: 0,
    viewer_has_thanked: false,
    viewer_has_liked: false,
  }));
}

function normalizeSnap(data: unknown): SnapWithAuthor | null {
  const snap = data as RawSnapWithAuthor | null;
  if (snap == null) return null;

  return {
    ...snap,
    profiles: Array.isArray(snap.profiles) ? snap.profiles[0] ?? null : snap.profiles ?? null,
    images: normalizeSnapImages(snap),
    thanks_count: 0,
    like_count: 0,
    comment_count: 0,
    viewer_has_thanked: false,
    viewer_has_liked: false,
  };
}

type SnapReactionRow = {
  snap_id: string;
  user_id: string;
  reaction_type: string;
};

export type SnapReactionCountRow = {
  snap_id: string;
  thanks_count: number;
  like_count: number;
  comment_count: number;
  total_count: number;
};

function errorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "";
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  if (error instanceof Error) return error.message;
  return String(error || "");
}

type SnapSelectResult = {
  data: unknown;
  error: unknown;
};

type SnapSelectRunner = (columns: string) => Promise<SnapSelectResult>;

const snapSelectAttempts = [
  { label: "joined", columns: snapSelect },
  { label: "profile fallback", columns: snapProfileFallbackSelect },
  { label: "base fallback", columns: snapBaseSelect },
] as const;

async function selectSnapRowsWithFallback(
  runSelect: SnapSelectRunner,
  logLabel: string,
  context: Record<string, string> = {}
): Promise<SnapSelectResult> {
  let finalResult: SnapSelectResult = { data: null, error: null };

  for (const attempt of snapSelectAttempts) {
    try {
      const result = await runSelect(attempt.columns);

      if (result.error == null) return result;

      finalResult = result;
      console.error(`${logLabel} ${attempt.label} select failed`, {
        ...context,
        message: errorMessage(result.error),
      });
    } catch (error) {
      finalResult = { data: null, error };
      console.error(`${logLabel} ${attempt.label} select threw`, {
        ...context,
        message: errorMessage(error),
      });
    }
  }

  return finalResult;
}

export function isMissingSnapReactionsTableError(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  return (
    errorCode(error) === "PGRST205" ||
    (message.includes("snap_reactions") &&
      (message.includes("could not find the table") ||
        message.includes("schema cache") ||
        message.includes("does not exist") ||
        message.includes("relation") ||
        message.includes("not found")))
  );
}

export async function listMySnapReactionCounts(supabase: SupabaseClient): Promise<SnapReactionCountRow[]> {
  const { data, error } = await supabase.rpc("get_my_snap_reaction_counts");

  if (error) {
    console.error("My snap reaction counts RPC failed", {
      message: error.message,
    });
    return [];
  }

  return ((data ?? []) as SnapReactionCountRow[]).map((counts) => ({
    ...counts,
    thanks_count: Number(counts.thanks_count ?? 0),
    like_count: Number(counts.like_count ?? 0),
    comment_count: Number(counts.comment_count ?? 0),
    total_count: Number(counts.total_count ?? 0),
  }));
}

async function withReactionSummaries(supabase: SupabaseClient, snaps: SnapWithAuthor[], viewerId?: string | null) {
  const snapIds = snaps.map((snap) => snap.id).filter((id) => id.length > 0);

  if (snapIds.length === 0) return snaps;

  const commentCounts = await listPublicSnapCommentCounts(supabase);
  const commentCountBySnapId = new Map(commentCounts.map((row) => [row.snap_id, row.comment_count]));

  if (viewerId == null) {
    return snaps.map((snap) => ({
      ...snap,
      comment_count: commentCountBySnapId.get(snap.id) ?? 0,
    }));
  }

  const authorBySnapId = new Map(snaps.map((snap) => [snap.id, snap.author_id]));
  const viewerThankedSnapIds = new Set<string>();
  const viewerLikedSnapIds = new Set<string>();

  try {
    const { data, error } = await supabase
      .from("snap_reactions")
      .select("snap_id, user_id, reaction_type")
      .in("snap_id", snapIds)
      .eq("user_id", viewerId)
      .returns<SnapReactionRow[]>();

    if (error) {
      if (!isMissingSnapReactionsTableError(error)) {
        console.error("Snap reactions select failed", {
          message: error.message,
        });
      }
    } else {
      (data ?? []).forEach((reaction) => {
        const authorId = authorBySnapId.get(reaction.snap_id);

        if (!authorId || reaction.user_id === authorId) return;

        if (reaction.reaction_type === "thanks") viewerThankedSnapIds.add(reaction.snap_id);
        if (reaction.reaction_type === "like") viewerLikedSnapIds.add(reaction.snap_id);
      });
    }
  } catch (error) {
    if (!isMissingSnapReactionsTableError(error)) {
      console.error("Snap reactions select threw", {
        message: errorMessage(error),
      });
    }
  }

  return snaps.map((snap) => ({
    ...snap,
    comment_count: commentCountBySnapId.get(snap.id) ?? 0,
    viewer_has_thanked: viewerId != null && viewerId !== snap.author_id && viewerThankedSnapIds.has(snap.id),
    viewer_has_liked: viewerId != null && viewerId !== snap.author_id && viewerLikedSnapIds.has(snap.id),
  }));
}

export async function listPublishedSnaps(supabase: SupabaseClient, limit = 20, viewerId?: string | null) {
  try {
    const { data, error } = await selectSnapRowsWithFallback(
      async (columns) =>
        await supabase
          .from("snaps")
          .select(columns)
          .eq("is_published", true)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(limit),
      "Published snap"
    );

    return { snaps: await withReactionSummaries(supabase, normalizeSnaps(data), viewerId), error };
  } catch (error) {
    console.error("Published snap select threw", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { snaps: [], error };
  }
}

export async function listUserSnaps(supabase: SupabaseClient, userId: string, limit = 30, viewerId?: string | null) {
  try {
    const { data, error } = await selectSnapRowsWithFallback(
      async (columns) =>
        await supabase
          .from("snaps")
          .select(columns)
          .eq("author_id", userId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(limit),
      "User snap",
      { userId }
    );

    return { snaps: await withReactionSummaries(supabase, normalizeSnaps(data), viewerId), error };
  } catch (error) {
    console.error("User snap select threw", {
      userId,
      message: error instanceof Error ? error.message : String(error),
    });
    return { snaps: [], error };
  }
}

export async function getPublishedSnapById(supabase: SupabaseClient, id: string, viewerId?: string | null) {
  try {
    const { data, error } = await selectSnapRowsWithFallback(
      async (columns) =>
        await supabase
          .from("snaps")
          .select(columns)
          .eq("id", id)
          .eq("is_published", true)
          .eq("is_deleted", false)
          .maybeSingle(),
      "Snap detail",
      { snapId: id }
    );

    const snap = normalizeSnap(data);
    const snapWithReactions = snap ? await withReactionSummaries(supabase, [snap], viewerId) : [];

    return { snap: snapWithReactions[0] ?? null, error };
  } catch (error) {
    console.error("Snap detail select threw", {
      snapId: id,
      message: error instanceof Error ? error.message : String(error),
    });
    return { snap: null, error };
  }
}
