"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { isSelectableAccountType } from "@/lib/accountTypes";
import { allowedImageContentType, isAllowedImageFile, safeUploadFileName } from "@/lib/imageValidation";
import {
  isOwnedProfileImagePath,
  profileImageObjectPathFromPublicUrl,
  PROFILE_IMAGE_BUCKET,
  resolveProfileImageIntent,
} from "@/lib/profileImages";
import { createClient } from "@/lib/supabase/server";

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanStoredText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function safeSubmittedJobType(submittedJobType: string | null, existingJobType: string | null) {
  if (submittedJobType == null) return null;
  if (isSelectableAccountType(submittedJobType)) return submittedJobType;
  if (existingJobType != null && submittedJobType === existingJobType) return existingJobType;
  return undefined;
}

function cleanUrl(value: FormDataEntryValue | null) {
  const text = cleanText(value);
  if (text == null) return null;

  const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function redirectToEdit(error: string): never {
  redirect(pathWithParams("/mypage/profile/edit", { error }));
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "";
}

async function uploadProfileImage({
  supabase,
  file,
  userId,
  kind,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  file: File;
  userId: string;
  kind: "avatar" | "cover";
}) {
  if (!isAllowedImageFile(file)) {
    return { path: null, url: null, error: "画像ファイルだけアップロードできます。" };
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    return { path: null, url: null, error: "プロフィール画像は1枚5MB以下で選択してください。" };
  }

  const contentType = allowedImageContentType(file);

  if (contentType == null) {
    return { path: null, url: null, error: "画像ファイルだけアップロードできます。" };
  }

  const uploadPath = `${userId}/${kind}-${Date.now()}-${randomUUID()}-${safeUploadFileName(file.name, contentType, "profile")}`;
  const { error: uploadError } = await supabase.storage.from(PROFILE_IMAGE_BUCKET).upload(uploadPath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });

  if (uploadError) {
    console.error("Profile image upload failed", {
      userId,
      kind,
      message: uploadError.message,
    });
    return { path: null, url: null, error: "プロフィール画像のアップロードに失敗しました。しばらく時間をおいて再度お試しください。" };
  }

  const { data } = supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(uploadPath);

  return { path: uploadPath, url: data.publicUrl, error: null };
}

async function removeProfileImageObjects({
  supabase,
  userId,
  paths,
  operation,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  paths: Array<string | null | undefined>;
  operation: string;
}) {
  const safePaths = [...new Set(paths.filter((path): path is string => Boolean(path) && isOwnedProfileImagePath(path, userId)))];
  if (safePaths.length === 0) return;

  const { error } = await supabase.storage.from(PROFILE_IMAGE_BUCKET).remove(safePaths);
  if (error) {
    console.error("Profile image storage cleanup failed", {
      operation,
      userId,
      pathCount: safePaths.length,
      message: error.message,
    });
  }
}

async function compensateUploadedProfileImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  uploadedPaths: string[]
) {
  await removeProfileImageObjects({
    supabase,
    userId,
    paths: uploadedPaths,
    operation: "upload compensation cleanup",
  });
}

async function cleanupReplacedProfileImages({
  supabase,
  userId,
  previousUrls,
  nextUrls,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  previousUrls: Array<string | null | undefined>;
  nextUrls: Array<string | null | undefined>;
}) {
  const pathFromUrl = (url: string | null | undefined) => {
    const objectPath = profileImageObjectPathFromPublicUrl(url);
    return objectPath && isOwnedProfileImagePath(objectPath, userId) ? objectPath : null;
  };
  const retainedPaths = new Set(nextUrls.map(pathFromUrl).filter((path): path is string => path !== null));
  const oldPaths = previousUrls.map(pathFromUrl).filter((path): path is string => path !== null && !retainedPaths.has(path));

  await removeProfileImageObjects({
    supabase,
    userId,
    paths: oldPaths,
    operation: "replaced profile image cleanup",
  });
}

function profileSaveErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "プロフィールを保存できませんでした。しばらく時間をおいて再度お試しください。";
  }

  if (
    message.includes("shop_address") ||
    message.includes("shop_map_url") ||
    message.includes("website_url") ||
    message.includes("instagram_url") ||
    message.includes("hotpepper_url")
  ) {
    return "プロフィールを保存できませんでした。入力内容を確認して、もう一度お試しください。";
  }

  return "プロフィールを保存できませんでした。入力内容を確認して、もう一度お試しください。";
}

