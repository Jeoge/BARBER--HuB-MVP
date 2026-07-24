"use client";

import { ExternalLink, RefreshCw, WalletCards } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { openStripeDashboardAction, refreshStripeConnectedAccountAction, startStripeOnboardingAction } from "@/app/payments/actions";
import type { MyMonetizationSummary } from "@/lib/supabase/monetization";

function statusLabel(account: MyMonetizationSummary["account"]) {
  if (!account) return "未設定";
  if (account.charges_enabled && account.payouts_enabled) return "受取可能";
  if (account.onboarding_status === "under_review") return "確認中";
  return "設定を完了してください";
}

export function StripeAccountPanel({ summary, refreshOnMount = false }: { summary: MyMonetizationSummary; refreshOnMount?: boolean }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (refreshOnMount) void refreshStripeConnectedAccountAction();
  }, [refreshOnMount]);

  function open(action: typeof startStripeOnboardingAction | typeof openStripeDashboardAction) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error);
      window.location.assign(result.url);
    });
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-[8px] bg-neutral-50 p-3">
        <div className="flex items-center justify-between gap-3"><span className="text-sm font-black text-ink">受取設定</span><span className="rounded-full bg-white px-2 py-0.5 text-[0.68rem] font-black text-mute">{statusLabel(summary.account)}</span></div>
        <p className="mt-2 text-xs font-medium leading-relaxed text-mute">Treat・有料記事の受取にはStripe Connectの本人確認と口座設定が必要です。設定完了まで販売・受取はできません。</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" disabled={pending} onClick={() => open(startStripeOnboardingAction)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] bg-ink text-xs font-black text-white disabled:opacity-60"><WalletCards size={14} />{summary.account ? "設定を続ける" : "受取設定を始める"}</button>
          {summary.account ? <button type="button" disabled={pending} onClick={() => open(openStripeDashboardAction)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white text-xs font-black text-ink disabled:opacity-60"><ExternalLink size={14} />Stripeを開く</button> : <span />}
        </div>
        {summary.account ? <button type="button" disabled={pending} onClick={() => startTransition(async () => { await refreshStripeConnectedAccountAction(); window.location.reload(); })} className="mt-2 inline-flex items-center gap-1 text-[0.68rem] font-bold text-mute"><RefreshCw size={13} />状態を更新</button> : null}
        {error ? <p className="mt-2 text-xs font-bold text-red-700">{error}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <p className="rounded-[8px] border border-line bg-white p-2.5 font-bold text-mute">受取Treat <span className="mt-1 block text-base text-ink">{summary.receivedTreats}件</span></p>
        <p className="rounded-[8px] border border-line bg-white p-2.5 font-bold text-mute">送ったTreat <span className="mt-1 block text-base text-ink">{summary.sentTreats}件</span></p>
        <p className="rounded-[8px] border border-line bg-white p-2.5 font-bold text-mute">有料記事販売 <span className="mt-1 block text-base text-ink">{summary.paidArticleSales}件</span></p>
        <p className="rounded-[8px] border border-line bg-white p-2.5 font-bold text-mute">購入済み記事 <span className="mt-1 block text-base text-ink">{summary.paidArticlePurchases}件</span></p>
      </div>
    </div>
  );
}
