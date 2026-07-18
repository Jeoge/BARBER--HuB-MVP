"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { hasSafetyConfirmations, SAFETY_CONFIRMATION_ERROR, safetyMigrationErrorMessage } from "@/lib/safety";
import { hasOwnedVerifiedBarberShop } from "@/lib/supabase/barber-shops";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

type SuccessionFormMode = "create" | "update";

const SUCCESSION_RELATION_ERROR =
  "開業・承継情報を保存できませんでした。時間をおいて再度お試しください。";
const SUCCESSION_SAFETY_FIELDS = [
  "successionPublicPrivateConfirmed",
  "successionSensitiveInfoConfirmed",
  "successionNoGuaranteeConfirmed",
];

const PUBLIC_SENSITIVE_PATTERNS = [
  "店舗名",
  "正確な住所",
  "売上",
  "利益",
  "家賃",
  "譲渡希望額",
  "譲渡額",
  "借入",
  "顧客数",
  "スタッフ",
  "電話",
  "メール",
  "LINE",
  "個人連絡先",
  "丁目",
  "番地",
  "号室",
  "建物名",
  "ビル名",
];

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function cleanNullableText(value: FormDataEntryValue | null) {
  const text = cleanText(value);
  return text.length > 0 ? text : null;
}

function cleanUrl(value: FormDataEntryValue | null) {
  const text = cleanNullableText(value);
  if (text == null) return null;
  if (text.startsWith("/")) return text;

  const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function cleanNumber(value: FormDataEntryValue | null) {
  const text = cleanText(value);
  if (!text) return null;
  const number = Number(text);
  if (!Number.isInteger(number) || number < 0 || number > 99) return null;
  return number;
}

function validStatus(value: string) {
  return value === "draft" || value === "published" || value === "closed" ? value : "published";
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

  if (message.includes("relation") && message.includes("succession")) {
    return SUCCESSION_RELATION_ERROR;
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後に開業・承継情報を掲載できます。先にプロフィールを保存してください。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "開業・承継情報を保存できませんでした。時間をおいて再度お試しください。";
  }

  if (message.includes("safety_confirmed_at") || message.includes("guidelines_confirmed") || message.includes("pr_disclosure_checked")) {
    return safetyMigrationErrorMessage("開業・承継情報");
  }

  return "開業・承継情報を保存できませんでした。入力内容を確認して、もう一度お試しください。";
}

function redirectToSuccessionForm(path: string, error: string): never {
  redirect(pathWithParams(path, { error }));
}

function requireText(value: string, path: string, message: string) {
  if (!value) redirectToSuccessionForm(path, message);
  return value;
}

function ensurePublicTextIsSafe(value: string, path: string, label: string) {
  const hit = PUBLIC_SENSITIVE_PATTERNS.find((pattern) => value.toLowerCase().includes(pattern.toLowerCase()));
  if (hit) {
    redirectToSuccessionForm(path, `${label}には「${hit}」などの非公開条件を書かないでください。非公開欄へ入力してください。`);
  }
}

function parseSuccessionPayload(formData: FormData, userId: string, redirectPath: string) {
  const listingType = requireText(cleanText(formData.get("listingType")), redirectPath, "掲載タイプを選択してください。");
  const title = requireText(cleanText(formData.get("title")), redirectPath, "公開用タイトルを入力してください。");
  const publicDescription = requireText(cleanText(formData.get("publicDescription")), redirectPath, "公開用説明文を入力してください。");
  const prefecture = requireText(cleanText(formData.get("prefecture")), redirectPath, "都道府県を入力してください。");
  const city = requireText(cleanText(formData.get("city")), redirectPath, "市区町村を入力してください。");

  ensurePublicTextIsSafe(title, redirectPath, "公開用タイトル");
  ensurePublicTextIsSafe(publicDescription, redirectPath, "公開用説明文");
  ensurePublicTextIsSafe(cleanText(formData.get("area")), redirectPath, "エリア・最寄駅の有無");

  if (!hasSafetyConfirmations(formData, SUCCESSION_SAFETY_FIELDS)) {
    redirectToSuccessionForm(redirectPath, SAFETY_CONFIRMATION_ERROR);
  }

  const safetyConfirmedAt = new Date().toISOString();
  const publicPayload = {
    user_id: userId,
    listing_type: listingType,
    title,
    public_description: publicDescription,
    prefecture,
    city,
    area: cleanNullableText(formData.get("area")),
    business_type: cleanNullableText(formData.get("businessType")),
    seats_count: cleanNumber(formData.get("seatsCount")),
    shampoo_count: cleanNumber(formData.get("shampooCount")),
    years_open: cleanNullableText(formData.get("yearsOpen")),
    desired_timing: cleanNullableText(formData.get("desiredTiming")),
    public_image_url: cleanUrl(formData.get("publicImageUrl")),
    contact_method: cleanNullableText(formData.get("contactMethod")) ?? "運営確認後に共有",
    status: validStatus(cleanText(formData.get("status"))),
    is_deleted: false,
    is_paid_featured: false,
    sort_priority: 0,
    plan_type: "free",
    safety_confirmed_at: safetyConfirmedAt,
    guidelines_confirmed: true,
    pr_disclosure_checked: false,
  };

  const privatePayload = {
    user_id: userId,
    private_shop_name: cleanNullableText(formData.get("privateShopName")),
    private_address: cleanNullableText(formData.get("privateAddress")),
    private_price: cleanNullableText(formData.get("privatePrice")),
    private_rent: cleanNullableText(formData.get("privateRent")),
    private_sales_note: cleanNullableText(formData.get("privateSalesNote")),
    private_owner_contact: cleanNullableText(formData.get("privateOwnerContact")),
    private_borrowing_note: cleanNullableText(formData.get("privateBorrowingNote")),
    private_customer_count_note: cleanNullableText(formData.get("privateCustomerCountNote")),
    private_staff_note: cleanNullableText(formData.get("privateStaffNote")),
  };

  return { publicPayload, privatePayload };
}

async function requireSuccessionPoster(redirectPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Succession post auth lookup failed", { message: userError.message });
    }

    redirect(pathWithParams("/login", { next: redirectPath, message: "開業・承継情報の掲載にはログインしてください。" }));
  }

  const [{ profile, error: profileError }, { hasShop, error: verifiedShopError }] = await Promise.all([
    getAccountProfile(supabase, user.id),
    hasOwnedVerifiedBarberShop(supabase, user.id),
  ]);

  if (profileError) {
    console.error("Succession post profile lookup failed", {
      userId: user.id,
      message: profileError.message,
    });
    redirectToSuccessionForm(redirectPath, "プロフィール情報を確認できませんでした。時間をおいて再度お試しください。");
  }

  if (verifiedShopError) {
    console.error("Succession post verified shop lookup failed", {
      userId: user.id,
      message: verifiedShopError.message,
    });
    redirectToSuccessionForm(redirectPath, "掲載に必要なサロン機能を確認できませんでした。時間をおいて再度お試しください。");
  }

  if (!hasShop) {
    redirectToSuccessionForm(redirectPath, "開業・承継情報の掲載には、マイページからサロン機能を追加し、店舗確認を完了してください。");
  }

  if (profile == null) {
    redirectToSuccessionForm(redirectPath, "プロフィール設定後に開業・承継情報を掲載できます。");
  }

  return { supabase, user };
}

