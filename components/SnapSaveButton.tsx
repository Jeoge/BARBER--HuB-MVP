"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useState, useTransition } from "react";
import { saveSnapAction, unsaveSnapAction } from "@/lib/actions/saved";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";
import { isSnapSaved as fetchIsSaved } from "@/lib/supabase/saved";

// Thanksボタンと同じ見た目のピル。控えめなブックマークで保存/解除。
const base =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 text-[0.7rem] font-black transition active:scale-[0.98] disabled:cursor-not-allowed";

export function SnapSaveButton({
  snapId,
  currentUserId,
  nextPath = "/snap",
}: {
  snapId: string;
  currentUserId?: string | null;
  nextPath?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 初期状態は saved_snaps の実データから判定（ログイン時のみ）。
  useEffect(() => {
    if (currentUserId == null) return;
    let active = true;
    const supabase = createClient();

    (async () => {
      const result = await fetchIsSaved(supabase, currentUserId, snapId);
      if (active) setSaved(result);
    })();

    return () => {
      active = false;
    };
  }, [currentUserId, snapId]);

  // 未ログインはログイン導線。
  if (currentUserId == null) {
    return (
      <Link
        href={pathWithParams("/login", { next: nextPath, message: "保存するにはログインしてください。" })}
        aria-label="保存する"
        className={base + " border-line/80 bg-white text-ink/78"}
      >
        <Bookmark aria-hidden="true" size={15} strokeWidth={1.9} />
        保存
      </Link>
    );
  }

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (isPending) return;

    const next = !saved;
    setSaved(next); // 楽観的UI更新

    startTransition(async () => {
      const result = next ? await saveSnapAction(snapId) : await unsaveSnapAction(snapId);
      if (result?.status === "error") {
        setSaved(!next); // 失敗時のみ巻き戻し
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-busy={isPending}
      aria-label={saved ? "保存を解除する" : "保存する"}
      disabled={isPending}
      className={
        base +
        " " +
        (saved
          ? "border-blush/25 bg-blushSoft text-ink"
          : "border-line/80 bg-white text-ink/78 hover:border-blush/25 hover:bg-blushSoft/50") +
        (isPending ? " cursor-wait opacity-70" : "")
      }
    >
      {saved ? (
        <BookmarkCheck aria-hidden="true" size={15} strokeWidth={1.9} className="text-blush" />
      ) : (
        <Bookmark aria-hidden="true" size={15} strokeWidth={1.9} />
      )}
      {isPending ? "保存中..." : saved ? "保存済み" : "保存"}
    </button>
  );
}
