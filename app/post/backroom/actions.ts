"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { getBackroomProfile, isBackroomCategory, normalizeBackroomCategory } from "@/lib/supabase/backroom";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

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
    return "Back Room投稿に必要なSQLが未適用です。Supabase SQL Editorで最新migrationを実行してください。";
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後にBack Roomへ投稿できます。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "Back Room投稿を保存できませんでした。権限設定を確認してください。";
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
      userEmail: user.email ?? null,
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
      userEmail: user.email ?? null,
      message: errorMessage(backroomProfileError),
    });
    redirectToBackroomPost({ error: "Back Room参加設定を確認できませんでした。Supabase SQL Editorで最新migrationを実行してください。" });
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
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("Back Room post insert failed", {
      userId: user.id,
      userEmail: user.email ?? null,
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

  revalidatePath("/backroom");
  revalidatePath("/mypage");
  revalidatePath(`/profiles/${user.id}`);
  revalidatePath(`/backroom/${postId}`);
  redirect(pathWithParams(`/backroom/${postId}`, { posted: "1" }));
}
