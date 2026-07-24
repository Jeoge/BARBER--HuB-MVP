"use client";

import { Coffee, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { createTreatCheckoutAction } from "@/app/payments/actions";
import { pathWithParams } from "@/lib/auth/redirects";
import { TREAT_AMOUNTS, formatJpy, type TreatTargetType } from "@/lib/monetization";

type TreatButtonProps = {
  targetType: TreatTargetType;
  targetId: string;
  currentUserId?: string | null;
  authorId?: string | null;
  nextPath: string;
  compact?: boolean;
};

export function TreatButton({ targetType, targetId, currentUserId, authorId, nextPath, compact = false }: TreatButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(TREAT_AMOUNTS[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const base = compact
    ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50 px-3 text-[0.7rem] font-black text-ink hover:bg-amber-100"
    : "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50 px-3 text-[0.72rem] font-black text-ink hover:bg-amber-100";

  if (!currentUserId) {
    return (
      <Link href={pathWithParams("/login", { next: nextPath, message: "Treatを送るにはログインしてください。" })} className={base}>
        <Coffee aria-hidden="true" size={15} />
        ☕ Treat
      </Link>
    );
  }

  if (authorId && authorId === currentUserId) {
    return (
      <button type="button" disabled className={base + " cursor-not-allowed opacity-50"} title="自分の投稿にはTreatを送れません">
        <Coffee aria-hidden="true" size={15} />
        ☕ Treat
      </button>
    );
  }

  function beginCheckout() {
    setError("");
    startTransition(async () => {
      const result = await createTreatCheckoutAction({ targetType, targetId, amount, message });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.assign(result.url);
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={base}>
        <Coffee aria-hidden="true" size={15} />
        ☕ Treat
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Treatを送る">
          <div className="w-full max-w-md rounded-[12px] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-ink">☕ Treatを送る</p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-mute">役立った経験や情報に、金銭的な感謝を送れます。決済はStripeで安全に処理されます。</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 text-mute hover:bg-neutral-100" aria-label="閉じる"><X size={18} /></button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {TREAT_AMOUNTS.map((value) => (
                <button key={value} type="button" onClick={() => setAmount(value)} className={"h-11 rounded-[8px] border text-sm font-black " + (amount === value ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:bg-neutral-50")}>
                  {formatJpy(value)}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-xs font-black text-ink">ひとこと（任意）
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={200} rows={3} placeholder="役立ったポイントを伝える" className="mt-1.5 w-full resize-none rounded-[8px] border border-line bg-neutral-50 px-3 py-2 text-sm font-medium text-ink outline-none focus:border-ink/30 focus:bg-white" />
            </label>
            <p className="mt-1 text-right text-[0.65rem] font-bold text-mute">{message.length}/200</p>
            {error ? <p className="mt-3 rounded-[8px] bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p> : null}
            <button type="button" disabled={pending} onClick={beginCheckout} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[8px] bg-ink text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
              <ExternalLink aria-hidden="true" size={15} />
              {pending ? "決済画面を準備中…" : `${formatJpy(amount)}をTreatする`}
            </button>
            <p className="mt-2 text-center text-[0.65rem] font-medium leading-relaxed text-mute">決済完了後、Treatが確定します。返金や問い合わせは運営窓口へご連絡ください。</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
