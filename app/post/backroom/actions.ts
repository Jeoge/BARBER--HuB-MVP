"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { isSafeBackroomImageStoragePath } from "@/lib/backroomImages";
import { cleanupCreatedBackroomPost, imageErrorMessage, prepareBackroomImage, submittedBackroomImage, uploadBackroomImage } from "@/lib/backroomImageServer";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { hasSafetyConfirmations, SAFETY_CONFIRMATION_ERROR, safetyMigrationErrorMessage } from "@/lib/safety";
import { removeBackroomImageObjects, removeBackroomImageObjectsAsServer } from "@/lib/supabase/backroom-images";
import { getBackroomProfile, isBackroomCategory, normalizeBackroomCategory } from "@/lib/supabase/backroom";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const BACKROOM_SAFETY_FIELDS = ["backroomPrivacyConfirmed", "backroomScopeConfirmed"];

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function redirectToBackroomPost(params: { error?: string }): never {
  redirect(pathWithParams("/post/backroom", params));
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function saveErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("relation") && message.includes("backroom_posts")) {
    return "Back Room投稿を保存できませんでした。時間をおいて再度お試しください。";
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後にBack Roomへ投稿できます。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "Back Room投稿を保存できませんでした。時間をおいて再度お試しください。";
  }

  if (message.includes("safety_confirmed_at") || message.includes("guidelines_confirmed") || message.includes("pr_disclosure_checked")) {
    return safetyMigrationErrorMessage("Back Room投稿");
  }

  return "Back Room投稿を保存できませんでした。入力内容を確認して、もう一度お試しください。";
}

