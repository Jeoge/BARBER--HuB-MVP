"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { topicSlugsForArticleCategory } from "@/lib/articleCategories";
import { pathWithParams } from "@/lib/auth/redirects";
import {
  allowedCompressedUploadContentType,
  compressedUploadFileExtension,
  type CompressedUploadMimeType,
} from "@/lib/imageValidation";
import { isNewsReviewAdminUserId } from "@/lib/news-drafts/review";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { hasSafetyConfirmations, SAFETY_CONFIRMATION_ERROR, safetyMigrationErrorMessage } from "@/lib/safety";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const ARTICLE_SAFETY_FIELDS = ["articleExperienceConfirmed", "articleNoHarmConfirmed", "articlePrDisclosureChecked"];
const ARTICLE_IMAGE_BUCKET = "article-images";
const MAX_ARTICLE_IMAGE_SIZE = 2 * 1024 * 1024;

type PreparedArticleImage = {
  file: File;
  contentType: CompressedUploadMimeType;
  byteSize: number;
  width: number | null;
  height: number | null;
};

type UploadedArticleImage = PreparedArticleImage & {
  storagePath: string;
};

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function redirectToArticlePost(params: { error?: string }): never {
  redirect(pathWithParams("/post/article", params));
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

function imageDimensions(bytes: Uint8Array, contentType: CompressedUploadMimeType) {
  return contentType === "image/webp" ? webpDimensions(bytes) : jpegDimensions(bytes);
}

function hasExpectedImageSignature(bytes: Uint8Array, contentType: CompressedUploadMimeType) {
  return contentType === "image/webp" ? isWebp(bytes) : isJpeg(bytes);
}

async function prepareArticleImage(image: File): Promise<PreparedArticleImage> {
  const contentType = allowedCompressedUploadContentType(image);

  if (contentType == null) {
    throw new Error("unsupported_type");
  }

  const bytes = new Uint8Array(await image.arrayBuffer());

  if (bytes.byteLength <= 0 || bytes.byteLength > MAX_ARTICLE_IMAGE_SIZE) {
    throw new Error("image_too_large");
  }

  if (!hasExpectedImageSignature(bytes, contentType)) {
    throw new Error("invalid_signature");
  }

  const dimensions = imageDimensions(bytes, contentType);

  return {
    file: image,
    contentType,
    byteSize: bytes.byteLength,
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
  };
}

function isMissingEditorPickColumn(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("editor_pick_at") ||
    (message.includes("column") && message.includes("schema cache")) ||
    (message.includes("column") && message.includes("articles"))
  );
}

function articleSaveErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("relation") && message.includes("articles")) {
    return "記事を保存できませんでした。時間をおいて再度お試しください。";
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後に記事投稿できます。先にプロフィールを保存してください。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "記事を保存できませんでした。時間をおいて再度お試しください。";
  }

  if (message.includes("safety_confirmed_at") || message.includes("guidelines_confirmed") || message.includes("pr_disclosure_checked")) {
    return safetyMigrationErrorMessage("記事");
  }

  if (message.includes("editor_pick_at")) {
    return "EDITOR'S PICK設定はまだ利用できません。migration適用後に再度お試しください。";
  }

  return "記事を保存できませんでした。入力内容を確認して、もう一度お試しください。";
}

function imageUploadErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("bucket") || message.includes("not found")) {
    return "画像アップロードに失敗しました。migration適用後に再度お試しください。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "画像アップロードに失敗しました。しばらく時間をおいて再度お試しください。";
  }

  return "画像アップロードに失敗しました。画像形式または容量を確認してください。";
}

