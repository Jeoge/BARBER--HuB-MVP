import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";
import { BACKROOM_IMAGE_BUCKET } from "@/lib/backroomImages";

export const BACKROOM_IMAGE_SIGNED_URL_EXPIRES_IN_SECONDS = 30 * 60;

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

export async function createBackroomSignedUrlMap(paths: string[], context: { operation: string; count?: number }) {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  if (uniquePaths.length === 0) return new Map<string, string>();

  const adminStatus = getSupabaseAdminConfigStatus();
  if (!adminStatus.ready) {
    console.error("Back Room signed image URL generation skipped because admin Supabase config is missing", {
      operation: context.operation,
      imageCount: uniquePaths.length,
      parentCount: context.count ?? null,
      missingCount: adminStatus.missing.length,
    });
    return new Map<string, string>();
  }

  const signedUrlByPath = new Map<string, string>();

  try {
    const adminSupabase = createSupabaseAdminClient();
    const { data, error } = await adminSupabase.storage
      .from(BACKROOM_IMAGE_BUCKET)
      .createSignedUrls(uniquePaths, BACKROOM_IMAGE_SIGNED_URL_EXPIRES_IN_SECONDS);

    if (error) {
      console.error("Back Room signed image URL generation failed", {
        operation: context.operation,
        imageCount: uniquePaths.length,
        parentCount: context.count ?? null,
        message: error.message,
      });
      return signedUrlByPath;
    }

    (data ?? []).forEach((item, index) => {
      const row = item as { path?: string | null; signedUrl?: string | null; error?: { message?: string } | null };
      const path = row.path?.trim() || uniquePaths[index];

      if (path && row.signedUrl && !row.error) {
        signedUrlByPath.set(path, row.signedUrl);
      }
    });
  } catch (error) {
    console.error("Back Room signed image URL generation threw", {
      operation: context.operation,
      imageCount: uniquePaths.length,
      parentCount: context.count ?? null,
      message: errorMessage(error),
    });
  }

  return signedUrlByPath;
}

export async function removeBackroomImageObjects(
  supabase: SupabaseClient,
  paths: string[],
  context: { operation: string; userId: string; parentId: string }
) {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  if (uniquePaths.length === 0) return true;

  try {
    const { error } = await supabase.storage.from(BACKROOM_IMAGE_BUCKET).remove(uniquePaths);

    if (error) {
      console.error("Back Room image cleanup failed", {
        operation: context.operation,
        userId: context.userId,
        parentId: context.parentId,
        count: uniquePaths.length,
        message: error.message,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Back Room image cleanup threw", {
      operation: context.operation,
      userId: context.userId,
      parentId: context.parentId,
      count: uniquePaths.length,
      message: errorMessage(error),
    });
    return false;
  }
}

export async function removeBackroomImageObjectsAsServer(
  paths: string[],
  context: { operation: string; userId: string; parentId: string }
) {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  if (uniquePaths.length === 0) return true;

  const adminStatus = getSupabaseAdminConfigStatus();
  if (!adminStatus.ready) {
    console.error("Back Room server image cleanup skipped because admin Supabase config is missing", {
      operation: context.operation,
      userId: context.userId,
      parentId: context.parentId,
      count: uniquePaths.length,
      missingCount: adminStatus.missing.length,
    });
    return false;
  }

  try {
    const adminSupabase = createSupabaseAdminClient();
    const { error } = await adminSupabase.storage.from(BACKROOM_IMAGE_BUCKET).remove(uniquePaths);

    if (error) {
      console.error("Back Room server image cleanup failed", {
        operation: context.operation,
        userId: context.userId,
        parentId: context.parentId,
        count: uniquePaths.length,
        message: error.message,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Back Room server image cleanup threw", {
      operation: context.operation,
      userId: context.userId,
      parentId: context.parentId,
      count: uniquePaths.length,
      message: errorMessage(error),
    });
    return false;
  }
}
