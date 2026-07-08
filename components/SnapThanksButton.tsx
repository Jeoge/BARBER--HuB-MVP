"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toggleSnapThanksAction, type SnapThanksState } from "@/app/snap/actions";
import { pathWithParams } from "@/lib/auth/redirects";

const buttonBase =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 text-[0.7rem] font-black transition";

function SubmitThanksButton({ thanked }: { thanked: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={thanked}
      className={
        buttonBase +
        " " +
        (thanked
          ? "border-blush/25 bg-blushSoft text-ink"
          : "border-line/80 bg-white text-ink/78 hover:border-blush/25 hover:bg-blushSoft/50") +
        (pending ? " cursor-wait opacity-70" : "")
      }
    >
      <Sparkles aria-hidden="true" size={15} strokeWidth={1.9} className="text-blush" />
      {pending ? "送信中..." : "Thanks"}
    </button>
  );
}

export function SnapThanksButton({
  snapId,
  authorId,
  currentUserId,
  initialCount,
  initiallyThanked,
  showCount = true,
}: {
  snapId: string;
  authorId: string;
  currentUserId?: string | null;
  initialCount: number;
  initiallyThanked: boolean;
  showCount?: boolean;
}) {
  const initialState: SnapThanksState = {
    count: initialCount,
    thanked: initiallyThanked,
  };
  const [state, formAction] = useActionState(toggleSnapThanksAction, initialState);
  const isOwnSnap = currentUserId != null && currentUserId === authorId;

  if (currentUserId == null) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={pathWithParams("/login", { next: "/snap", message: "Thanksするにはログインしてください。" })}
          className={buttonBase + " border-line/80 bg-white text-ink/78"}
        >
          <Sparkles aria-hidden="true" size={15} strokeWidth={1.9} className="text-blush" />
          Thanks
        </Link>
        {showCount ? <span className="text-[0.68rem] font-bold text-mute">{state.count}</span> : null}
      </div>
    );
  }

  if (isOwnSnap) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" disabled className={buttonBase + " cursor-not-allowed border-line/80 bg-neutral-50 text-mute"}>
          <Sparkles aria-hidden="true" size={15} strokeWidth={1.9} className="text-blush/70" />
          Thanks
        </button>
        {showCount ? <span className="text-[0.68rem] font-bold text-mute">{state.count}</span> : null}
        <span className="text-[0.68rem] font-semibold text-mute">自分の投稿はカウントされません</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="snapId" value={snapId} />
      <SubmitThanksButton thanked={state.thanked} />
      {showCount ? <span className="text-[0.68rem] font-bold text-mute">{state.count}</span> : null}
      {state.error ? <span className="text-[0.68rem] font-bold text-red-600">{state.error}</span> : null}
      {!state.error && state.message ? <span className="text-[0.68rem] font-semibold text-mute">{state.message}</span> : null}
    </form>
  );
}