export async function saveProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Profile auth user lookup failed", {
        message: userError.message,
      });
    }

    redirect(
      pathWithParams("/login", {
        next: "/mypage/profile/edit",
        message: "プロフィールを編集するにはログインしてください。",
      })
    );
  }

  const now = new Date().toISOString();
  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("id, job_type, avatar_url, cover_url")
    .eq("id", user.id)
    .maybeSingle<{ id: string; job_type: string | null; avatar_url: string | null; cover_url: string | null }>();

  if (existingError) {
    console.error("Profile lookup before save failed", {
      userId: user.id,
      message: existingError.message,
    });
    redirectToEdit("プロフィールの確認に失敗しました。しばらく時間をおいて再度お試しください。");
  }

  const avatarImageIntentResult = resolveProfileImageIntent({
    libraryValue: formData.get("avatar_image_library"),
    cameraValue: formData.get("avatar_image_camera"),
    remove: formData.get("remove_avatar_image") === "1",
  });
  if (avatarImageIntentResult.error || !avatarImageIntentResult.intent) {
    redirectToEdit(avatarImageIntentResult.error ?? "プロフィール画像の指定を確認してください。");
  }

  const coverImageIntentResult = resolveProfileImageIntent({
    libraryValue: formData.get("cover_image_library"),
    cameraValue: formData.get("cover_image_camera"),
    remove: formData.get("remove_cover_image") === "1",
  });
  if (coverImageIntentResult.error || !coverImageIntentResult.intent) {
    redirectToEdit(coverImageIntentResult.error ?? "カバー写真の指定を確認してください。");
  }

  const avatarImageIntent = avatarImageIntentResult.intent;
  const coverImageIntent = coverImageIntentResult.intent;
  if (!avatarImageIntent || !coverImageIntent) {
    redirectToEdit("写真の指定を確認してください。");
  }

  const submittedJobType = cleanText(formData.get("job_type"));
  const existingJobType = cleanStoredText(existingProfile?.job_type);
  const jobType = safeSubmittedJobType(submittedJobType, existingJobType);

  if (jobType === undefined) {
    redirectToEdit("登録区分は選択肢から選んでください。");
  }

  let avatarUrl = existingProfile?.avatar_url ?? null;
  let coverUrl = existingProfile?.cover_url ?? null;
  const uploadedPaths: string[] = [];

  if (avatarImageIntent.kind === "remove") {
    avatarUrl = null;
  } else if (avatarImageIntent.kind === "replace") {
    const upload = await uploadProfileImage({ supabase, file: avatarImageIntent.file, userId: user.id, kind: "avatar" });

    if (upload.error) {
      await compensateUploadedProfileImages(supabase, user.id, uploadedPaths);
      redirectToEdit(upload.error);
    }
    avatarUrl = upload.url;
    if (upload.path) uploadedPaths.push(upload.path);
  }

  if (coverImageIntent.kind === "remove") {
    coverUrl = null;
  } else if (coverImageIntent.kind === "replace") {
    const upload = await uploadProfileImage({ supabase, file: coverImageIntent.file, userId: user.id, kind: "cover" });

    if (upload.error) {
      await compensateUploadedProfileImages(supabase, user.id, uploadedPaths);
      redirectToEdit(upload.error);
    }
    coverUrl = upload.url;
    if (upload.path) uploadedPaths.push(upload.path);
  }

  const profilePayload = {
    id: user.id,
    display_name: cleanText(formData.get("display_name")),
    job_type: jobType,
    salon_name: cleanText(formData.get("salon_name")),
    region: cleanText(formData.get("region")),
    bio: cleanText(formData.get("bio")),
    shop_address: cleanText(formData.get("shop_address")),
    shop_map_url: cleanUrl(formData.get("shop_map_url")),
    website_url: cleanUrl(formData.get("website_url")),
    instagram_url: cleanUrl(formData.get("instagram_url")),
    youtube_url: cleanUrl(formData.get("youtube_url")),
    tiktok_url: cleanUrl(formData.get("tiktok_url")),
    x_url: cleanUrl(formData.get("x_url")),
    line_url: cleanUrl(formData.get("line_url")),
    hotpepper_url: cleanUrl(formData.get("hotpepper_url")),
    rakuten_url: cleanUrl(formData.get("rakuten_url")),
    booking_url: cleanUrl(formData.get("booking_url")),
    avatar_url: avatarUrl,
    cover_url: coverUrl,
    updated_at: now,
    ...(existingProfile ? {} : { created_at: now }),
  };

  const { data: savedProfile, error } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("Profile upsert failed", {
      userId: user.id,
      message: error.message,
    });
    await compensateUploadedProfileImages(supabase, user.id, uploadedPaths);
    redirectToEdit(profileSaveErrorMessage(error));
  }

  if (savedProfile?.id !== user.id) {
    console.error("Profile save verification failed", {
      userId: user.id,
      savedProfileId: savedProfile?.id ?? null,
    });
    await compensateUploadedProfileImages(supabase, user.id, uploadedPaths);
    redirectToEdit("プロフィールを保存できませんでした。ログイン中ユーザーとの紐づきを確認してください。");
  }

  await cleanupReplacedProfileImages({
    supabase,
    userId: user.id,
    previousUrls: [existingProfile?.avatar_url, existingProfile?.cover_url],
    nextUrls: [avatarUrl, coverUrl],
  });

  revalidatePath("/mypage");
  revalidatePath("/mypage/profile/edit");
  revalidatePath(`/profiles/${user.id}`);
  redirect(pathWithParams("/mypage", { profile: "updated" }));
}
