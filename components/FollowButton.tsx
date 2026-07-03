"use client";

import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type FollowButtonProps = {
  profileId: string;
};

function followKey(profileId: string) {
  return `barber-hub:follow:${profileId}`;
}

export function FollowButton({ profileId }: FollowButtonProps) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setFollowing(window.localStorage.getItem(followKey(profileId)) === "1");
  }, [profileId]);

  function toggleFollow() {
    const next = !following;
    setFollowing(next);
    if (next) {
      window.localStorage.setItem(followKey(profileId), "1");
    } else {
      window.localStorage.removeItem(followKey(profileId));
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      aria-pressed={following}
      className={
        "inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] px-3 text-xs font-black transition " +
        (following ? "border border-line bg-white text-ink" : "bg-ink text-white")
      }
    >
      {following ? <Check aria-hidden="true" size={15} /> : <Plus aria-hidden="true" size={15} />}
      {following ? "フォロー中" : "フォローする"}
    </button>
  );
}
