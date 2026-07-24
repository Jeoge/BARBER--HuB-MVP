"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { pathWithParams, safeNextPath } from "@/lib/auth/redirects";
import {
  MONETIZATION_CURRENCY,
  calculatePlatformAmounts,
  isMonetizationEnabled,
  isPaidArticlePrice,
  isTreatAmount,
  isTreatTargetType,
  type TreatTargetType,
} from "@/lib/monetization";
import { appUrl, createStripeClient, getStripeConfigStatus, isStripeModeAllowedForEnvironment } from "@/lib/stripe";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };
type ConnectedAccountRow = {
  user_id: string;
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  onboarding_status: string;
};

function cleanText(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function unavailable() {
  return { ok: false as const, error: "現在この機能は利用できません。" };
}

async function requirePaymentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function recipientAccount(recipientId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("stripe_connected_accounts")
    .select("user_id, stripe_account_id, charges_enabled, payouts_enabled, onboarding_status")
    .eq("user_id", recipientId)
    .maybeSingle<ConnectedAccountRow>();

  if (error || data == null || !data.charges_enabled || !data.payouts_enabled || data.onboarding_status !== "enabled") return null;
  return data;
}

async function resolveTreatTarget(
  targetType: TreatTargetType,
  targetId: string,
  viewerId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (targetType === "snap") {
    const { data } = await supabase.from("snaps").select("id, author_id, is_published, is_deleted").eq("id", targetId).maybeSingle<{ id: string; author_id: string; is_published: boolean | null; is_deleted: boolean | null }>();
    if (!data || data.is_deleted || data.is_published === false) return null;
    return { recipientId: data.author_id, label: "Snap", returnPath: `/posts/${targetId}` };
  }

  if (targetType === "article") {
    const { data } = await supabase
      .from("articles")
      .select("id, author_id, is_published, is_deleted, access_type")
      .eq("id", targetId)
      .maybeSingle<{ id: string; author_id: string; is_published: boolean | null; is_deleted: boolean | null; access_type?: string | null }>();
    if (!data || data.is_deleted || data.is_published === false) return null;
    if (data.access_type === "paid" && data.author_id !== viewerId) {
      const { data: purchase } = await supabase
        .from("paid_article_purchases")
        .select("id")
        .eq("article_id", targetId)
        .eq("buyer_id", viewerId)
        .eq("status", "completed")
        .is("refunded_at", null)
        .maybeSingle<{ id: string }>();
      if (!purchase) return { recipientId: data.author_id, label: "article_locked", returnPath: `/articles/${targetId}` };
    }
    return { recipientId: data.author_id, label: "記事", returnPath: `/articles/${targetId}` };
  }

  if (targetType === "backroom_thread") {
    const { data } = await supabase.from("backroom_posts").select("id, user_id, is_deleted").eq("id", targetId).maybeSingle<{ id: string; user_id: string; is_deleted: boolean | null }>();
    if (!data || data.is_deleted) return null;
    return { recipientId: data.user_id, label: "Back Roomスレッド", returnPath: `/backroom/${targetId}` };
  }

  const { data } = await supabase
    .from("backroom_comments")
    .select("id, user_id, post_id, is_deleted, backroom_posts!inner(is_deleted)")
    .eq("id", targetId)
    .maybeSingle<{ id: string; user_id: string; post_id: string; is_deleted: boolean | null; backroom_posts: { is_deleted: boolean | null } | null }>();
  if (!data || data.is_deleted || data.backroom_posts?.is_deleted) return null;
  return { recipientId: data.user_id, label: "Back Roomコメント", returnPath: `/backroom/${data.post_id}#backroom-comment-${targetId}` };
}

async function checkoutUrlForTreat(input: { senderId: string; recipientId: string; targetType: TreatTargetType; targetId: string; amount: number; message: string; returnPath: string }) {
  const stripe = createStripeClient();
  const admin = createSupabaseAdminClient();
  const account = await recipientAccount(input.recipientId);
  if (!account) return unavailable();
  const { platformFeeAmount, recipientAmount } = calculatePlatformAmounts(input.amount);
  const id = randomUUID();
  const { error: insertError } = await admin.from("content_treats").insert({
    id,
    sender_id: input.senderId,
    recipient_id: input.recipientId,
    target_type: input.targetType,
    target_id: input.targetId,
    amount: input.amount,
    currency: MONETIZATION_CURRENCY,
    platform_fee_amount: platformFeeAmount,
    recipient_amount: recipientAmount,
    stripe_destination_account_id: account.stripe_account_id,
    status: "pending",
    optional_message: input.message || null,
  });
  if (insertError) return { ok: false as const, error: "Treatの準備に失敗しました。時間をおいて再度お試しください。" };

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [{ price_data: { currency: MONETIZATION_CURRENCY, unit_amount: input.amount, product_data: { name: `${input.returnPath.includes("/posts/") ? "Snap" : "BARBER HUB"} Treat` } }, quantity: 1 }],
        payment_intent_data: {
          application_fee_amount: platformFeeAmount,
          transfer_data: { destination: account.stripe_account_id },
          metadata: { payment_record_id: id, payment_kind: "treat" },
        },
        metadata: { payment_record_id: id, payment_kind: "treat" },
        success_url: `${appUrl()}/payments/success?session_id={CHECKOUT_SESSION_ID}&return_to=${encodeURIComponent(input.returnPath)}`,
        cancel_url: `${appUrl()}${input.returnPath}`,
      },
      { idempotencyKey: `barber-hub-treat-${id}` }
    );
    if (!session.url) throw new Error("missing_checkout_url");
    const { error: updateError } = await admin.from("content_treats").update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
    if (updateError) throw updateError;
    return { ok: true as const, url: session.url };
  } catch {
    await admin.from("content_treats").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
    return { ok: false as const, error: "Treat決済を開始できませんでした。時間をおいて再度お試しください。" };
  }
}

