"use client";

import { Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useState, useTransition } from "react";
import { followAction, unfollowAction } from "@/lib/actions/follow";
import { isFollowing as fetchIsFollowing } from "@/lib/supabase/follows";
import { createClient } from "@/lib/supabase/client";

type FollowButtonProps = {
  profileId?: string;
  authorId?: string;
  followingUserId?: string;
  variant?: "profile" | "snapInline";
  className?: string;
  onFollowToggle?: (payload: {
    followingUserId: string;
    authorId: string;
    isFollowing: boolean;
  }) => void;
};

export function FollowButton({
  profileId,
  authorId,
  followingUserId,
  variant = "profile",
  className = "",
  onFollowToggle,
}: FollowButtonProps) {
  const targetUserId = followingUserId ?? profileId ?? authorId;

  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 初期状態は follows テーブルの実データから判定する（localStorageは使わない）。
  useEffect(() => {
    if (targetUserId == null) return;
    let active = true;
    const supabase = createClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || user == null) return;

      if (user.id === targetUserId) {
        setIsSelf(true);
        return;
      }

      const following = await fetchIsFollowing(supabase, user.id, targetUserId);
      if (active) setIsFollowing(following);
    })();

    return () => {
      active = false;
    };
  }, [targetUserId]);

  // 対象が無い / 自分自身のときは表示しない。
  if (targetUserId == null || isSelf) {
    return null;
  }

  const target = targetUserId;

  function toggleFollow(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (isPending) return;

    const next = !isFollowing;
    setIsFollowing(next); // 楽観的UI更新
    onFollowToggle?.({ followingUserId: target, authorId: authorId ?? target, isFollowing: next });

    startTransition(async () => {
      const result = next ? await followAction(target) : await unfollowAction(target);
      // 未ログインならサーバーアクション側でログインページへリダイレクトされる。
      if (result?.status === "error") {
        setIsFollowing(!next); // 失敗時のみ楽観的更新を巻き戻す
        return;
      }
      // App Routerのクライアントキャッシュを無効化し、他ページに戻ったときも
      // フォロー状態・フォロー数が最新になるようにする。
      router.refresh();
    });
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
      aria-busy={isPending}
      aria-label={isFollowing ? "フォローを解除する" : "投稿者をフォローする"}
      className={variantClass + (className ? ` ${className}` : "")}
    >
      {variant === "profile" ? (isFollowing ? <Check aria-hidden="true" size={15} /> : <Plus aria-hidden="true" size={15} />) : null}
      {isFollowing ? "フォロー中" : variant === "profile" ? "フォローする" : "＋フォロー"}
    </button>
  );
}
