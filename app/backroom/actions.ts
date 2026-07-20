"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import {
  cleanupCreatedBackroomComment,
  errorMessage,
  imageErrorMessage,
  prepareBackroomImage,
  submittedBackroomImage,
  uploadBackroomImageAsServer,
} from "@/lib/backroomImageServer";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { getBackroomProfile } from "@/lib/supabase/backroom";
import { removeBackroomImageObjectsAsServer } from "@/lib/supabase/backroom-images";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function backroomPath(postId: string, params?: Record<string, string | undefined>) {
  return pathWithParams(`/backroom/${postId}`, params ?? {});
}

function commentErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("relation") && message.includes("backroom_comments")) {
    return "コメントを保存できませんでした。時間をおいて再度お試しください。";
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後にコメントできます。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "コメントを保存できませんでした。時間をおいて再度お試しください。";
  }

  return "コメントを保存できませんでした。";
}

export async function createBackroomCommentAction(formData: FormData) {
  const postId = cleanText(formData.get("postId"));
  const body = cleanText(formData.get("body"));

  if (!postId) {
    redirect("/backroom");
  }

  if (body.length > 1000) {
    redirect(backroomPath(postId, { commentError: "コメントは1000文字以内で入力してください。" }));
  }

  let preparedImage: Awaited<ReturnType<typeof prepareBackroomImage>> = null;
  try {
    preparedImage = await prepareBackroomImage(submittedBackroomImage(formData));
  } catch (error) {
    console.error("Back Room comment image validation failed", { postId, message: errorMessage(error) });
    redirect(backroomPath(postId, { commentError: imageErrorMessage(error) }));
  }

  if (!body && preparedImage == null) {
    redirect(backroomPath(postId, { commentError: "本文または画像を入力してください。" }));
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Back Room comment auth lookup failed", {
        postId,
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: `/backroom/${postId}`, message: "コメントにはログインしてください。" }));
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    console.error("Back Room comment profile lookup failed", {
      postId,
      userId: user.id,
      message: profileError.message,
    });
    redirect(backroomPath(postId, { commentError: "プロフィール情報を確認できませんでした。時間をおいて再度お試しください。" }));
  }

  const permissionRedirect = getPostPermissionRedirect(profile, "backroom", `/backroom/${postId}`);
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }

  const { profile: backroomProfile, error: backroomProfileError } = await getBackroomProfile(supabase, user.id);

  if (backroomProfileError) {
    console.error("Back Room comment member profile lookup failed", {
      postId,
      userId: user.id,
      message: errorMessage(backroomProfileError),
    });
    redirect(backroomPath(postId, { commentError: "Back Room参加設定を確認できませんでした。時間をおいて再度お試しください。" }));
  }

  if (backroomProfile == null) {
    redirect(pathWithParams("/backroom/setup", { next: `/backroom/${postId}`, error: "Back Room専用ニックネームを設定してください。" }));
  }

  const commentId = randomUUID();

  if (preparedImage) {
    let uploadPath = "";
    let imageSaveError: string | null = null;

    try {
      uploadPath = await uploadBackroomImageAsServer("comments", commentId, user.id, preparedImage);
      const { data: commentRow, error: commentRowError } = await supabase
        .rpc("create_backroom_image_comment", {
          p_comment_id: commentId,
          p_post_id: postId,
          p_body: body || null,
          p_storage_path: uploadPath,
          p_sort_order: 0,
          p_width: preparedImage.width,
          p_height: preparedImage.height,
          p_byte_size: preparedImage.byteSize,
          p_mime_type: preparedImage.contentType,
        })
        .maybeSingle<{ id: string }>();

      if (commentRowError || commentRow?.id !== commentId) {
        console.error("Back Room image comment RPC verification failed", {
          postId,
          commentId,
          userId: user.id,
          message: commentRowError?.message ?? "saved comment id verification failed",
        });
        imageSaveError = "画像付きコメントを保存できませんでした。もう一度お試しください。";
      }
    } catch (error) {
      console.error("Back Room comment image save threw", { postId, commentId, userId: user.id, message: errorMessage(error) });
      imageSaveError = errorMessage(error).includes("upload_failed")
        ? "画像アップロードに失敗しました。画像形式または容量を確認してください。"
        : "画像付きコメントを保存できませんでした。もう一度お試しください。";
    }

    if (imageSaveError) {
      await removeBackroomImageObjectsAsServer(uploadPath ? [uploadPath] : [], {
        operation: "comment image compensation cleanup",
        userId: user.id,
        parentId: commentId,
      });
      await cleanupCreatedBackroomComment(supabase, {
        commentId,
        userId: user.id,
        uploadedPaths: [],
        reason: "comment image RPC failure",
      });
      redirect(backroomPath(postId, { commentError: imageSaveError }));
    }
  } else {
    const now = new Date().toISOString();
    const { data: commentRow, error } = await supabase
      .from("backroom_comments")
      .insert({
        id: commentId,
        post_id: postId,
        user_id: user.id,
        body,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      console.error("Back Room comment insert failed", {
        postId,
        userId: user.id,
        message: error.message,
      });
      redirect(backroomPath(postId, { commentError: commentErrorMessage(error) }));
    }

    if (commentRow?.id !== commentId) {
      console.error("Back Room comment insert verification failed", { postId, commentId, userId: user.id });
      redirect(backroomPath(postId, { commentError: "コメントを保存できませんでした。もう一度お試しください。" }));
    }
  }

  revalidatePath("/backroom");
  revalidatePath("/mypage");
  revalidatePath(`/backroom/${postId}`);
  redirect(backroomPath(postId, { comment: "posted" }));
}