async function saveSuccessionPost(formData: FormData, mode: SuccessionFormMode) {
  const postId = cleanText(formData.get("postId"));
  const redirectPath = mode === "update" && postId ? `/mypage/succession/${postId}/edit` : "/post/succession";
  const { supabase, user } = await requireSuccessionPoster(redirectPath);
  const { publicPayload, privatePayload } = parseSuccessionPayload(formData, user.id, redirectPath);
  const now = new Date().toISOString();

  if (mode === "create") {
    const id = randomUUID();
    const { data, error } = await supabase
      .from("succession_posts")
      .insert({
        id,
        ...publicPayload,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      console.error("Succession post insert failed", {
        userId: user.id,
        message: error.message,
      });
      redirectToSuccessionForm(redirectPath, saveErrorMessage(error));
    }

    if (data?.id !== id) {
      redirectToSuccessionForm(redirectPath, "開業・承継情報を保存できませんでした。もう一度お試しください。");
    }

    const { error: privateError } = await supabase
      .from("succession_post_private")
      .insert({
        post_id: id,
        ...privatePayload,
        created_at: now,
        updated_at: now,
      });

    if (privateError) {
      console.error("Succession private insert failed", {
        userId: user.id,
        postId: id,
        message: privateError.message,
      });
      redirectToSuccessionForm(redirectPath, saveErrorMessage(privateError));
    }

    revalidatePath("/succession");
    revalidatePath("/mypage");
    revalidatePath(`/succession/${id}`);
    redirect(publicPayload.status === "published" ? pathWithParams(`/succession/${id}`, { posted: "1" }) : pathWithParams("/mypage", { succession: "updated" }));
  }

  if (!postId) {
    redirectToSuccessionForm("/mypage", "掲載IDを確認できませんでした。");
  }

  const { error } = await supabase
    .from("succession_posts")
    .update({
      ...publicPayload,
      updated_at: now,
    })
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Succession post update failed", {
      userId: user.id,
      postId,
      message: error.message,
    });
    redirectToSuccessionForm(redirectPath, saveErrorMessage(error));
  }

  const { error: privateError } = await supabase
    .from("succession_post_private")
    .upsert(
      {
        post_id: postId,
        ...privatePayload,
        updated_at: now,
      },
      { onConflict: "post_id" }
    );

  if (privateError) {
    console.error("Succession private upsert failed", {
      userId: user.id,
      postId,
      message: privateError.message,
    });
    redirectToSuccessionForm(redirectPath, saveErrorMessage(privateError));
  }

  revalidatePath("/succession");
  revalidatePath("/mypage");
  revalidatePath(`/succession/${postId}`);
  redirect(publicPayload.status === "published" ? pathWithParams(`/succession/${postId}`, { updated: "1" }) : pathWithParams("/mypage", { succession: "updated" }));
}

export async function createSuccessionPostAction(formData: FormData) {
  await saveSuccessionPost(formData, "create");
}

export async function updateSuccessionPostAction(formData: FormData) {
  await saveSuccessionPost(formData, "update");
}

export async function closeSuccessionPostAction(formData: FormData) {
  const postId = cleanText(formData.get("postId"));
  const redirectPath = "/mypage";

  if (!postId) {
    redirectToSuccessionForm(redirectPath, "掲載IDを確認できませんでした。");
  }

  const { supabase, user } = await requireSuccessionPoster(redirectPath);
  const { error } = await supabase
    .from("succession_posts")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Succession post close failed", {
      userId: user.id,
      postId,
      message: error.message,
    });
    redirectToSuccessionForm(redirectPath, saveErrorMessage(error));
  }

  revalidatePath("/succession");
  revalidatePath("/mypage");
  revalidatePath(`/succession/${postId}`);
  redirect(pathWithParams("/mypage", { succession: "closed" }));
}