export async function createBackroomPostAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Back Room post auth lookup failed", {
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: "/post/backroom", message: "Back Room投稿にはログインしてください。" }));
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    console.error("Back Room post profile lookup failed", {
      userId: user.id,
      message: profileError.message,
    });
    redirectToBackroomPost({ error: "プロフィール情報を確認できませんでした。時間をおいて再度お試しください。" });
  }

  if (profile == null) {
    const permissionRedirect = getPostPermissionRedirect(null, "backroom", "/post/backroom");
    redirect(permissionRedirect ?? pathWithParams("/mypage/profile/edit", { error: "プロフィール設定後にBack Roomへ投稿できます。" }));
  }

  const permissionRedirect = getPostPermissionRedirect(profile, "backroom", "/post/backroom");
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }

  const { profile: backroomProfile, error: backroomProfileError } = await getBackroomProfile(supabase, user.id);

  if (backroomProfileError) {
    console.error("Back Room member profile lookup failed", {
      userId: user.id,
      message: errorMessage(backroomProfileError),
    });
    redirectToBackroomPost({ error: "Back Room参加設定を確認できませんでした。時間をおいて再度お試しください。" });
  }

  if (backroomProfile == null) {
    redirect(pathWithParams("/backroom/setup", { next: "/post/backroom", error: "Back Room専用ニックネームを設定してください。" }));
  }

  const title = cleanText(formData.get("title"));
  const body = cleanText(formData.get("body"));
  const categoryInput = cleanText(formData.get("category"));
  const category = normalizeBackroomCategory(categoryInput);

  if (!title) {
    redirectToBackroomPost({ error: "タイトルを入力してください。" });
  }

  if (title.length > 120) {
    redirectToBackroomPost({ error: "タイトルは120文字以内で入力してください。" });
  }

  if (!body) {
    redirectToBackroomPost({ error: "本文を入力してください。" });
  }

  if (body.length > 6000) {
    redirectToBackroomPost({ error: "本文は6000文字以内で入力してください。" });
  }

  if (!isBackroomCategory(category)) {
    redirectToBackroomPost({ error: "Back Roomカテゴリーを選択してください。" });
  }

  if (!hasSafetyConfirmations(formData, BACKROOM_SAFETY_FIELDS)) {
    redirectToBackroomPost({ error: SAFETY_CONFIRMATION_ERROR });
  }

  let preparedImage: Awaited<ReturnType<typeof prepareBackroomImage>> = null;
  try {
    preparedImage = await prepareBackroomImage(submittedBackroomImage(formData));
  } catch (error) {
    console.error("Back Room thread image validation failed", { userId: user.id, message: errorMessage(error) });
    redirectToBackroomPost({ error: imageErrorMessage(error) });
  }

  const postId = randomUUID();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("backroom_posts")
    .insert({
      id: postId,
      user_id: user.id,
      title,
      body,
      category,
      is_deleted: false,
      safety_confirmed_at: now,
      guidelines_confirmed: true,
      pr_disclosure_checked: false,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("Back Room post insert failed", {
      userId: user.id,
      message: error.message,
    });
    redirectToBackroomPost({ error: saveErrorMessage(error) });
  }

  if (data?.id !== postId) {
    console.error("Back Room post insert verification failed", {
      userId: user.id,
      postId,
      savedId: data?.id ?? null,
    });
    redirectToBackroomPost({ error: "Back Room投稿を保存できませんでした。もう一度お試しください。" });
  }

  if (preparedImage) {
    let uploadPath = "";

    try {
      uploadPath = await uploadBackroomImage(supabase, "threads", postId, user.id, preparedImage);
      const { data: imageRow, error: imageRowError } = await supabase
        .from("backroom_thread_images")
        .insert({
          thread_id: postId,
          storage_path: uploadPath,
          sort_order: 0,
          width: preparedImage.width,
          height: preparedImage.height,
          byte_size: preparedImage.byteSize,
          mime_type: preparedImage.contentType,
        })
        .select("id, storage_path")
        .maybeSingle<{ id: string; storage_path: string }>();

      if (imageRowError || imageRow?.storage_path !== uploadPath) {
        console.error("Back Room thread image row save verification failed", {
          postId,
          userId: user.id,
          message: imageRowError?.message ?? "saved path verification failed",
        });
        await cleanupCreatedBackroomPost(supabase, {
          postId,
          userId: user.id,
          uploadedPaths: [uploadPath],
          reason: "thread image row save failure",
        });
        redirectToBackroomPost({ error: "画像付きBack Room投稿を保存できませんでした。もう一度お試しください。" });
      }
    } catch (error) {
      console.error("Back Room thread image save threw", { postId, userId: user.id, message: errorMessage(error) });
      await cleanupCreatedBackroomPost(supabase, {
        postId,
        userId: user.id,
        uploadedPaths: uploadPath ? [uploadPath] : [],
        reason: "thread image save threw",
      });
      redirectToBackroomPost({
        error: errorMessage(error).includes("upload_failed")
          ? "画像アップロードに失敗しました。画像形式または容量を確認してください。"
          : "画像付きBack Room投稿を保存できませんでした。もう一度お試しください。",
      });
    }
  }

  revalidatePath("/backroom");
  revalidatePath("/mypage");
  revalidatePath(`/profiles/${user.id}`);
  revalidatePath(`/backroom/${postId}`);
  redirect(pathWithParams(`/backroom/${postId}`, { posted: "1" }));
}

