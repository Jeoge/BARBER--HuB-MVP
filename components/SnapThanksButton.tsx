"use client";

import { Sparkles, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toggleSnapReactionAction, type SnapReactionState, type SnapReactionType } from "@/app/snap/actions";
import { ThanksActionButton } from "@/components/ThanksActionButton";
import { pathWithParams } from "@/lib/auth/redirects";

const buttonBase =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 text-[0.7rem] font-black transition active:scale-[0.98] disabled:active:scale-100 disabled:cursor-not-allowed";

const reactionConfig = {
  thanks: {
    label: "Thanks",
    pendingLabel: "送信中...",
    ownMessage: "自分の投稿にはリアクションできません",
    Icon: Sparkles,
  },
  like: {
    label: "いいね",
    pendingLabel: "送信中...",
    ownMessage: "自分の投稿にはリアクションできません",
    Icon: ThumbsUp,
  },
} as const;

function SubmitReactionButton({ active, reactionType }: { active: boolean; reactionType: SnapReactionType }) {
  const { pending } = useFormStatus();
  const config = reactionConfig[reactionType];
  const Icon = config.Icon;
  const className =
    buttonBase +
    " " +
    (active
      ? "border-blush/25 bg-blushSoft text-ink"
      : "border-line/80 bg-white text-ink/78 hover:border-blush/25 hover:bg-blushSoft/50") +
    (pending ? " cursor-wait opacity-70" : "");

  if (reactionType === "thanks") {
    return (
      <ThanksActionButton type="submit" active={active} pendingText={config.pendingLabel} className={className}>
        <Icon aria-hidden="true" size={15} strokeWidth={1.9} className="text-blush" />
        {config.label}
      </ThanksActionButton>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={active}
      aria-busy={pending}
      className={className}
    >
      <Icon
        aria-hidden="true"
        size={15}
        strokeWidth={1.9}
        fill={active ? "currentColor" : "none"}
      />
      {pending ? config.pendingLabel : config.label}
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
  actions,
  reactionType = "thanks",
  nextPath = "/snap",
  inline = false,
}: {
  snapId: string;
  authorId: string;
  currentUserId?: string | null;
  initialCount: number;
  initiallyThanked: boolean;
  showCount?: boolean;
  actions?: ReactNode;
  reactionType?: SnapReactionType;
  nextPath?: string;
  inline?: boolean;
}) {
  const config = reactionConfig[reactionType];
  const Icon = config.Icon;
  const wrapperClass = inline ? "flex items-center gap-2" : "reaction-row mt-3 flex flex-wrap items-center gap-2";
  const initialState: SnapReactionState = {
    count: initialCount,
    active: initiallyThanked,
  };
  const [state, formAction] = useActionState(toggleSnapReactionAction, initialState);
  const isOwnSnap = currentUserId != null && currentUserId === authorId;

  if (currentUserId == null) {
    return (
      <div className={wrapperClass}>
        <Link
          href={pathWithParams("/login", { next: nextPath, message: `${config.label}するにはログインしてください。` })}
          className={buttonBase + " border-line/80 bg-white text-ink/78 active:opacity-70"}
        >
          <Icon aria-hidden="true" size={15} strokeWidth={1.9} className={reactionType === "thanks" ? "text-blush" : ""} />
          {config.label}
        </Link>
        {showCount ? <span className="text-[0.68rem] font-bold text-mute">{state.count}</span> : null}
        {actions ? <div className="ml-auto flex max-w-full flex-wrap items-center justify-end">{actions}</div> : null}
      </div>
    );
  }

  if (isOwnSnap) {
    return (
      <div className={wrapperClass}>
        <button type="button" disabled aria-pressed={false} className={buttonBase + " cursor-not-allowed border-line/80 bg-neutral-50 text-mute"}>
          <Icon aria-hidden="true" size={15} strokeWidth={1.9} className={reactionType === "thanks" ? "text-blush/70" : ""} />
          {config.label}
        </button>
        {showCount ? <span className="text-[0.68rem] font-bold text-mute">{state.count}</span> : null}
        {!inline ? <span className="text-[0.68rem] font-semibold text-mute">{config.ownMessage}</span> : null}
        {actions ? <div className="ml-auto flex max-w-full flex-wrap items-center justify-end">{actions}</div> : null}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <form action={formAction} className="contents">
        <input type="hidden" name="snapId" value={snapId} />
        <input type="hidden" name="reactionType" value={reactionType} />
        <SubmitReactionButton active={state.active} reactionType={reactionType} />
      </form>
      {showCount ? <span className="text-[0.68rem] font-bold text-mute">{state.count}</span> : null}
      {!inline && state.error ? <span className="text-[0.68rem] font-bold text-red-600">{state.error}</span> : null}
      {!inline && !state.error && state.message ? <span className="text-[0.68rem] font-semibold text-mute">{state.message}</span> : null}
      {actions ? <div className="ml-auto flex max-w-full flex-wrap items-center justify-end">{actions}</div> : null}
    </div>
  );
}

export function SnapLikeButton(props: Omit<Parameters<typeof SnapThanksButton>[0], "reactionType">) {
  return <SnapThanksButton {...props} reactionType="like" inline />;
}
