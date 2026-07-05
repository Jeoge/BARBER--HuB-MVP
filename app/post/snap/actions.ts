"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const SNAP_IMAGE_BUCKET = "snap-images";

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function redirectToSnapPost(params: { error?: string; message?: string }): never {
  redirect(pathWithParams("/post/snap", params));
}

function supabaseMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message.toLowerCase();
  }

  return "";
}

function uploadErrorMessage(error: unknown) {
  const message = supabaseMessage(error);

  if (message.includes("bucket") || message.includes("not found")) {
    return "画像アップロードに失敗しました。Storage bucket「snap-images」が見つからない可能性があります。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "画像アップロードに失敗しました。Storageの権限設定を確認してください。";
  }

  return "画像アップロードに失敗しました。しばらく時間をおいて再度お試しください。";
}

function profileErrorMessage(error: unknown) {
  const message = supabaseMessage(error);

  if (message.includes("row-level security") || message.includes("permission")) {
    return "プロフィール情報を確認できませんでした。profilesテーブルの権限設定を確認してください。";
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
    return `${prefix}snapsテーブルの権限設定を確認してください。`;
  }

  if (message.includes("null value") && message.includes("id")) {
    return `${prefix}Snap IDの作成に失敗しました。しばらく時間をおいて再度お試しください。`;
  }

  return `${prefix}しばらく時間をおいて再度お試しください。`;
}

function safeFileName(fileName: string, contentType: string) {
  const extensionFromType = contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const normalized = fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const fallback = `snap.${extensionFromType || "jpg"}`;
  const safeName = normalized || fallback;

  return safeName.slice(0, 90);
}

export async function createSnapAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect(pathWithParams("/login", { next: "/post/snap", message: "ログインが必要です。" }));
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    redirectToSnapPost({ error: profileErrorMessage(profileError) });
  }

  if (profile == null) {
    redirectToSnapPost({ error: "プロフィール設定後にSnap投稿できます。" });
  }

  const caption = cleanText(formData.get("caption"));
  const category = cleanText(formData.get("category")) || "日常";
  const region = cleanText(formData.get("region")) || profile.region || "";
  const image = formData.get("image");
  let imageUrl: string | null = null;
  let imagePath: string | null = null;

  if (!caption) {
    redirectToSnapPost({ error: "本文を入力してください。" });
  }

  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      redirectToSnapPost({ error: "画像ファイルだけアップロードできます。" });
    }

    if (image.size > MAX_IMAGE_SIZE) {
      redirectToSnapPost({ error: "画像は10MB以下にしてください。" });
    }

    const uploadPath = `${user.id}/${Date.now()}-${safeFileName(image.name, image.type)}`;
    const { error: uploadError } = await supabase.storage
      .from(SNAP_IMAGE_BUCKET)
      .upload(uploadPath, image, {
        cacheControl: "3600",
        upsert: false,
        contentType: image.type,
      });

    if (uploadError) {
      redirectToSnapPost({ error: uploadErrorMessage(uploadError) });
    }

    const { data: publicUrlData } = supabase.storage.from(SNAP_IMAGE_BUCKET).getPublicUrl(uploadPath);
    imageUrl = publicUrlData.publicUrl;
    imagePath = uploadPath;
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("snaps").insert({
    id: randomUUID(),
    author_id: user.id,
    caption,
    category,
    region: region || null,
    image_url: imageUrl,
    image_path: imagePath,
    is_published: true,
    is_deleted: false,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    if (imagePath) {
      await supabase.storage.from(SNAP_IMAGE_BUCKET).remove([imagePath]);
    }

    redirectToSnapPost({ error: insertErrorMessage(error, Boolean(imagePath)) });
  }

  revalidatePath("/");
  revalidatePath("/snap");
  revalidatePath("/mypage");
  redirect(pathWithParams("/post/snap", { message: "posted" }));
}
