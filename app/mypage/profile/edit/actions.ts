"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const PROFILE_IMAGE_BUCKET = "profile-images";

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

function redirectToEdit(error: string) {
  redirect(pathWithParams("/mypage/profile/edit", { error }));
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "";
}

function isLikelyImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(avif|gif|heic|heif|jpeg|jpg|png|webp)$/i.test(file.name);
}

function contentTypeForUpload(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "heic") return "image/heic";
  if (extension === "heif") return "image/heif";

  return "application/octet-stream";
}

function safeFileName(fileName: string, contentType: string) {
  const extensionFromType = contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const filePart = fileName.split(/[/\\]/).pop() || "";
  const extensionFromName = filePart.includes(".")
    ? filePart.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase()
    : "";
  const extension = extensionFromName || extensionFromType || "jpg";
  const baseName = filePart.replace(/\.[^.]+$/, "");
  const normalizedBase = baseName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const safeBase = normalizedBase || "profile";

  return `${safeBase.slice(0, 72)}.${extension}`.slice(0, 90);
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
  if (!isLikelyImageFile(file)) {
    return { url: null, error: "画像ファイルだけアップロードできます。" };
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    return { url: null, error: "プロフィール画像は1枚5MB以下で選択してください。" };
  }

  const contentType = contentTypeForUpload(file);
  const uploadPath = `${userId}/${kind}-${Date.now()}-${randomUUID()}-${safeFileName(file.name, contentType)}`;
  const { error: uploadError } = await supabase.storage.from(PROFILE_IMAGE_BUCKET).upload(uploadPath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });

  if (uploadError) {
    console.error("Profile image upload failed", {
      userId,
      kind,
      uploadPath,
      message: uploadError.message,
    });
    return { url: null, error: "プロフィール画像のアップロードに失敗しました。Storage設定を確認してください。" };
  }

  const { data } = supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(uploadPath);

  return { url: data.publicUrl, error: null };
}

function profileSaveErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "プロフィールを保存できませんでした。profilesテーブルの権限設定を確認してください。";
  }

  if (
    message.includes("shop_address") ||
    message.includes("shop_map_url") ||
    message.includes("website_url") ||
    message.includes("instagram_url") ||
    message.includes("hotpepper_url")
  ) {
    return "お店情報とSNSリンクの保存に必要なprofilesカラムが未適用です。Supabase SQL Editorで最新migrationを実行してください。";
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
    .select("id, avatar_url, cover_url")
    .eq("id", user.id)
    .maybeSingle<{ id: string; avatar_url: string | null; cover_url: string | null }>();

  if (existingError) {
    console.error("Profile lookup before save failed", {
      userId: user.id,
      userEmail: user.email ?? null,
      message: existingError.message,
    });
    redirectToEdit("プロフィールの確認に失敗しました。profilesテーブルの権限設定を確認してください。");
  }

  const avatarImage = formData.get("avatar_image");
  const coverImage = formData.get("cover_image");
  let avatarUrl = existingProfile?.avatar_url ?? null;
  let coverUrl = existingProfile?.cover_url ?? null;

  if (avatarImage instanceof File && avatarImage.size > 0) {
    const upload = await uploadProfileImage({ supabase, file: avatarImage, userId: user.id, kind: "avatar" });

    if (upload.error) redirectToEdit(upload.error);
    avatarUrl = upload.url;
  }

  if (coverImage instanceof File && coverImage.size > 0) {
    const upload = await uploadProfileImage({ supabase, file: coverImage, userId: user.id, kind: "cover" });

    if (upload.error) redirectToEdit(upload.error);
    coverUrl = upload.url;
  }

  const profilePayload = {
    id: user.id,
    display_name: cleanText(formData.get("display_name")),
    job_type: cleanText(formData.get("job_type")),
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
      userEmail: user.email ?? null,
      message: error.message,
    });
    redirectToEdit(profileSaveErrorMessage(error));
  }

  if (savedProfile?.id !== user.id) {
    console.error("Profile save verification failed", {
      userId: user.id,
      savedProfileId: savedProfile?.id ?? null,
    });
    redirectToEdit("プロフィールを保存できませんでした。ログイン中ユーザーとの紐づきを確認してください。");
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/profile/edit");
  revalidatePath(`/profiles/${user.id}`);
  redirect(pathWithParams("/mypage", { profile: "updated" }));
}
