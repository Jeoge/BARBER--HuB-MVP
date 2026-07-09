"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { allowedImageContentType, isAllowedImageFile, safeUploadFileName } from "@/lib/imageValidation";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { isSafetyConfirmed, SAFETY_CONFIRMATION_ERROR, safetyMigrationErrorMessage } from "@/lib/safety";
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

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;

  return String(error || "");
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
  const category = cleanText(formData.get("category")) || "日常";
  const region = cleanText(formData.get("region")) || profile.region || "";
  const image = formData.get("image");
  let imageUrl: string | null = null;
  let imagePath: string | null = null;

  if (!caption) {
    redirectToSnapPost({ error: "本文を入力してください。" });
  }

  if (!isSafetyConfirmed(formData, "snapSafetyConfirmed")) {
    redirectToSnapPost({ error: SAFETY_CONFIRMATION_ERROR });
  }

  if (image instanceof File && image.size > 0) {
    if (!isAllowedImageFile(image)) {
      redirectToSnapPost({ error: "画像ファイルだけアップロードできます。" });
    }

    if (image.size > MAX_IMAGE_SIZE) {
      redirectToSnapPost({ error: "画像は10MB以下にしてください。" });
    }

    const uploadContentType = allowedImageContentType(image);

    if (uploadContentType == null) {
      redirectToSnapPost({ error: "画像ファイルだけアップロードできます。" });
    }

    const uploadPath = `${user.id}/${Date.now()}-${randomUUID()}-${safeUploadFileName(image.name, uploadContentType, "snap")}`;
    let uploadResult: Awaited<ReturnType<ReturnType<typeof supabase.storage.from>["upload"]>>;

    try {
      uploadResult = await supabase.storage
        .from(SNAP_IMAGE_BUCKET)
        .upload(uploadPath, image, {
          cacheControl: "3600",
          upsert: false,
          contentType: uploadContentType,
        });
    } catch (error) {
      console.error("Snap image upload threw", {
        userId: user.id,
        uploadPath,
        message: errorMessage(error),
      });
      redirectToSnapPost({ error: "画像アップロードに失敗しました。画像形式または容量を確認してください。" });
    }

    const { error: uploadError } = uploadResult;

    if (uploadError) {
      console.error("Snap image upload failed", {
        userId: user.id,
        uploadPath,
        message: uploadError.message,
      });
      redirectToSnapPost({ error: uploadErrorMessage(uploadError) });
    }

    const { data: publicUrlData } = supabase.storage.from(SNAP_IMAGE_BUCKET).getPublicUrl(uploadPath);
    imageUrl = publicUrlData.publicUrl;
    imagePath = uploadPath;
  }

  const now = new Date().toISOString();
  let insertResult: Awaited<ReturnType<ReturnType<typeof supabase.from>["insert"]>>;

  try {
    insertResult = await supabase.from("snaps").insert({
      id: randomUUID(),
      author_id: user.id,
      caption,
      category,
      region: region || null,
      image_url: imageUrl,
      image_path: imagePath,
      is_published: true,
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
      hasImage: Boolean(imagePath),
      message: errorMessage(error),
    });

    if (imagePath) {
      try {
        const { error: removeError } = await supabase.storage.from(SNAP_IMAGE_BUCKET).remove([imagePath]);

        if (removeError) {
          console.error("Snap image cleanup failed after insert throw", {
            userId: user.id,
            imagePath,
            message: removeError.message,
          });
        }
      } catch (cleanupError) {
        console.error("Snap image cleanup threw after insert throw", {
          userId: user.id,
          imagePath,
          message: errorMessage(cleanupError),
        });
      }
    }

    redirectToSnapPost({ error: "Snapの保存に失敗しました。少し時間をおいて再度お試しください。" });
  }

  const { error } = insertResult;

  if (error) {
    console.error("Snap insert failed", {
      userId: user.id,
      profileId: profile.id,
      hasImage: Boolean(imagePath),
      message: error.message,
    });

    if (imagePath) {
      try {
        const { error: removeError } = await supabase.storage.from(SNAP_IMAGE_BUCKET).remove([imagePath]);

        if (removeError) {
          console.error("Snap image cleanup failed after insert error", {
            userId: user.id,
            imagePath,
            message: removeError.message,
          });
        }
      } catch (cleanupError) {
        console.error("Snap image cleanup threw after insert error", {
          userId: user.id,
          imagePath,
          message: errorMessage(cleanupError),
        });
      }
    }

    redirectToSnapPost({ error: insertErrorMessage(error, Boolean(imagePath)) });
  }

  revalidatePath("/");
  revalidatePath("/snap");
  revalidatePath("/mypage");
  redirect(pathWithParams("/snap", { posted: "1" }));
}
