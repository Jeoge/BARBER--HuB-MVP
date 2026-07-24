"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isArticleCategory, isPaidEligibleArticleCategory } from "@/lib/articleCategories";
import { pathWithParams } from "@/lib/auth/redirects";
import { isMonetizationEnabled, isPaidArticlePrice } from "@/lib/monetization";
import { PAID_ARTICLE_PURCHASE_HISTORY_STATUSES, purchasedPaidArticleEditError } from "@/lib/paidArticleIntegrity";
import { createClient } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function updateMyArticleAction(formData: FormData) {
  const articleId = clean(formData.get("articleId"));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(pathWithParams("/login", { next: `/mypage/articles/${articleId}/edit`, message: "記事を編集するにはログインしてください。" }));

  const { data: current } = await supabase
    .from("articles")
    .select("id, author_id, access_type, price_amount")
    .eq("id", articleId)
    .eq("author_id", user.id)
    .eq("is_deleted", false)
    .maybeSingle<{ id: string; author_id: string; access_type: string | null; price_amount: number | null }>();
  if (!current) redirect("/mypage");

  const title = clean(formData.get("title"));
  const category = clean(formData.get("category"));
  const body = clean(formData.get("body"));
  const paidBody = clean(formData.get("paidBody"));
  const accessType = clean(formData.get("accessType")) === "paid" ? "paid" : "free";
  const priceAmount = Number(clean(formData.get("priceAmount")));
  const errorPath = (error: string) => pathWithParams(`/mypage/articles/${articleId}/edit`, { error });
  if (!title || title.length > 120 || !body || !isArticleCategory(category)) redirect(errorPath("タイトル、カテゴリ、本文を確認してください。"));

  const [{ data: paidSection, error: paidSectionError }, { count: purchaseHistoryCount, error: purchaseHistoryError }] = await Promise.all([
    supabase.from("article_paid_sections").select("body").eq("article_id", articleId).maybeSingle<{ body: string }>(),
    supabase.from("paid_article_purchases").select("id", { count: "exact", head: true }).eq("article_id", articleId).in("status", PAID_ARTICLE_PURCHASE_HISTORY_STATUSES),
  ]);
  if (paidSectionError || purchaseHistoryError) redirect(errorPath("購入実績を確認できませんでした。もう一度お試しください。"));
  const hasPurchaseHistory = (purchaseHistoryCount ?? 0) > 0;
  const integrityError = purchasedPaidArticleEditError({
    hasPurchaseHistory,
    currentAccessType: current.access_type,
    nextAccessType: accessType,
    existingPaidBody: paidSection?.body ?? null,
    nextPaidBody: paidBody,
  });
  if (integrityError) redirect(errorPath(integrityError));

  if (accessType === "paid" && (!isMonetizationEnabled() || !isPaidEligibleArticleCategory(category) || !isPaidArticlePrice(priceAmount) || !paidBody)) redirect(errorPath("有料記事の公開設定・価格・有料本文を確認してください。"));

  if (current.access_type === "paid" && current.price_amount !== priceAmount) {
    if (hasPurchaseHistory && clean(formData.get("confirmPriceChange")) !== "1") redirect(errorPath("購入実績があります。価格変更の確認にチェックしてください。"));
  }

  const now = new Date().toISOString();
  const { error: articleError } = await supabase.from("articles").update({ title, category, body, access_type: accessType, price_amount: accessType === "paid" ? priceAmount : null, currency: "jpy", updated_at: now }).eq("id", articleId).eq("author_id", user.id);
  if (articleError) redirect(errorPath("記事を保存できませんでした。"));

  const categories = Array.from(new Set([category, ...(category === "経験記事" ? formData.getAll("experienceCategory").map((entry) => clean(entry)).filter((entry) => entry && entry !== "経験記事" && isArticleCategory(entry)) : [])]));
  const { error: deleteCategoriesError } = await supabase.from("article_category_assignments").delete().eq("article_id", articleId);
  const { error: insertCategoriesError } = deleteCategoriesError ? { error: deleteCategoriesError } : await supabase.from("article_category_assignments").insert(categories.map((assignedCategory) => ({ article_id: articleId, category: assignedCategory })));
  if (insertCategoriesError) redirect(errorPath("関連カテゴリーを保存できませんでした。"));

  if (accessType === "paid" && !hasPurchaseHistory) {
    const { error } = await supabase.from("article_paid_sections").upsert({ article_id: articleId, body: paidBody, updated_at: now }, { onConflict: "article_id" });
    if (error) redirect(errorPath("有料部分を保存できませんでした。"));
  } else {
    const { error } = await supabase.from("article_paid_sections").delete().eq("article_id", articleId);
    if (error) redirect(errorPath("有料部分を更新できませんでした。"));
  }

  revalidatePath(`/articles/${articleId}`);
  revalidatePath("/mypage");
  redirect(pathWithParams(`/articles/${articleId}`, { updated: "1" }));
}
