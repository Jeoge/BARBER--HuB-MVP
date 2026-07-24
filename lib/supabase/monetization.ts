import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type StripeConnectedAccount = {
  stripe_account_id: string;
  onboarding_status: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
};

export type MyMonetizationSummary = {
  account: StripeConnectedAccount | null;
  receivedTreats: number;
  sentTreats: number;
  paidArticleSales: number;
  paidArticlePurchases: number;
};

export async function getMyMonetizationSummary(supabase: SupabaseClient, userId: string): Promise<MyMonetizationSummary> {
  const empty: MyMonetizationSummary = { account: null, receivedTreats: 0, sentTreats: 0, paidArticleSales: 0, paidArticlePurchases: 0 };
  try {
    const [account, received, sent, sales, purchases] = await Promise.all([
      supabase.from("stripe_connected_accounts").select("stripe_account_id, onboarding_status, charges_enabled, payouts_enabled, details_submitted").eq("user_id", userId).maybeSingle<StripeConnectedAccount>(),
      supabase.from("content_treats").select("id", { count: "exact", head: true }).eq("recipient_id", userId).eq("status", "completed"),
      supabase.from("content_treats").select("id", { count: "exact", head: true }).eq("sender_id", userId).eq("status", "completed"),
      supabase.from("paid_article_purchases").select("id", { count: "exact", head: true }).eq("seller_id", userId).eq("status", "completed"),
      supabase.from("paid_article_purchases").select("id", { count: "exact", head: true }).eq("buyer_id", userId).eq("status", "completed"),
    ]);
    return {
      account: account.error ? null : account.data ?? null,
      receivedTreats: received.error ? 0 : received.count ?? 0,
      sentTreats: sent.error ? 0 : sent.count ?? 0,
      paidArticleSales: sales.error ? 0 : sales.count ?? 0,
      paidArticlePurchases: purchases.error ? 0 : purchases.count ?? 0,
    };
  } catch {
    return empty;
  }
}
