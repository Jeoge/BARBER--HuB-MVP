"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { allowedSnapUploadContentType, snapUploadFileExtension } from "@/lib/imageValidation";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { isSafetyConfirmed, SAFETY_CONFIRMATION_ERROR, safetyMigrationErrorMessage } from "@/lib/safety";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const MAX_SNAP_IMAGE_COUNT = 4;
const MAX_TOTAL_COMPRESSED_IMAGE_SIZE = 4 * 1024 * 1024;
const SNAP_IMAGE_BUCKET = "snap-images";
const SNAP_DEFAULT_CATEGORY = "日常";

type SnapUploadContentType = "image/jpeg" | "image/webp";

type PreparedSnapImage = {
  file: File;
  displayOrder: number;
  contentType: SnapUploadContentType;
  byteSize: number;
  width: number | null;
  height: number | null;
};

type UploadedSnapImage = PreparedSnapImage & {
  storagePath: string;
  publicUrl: string;
};

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function redirectToSnapPost(params: { error?: string; message?: string }): never {
  redirect(pathWithParams("/post/snap", params));
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;

  return String(error || "");
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

function readUint24LittleEndian(bytes: Uint8Array, offset: number) {
  return bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16);
}

function isJpeg(bytes: Uint8Array) {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isWebp(bytes: Uint8Array) {
  return bytes.length >= 16 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
}

function jpegDimensions(bytes: Uint8Array) {
  if (!isJpeg(bytes)) return null;

  let offset = 2;

  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > bytes.length) break;

    const segmentLength = (bytes[offset] << 8) + bytes[offset + 1];

    if (segmentLength < 2 || offset + segmentLength > bytes.length) break;

    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (isStartOfFrame && segmentLength >= 7) {
      const height = (bytes[offset + 3] << 8) + bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) + bytes[offset + 6];

      return width > 0 && height > 0 ? { width, height } : null;
    }

    offset += segmentLength;
  }

  return null;
}

