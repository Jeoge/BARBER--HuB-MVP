"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

const SUPPORT_TYPES = new Set([
  "general",
  "advertising",
  "jobs",
  "succession",
  "report",
  "rights",
  "bug",
  "deletion_request",
  "other",
]);

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function nullableText(value: FormDataEntryValue | null) {
  const text = cleanText(value);
  return text.length > 0 ? text : null;
}

function safeRedirectPath(value: FormDataEntryValue | null) {
  const path = cleanText(value);
  if (!path.startsWith("/") || path.startsWith("//")) return "/contact";
  return path;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanTargetUrl(value: FormDataEntryValue | null) {
  const text = nullableText(value);
  if (text == null) return null;

  if (text.startsWith("/") && !text.startsWith("//")) return text.slice(0, 500);

  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().slice(0, 500);
  } catch {
    return null;
  }
}

function redirectWithError(path: string, error: string): never {
  redirect(pathWithParams(path, { error }));
}

export async function createSupportInquiryAction(formData: FormData) {
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));
  const name = cleanText(formData.get("name"));
  const email = cleanText(formData.get("email"));
  const inquiryType = cleanText(formData.get("inquiryType"));
  const targetUrl = cleanTargetUrl(formData.get("targetUrl"));
  const message = cleanText(formData.get("message"));
  const confirmed = formData.get("confirmed") === "on" || formData.get("confirmed") === "confirmed";

  if (!name) {
    redirectWithError(redirectTo, "名前を入力してください。");
  }

  if (!isValidEmail(email)) {
    redirectWithError(redirectTo, "メールアドレスの形式を確認してください。");
  }

  if (!SUPPORT_TYPES.has(inquiryType)) {
    redirectWithError(redirectTo, "問い合わせ種別を選択してください。");
  }

  if (!message) {
    redirectWithError(redirectTo, "内容を入力してください。");
  }

  if (message.length > 3000) {
    redirectWithError(redirectTo, "内容は3000文字以内で入力してください。");
  }

  if (!confirmed) {
    redirectWithError(redirectTo, "送信前の確認にチェックしてください。");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("support_inquiries")
    .insert({
      id: randomUUID(),
      user_id: user?.id ?? null,
      name,
      email,
      inquiry_type: inquiryType,
      target_url: targetUrl,
      message,
      status: "new",
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error("support inquiry insert failed", {
      userId: user?.id ?? null,
      inquiryType,
      message: error.message,
    });
    redirectWithError(redirectTo, "送信できませんでした。時間をおいて再度お試しください。");
  }

  revalidatePath("/contact");
  revalidatePath("/account/deletion");
  redirect(pathWithParams(redirectTo, { sent: "1" }));
}