async function removeUploadedArticleImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  path: string | null,
  reason: string
) {
  if (!path) return;

  try {
    const { error } = await supabase.storage.from(ARTICLE_IMAGE_BUCKET).remove([path]);

    if (error) {
      console.error("Article image cleanup failed", {
        userId,
        reason,
        count: 1,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("Article image cleanup threw", {
      userId,
      reason,
      count: 1,
      message: errorMessage(error),
    });
  }
}

export async function createArticleAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Article post auth lookup failed", {
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: "/post/article", message: "記事を書くにはログインしてください。" }));
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    console.error("Article post profile lookup failed", {
      userId: user.id,
      message: profileError.message,
    });
    redirectToArticlePost({ error: "プロフィール情報を確認できませんでした。時間をおいて再度お試しください。" });
  }

  if (profile == null) {
    const permissionRedirect = getPostPermissionRedirect(null, "article", "/post/article");
    redirect(permissionRedirect ?? pathWithParams("/mypage/profile/edit", { error: "プロフィール設定後に記事投稿できます。" }));
  }

  const category = cleanText(formData.get("category")) || "経験記事";
  const capability = category === "講習会レポート" || category === "コンクールレポート" ? "report" : "article";
  const permissionRedirect = getPostPermissionRedirect(profile, capability, "/post/article");
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }

  const title = cleanText(formData.get("title"));
  const body = cleanText(formData.get("body"));
  const takeaway = cleanText(formData.get("takeaway"));
  const submittedImages = formData
    .getAll("image")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const canSetEditorPick = isNewsReviewAdminUserId(user.id);
  const editorPickRequested = cleanText(formData.get("editorPick")) === "1";

  if (!title) {
    redirectToArticlePost({ error: "タイトルを入力してください。" });
  }

  if (title.length > 120) {
    redirectToArticlePost({ error: "タイトルは120文字以内で入力してください。" });
  }

  if (!body) {
    redirectToArticlePost({ error: "本文を入力してください。" });
  }

  if (!hasSafetyConfirmations(formData, ARTICLE_SAFETY_FIELDS)) {
    redirectToArticlePost({ error: SAFETY_CONFIRMATION_ERROR });
  }

  if (submittedImages.length > 1) {
    redirectToArticlePost({ error: "写真は1枚だけ選択できます。" });
  }

  if (editorPickRequested && !canSetEditorPick) {
    console.warn("Non-admin article editor pick request ignored", {
      userId: user.id,
    });
  }

  let preparedImage: PreparedArticleImage | null = null;

  if (submittedImages.length === 1) {
    try {
      preparedImage = await prepareArticleImage(submittedImages[0]);
    } catch (error) {
      console.error("Article compressed image validation failed", {
        userId: user.id,
        message: errorMessage(error),
      });
      redirectToArticlePost({ error: "画像を圧縮できませんでした。別の写真をお試しください。" });
    }
  }

  const articleId = randomUUID();
  const now = new Date().toISOString();
  const articleBody = takeaway ? `${body}\n\nこの記事で伝えたいこと\n${takeaway}` : body;
  let uploadedImage: UploadedArticleImage | null = null;

  if (preparedImage) {
    const extension = compressedUploadFileExtension(preparedImage.contentType);
    const uploadPath = `${user.id}/${articleId}/${Date.now()}-${randomUUID()}.${extension}`;
    let uploadResult: Awaited<ReturnType<ReturnType<typeof supabase.storage.from>["upload"]>>;

    try {
      uploadResult = await supabase.storage
        .from(ARTICLE_IMAGE_BUCKET)
        .upload(uploadPath, preparedImage.file, {
          cacheControl: "604800",
          upsert: false,
          contentType: preparedImage.contentType,
        });
    } catch (error) {
      console.error("Article image upload threw", {
        userId: user.id,
        articleId,
        message: errorMessage(error),
      });
      await removeUploadedArticleImage(supabase, user.id, uploadPath, "upload throw");
      redirectToArticlePost({ error: "画像アップロードに失敗しました。画像形式または容量を確認してください。" });
    }

    if (uploadResult.error) {
      console.error("Article image upload failed", {
        userId: user.id,
        articleId,
        message: uploadResult.error.message,
      });
      await removeUploadedArticleImage(supabase, user.id, uploadPath, "upload error");
      redirectToArticlePost({ error: imageUploadErrorMessage(uploadResult.error) });
    }

    uploadedImage = {
      ...preparedImage,
      storagePath: uploadPath,
    };
  }

  const { data, error } = await supabase
    .from("articles")
    .insert({
      id: articleId,
      author_id: user.id,
      title,
      category,
      body: articleBody,
      image_url: null,
      image_path: uploadedImage?.storagePath ?? null,
      is_published: true,
      is_deleted: false,
      safety_confirmed_at: now,
      guidelines_confirmed: true,
      pr_disclosure_checked: true,
      published_at: now,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("Article insert failed", {
      userId: user.id,
      message: error.message,
    });
    await removeUploadedArticleImage(supabase, user.id, uploadedImage?.storagePath ?? null, "article insert error");
    redirectToArticlePost({ error: articleSaveErrorMessage(error) });
  }

  if (data?.id !== articleId) {
    console.error("Article insert verification failed", {
      userId: user.id,
      articleId,
      savedId: data?.id ?? null,
    });
    await removeUploadedArticleImage(supabase, user.id, uploadedImage?.storagePath ?? null, "article insert verification failed");
    redirectToArticlePost({ error: "記事を保存できませんでした。もう一度お試しください。" });
  }

  let editorPickStatus: "1" | "failed" | "unavailable" | undefined;

  if (canSetEditorPick && editorPickRequested) {
    const adminStatus = getSupabaseAdminConfigStatus();

    if (!adminStatus.ready) {
      console.error("Article editor pick update skipped because admin Supabase config is missing", {
        userId: user.id,
        articleId,
        missingCount: adminStatus.missing.length,
      });
      editorPickStatus = "failed";
    } else {
      try {
        const adminSupabase = createSupabaseAdminClient();
        const { error: editorPickError } = await adminSupabase
          .from("articles")
          .update({ editor_pick_at: now, updated_at: now })
          .eq("id", articleId)
          .eq("author_id", user.id);

        if (editorPickError) {
          console.error("Article editor pick update failed", {
            userId: user.id,
            articleId,
            message: editorPickError.message,
          });
          editorPickStatus = isMissingEditorPickColumn(editorPickError) ? "unavailable" : "failed";
        } else {
          editorPickStatus = "1";
        }
      } catch (error) {
        console.error("Article editor pick update threw", {
          userId: user.id,
          articleId,
          message: errorMessage(error),
        });
        editorPickStatus = isMissingEditorPickColumn(error) ? "unavailable" : "failed";
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/mypage");
  revalidatePath(`/profiles/${user.id}`);
  revalidatePath(`/articles/${articleId}`);
  for (const topicSlug of topicSlugsForArticleCategory(category)) {
    revalidatePath(`/topics/${topicSlug}`);
  }
  redirect(pathWithParams(`/articles/${articleId}`, { posted: "1", editorPick: editorPickStatus }));
}