function webpDimensions(bytes: Uint8Array) {
  if (!isWebp(bytes) || bytes.length < 30) return null;

  const chunkType = ascii(bytes, 12, 16);

  if (chunkType === "VP8X" && bytes.length >= 30) {
    return {
      width: readUint24LittleEndian(bytes, 24) + 1,
      height: readUint24LittleEndian(bytes, 27) + 1,
    };
  }

  if (chunkType === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  if (chunkType === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return {
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
    };
  }

  return null;
}

function imageDimensions(bytes: Uint8Array, contentType: SnapUploadContentType) {
  return contentType === "image/webp" ? webpDimensions(bytes) : jpegDimensions(bytes);
}

function hasExpectedImageSignature(bytes: Uint8Array, contentType: SnapUploadContentType) {
  return contentType === "image/webp" ? isWebp(bytes) : isJpeg(bytes);
}

async function prepareSnapImages(images: File[]): Promise<PreparedSnapImage[]> {
  const preparedImages: PreparedSnapImage[] = [];
  let totalByteSize = 0;

  for (const [index, image] of images.entries()) {
    const contentType = allowedSnapUploadContentType(image);

    if (contentType == null) {
      throw new Error("unsupported_type");
    }

    const bytes = new Uint8Array(await image.arrayBuffer());
    totalByteSize += bytes.byteLength;

    if (totalByteSize > MAX_TOTAL_COMPRESSED_IMAGE_SIZE) {
      throw new Error("total_too_large");
    }

    if (!hasExpectedImageSignature(bytes, contentType)) {
      throw new Error("invalid_signature");
    }

    const dimensions = imageDimensions(bytes, contentType);

    preparedImages.push({
      file: image,
      displayOrder: index,
      contentType,
      byteSize: bytes.byteLength,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
    });
  }

  return preparedImages;
}

function supabaseMessage(error: unknown) {
  return errorMessage(error).toLowerCase();
}

function uploadErrorMessage(error: unknown) {
  const message = supabaseMessage(error);

  if (message.includes("bucket") || message.includes("not found")) {
    return "画像アップロードに失敗しました。しばらく時間をおいて再度お試しください。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "画像アップロードに失敗しました。しばらく時間をおいて再度お試しください。";
  }

  return "画像アップロードに失敗しました。しばらく時間をおいて再度お試しください。";
}

function profileErrorMessage(error: unknown) {
  const message = supabaseMessage(error);

  if (message.includes("row-level security") || message.includes("permission")) {
    return "プロフィール情報を確認できませんでした。しばらく時間をおいて再度お試しください。";
  }

  return "プロフィール情報を確認できませんでした。しばらく時間をおいて再度お試しください。";
}

function insertErrorMessage(error: unknown, hadUploadedImage: boolean) {
  const message = supabaseMessage(error);
  const prefix = hadUploadedImage
    ? "画像アップロード後の投稿保存に失敗しました。"
    : "投稿保存に失敗しました。";

  if (message.includes("foreign key")) {
    return `${prefix}ログイン中ユーザーとプロフィール情報が一致していません。プロフィール設定後に再度お試しください。`;
  }

  if (message.includes("row-level security") || message.includes("permission")) {
    return `${prefix}しばらく時間をおいて再度お試しください。`;
  }

  if (message.includes("null value") && message.includes("id")) {
    return `${prefix}Snap IDの作成に失敗しました。しばらく時間をおいて再度お試しください。`;
  }

  if (message.includes("safety_confirmed_at") || message.includes("guidelines_confirmed") || message.includes("pr_disclosure_checked")) {
    return safetyMigrationErrorMessage("Snap");
  }

  return `${prefix}しばらく時間をおいて再度お試しください。`;
}

async function removeUploadedSnapImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  paths: string[],
  reason: string
) {
  if (paths.length === 0) return;

  try {
    const { error } = await supabase.storage.from(SNAP_IMAGE_BUCKET).remove(paths);

    if (error) {
      console.error("Snap image cleanup failed", {
        userId,
        reason,
        count: paths.length,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("Snap image cleanup threw", {
      userId,
      reason,
      count: paths.length,
      message: errorMessage(error),
    });
  }
}

async function cleanupCreatedSnapAfterImageFailure(
  supabase: Awaited<ReturnType<typeof createClient>>,
  {
    snapId,
    userId,
    uploadedPaths,
    reason,
  }: {
    snapId: string;
    userId: string;
    uploadedPaths: string[];
    reason: string;
  }
) {
  try {
    const { error } = await supabase
      .from("snap_images")
      .delete()
      .eq("snap_id", snapId);

    if (error) {
      console.error("Snap image rows cleanup failed", {
        snapId,
        userId,
        reason,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("Snap image rows cleanup threw", {
      snapId,
      userId,
      reason,
      message: errorMessage(error),
    });
  }

  try {
    const { error } = await supabase
      .from("snaps")
      .update({ is_deleted: true, is_published: false, updated_at: new Date().toISOString() })
      .eq("id", snapId)
      .eq("author_id", userId);

    if (error) {
      console.error("Snap cleanup soft delete failed", {
        snapId,
        userId,
        reason,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("Snap cleanup soft delete threw", {
      snapId,
      userId,
      reason,
      message: errorMessage(error),
    });
  }

  await removeUploadedSnapImages(supabase, userId, uploadedPaths, reason);
}

export async function createSnapAction(formData: FormData) {
  const supabase = await createClient();
  let authResult: Awaited<ReturnType<typeof supabase.auth.getUser>>;

  try {
    authResult = await supabase.auth.getUser();
  } catch (error) {
    console.error("Snap auth user lookup threw", {
      message: errorMessage(error),
    });
    redirectToSnapPost({ error: "ログイン情報を確認できませんでした。もう一度ログインしてからお試しください。" });
  }

  const {
    data: { user },
    error: userError,
  } = authResult;

  if (user == null) {
    if (userError) {
      console.error("Snap auth user lookup failed", {
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: "/post/snap", message: "ログインが必要です。" }));
  }

  let profileResult: Awaited<ReturnType<typeof getAccountProfile>>;

  try {
    profileResult = await getAccountProfile(supabase, user.id);
  } catch (error) {
    console.error("Snap profile lookup threw", {
      userId: user.id,
      message: errorMessage(error),
    });
    redirectToSnapPost({ error: "プロフィール情報を確認できませんでした。しばらく時間をおいて再度お試しください。" });
  }

  const { profile, error: profileError } = profileResult;

  if (profileError) {
    console.error("Snap profile lookup failed", {
      userId: user.id,
      message: errorMessage(profileError),
    });
    redirectToSnapPost({ error: profileErrorMessage(profileError) });
  }

  if (profile == null) {
    const permissionRedirect = getPostPermissionRedirect(null, "snap", "/post/snap");
    redirect(permissionRedirect ?? pathWithParams("/mypage/profile/edit", { error: "プロフィール設定後にSnap投稿できます。" }));
  }

  const permissionRedirect = getPostPermissionRedirect(profile, "snap", "/post/snap");
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }

  if (profile.id !== user.id) {
    console.error("Snap profile id mismatch", {
      userId: user.id,
      profileId: profile.id,
    });
    redirectToSnapPost({ error: "投稿保存に失敗しました：profilesとの紐づきを確認してください。" });
  }

  const caption = cleanText(formData.get("caption"));
  const category = SNAP_DEFAULT_CATEGORY;
  const region = cleanText(formData.get("region")) || profile.region || "";
  const submittedImages = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!caption) {
    redirectToSnapPost({ error: "本文を入力してください。" });
  }

  if (!isSafetyConfirmed(formData, "snapSafetyConfirmed")) {
    redirectToSnapPost({ error: SAFETY_CONFIRMATION_ERROR });
  }

  if (submittedImages.length > MAX_SNAP_IMAGE_COUNT) {
    redirectToSnapPost({ error: "画像は4枚まで選択できます。" });
  }

  let preparedImages: PreparedSnapImage[] = [];

  try {
    preparedImages = await prepareSnapImages(submittedImages);
  } catch (error) {
    console.error("Snap compressed image validation failed", {
      userId: user.id,
      imageCount: submittedImages.length,
      message: errorMessage(error),
    });
    redirectToSnapPost({ error: "画像を圧縮できませんでした。別の写真をお試しください。" });
  }

  const snapId = randomUUID();
  const uploadedImages: UploadedSnapImage[] = [];

  for (const image of preparedImages) {
    const extension = snapUploadFileExtension(image.contentType);
    const uploadPath = `${user.id}/${snapId}/${image.displayOrder}-${Date.now()}-${randomUUID()}.${extension}`;
    let uploadResult: Awaited<ReturnType<ReturnType<typeof supabase.storage.from>["upload"]>>;

    try {
      uploadResult = await supabase.storage
        .from(SNAP_IMAGE_BUCKET)
        .upload(uploadPath, image.file, {
          cacheControl: "604800",
          upsert: false,
          contentType: image.contentType,
        });
    } catch (error) {
      console.error("Snap image upload threw", {
        userId: user.id,
        uploadPath,
        message: errorMessage(error),
      });
      await removeUploadedSnapImages(
        supabase,
        user.id,
        [...uploadedImages.map((uploadedImage) => uploadedImage.storagePath), uploadPath],
        "upload throw"
      );
      redirectToSnapPost({ error: "画像アップロードに失敗しました。画像形式または容量を確認してください。" });
    }

    const { error: uploadError } = uploadResult;

    if (uploadError) {
      console.error("Snap image upload failed", {
        userId: user.id,
        uploadPath,
        message: uploadError.message,
      });
      await removeUploadedSnapImages(
        supabase,
        user.id,
        [...uploadedImages.map((uploadedImage) => uploadedImage.storagePath), uploadPath],
        "upload error"
      );
      redirectToSnapPost({ error: uploadErrorMessage(uploadError) });
    }

    const { data: publicUrlData } = supabase.storage.from(SNAP_IMAGE_BUCKET).getPublicUrl(uploadPath);

    uploadedImages.push({
      ...image,
      storagePath: uploadPath,
      publicUrl: publicUrlData.publicUrl,
    });
  }

  const now = new Date().toISOString();
  const primaryImage = uploadedImages[0] ?? null;
  let insertResult: Awaited<ReturnType<ReturnType<typeof supabase.from>["insert"]>>;

  try {
    insertResult = await supabase.from("snaps").insert({
      id: snapId,
      author_id: user.id,
      caption,
      category,
      region: region || null,
      image_url: primaryImage?.publicUrl ?? null,
      image_path: primaryImage?.storagePath ?? null,
      is_published: uploadedImages.length === 0,
      is_deleted: false,
      safety_confirmed_at: now,
      guidelines_confirmed: true,
      pr_disclosure_checked: true,
      created_at: now,
      updated_at: now,
    });
  } catch (error) {
    console.error("Snap insert threw", {
      userId: user.id,
      profileId: profile.id,
      imageCount: uploadedImages.length,
      message: errorMessage(error),
    });

    await removeUploadedSnapImages(
      supabase,
      user.id,
      uploadedImages.map((uploadedImage) => uploadedImage.storagePath),
      "snap insert throw"
    );

    redirectToSnapPost({ error: "Snapの保存に失敗しました。少し時間をおいて再度お試しください。" });
  }

  const { error } = insertResult;

  if (error) {
    console.error("Snap insert failed", {
      userId: user.id,
      profileId: profile.id,
      imageCount: uploadedImages.length,
      message: error.message,
    });

    await removeUploadedSnapImages(
      supabase,
      user.id,
      uploadedImages.map((uploadedImage) => uploadedImage.storagePath),
      "snap insert error"
    );

    redirectToSnapPost({ error: insertErrorMessage(error, uploadedImages.length > 0) });
  }

  if (uploadedImages.length > 0) {
    const imageRows = uploadedImages.map((image) => ({
      snap_id: snapId,
      storage_path: image.storagePath,
      public_url: image.publicUrl,
      display_order: image.displayOrder,
      width: image.width,
      height: image.height,
      byte_size: image.byteSize,
      mime_type: image.contentType,
    }));

    let imageInsertError: { message: string } | null = null;

    try {
      const imageInsertResult = await supabase.from("snap_images").insert(imageRows);
      imageInsertError = imageInsertResult.error;
    } catch (error) {
      console.error("Snap image rows insert threw", {
        snapId,
        userId: user.id,
        imageCount: uploadedImages.length,
        message: errorMessage(error),
      });
      await cleanupCreatedSnapAfterImageFailure(supabase, {
        snapId,
        userId: user.id,
        uploadedPaths: uploadedImages.map((uploadedImage) => uploadedImage.storagePath),
        reason: "image row insert throw",
      });
      redirectToSnapPost({ error: "Snapの保存に失敗しました。少し時間をおいて再度お試しください。" });
    }

    if (imageInsertError) {
      console.error("Snap image rows insert failed", {
        snapId,
        userId: user.id,
        imageCount: uploadedImages.length,
        message: imageInsertError.message,
      });
      await cleanupCreatedSnapAfterImageFailure(supabase, {
        snapId,
        userId: user.id,
        uploadedPaths: uploadedImages.map((uploadedImage) => uploadedImage.storagePath),
        reason: "image row insert error",
      });
      redirectToSnapPost({ error: insertErrorMessage(imageInsertError, true) });
    }

    let publishError: { message: string } | null = null;

    try {
      const publishResult = await supabase
        .from("snaps")
        .update({ is_published: true, updated_at: now })
        .eq("id", snapId)
        .eq("author_id", user.id);
      publishError = publishResult.error;
    } catch (error) {
      console.error("Snap publish after images threw", {
        snapId,
        userId: user.id,
        imageCount: uploadedImages.length,
        message: errorMessage(error),
      });
      await cleanupCreatedSnapAfterImageFailure(supabase, {
        snapId,
        userId: user.id,
        uploadedPaths: uploadedImages.map((uploadedImage) => uploadedImage.storagePath),
        reason: "publish after images throw",
      });
      redirectToSnapPost({ error: "Snapの保存に失敗しました。少し時間をおいて再度お試しください。" });
    }

    if (publishError) {
      console.error("Snap publish after images failed", {
        snapId,
        userId: user.id,
        imageCount: uploadedImages.length,
        message: publishError.message,
      });
      await cleanupCreatedSnapAfterImageFailure(supabase, {
        snapId,
        userId: user.id,
        uploadedPaths: uploadedImages.map((uploadedImage) => uploadedImage.storagePath),
        reason: "publish after images error",
      });
      redirectToSnapPost({ error: insertErrorMessage(publishError, true) });
    }
  }

  revalidatePath("/");
  revalidatePath("/snap");
  revalidatePath("/mypage");
  revalidatePath(`/posts/${snapId}`);
  redirect(pathWithParams("/snap", { posted: "1" }));
}
