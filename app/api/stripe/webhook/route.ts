import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createStripeClient, getStripeConfigStatus } from "@/lib/stripe";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";
import { refundStatusFromAmounts } from "@/lib/monetization";

export const runtime = "nodejs";

type PaymentRow = {
  id: string;
  amount?: number;
  price_amount?: number;
  currency: string;
  platform_fee_amount: number;
  stripe_destination_account_id: string;
};

function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function accountId(value: string | Stripe.Account | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function webhookSecrets() {
  return [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(
    (secret): secret is string => Boolean(secret?.trim()),
  );
}

function constructWebhookEvent(payload: string, signature: string) {
  let lastError: unknown;
  for (const secret of webhookSecrets()) {
    try {
      return createStripeClient().webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("missing_webhook_secret");
}

async function verifyCheckoutPayment(session: Stripe.Checkout.Session, row: PaymentRow) {
  if (session.mode !== "payment" || session.payment_status !== "paid") return false;
  const paymentIntentId = stripeId(session.payment_intent);
  if (!paymentIntentId) return false;

  const paymentIntent = await createStripeClient().paymentIntents.retrieve(paymentIntentId);
  const amount = row.amount ?? row.price_amount;

  return (
    paymentIntent.status === "succeeded" &&
    paymentIntent.amount === amount &&
    paymentIntent.currency === row.currency &&
    paymentIntent.application_fee_amount === row.platform_fee_amount &&
    accountId(paymentIntent.transfer_data?.destination) === row.stripe_destination_account_id
  );
}

async function completeCheckout(session: Stripe.Checkout.Session) {
  const admin = createSupabaseAdminClient();
  const paymentIntentId = stripeId(session.payment_intent);
  if (!paymentIntentId) throw new Error("missing_payment_intent");

  const { data: treat, error: treatError } = await admin
    .from("content_treats")
    .select("id, amount, currency, platform_fee_amount, stripe_destination_account_id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle<PaymentRow>();
  if (treatError) throw treatError;

  if (treat) {
    if (!(await verifyCheckoutPayment(session, treat))) throw new Error("treat_payment_verification_failed");
    const { error } = await admin.rpc("complete_content_treat", {
      p_checkout_session_id: session.id,
      p_payment_intent_id: paymentIntentId,
      p_completed_at: new Date().toISOString(),
    });
    if (error) throw error;
    return;
  }

  const { data: purchase, error: purchaseError } = await admin
    .from("paid_article_purchases")
    .select("id, price_amount, currency, platform_fee_amount, stripe_destination_account_id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle<PaymentRow>();
  if (purchaseError) throw purchaseError;
  if (!purchase) throw new Error("checkout_record_not_found");
  if (!(await verifyCheckoutPayment(session, purchase))) throw new Error("paid_article_payment_verification_failed");

  const { error } = await admin.rpc("complete_paid_article_purchase", {
    p_checkout_session_id: session.id,
    p_payment_intent_id: paymentIntentId,
    p_completed_at: new Date().toISOString(),
  });
  if (error) throw error;
}

async function applyChargeRefund(charge: Stripe.Charge) {
  const paymentIntentId = stripeId(charge.payment_intent);
  const amountRefunded = charge.amount_refunded;
  if (!paymentIntentId || !Number.isSafeInteger(amountRefunded) || amountRefunded <= 0) return;

  const admin = createSupabaseAdminClient();
  const timestamp = new Date().toISOString();
  const [treatResult, purchaseResult] = await Promise.all([
    admin.from("content_treats").select("id, amount").eq("stripe_payment_intent_id", paymentIntentId).in("status", ["completed", "partially_refunded"]).returns<Array<{ id: string; amount: number }>>(),
    admin.from("paid_article_purchases").select("id, price_amount").eq("stripe_payment_intent_id", paymentIntentId).in("status", ["completed", "partially_refunded"]).returns<Array<{ id: string; price_amount: number }>>(),
  ]);
  if (treatResult.error) throw treatResult.error;
  if (purchaseResult.error) throw purchaseResult.error;

  const treatUpdates = (treatResult.data ?? []).map((treat) => {
    const status = refundStatusFromAmounts(treat.amount, amountRefunded);
    if (!status) return null;
    return admin.from("content_treats").update({ status, refunded_amount: Math.min(treat.amount, amountRefunded), refunded_at: timestamp, updated_at: timestamp }).eq("id", treat.id).in("status", ["completed", "partially_refunded"]);
  });
  const purchaseUpdates = (purchaseResult.data ?? []).map((purchase) => {
    const status = refundStatusFromAmounts(purchase.price_amount, amountRefunded);
    if (!status) return null;
    return admin.from("paid_article_purchases").update({ status, refunded_amount: Math.min(purchase.price_amount, amountRefunded), refunded_at: timestamp, updated_at: timestamp }).eq("id", purchase.id).in("status", ["completed", "partially_refunded"]);
  });
  for (const update of [...treatUpdates, ...purchaseUpdates]) {
    if (update == null) continue;
    const result = await update;
    if (result.error) throw result.error;
  }
}

async function handleEvent(event: Stripe.Event) {
  const admin = createSupabaseAdminClient();

  if (event.type === "checkout.session.completed") {
    await completeCheckout(event.data.object as Stripe.Checkout.Session);
    return;
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const timestamp = new Date().toISOString();
    const [treat, purchase] = await Promise.all([
      admin.from("content_treats").update({ status: "expired", updated_at: timestamp }).eq("stripe_checkout_session_id", session.id).eq("status", "pending"),
      admin.from("paid_article_purchases").update({ status: "expired", updated_at: timestamp }).eq("stripe_checkout_session_id", session.id).eq("status", "pending"),
    ]);
    if (treat.error) throw treat.error;
    if (purchase.error) throw purchase.error;
    return;
  }

  if (event.type === "charge.refunded") {
    await applyChargeRefund(event.data.object as Stripe.Charge);
    return;
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    const onboardingStatus = account.charges_enabled && account.payouts_enabled ? "enabled" : account.requirements?.disabled_reason ? "restricted" : account.details_submitted ? "under_review" : "pending";
    const { error } = await admin
      .from("stripe_connected_accounts")
      .update({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        onboarding_status: onboardingStatus,
        requirements_json: account.requirements ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_account_id", account.id);
    if (error) throw error;
  }
}

export async function POST(request: Request) {
  const stripeStatus = getStripeConfigStatus();
  const adminStatus = getSupabaseAdminConfigStatus();
  if (!stripeStatus.ready || !adminStatus.ready || webhookSecrets().length === 0) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(await request.text(), signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: claimed, error: claimError } = await admin.rpc("claim_stripe_webhook_event", {
    p_stripe_event_id: event.id,
    p_event_type: event.type,
  });
  if (claimError) return NextResponse.json({ error: "Unable to claim event." }, { status: 500 });
  if (!claimed) return NextResponse.json({ received: true });

  try {
    await handleEvent(event);
    const { error } = await admin.rpc("finish_stripe_webhook_event", {
      p_stripe_event_id: event.id,
      p_success: true,
      p_error: null,
    });
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "webhook_processing_failed";
    await admin.rpc("finish_stripe_webhook_event", {
      p_stripe_event_id: event.id,
      p_success: false,
      p_error: message,
    });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
