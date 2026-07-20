import "server-only";

import { randomUUID } from "crypto";
import { BACKROOM_IMAGE_BUCKET, BACKROOM_IMAGE_MAX_BYTES, BACKROOM_IMAGE_MAX_COUNT, backroomImageStoragePath } from "@/lib/backroomImages";
import {
  allowedBackroomUploadContentType,
  backroomImageDimensions,
  backroomUploadFileExtension,
  hasExpectedBackroomImageSignature,
  type BackroomUploadMimeType,
} from "@/lib/imageValidation";
import { removeBackroomImageObjects } from "@/lib/supabase/backroom-images";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PreparedBackroomImage = {
  file: File;
  contentType: BackroomUploadMimeType;
  byteSize: number;
  width: number;
  height: number;
};

export function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

export function imageErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("too_many")) return "画像は1枚まで選択できます。";
  if (message.includes("too_large")) return "画像は圧縮後2MB以内にしてください。";
  if (message.includes("unsupported_type")) return "JPEG、PNG、WebPの画像だけ投稿できます。HEIC / HEIFはブラウザで変換できる場合だけ利用できます。";
  if (message.includes("invalid_signature") || message.includes("invalid_dimensions")) {
    return "画像を確認できませんでした。別の画像をお試しください。";
  }

  return "画像を確認できませんでした。別の画像をお試しください。";
}

export function submittedBackroomImage(formData: FormData) {
  const images = formData.getAll("image").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (images.length > BACKROOM_IMAGE_MAX_COUNT) throw new Error("too_many");
  return images[0] ?? null;
}

export async function prepareBackroomImage(image: File | null): Promise<PreparedBackroomImage | null> {
  if (image == null) return null;
  if (image.size > BACKROOM_IMAGE_MAX_BYTES) throw new Error("too_large");

  const contentType = allowedBackroomUploadContentType(image);
  if (contentType == null) throw new Error("unsupported_type");

  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!hasExpectedBackroomImageSignature(bytes, contentType)) throw new Error("invalid_signature");

  const dimensions = backroomImageDimensions(bytes, contentType);
  if (dimensions == null) throw new Error("invalid_dimensions");

  return {
    file: image,
    contentType,
    byteSize: bytes.byteLength,
    width: dimensions.width,
    height: dimensions.height,
  };
}

export async function uploadBackroomImage(
  supabase: SupabaseClient,
  kind: "threads" | "comments",
  parentId: string,
  userId: string,
  image: PreparedBackroomImage
) {
  const extension = backroomUploadFileExtension(image.contentType);
  const uploadPath = backroomImageStoragePath(kind, parentId, extension, randomUUID());

  try {
    const { data, error } = await supabase.storage.from(BACKROOM_IMAGE_BUCKET).upload(uploadPath, image.file, {
      cacheControl: "604800",
      upsert: false,
      contentType: image.contentType,
    });

    if (error || data?.path !== uploadPath) {
      console.error("Back Room image upload failed", {
        kind,
        parentId,
        userId,
        message: error?.message ?? "uploaded path verification failed",
      });
      throw new Error("upload_failed");
    }

    return uploadPath;
  } catch (error) {
    if (error instanceof Error && error.message === "upload_failed") throw error;
    console.error("Back Room image upload threw", { kind, parentId, userId, message: errorMessage(error) });
    throw new Error("upload_failed");
  }
}

async function deleteCreatedRow(
  supabase: SupabaseClient,
  table: "backroom_posts" | "backroom_comments",
  id: string,
  userId: string,
  reason: string
) {
  const ownerColumn = table === "backroom_posts" ? "user_id" : "user_id";
  const { error } = await supabase.from(table).delete().eq("id", id).eq(ownerColumn, userId);
  if (!error) return;

  console.error("Back Room created row cleanup delete failed", { table, id, userId, reason, message: error.message });
  const { error: softDeleteError } = await supabase
    .from(table)
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq(ownerColumn, userId);
  if (softDeleteError) {
    console.error("Back Room created row cleanup soft delete failed", { table, id, userId, reason, message: softDeleteError.message });
  }
}

export async function cleanupCreatedBackroomPost(
  supabase: SupabaseClient,
  { postId, userId, uploadedPaths, reason }: { postId: string; userId: string; uploadedPaths: string[]; reason: string }
) {
  await removeBackroomImageObjects(supabase, uploadedPaths, { operation: reason, userId, parentId: postId });

  const { error: imageRowsError } = await supabase.from("backroom_thread_images").delete().eq("thread_id", postId);
  if (imageRowsError) {
    console.error("Back Room thread image rows cleanup failed", { postId, userId, reason, message: imageRowsError.message });
  }

  await deleteCreatedRow(supabase, "backroom_posts", postId, userId, reason);
}

export async function cleanupCreatedBackroomComment(
  supabase: SupabaseClient,
  { commentId, userId, uploadedPaths, reason }: { commentId: string; userId: string; uploadedPaths: string[]; reason: string }
) {
  await removeBackroomImageObjects(supabase, uploadedPaths, { operation: reason, userId, parentId: commentId });

  const { error: imageRowsError } = await supabase.from("backroom_comment_images").delete().eq("comment_id", commentId);
  if (imageRowsError) {
    console.error("Back Room comment image rows cleanup failed", { commentId, userId, reason, message: imageRowsError.message });
  }

  await deleteCreatedRow(supabase, "backroom_comments", commentId, userId, reason);
}
