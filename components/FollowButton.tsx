"use client";

import { Check, Plus } from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";
import { currentUser } from "@/lib/userDashboard";

type FollowButtonProps = {
  profileId?: string;
  authorId?: string;
  currentUserId?: string;
  followerId?: string;
  followingUserId?: string;
  variant?: "profile" | "snapInline";
  className?: string;
  onFollowToggle?: (payload: {
    followerId: string;
    followingUserId: string;
    authorId: string;
    isFollowing: boolean;
  }) => void;
};

function followKey(followerId: string, followingUserId: string) {
  return `barber-hub:follow:${followerId}:${followingUserId}`;
}

function legacyFollowKey(followingUserId: string) {
  return `barber-hub:follow:${followingUserId}`;
}

export function FollowButton({
  profileId,
  authorId,
  currentUserId = currentUser.profileId,
  followerId = currentUser.id,
  followingUserId,
  variant = "profile",
  className = "",
  onFollowToggle,
}: FollowButtonProps) {
  const targetUserId = followingUserId ?? profileId ?? authorId;
  const targetAuthorId = authorId ?? targetUserId;
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (targetUserId == null) return;
    setIsFollowing(
      window.localStorage.getItem(followKey(followerId, targetUserId)) === "1" ||
        window.localStorage.getItem(legacyFollowKey(targetUserId)) === "1"
    );
  }, [followerId, targetUserId]);

  if (targetUserId == null || targetAuthorId == null || currentUserId === targetAuthorId) {
    return null;
  }

  const followTargetUserId = targetUserId;
  const followAuthorId = targetAuthorId;

  function toggleFollow(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const next = !isFollowing;
    setIsFollowing(next);
    if (next) {
      window.localStorage.setItem(followKey(followerId, followTargetUserId), "1");
      window.localStorage.setItem(legacyFollowKey(followTargetUserId), "1");
    } else {
      window.localStorage.removeItem(followKey(followerId, followTargetUserId));
      window.localStorage.removeItem(legacyFollowKey(followTargetUserId));
    }
    onFollowToggle?.({ followerId, followingUserId: followTargetUserId, authorId: followAuthorId, isFollowing: next });
  }

  const profileClass =
    "inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] px-3 text-xs font-black transition " +
    (isFollowing ? "border border-line bg-white text-ink" : "bg-ink text-white");
  const snapClass =
    "inline-flex h-8 shrink-0 items-center justify-center rounded-full border px-2.5 text-[0.68rem] font-black leading-none transition " +
    (isFollowing ? "border-line/80 bg-white text-ink/60" : "border-line/80 bg-white text-blush");
  const variantClass = variant === "profile" ? profileClass : snapClass;

  return (
    <button
      type="button"
      onClick={toggleFollow}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? "フォローを解除する" : "投稿者をフォローする"}
      className={variantClass + (className ? ` ${className}` : "")}
    >
      {variant === "profile" ? (isFollowing ? <Check aria-hidden="true" size={15} /> : <Plus aria-hidden="true" size={15} />) : null}
      {isFollowing ? "フォロー中" : variant === "profile" ? "フォローする" : "＋フォロー"}
    </button>
  );
}
