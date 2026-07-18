"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { normalizeShopSearchText } from "@/lib/supabase/barber-shops";
import { createClient } from "@/lib/supabase/server";

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function cleanNullableText(value: FormDataEntryValue | null) {
  const text = cleanText(value);
  return text.length > 0 ? text : null;
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function storeSaveErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("duplicate") || message.includes("unique")) {
    return "同じ店舗と思われる情報がすでに登録されています。店舗検索から該当店舗を確認してください。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("login required")) {
    return "店舗情報を保存できませんでした。ログイン状態を確認して、もう一度お試しください。";
  }

  return "店舗情報を保存できませんでした。入力内容を確認して、もう一度お試しください。";
}

async function requireUser(nextPath: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (error) {
      console.error("Store directory auth lookup failed", { message: error.message });
    }

    redirect(pathWithParams("/login", { next: nextPath, message }));
  }

  return { supabase, user };
}

export async function createBarberShopAction(formData: FormData) {
  const redirectPath = "/stores/new";
  const { supabase } = await requireUser(redirectPath, "店舗登録にはログインしてください。");
  const name = cleanText(formData.get("name"));
  const prefecture = cleanText(formData.get("prefecture"));
  const municipality = cleanText(formData.get("municipality"));
  const address = cleanText(formData.get("address"));
  const postalCode = cleanNullableText(formData.get("postal_code"));
  const relation = cleanText(formData.get("relation"));
  const message = cleanNullableText(formData.get("message"));
  const confirmed = cleanText(formData.get("confirmed")) === "yes";
  const normalizedName = normalizeShopSearchText(name);

  if (!name || !prefecture || !municipality || !address || !relation || !normalizedName) {
    redirect(pathWithParams(redirectPath, { error: "店舗名、都道府県、市区町村、住所、登録者との関係を入力してください。" }));
  }

  if (!confirmed) {
    redirect(pathWithParams(redirectPath, { error: "内容確認にチェックしてください。" }));
  }

  const { data: shopId, error } = await supabase.rpc("create_barber_shop_with_claim", {
    shop_name: name,
    normalized_shop_name: normalizedName,
    shop_prefecture: prefecture,
    shop_municipality: municipality,
    shop_address: address,
    shop_postal_code: postalCode,
    claim_relation: relation,
    claim_message: message,
  });

  if (error || typeof shopId !== "string") {
    console.error("Barber shop create with claim failed", {
      message: error?.message ?? "missing shop id",
    });
    redirect(pathWithParams(redirectPath, { error: storeSaveErrorMessage(error) }));
  }

  revalidatePath("/");
  revalidatePath("/mypage");
  revalidatePath(`/stores/${shopId}`);
  redirect(pathWithParams(`/stores/${shopId}`, { registered: "1" }));
}

export async function requestBarberShopClaimAction(formData: FormData) {
  const shopId = cleanText(formData.get("shopId"));
  const redirectPath = shopId ? `/stores/${shopId}` : "/";

  if (!shopId) {
    redirect(pathWithParams("/", { error: "店舗IDを確認できませんでした。" }));
  }

  const { supabase } = await requireUser(
    pathWithParams(redirectPath, { claim: "1" }),
    "店舗のオーナー認証申請にはログインしてください。"
  );
  const relation = cleanText(formData.get("relation"));
  const message = cleanNullableText(formData.get("message"));

  if (!relation) {
    redirect(pathWithParams(redirectPath, { error: "店舗との関係を選択してください。" }));
  }

  const { data: claimId, error } = await supabase.rpc("request_barber_shop_claim", {
    claim_shop_id: shopId,
    claim_relation: relation,
    claim_message: message,
  });

  if (error || typeof claimId !== "string") {
    console.error("Barber shop claim request failed", {
      shopId,
      message: error?.message ?? "missing claim id",
    });
    redirect(pathWithParams(redirectPath, { error: storeSaveErrorMessage(error) }));
  }

  revalidatePath(`/stores/${shopId}`);
  revalidatePath("/mypage");
  redirect(pathWithParams(redirectPath, { claim: "pending" }));
}

export async function updateVerifiedBarberShopAction(formData: FormData) {
  const shopId = cleanText(formData.get("shopId"));
  const redirectPath = shopId ? `/mypage/stores/${shopId}/edit` : "/mypage";

  if (!shopId) {
    redirect(pathWithParams("/mypage", { storeError: "店舗IDを確認できませんでした。" }));
  }

  const { supabase, user } = await requireUser(redirectPath, "店舗情報を編集するにはログインしてください。");
  const name = cleanText(formData.get("name"));
  const prefecture = cleanText(formData.get("prefecture"));
  const municipality = cleanText(formData.get("municipality"));
  const address = cleanText(formData.get("address"));
  const postalCode = cleanNullableText(formData.get("postal_code"));
  const phone = cleanNullableText(formData.get("phone"));
  const normalizedName = normalizeShopSearchText(name);

  if (!name || !prefecture || !municipality || !address || !normalizedName) {
    redirect(pathWithParams(redirectPath, { error: "店舗名、都道府県、市区町村、住所を入力してください。" }));
  }

  const { data, error } = await supabase
    .from("barber_shops")
    .update({
      name,
      normalized_name: normalizedName,
      prefecture,
      municipality,
      address,
      postal_code: postalCode,
      phone,
    })
    .eq("id", shopId)
    .eq("owner_user_id", user.id)
    .eq("verification_status", "verified")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || data?.id !== shopId) {
    console.error("Verified barber shop update failed", {
      shopId,
      userId: user.id,
      message: error?.message ?? "updated row not returned",
    });
    redirect(pathWithParams(redirectPath, { error: storeSaveErrorMessage(error) }));
  }

  revalidatePath("/");
  revalidatePath("/mypage");
  revalidatePath(`/stores/${shopId}`);
  revalidatePath(redirectPath);
  redirect(pathWithParams("/mypage", { store: "updated" }));
}
