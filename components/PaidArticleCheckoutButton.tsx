"use client";

import { ExternalLink, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { createArticlePurchaseCheckoutAction } from "@/app/payments/actions";
import { pathWithParams } from "@/lib/auth/redirects";
import { formatJpy } from "@/lib/monetization";

export function PaidArticleCheckoutButton({ articleId, price, currentUserId }: { articleId: string; price: number; currentUserId?: string | null }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const nextPath = `/articles/${articleId}`;

  if (!currentUserId) {
    return <Link href={pathWithParams("/login", { next: nextPath, message: "有料記事の購入にはログインしてください。" })} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[8px] bg-ink px-4 text-sm font-black text-white"><LockKeyhole size={15} />ログインして購入する</Link>;
  }

  function checkout() {
    setError("");
    startTransition(async () => {
      const result = await createArticlePurchaseCheckoutAction({ articleId });
      if (!result.ok) return setError(result.error);
      window.location.assign(result.url);
    });
  }

  return (
    <div className="mt-4">
      <button type="button" disabled={pending} onClick={checkout} className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[8px] bg-ink px-4 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
        <ExternalLink size={15} />{pending ? "決済画面を準備中…" : `${formatJpy(price)}で購入する`}
      </button>
      {error ? <p className="mt-2 text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