export async function createTreatCheckoutAction(input: { targetType: string; targetId: string; amount: number; message?: string }): Promise<CheckoutResult> {
  if (!isMonetizationEnabled() || !isStripeModeAllowedForEnvironment() || !getStripeConfigStatus().ready || !getSupabaseAdminConfigStatus().ready) return unavailable();
  if (!isTreatTargetType(input.targetType) || !isUuid(input.targetId) || !isTreatAmount(input.amount)) return { ok: false, error: "Treat内容を確認できませんでした。" };
  const message = cleanText(input.message).replace(/\u0000/g, "");
  if (message.length > 200) return { ok: false, error: "Treatコメントは200文字以内で入力してください。" };
  const { supabase, user } = await requirePaymentUser();
  if (!user) return { ok: false, error: "Treatを送るにはログインしてください。" };
  const target = await resolveTreatTarget(input.targetType, input.targetId, user.id, supabase);
  if (!target || target.label === "article_locked") return { ok: false, error: "現在この投稿にはTreatを送れません" };
  if (target.recipientId === user.id) return { ok: false, error: "自分の投稿にはTreatを送れません。" };
  return checkoutUrlForTreat({ senderId: user.id, recipientId: target.recipientId, targetType: input.targetType, targetId: input.targetId, amount: input.amount, message, returnPath: target.returnPath });
}

