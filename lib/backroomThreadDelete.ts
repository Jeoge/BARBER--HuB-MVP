import type { SupabaseClient } from "@supabase/supabase-js";

export const BACKROOM_DELETE_PAGE_SIZE = 500;
export const BACKROOM_DELETE_COMMENT_ID_CHUNK_SIZE = 200;

export type BackroomDeleteDbError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

export type BackroomImageTableName = "backroom_thread_images" | "backroom_comment_images";

export type ThreadImagePathRow = {
  storage_path: string;
};

export type CommentImagePathRow = {
  comment_id: string;
  storage_path: string;
};

type BackroomDeleteClient = Pick<SupabaseClient, "from">;

function errorReferencesTable(error: BackroomDeleteDbError, tableName: BackroomImageTableName) {
  const errorText = [error.message, error.details, error.hint]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  const escapedTableName = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tableReferencePattern = new RegExp(`(^|[^a-z0-9_])(?:public\\.)?${escapedTableName}([^a-z0-9_]|$)`, "i");

  return tableReferencePattern.test(errorText);
}

export function isMissingBackroomImageTableError(error: BackroomDeleteDbError, tableName: BackroomImageTableName) {
  const code = error.code?.trim().toUpperCase();
  if (code !== "42P01" && code !== "PGRST205") return false;

  return errorReferencesTable(error, tableName);
}

export function deletedExactlyOneBackroomPost(count: number | null) {
  return count === 1;
}

export async function listAllBackroomThreadImagePaths(supabase: BackroomDeleteClient, postId: string) {
  const rows: ThreadImagePathRow[] = [];

  for (let from = 0; ; from += BACKROOM_DELETE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("backroom_thread_images")
      .select("storage_path")
      .eq("thread_id", postId)
      .order("id", { ascending: true })
      .range(from, from + BACKROOM_DELETE_PAGE_SIZE - 1);

    if (error) return { rows, error };

    const page = (data ?? []) as ThreadImagePathRow[];
    rows.push(...page);
    if (page.length < BACKROOM_DELETE_PAGE_SIZE) return { rows, error: null };
  }
}

export async function listAllBackroomCommentIds(supabase: BackroomDeleteClient, postId: string) {
  const ids: string[] = [];

  for (let from = 0; ; from += BACKROOM_DELETE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("backroom_comments")
      .select("id")
      .eq("post_id", postId)
      .order("id", { ascending: true })
      .range(from, from + BACKROOM_DELETE_PAGE_SIZE - 1);

    if (error) return { ids, error };

    const page = (data ?? []) as Array<{ id: string }>;
    ids.push(...page.map((row) => row.id));
    if (page.length < BACKROOM_DELETE_PAGE_SIZE) return { ids, error: null };
  }
}

export async function listAllBackroomCommentImagePaths(supabase: BackroomDeleteClient, commentIds: string[]) {
  const rows: CommentImagePathRow[] = [];
  if (commentIds.length === 0) return { rows, error: null };

  for (let chunkStart = 0; chunkStart < commentIds.length; chunkStart += BACKROOM_DELETE_COMMENT_ID_CHUNK_SIZE) {
    const commentIdChunk = commentIds.slice(chunkStart, chunkStart + BACKROOM_DELETE_COMMENT_ID_CHUNK_SIZE);

    for (let from = 0; ; from += BACKROOM_DELETE_PAGE_SIZE) {
      const { data, error } = await supabase
        .from("backroom_comment_images")
        .select("comment_id, storage_path")
        .in("comment_id", commentIdChunk)
        .order("comment_id", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + BACKROOM_DELETE_PAGE_SIZE - 1);

      if (error) return { rows, error };

      const page = (data ?? []) as CommentImagePathRow[];
      rows.push(...page);
      if (page.length < BACKROOM_DELETE_PAGE_SIZE) break;
    }
  }

  return { rows, error: null };
}
