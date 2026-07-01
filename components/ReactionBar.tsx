"use client";

import { Bookmark, MessageCircle, Sparkles, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ReactionBarProps = {
  commentHref?: string;
  className?: string;
  compact?: boolean;
};

const buttonBase =
  "relative inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-line/80 bg-white px-2.5 text-[0.68rem] font-semibold text-ink/78 transition";

export function ReactionBar({ commentHref, className = "", compact = false }: ReactionBarProps) {
  const [liked, setLiked] = useState(false);
  const [thanked, setThanked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [spark, setSpark] = useState(false);

  function sendThanks() {
    setThanked(true);
    setSpark(true);
    window.setTimeout(() => setSpark(false), 720);
  }

  const labelClass = compact ? "sr-only" : "";

  return (
    <div className={"flex flex-wrap items-center gap-1.5 " + className}>
      <button
        type="button"
        aria-pressed={liked}
        className={buttonBase + (liked ? " bg-neutral-100 text-ink" : " hover:bg-neutral-50")}
        onClick={() => setLiked((current) => !current)}
      >
        <ThumbsUp aria-hidden="true" size={14} strokeWidth={1.8} />
        <span className={labelClass}>グッド</span>
      </button>

      <button
        type="button"
        aria-pressed={thanked}
        className={
          buttonBase +
          " overflow-visible" +
          (thanked ? " border-blush/25 bg-blushSoft text-ink" : " hover:border-blush/25 hover:bg-blushSoft/50")
        }
        onClick={sendThanks}
      >
        <Sparkles aria-hidden="true" size={14} strokeWidth={1.8} className="text-blush" />
        <span className={labelClass}>Thanks</span>
        {spark ? (
          <span aria-hidden="true" className="pointer-events-none absolute -right-1 -top-2 text-blush">
            <Sparkles size={13} className="animate-ping opacity-70" />
          </span>
        ) : null}
      </button>

      {commentHref ? (
        <Link href={commentHref} className={buttonBase + " hover:bg-neutral-50"}>
          <MessageCircle aria-hidden="true" size={14} strokeWidth={1.8} />
          <span className={labelClass}>コメント</span>
        </Link>
      ) : (
        <button type="button" className={buttonBase + " hover:bg-neutral-50"}>
          <MessageCircle aria-hidden="true" size={14} strokeWidth={1.8} />
          <span className={labelClass}>コメント</span>
        </button>
      )}

      <button
        type="button"
        aria-pressed={saved}
        className={buttonBase + (saved ? " bg-neutral-100 text-ink" : " hover:bg-neutral-50")}
        onClick={() => setSaved((current) => !current)}
      >
        <Bookmark aria-hidden="true" size={14} strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />
        <span className={labelClass}>保存</span>
      </button>
    </div>
  );
}