export async function createArticlePurchaseCheckoutAction(input: { articleId: string }): Promise<CheckoutResult> {
  if (!isMonetizationEnabled() || !isStripeModeAllowedForEnvironment() || !getStripeConfigStatus().ready || !getSupabaseAdminConfigStatus().ready) return unavailable();
  if (!isUuid(input.articleId)) return { ok: false, error: "記事を確認できませんでした。" };
  const { supabase, user } = await requirePaymentUser();
  if (!user) return { ok: false, error: "購入するにはログインしてください。" };
  const { data: article } = await supabase
    .from("articles")
    .select("id, author_id, title, access_type, price_amount, is_published, is_deleted")
    .eq("id", input.articleId)
    .maybeSingle<{ id: string; author_id: string; title: string; access_type?: string | null; price_amount?: number | null; is_published: boolean | null; is_deleted: boolean | null }>();
  if (!article || article.is_deleted || article.is_published === false || article.access_type !== "paid" || !isPaidArticlePrice(Number(article.price_amount))) return { ok: false, error: "この有料記事は現在購入できません。" };
  if (article.author_id === user.id) return { ok: false, error: "投稿者本人は購入せずに全文を確認できます。" };

  const admin = createSupabaseAdminClient();
  const { data: owned } = await admin.from("paid_article_purchases").select("id, status").eq("article_id", article.id).eq("buyer_id", user.id).eq("status", "completed").is("refunded_at", null).maybeSingle<{ id: string; status: string }>();
  if (owned) return { ok: false, error: "この記事はすでに購入済みです。" };
  const account = await recipientAccount(article.author_id);
  if (!account) return { ok: false, error: "この投稿者は現在有料記事を公開できません。" };
  const price = Number(article.price_amount);
  const { platformFeeAmount, recipientAmount } = calculatePlatformAmounts(price);
  const id = randomUUID();
  const { error: insertError } = await admin.from("paid_article_purchases").insert({
    id, article_id: article.id, buyer_id: user.id, seller_id: article.author_id, price_amount: price, currency: MONETIZATION_CURRENCY,
    platform_fee_amount: platformFeeAmount, seller_amount: recipientAmount, stripe_destination_account_id: account.stripe_account_id, status: "pending",
  });
  if (insertError) return { ok: false, error: "購入の準備に失敗しました。時間をおいて再度お試しください。" };
  try {
    const stripe = createStripeClient();
    const returnPath = `/articles/${article.id}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price_data: { currency: MONETIZATION_CURRENCY, unit_amount: price, product_data: { name: article.title } }, quantity: 1 }],
      payment_intent_data: { application_fee_amount: platformFeeAmount, transfer_data: { destination: account.stripe_account_id }, metadata: { payment_record_id: id, payment_kind: "paid_article" } },
      metadata: { payment_record_id: id, payment_kind: "paid_article" },
      success_url: `${appUrl()}/payments/success?session_id={CHECKOUT_SESSION_ID}&return_to=${encodeURIComponent(returnPath)}`,
      cancel_url: `${appUrl()}${returnPath}`,
    }, { idempotencyKey: `barber-hub-paid-article-${id}` });
    if (!session.url) throw new Error("missing_checkout_url");
    const { error: updateError } = await admin.from("paid_article_purchases").update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
    if (updateError) throw updateError;
    return { ok: true, url: session.url };
  } catch {
    await admin.from("paid_article_purchases").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
    return { ok: false, error: "購入決済を開始できませんでした。時間をおいて再度お試しください。" };
  }
}

export async function startStripeOnboardingAction(): Promise<CheckoutResult> {
  if (!isMonetizationEnabled() || !isStripeModeAllowedForEnvironment() || !getStripeConfigStatus().ready || !getSupabaseAdminConfigStatus().ready) return unavailable();
  const { user } = await requirePaymentUser();
  if (!user) return { ok: false, error: "受取設定にはログインしてください。" };
  const admin = createSupabaseAdminClient();
  const stripe = createStripeClient();
  let { data: account } = await admin.from("stripe_connected_accounts").select("user_id, stripe_account_id, charges_enabled, payouts_enabled, onboarding_status").eq("user_id", user.id).maybeSingle<ConnectedAccountRow>();
  if (!account) {
    const created = await stripe.accounts.create({ type: "express", country: "JP", capabilities: { transfers: { requested: true } }, metadata: { barber_hub_user_id: user.id } }, { idempotencyKey: `barber-hub-connect-${user.id}` });
    const { error } = await admin.from("stripe_connected_accounts").insert({ user_id: user.id, stripe_account_id: created.id, onboarding_status: "pending", charges_enabled: false, payouts_enabled: false, details_submitted: false });
    if (error) return { ok: false, error: "受取設定を準備できませんでした。" };
    account = { user_id: user.id, stripe_account_id: created.id, charges_enabled: false, payouts_enabled: false, onboarding_status: "pending" };
  }
  const returnUrl = `${appUrl()}/mypage?stripe=returned`;
  const link = await stripe.accountLinks.create({ account: account.stripe_account_id, type: "account_onboarding", refresh_url: `${appUrl()}/mypage?stripe=refresh`, return_url: returnUrl });
  return { ok: true, url: link.url };
}

export async function openStripeDashboardAction(): Promise<CheckoutResult> {
  if (!isMonetizationEnabled() || !isStripeModeAllowedForEnvironment() || !getStripeConfigStatus().ready || !getSupabaseAdminConfigStatus().ready) return unavailable();
  const { user } = await requirePaymentUser();
  if (!user) return { ok: false, error: "Stripeを確認するにはログインしてください。" };
  const admin = createSupabaseAdminClient();
  const { data: account } = await admin.from("stripe_connected_accounts").select("stripe_account_id").eq("user_id", user.id).maybeSingle<{ stripe_account_id: string }>();
  if (!account) return { ok: false, error: "先に受取設定を始めてください。" };
  try {
    const link = await createStripeClient().accounts.createLoginLink(account.stripe_account_id);
    return { ok: true, url: link.url };
  } catch {
    return { ok: false, error: "Stripeの確認画面を開けませんでした。" };
  }
}

export async function refreshStripeConnectedAccountAction() {
  if (!isMonetizationEnabled() || !isStripeModeAllowedForEnvironment() || !getStripeConfigStatus().ready || !getSupabaseAdminConfigStatus().ready) return;
  const { user } = await requirePaymentUser();
  if (!user) return;
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("stripe_connected_accounts").select("stripe_account_id").eq("user_id", user.id).maybeSingle<{ stripe_account_id: string }>();
  if (!data) return;
  try {
    const account = await createStripeClient().accounts.retrieve(data.stripe_account_id);
    const onboardingStatus = account.charges_enabled && account.payouts_enabled ? "enabled" : account.requirements?.disabled_reason ? "restricted" : account.details_submitted ? "under_review" : "pending";
    await admin.from("stripe_connected_accounts").update({ charges_enabled: account.charges_enabled, payouts_enabled: account.payouts_enabled, details_submitted: account.details_submitted, onboarding_status: onboardingStatus, requirements_json: account.requirements ?? {}, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    revalidatePath("/mypage");
  } catch {
    // The status remains unchanged until Stripe can be queried again.
  }
}
