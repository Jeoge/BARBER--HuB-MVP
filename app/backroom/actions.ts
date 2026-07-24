"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import {
  deletedExactlyOneBackroomPost,
  isMissingBackroomImageTableError,
  listAllBackroomCommentIds,
  listAllBackroomCommentImagePaths,
  listAllBackroomThreadImagePaths,
  type BackroomDeleteDbError,
} from "@/lib/backroomThreadDelete";
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
import { isSafeBackroomImageStoragePath } from "@/lib/backroomImages";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type BackroomCommentLikeState = { count: number; liked: boolean; error?: string };

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function backroomPath(postId: string, params?: Record<string, string | undefined>) {
  return pathWithParams(`/backroom/${postId}`, params ?? {});
}

function backroomDeleteFailurePath() {
  return pathWithParams("/mypage", { backroomDeleteError: "1" });
}

function logBackroomDeleteDbError(
  label: string,
  operation: string,
  context: { postId: string; userId: string; threadImageCount?: number; commentCount?: number; commentImageCount?: number },
  error: BackroomDeleteDbError
) {
  console.error(label, {
    operation,
    ...context,
    code: error.code ?? "unknown",
    message: error.message ?? "unknown",
    details: error.details ?? null,
    hint: error.hint ?? null,
  });
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

export async function deleteBackroomPostAction(formData: FormData) {
  const postId = cleanText(formData.get("postId"));

  if (!UUID_PATTERN.test(postId)) {
    console.error("Back Room thread deletion rejected invalid post id", {
      operation: "backroom thread deletion input validation",
      postIdProvided: Boolean(postId),
      postIdLength: postId.length,
    });
    redirect(backroomDeleteFailurePath());
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Back Room thread deletion auth lookup failed", {
        operation: "backroom thread deletion auth lookup",
        postId,
        message: userError.message,
      });
    }

    redirect(
      pathWithParams("/login", {
        next: "/mypage",
        message: "スレッドの削除にはログインしてください。",
      })
    );
  }

  const { data: ownedPost, error: ownedPostError } = await supabase
    .from("backroom_posts")
    .select("id, user_id")
    .eq("id", postId)
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .maybeSingle<{ id: string; user_id: string; category: string }>();

  if (ownedPostError) {
    logBackroomDeleteDbError(
      "Back Room thread deletion ownership lookup failed",
      "backroom thread deletion ownership lookup",
      { postId, userId: user.id },
      ownedPostError
    );
    redirect(backroomDeleteFailurePath());
  }

  if (ownedPost == null) {
    console.error("Back Room thread deletion ownership verification failed", {
      operation: "backroom thread deletion ownership verification",
      postId,
      userId: user.id,
      matchedPostCount: 0,
    });
    redirect(backroomDeleteFailurePath());
  }

  let threadImageResult = await listAllBackroomThreadImagePaths(supabase, postId);
  if (threadImageResult.error) {
    if (isMissingBackroomImageTableError(threadImageResult.error, "backroom_thread_images")) {
      console.warn("Back Room thread deletion continuing without thread image metadata", {
        operation: "backroom thread deletion thread image lookup",
        code: threadImageResult.error.code ?? "unknown",
        table: "backroom_thread_images",
      });
      threadImageResult = { rows: [], error: null };
    } else {
      logBackroomDeleteDbError(
        "Back Room thread deletion image path lookup failed",
        "backroom thread deletion thread image lookup",
        { postId, userId: user.id, threadImageCount: threadImageResult.rows.length },
        threadImageResult.error
      );
      redirect(backroomDeleteFailurePath());
    }
  }

  const commentIdResult = await listAllBackroomCommentIds(supabase, postId);
  if (commentIdResult.error) {
    logBackroomDeleteDbError(
      "Back Room thread deletion comment lookup failed",
      "backroom thread deletion comment lookup",
      {
        postId,
        userId: user.id,
        threadImageCount: threadImageResult.rows.length,
        commentCount: commentIdResult.ids.length,
      },
      commentIdResult.error
    );
    redirect(backroomDeleteFailurePath());
  }

  if (commentIdResult.ids.some((commentId) => !UUID_PATTERN.test(commentId))) {
    console.error("Back Room thread deletion comment id validation failed", {
      operation: "backroom thread deletion comment id validation",
      postId,
      userId: user.id,
      threadImageCount: threadImageResult.rows.length,
      commentCount: commentIdResult.ids.length,
    });
    redirect(backroomDeleteFailurePath());
  }

  let commentImageResult = await listAllBackroomCommentImagePaths(supabase, commentIdResult.ids);
  if (commentImageResult.error) {
    if (isMissingBackroomImageTableError(commentImageResult.error, "backroom_comment_images")) {
      console.warn("Back Room thread deletion continuing without comment image metadata", {
        operation: "backroom thread deletion comment image lookup",
        code: commentImageResult.error.code ?? "unknown",
        table: "backroom_comment_images",
      });
      commentImageResult = { rows: [], error: null };
    } else {
      logBackroomDeleteDbError(
        "Back Room thread deletion comment image path lookup failed",
        "backroom thread deletion comment image lookup",
        {
          postId,
          userId: user.id,
          threadImageCount: threadImageResult.rows.length,
          commentCount: commentIdResult.ids.length,
          commentImageCount: commentImageResult.rows.length,
        },
        commentImageResult.error
      );
      redirect(backroomDeleteFailurePath());
    }
  }

  const threadPathsAreSafe = threadImageResult.rows.every(
    (row) => typeof row.storage_path === "string" && isSafeBackroomImageStoragePath(row.storage_path, "threads", postId)
  );
  const commentPathsAreSafe = commentImageResult.rows.every(
    (row) =>
      typeof row.comment_id === "string" &&
      typeof row.storage_path === "string" &&
      isSafeBackroomImageStoragePath(row.storage_path, "comments", row.comment_id)
  );

  if (!threadPathsAreSafe || !commentPathsAreSafe) {
    console.error("Back Room thread deletion image path validation failed", {
      operation: "backroom thread deletion image path validation",
      postId,
      userId: user.id,
      threadImageCount: threadImageResult.rows.length,
      commentCount: commentIdResult.ids.length,
      commentImageCount: commentImageResult.rows.length,
    });
    redirect(backroomDeleteFailurePath());
  }

  const { error: deleteError, count: deletedPostCount } = await supabase
    .from("backroom_posts")
    .delete({ count: "exact" })
    .eq("id", postId)
    .eq("user_id", user.id)
    .eq("is_deleted", false);

  if (deleteError) {
    logBackroomDeleteDbError(
      "Back Room thread deletion failed",
      "backroom thread deletion database delete",
      {
        postId,
        userId: user.id,
        threadImageCount: threadImageResult.rows.length,
        commentCount: commentIdResult.ids.length,
        commentImageCount: commentImageResult.rows.length,
      },
      deleteError
    );
    redirect(backroomDeleteFailurePath());
  }

  if (!deletedExactlyOneBackroomPost(deletedPostCount)) {
    console.error("Back Room thread deletion result verification failed", {
      operation: "backroom thread deletion database result verification",
      postId,
      userId: user.id,
      deletedPostCount,
      threadImageCount: threadImageResult.rows.length,
      commentCount: commentIdResult.ids.length,
      commentImageCount: commentImageResult.rows.length,
    });
    redirect(backroomDeleteFailurePath());
  }

  const storagePaths = Array.from(
    new Set([
      ...threadImageResult.rows.map((row) => row.storage_path),
      ...commentImageResult.rows.map((row) => row.storage_path),
    ])
  );
  const storageRemoved = await removeBackroomImageObjectsAsServer(storagePaths, {
    operation: "backroom thread deletion storage cleanup",
    userId: user.id,
    parentId: postId,
  });

  if (!storageRemoved) {
    console.error("Back Room thread deletion storage cleanup incomplete", {
      operation: "backroom thread deletion storage cleanup",
      postId,
      userId: user.id,
      imageCount: storagePaths.length,
    });
  }

  revalidatePath("/backroom");
  revalidatePath("/mypage");
  revalidatePath(`/backroom/${postId}`);
  revalidatePath(`/profiles/${user.id}`);
  redirect(pathWithParams("/mypage", { backroomDelete: "deleted" }));
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

