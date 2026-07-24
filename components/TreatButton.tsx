"use client";

import { Coffee, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const checkoutStartedRef = useRef(false);
  const pendingRef = useRef(false);
  pendingRef.current = pending;
  const base = compact
    ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50 px-3 text-[0.7rem] font-black text-ink hover:bg-amber-100"
    : "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50 px-3 text-[0.72rem] font-black text-ink hover:bg-amber-100";

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFirstControl = () => {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      focusable?.[0]?.focus();
    };
    const focusTimer = window.setTimeout(focusFirstControl, 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!pendingRef.current && !checkoutStartedRef.current) setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? []);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

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

  function closeSheet() {
    if (!pendingRef.current && !checkoutStartedRef.current) setOpen(false);
  }

  function beginCheckout() {
    if (checkoutStartedRef.current || pendingRef.current) return;
    checkoutStartedRef.current = true;
    setError("");
    startTransition(async () => {
      const result = await createTreatCheckoutAction({ targetType, targetId, amount, message });
      if (!result.ok) {
        checkoutStartedRef.current = false;
        setError(result.error);
        return;
      }
      window.location.assign(result.url);
    });
  }

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} disabled={pending} className={base}>
        <Coffee aria-hidden="true" size={15} />
        ☕ Treat
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center" role="presentation">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-busy={pending}
            aria-labelledby="treat-sheet-title"
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[12px] bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="treat-sheet-title" className="text-sm font-black text-ink">Treatを送る</h2>
              <button type="button" onClick={closeSheet} disabled={pending} className="rounded-full p-1.5 text-mute hover:bg-neutral-100 disabled:cursor-wait" aria-label="閉じる"><X size={18} /></button>
            </div>
            <fieldset className="mt-4" disabled={pending}>
              <legend className="text-xs font-black text-ink">金額</legend>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {TREAT_AMOUNTS.map((value) => (
                  <button key={value} type="button" onClick={() => setAmount(value)} aria-pressed={amount === value} className={"h-11 rounded-[8px] border text-sm font-black " + (amount === value ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:bg-neutral-50")}>
                    {formatJpy(value)}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="mt-4 block text-xs font-black text-ink">ひとこと
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} disabled={pending} maxLength={200} rows={3} placeholder="任意" className="mt-1.5 w-full resize-none rounded-[8px] border border-line bg-neutral-50 px-3 py-2 text-sm font-medium text-ink outline-none focus:border-ink/30 focus:bg-white disabled:cursor-wait" />
            </label>
            {error ? <p role="alert" className="mt-3 rounded-[8px] bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p> : null}
            <button type="button" disabled={pending} aria-busy={pending} onClick={beginCheckout} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[8px] bg-ink text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
              <ExternalLink aria-hidden="true" size={15} />
              {pending ? "準備中…" : "送信"}
            </button>
            <p className="mt-3 text-center text-[0.65rem] font-medium text-mute"><Link href="/terms" className="underline underline-offset-2">規約・返金について</Link></p>
          </div>
        </div>
      ) : null}
    </>
  );
}
