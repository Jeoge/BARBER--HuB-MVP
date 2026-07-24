"use client";

import { Heart } from "lucide-react";
import { useActionState } from "react";
import { toggleBackroomCommentLikeAction, type BackroomCommentLikeState } from "@/app/backroom/actions";

export function BackroomCommentLikeButton({ commentId, authorId, currentUserId, initialCount, initiallyLiked }: { commentId: string; authorId: string; currentUserId: string; initialCount: number; initiallyLiked: boolean }) {
  const [state, action] = useActionState(toggleBackroomCommentLikeAction, { count: initialCount, liked: initiallyLiked } satisfies BackroomCommentLikeState);
  const own = authorId === currentUserId;
  return (
    <div className="mt-3 flex items-center gap-2">
      <form action={action}>
        <input type="hidden" name="commentId" value={commentId} />
        <button type="submit" disabled={own} aria-pressed={state.liked} className={"inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-[0.68rem] font-black " + (own ? "cursor-not-allowed border-line bg-neutral-50 text-mute" : state.liked ? "border-blush/30 bg-blushSoft text-ink" : "border-line bg-white text-mute hover:bg-neutral-50")}>
          <Heart size={14} fill={state.liked ? "currentColor" : "none"} className={state.liked ? "text-blush" : ""} />
          いいね {state.count}
        </button>
      </form>
      {state.error ? <span className="text-[0.65rem] font-bold text-red-700">{state.error}</span> : null}
    </div>
  );
}