export async function toggleBackroomCommentLikeAction(previousState: BackroomCommentLikeState, formData: FormData): Promise<BackroomCommentLikeState> {
  const commentId = cleanText(formData.get("commentId"));
  if (!UUID_PATTERN.test(commentId)) return { ...previousState, error: "コメントを確認できませんでした。" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ...previousState, error: "いいねするにはログインしてください。" };

  const { data: comment, error: commentError } = await supabase
    .from("backroom_comments")
    .select("id, post_id, user_id, is_deleted, backroom_posts!inner(is_deleted)")
    .eq("id", commentId)
    .maybeSingle<{ id: string; post_id: string; user_id: string; is_deleted: boolean | null; backroom_posts: { is_deleted: boolean | null } | null }>();
  if (commentError || !comment || comment.is_deleted || comment.backroom_posts?.is_deleted) return { ...previousState, error: "このコメントにはいいねできません。" };
  if (comment.user_id === user.id) return { count: previousState.count, liked: false, error: "自分のコメントにはいいねできません。" };

  const { data: existing, error: existingError } = await supabase
    .from("backroom_comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle<{ comment_id: string }>();
  if (existingError) return { ...previousState, error: "いいねを確認できませんでした。" };

  const mutation = existing
    ? supabase.from("backroom_comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id)
    : supabase.from("backroom_comment_likes").insert({ comment_id: commentId, user_id: user.id });
  const { error: mutationError } = await mutation;
  if (mutationError) return { ...previousState, error: "いいねを保存できませんでした。" };

  const { data: countRows } = await supabase.rpc("get_public_backroom_comment_like_counts", { p_comment_ids: [commentId] });
  const count = Number(((countRows ?? []) as Array<{ like_count: number | string }>)[0]?.like_count ?? 0);
  revalidatePath(`/backroom/${comment.post_id}`);
  return { count, liked: !existing };
}
