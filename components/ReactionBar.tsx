"use client";

import { Bookmark, MessageCircle, Sparkles, ThumbsUp } from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";
import { CommentSheet, type SheetComment } from "./CommentSheet";
import { ThanksActionButton } from "./ThanksActionButton";

type ReactionBarProps = {
  contentId?: string;
  commentTitle?: string;
  comments?: SheetComment[];
  className?: string;
  compact?: boolean;
  goodIconOnly?: boolean;
};

const buttonBase =
  "relative inline-flex h-9 items-center justify-center gap-1.5 overflow-visible rounded-full border border-line/80 bg-white px-3 text-[0.7rem] font-semibold text-ink/78 transition";

function storageKey(contentId: string, kind: "good" | "thanks" | "save") {
  return `barber-hub:reaction:${contentId}:${kind}`;
}

function hasStoredReaction(contentId: string | undefined, kind: "good" | "thanks" | "save") {
  if (contentId == null || typeof window === "undefined") return false;
  return window.localStorage.getItem(storageKey(contentId, kind)) === "1";
}

function storeReaction(contentId: string | undefined, kind: "good" | "thanks" | "save") {
  if (contentId == null || typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(contentId, kind), "1");
}

function stopCardNavigation(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  event.stopPropagation();
}

export function ReactionBar({ contentId, commentTitle, comments, className = "", compact = false, goodIconOnly = false }: ReactionBarProps) {
  const [liked, setLiked] = useState(false);
  const [thanked, setThanked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likePulse, setLikePulse] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);

  useEffect(() => {
    setLiked(hasStoredReaction(contentId, "good"));
    setThanked(hasStoredReaction(contentId, "thanks"));
    setSaved(hasStoredReaction(contentId, "save"));
  }, [contentId]);

  function pressGood(event: MouseEvent<HTMLButtonElement>) {
    stopCardNavigation(event);
    if (!liked) {
      storeReaction(contentId, "good");
      setLiked(true);
    }
    setLikePulse(true);
    window.setTimeout(() => setLikePulse(false), 520);
  }

  function pressThanks(event: MouseEvent<HTMLButtonElement>) {
    stopCardNavigation(event);
    if (!thanked) {
      storeReaction(contentId, "thanks");
      setThanked(true);
    }
  }

  function pressSave(event: MouseEvent<HTMLButtonElement>) {
    stopCardNavigation(event);
    if (!saved) {
      storeReaction(contentId, "save");
      setSaved(true);
    }
  }

  function openComments(event: MouseEvent<HTMLButtonElement>) {
    stopCardNavigation(event);
    setCommentOpen(true);
  }

  const labelClass = compact ? "sr-only" : "";
  const goodLabelClass = compact || goodIconOnly ? "sr-only" : "";

  return (
    <>
      <div className={"flex flex-wrap items-center gap-1.5 " + className}>
        <button
          type="button"
          aria-pressed={liked}
          className={buttonBase + (liked ? " bg-neutral-100 text-ink" : " hover:bg-neutral-50") + (likePulse ? " scale-110" : "")}
          onClick={pressGood}
        >
          <span aria-hidden="true" className={likePulse ? "absolute inset-0 rounded-full ring-4 ring-ink/10" : ""} />
          <ThumbsUp aria-hidden="true" size={15} strokeWidth={1.9} fill={liked ? "currentColor" : "none"} />
          <span className={goodLabelClass}>{"\u30b0\u30c3\u30c9"}</span>
        </button>

        <ThanksActionButton
          type="button"
          active={thanked}
          className={
            buttonBase +
            (thanked ? " border-blush/25 bg-blushSoft text-ink" : " hover:border-blush/25 hover:bg-blushSoft/50")
          }
          onClick={pressThanks}
        >
          <Sparkles aria-hidden="true" size={15} strokeWidth={1.9} className="text-blush" />
          <span className={labelClass}>Thanks</span>
        </ThanksActionButton>

        <button type="button" className={buttonBase + " hover:bg-neutral-50"} onClick={openComments}>
          <MessageCircle aria-hidden="true" size={15} strokeWidth={1.9} />
          <span className={labelClass}>{"\u30b3\u30e1\u30f3\u30c8"}</span>
        </button>

        <button
          type="button"
          aria-pressed={saved}
          className={buttonBase + (saved ? " bg-neutral-100 text-ink" : " hover:bg-neutral-50")}
          onClick={pressSave}
        >
          <Bookmark aria-hidden="true" size={15} strokeWidth={1.9} fill={saved ? "currentColor" : "none"} />
          <span className={labelClass}>{"\u4fdd\u5b58"}</span>
        </button>
      </div>
      <CommentSheet open={commentOpen} onClose={() => setCommentOpen(false)} title={commentTitle} comments={comments} />
    </>
  );
}