export async function deleteBackroomPostAction(formData: FormData) {
  const postId = cleanText(formData.get("postId"));
  if (!postId) redirect("/backroom");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect(pathWithParams("/login", { next: `/backroom/${postId}`, message: "削除にはログインしてください。" }));
  }

  const { data: post, error: postError } = await supabase
    .from("backroom_posts")
    .select("id, user_id")
    .eq("id", postId)
    .maybeSingle<{ id: string; user_id: string }>();

  if (postError || post == null || post.user_id !== user.id) {
    console.error("Back Room post delete authorization failed", { postId, userId: user.id, message: postError?.message ?? "not owner" });
    redirect(pathWithParams(`/backroom/${postId}`, { deleteError: "自分のスレッドだけ削除できます。" }));
  }

  const { data: imageRows, error: imageRowsError } = await supabase
    .from("backroom_thread_images")
    .select("storage_path")
    .eq("thread_id", postId)
    .returns<{ storage_path: string }[]>();

  const missingImageTable = imageRowsError?.message.toLowerCase().includes("relation") && imageRowsError.message.toLowerCase().includes("backroom_thread_images");
  if (imageRowsError && !missingImageTable) {
    console.error("Back Room thread image paths select for delete failed", { postId, userId: user.id, message: imageRowsError.message });
    redirect(pathWithParams(`/backroom/${postId}`, { deleteError: "スレッド画像を確認できませんでした。時間をおいて再度お試しください。" }));
  }

  const invalidThreadImagePath = (imageRows ?? []).some(
    (row) => !isSafeBackroomImageStoragePath(row.storage_path, "threads", postId),
  );
  if (invalidThreadImagePath) {
    console.error("Back Room thread delete found an unsafe image path", { postId, userId: user.id });
    redirect(pathWithParams(`/backroom/${postId}`, { deleteError: "スレッド画像を確認できませんでした。時間をおいて再度お試しください。" }));
  }
  const imagePaths = (imageRows ?? []).map((row) => row.storage_path);
  const { data: comments, error: commentsError } = await supabase
    .from("backroom_comments")
    .select("id")
    .eq("post_id", postId)
    .returns<{ id: string }[]>();
  if (commentsError) {
    console.error("Back Room comment ids select for thread delete failed", { postId, userId: user.id, message: commentsError.message });
    redirect(pathWithParams(`/backroom/${postId}`, { deleteError: "コメントを確認できませんでした。時間をおいて再度お試しください。" }));
  }

  const commentIds = (comments ?? []).map((comment) => comment.id);
  let commentImagePaths: string[] = [];
  if (commentIds.length > 0 && !missingImageTable) {
    const { data: commentImageRows, error: commentImageRowsError } = await supabase
      .from("backroom_comment_images")
      .select("comment_id, storage_path")
      .in("comment_id", commentIds)
      .returns<{ comment_id: string; storage_path: string }[]>();
    if (commentImageRowsError) {
      console.error("Back Room comment image paths select for thread delete failed", { postId, userId: user.id, message: commentImageRowsError.message });
      redirect(pathWithParams(`/backroom/${postId}`, { deleteError: "コメント画像を確認できませんでした。時間をおいて再度お試しください。" }));
    }
    const invalidCommentImagePath = (commentImageRows ?? []).some(
      (row) => !isSafeBackroomImageStoragePath(row.storage_path, "comments", row.comment_id),
    );
    if (invalidCommentImagePath) {
      console.error("Back Room thread delete found an unsafe comment image path", { postId, userId: user.id });
      redirect(pathWithParams(`/backroom/${postId}`, { deleteError: "コメント画像を確認できませんでした。時間をおいて再度お試しください。" }));
    }
    commentImagePaths = (commentImageRows ?? []).map((row) => row.storage_path);
  }

  const removed = await removeBackroomImageObjects(supabase, imagePaths, { operation: "thread delete", userId: user.id, parentId: postId });
  if (!removed) {
    redirect(pathWithParams(`/backroom/${postId}`, { deleteError: "スレッド画像を削除できませんでした。時間をおいて再度お試しください。" }));
  }
  const removedCommentImages = await removeBackroomImageObjectsAsServer(commentImagePaths, { operation: "thread comment image delete", userId: user.id, parentId: postId });
  if (!removedCommentImages) {
    redirect(pathWithParams(`/backroom/${postId}`, { deleteError: "コメント画像を削除できませんでした。時間をおいて再度お試しください。" }));
  }

  const { error } = await supabase.from("backroom_posts").delete().eq("id", postId).eq("user_id", user.id);
  if (error) {
    console.error("Back Room post delete failed", { postId, userId: user.id, message: error.message });
    redirect(pathWithParams(`/backroom/${postId}`, { deleteError: "スレッドを削除できませんでした。時間をおいて再度お試しください。" }));
  }

  revalidatePath("/backroom");
  revalidatePath("/mypage");
  redirect(pathWithParams("/backroom", { deleted: "1" }));
}
