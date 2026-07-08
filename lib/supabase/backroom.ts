import type { SupabaseClient } from "@supabase/supabase-js";

export const BACKROOM_CATEGORIES = [
  "営業後トーク",
  "相談",
  "経営",
  "独立",
  "スタッフ",
  "集客",
  "技術",
  "材料",
  "STU",
  "アシスタント",
  "趣味",
  "雑談",
] as const;

export type BackroomCategory = (typeof BACKROOM_CATEGORIES)[number];

export type BackroomAuthorProfile = {
  id: string;
  display_name: string | null;
  job_type: string | null;
  salon_name: string | null;
  region: string | null;
  avatar_url: string | null;
};

export type BackroomPostRecord = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: BackroomCategory;
  created_at: string | null;
  updated_at: string | null;
  is_deleted: boolean | null;
};

export type BackroomPostWithAuthor = BackroomPostRecord & {
  profiles: BackroomAuthorProfile | null;
  comment_count: number;
};

export type BackroomComment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string | null;
  profiles: BackroomAuthorProfile | null;
};

type RawBackroomPost = BackroomPostRecord & {
  profiles: BackroomAuthorProfile | BackroomAuthorProfile[] | null;
};

type RawBackroomComment = Omit<BackroomComment, "profiles"> & {
  profiles: BackroomAuthorProfile | BackroomAuthorProfile[] | null;
};

type BackroomCommentCountRow = {
  post_id: string;
};

const backroomPostSelect = `
  id,
  user_id,
  title,
  body,
  category,
  created_at,
  updated_at,
  is_deleted,
  profiles:user_id (
    id,
    display_name,
    job_type,
    salon_name,
    region,
    avatar_url
  )
`;

const backroomPostBaseSelect = `
  id,
  user_id,
  title,
  body,
  category,
  created_at,
  updated_at,
  is_deleted
`;

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function normalizeProfile(profile: BackroomAuthorProfile | BackroomAuthorProfile[] | null) {
  return Array.isArray(profile) ? profile[0] ?? null : profile;
}

function normalizePosts(data: unknown): BackroomPostWithAuthor[] {
  return ((data ?? []) as RawBackroomPost[]).map((post) => ({
    ...post,
    profiles: normalizeProfile(post.profiles),
    comment_count: 0,
  }));
}

function normalizePost(data: unknown): BackroomPostWithAuthor | null {
  const post = data as RawBackroomPost | null;
  if (post == null) return null;

  return {
    ...post,
    profiles: normalizeProfile(post.profiles),
    comment_count: 0,
  };
}

function normalizeComments(data: unknown): BackroomComment[] {
  return ((data ?? []) as RawBackroomComment[]).map((comment) => ({
    ...comment,
    profiles: normalizeProfile(comment.profiles),
  }));
}

async function withCommentCounts(supabase: SupabaseClient, posts: BackroomPostWithAuthor[]) {
  const postIds = posts.map((post) => post.id);
  if (postIds.length === 0) return posts;

  try {
    const { data, error } = await supabase
      .from("backroom_comments")
      .select("post_id")
      .in("post_id", postIds)
      .eq("is_deleted", false)
      .returns<BackroomCommentCountRow[]>();

    if (error) {
      console.error("Back Room comment count select failed", {
        message: error.message,
      });
      return posts;
    }

    const countByPostId = new Map<string, number>();
    (data ?? []).forEach((comment) => {
      countByPostId.set(comment.post_id, (countByPostId.get(comment.post_id) ?? 0) + 1);
    });

    return posts.map((post) => ({
      ...post,
      comment_count: countByPostId.get(post.id) ?? 0,
    }));
  } catch (error) {
    console.error("Back Room comment count select threw", {
      message: errorMessage(error),
    });
    return posts;
  }
}

export function isBackroomCategory(value: string): value is BackroomCategory {
  return BACKROOM_CATEGORIES.includes(value as BackroomCategory);
}

export function backroomAuthorName(post: BackroomPostWithAuthor) {
  return post.profiles?.display_name?.trim() || post.profiles?.salon_name?.trim() || "プロフィール未設定";
}

export function backroomAuthorMeta(post: BackroomPostWithAuthor) {
  return [post.profiles?.job_type, post.profiles?.salon_name, post.profiles?.region]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(" / ");
}

export function backroomDateLabel(post: Pick<BackroomPostRecord, "created_at">) {
  if (!post.created_at) return "投稿日時未設定";

  const createdAt = new Date(post.created_at);
  if (Number.isNaN(createdAt.getTime())) return "投稿日時未設定";

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(createdAt);
}

export function backroomExcerpt(body: string, maxLength = 84) {
  const singleLine = body.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) return singleLine;
  return `${singleLine.slice(0, maxLength)}...`;
}

export async function listBackroomPosts(supabase: SupabaseClient, limit = 30) {
  try {
    const { data, error } = await supabase
      .from("backroom_posts")
      .select(backroomPostSelect)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Back Room posts joined select failed", {
        message: error.message,
      });

      const fallback = await supabase
        .from("backroom_posts")
        .select(backroomPostBaseSelect)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!fallback.error) {
        return { posts: await withCommentCounts(supabase, normalizePosts(fallback.data)), error: null };
      }

      console.error("Back Room posts fallback select failed", {
        message: fallback.error.message,
      });
    }

    return { posts: await withCommentCounts(supabase, normalizePosts(data)), error };
  } catch (error) {
    console.error("Back Room posts select threw", {
      message: errorMessage(error),
    });
    return { posts: [], error };
  }
}

export async function listUserBackroomPosts(supabase: SupabaseClient, userId: string, limit = 20) {
  try {
    const { data, error } = await supabase
      .from("backroom_posts")
      .select(backroomPostSelect)
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("User Back Room posts joined select failed", {
        userId,
        message: error.message,
      });
    }

    return { posts: await withCommentCounts(supabase, normalizePosts(data)), error };
  } catch (error) {
    console.error("User Back Room posts select threw", {
      userId,
      message: errorMessage(error),
    });
    return { posts: [], error };
  }
}

export async function getBackroomPostById(supabase: SupabaseClient, id: string) {
  try {
    const { data, error } = await supabase
      .from("backroom_posts")
      .select(backroomPostSelect)
      .eq("id", id)
      .eq("is_deleted", false)
      .maybeSingle();

    if (error) {
      console.error("Back Room detail joined select failed", {
        postId: id,
        message: error.message,
      });
    }

    const post = normalizePost(data);
    const withCounts = post ? await withCommentCounts(supabase, [post]) : [];

    return { post: withCounts[0] ?? null, error };
  } catch (error) {
    console.error("Back Room detail select threw", {
      postId: id,
      message: errorMessage(error),
    });
    return { post: null, error };
  }
}

export async function listBackroomComments(supabase: SupabaseClient, postId: string, limit = 80) {
  try {
    const { data, error } = await supabase
      .from("backroom_comments")
      .select(
        `
        id,
        post_id,
        user_id,
        body,
        created_at,
        profiles:user_id (
          id,
          display_name,
          job_type,
          salon_name,
          region,
          avatar_url
        )
      `
      )
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Back Room comments joined select failed", {
        postId,
        message: error.message,
      });
    }

    return { comments: normalizeComments(data), error };
  } catch (error) {
    console.error("Back Room comments select threw", {
      postId,
      message: errorMessage(error),
    });
    return { comments: [], error };
  }
}
