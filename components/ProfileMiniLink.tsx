"use client";

import Link from "next/link";
import { type MouseEvent } from "react";
import { findPublicProfile, profileHref } from "@/lib/publicProfiles";

type ProfileMiniLinkProps = {
  profileId?: string;
  fallbackName?: string;
  compact?: boolean;
  className?: string;
};

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

export function ProfileMiniLink({ profileId, fallbackName = "BARBER HUB", compact = false, className = "" }: ProfileMiniLinkProps) {
  const profile = findPublicProfile(profileId);
  const name = profile?.displayName ?? fallbackName;
  const badge = profile?.badges?.[0];

  function stopParentNavigation(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
  }

  return (
    <Link
      href={profileHref(profileId)}
      onClick={stopParentNavigation}
      className={"inline-flex min-w-0 items-center gap-2 rounded-full pr-1 text-left transition hover:bg-neutral-50 " + className}
      aria-label={`${name}のプロフィールを見る`}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[0.68rem] font-black text-white">
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" onError={(event) => (event.currentTarget.style.display = "none")} />
        ) : (
          initials(name)
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold leading-tight text-ink">{name}</span>
        {!compact && badge ? <span className="mt-0.5 block truncate text-[0.62rem] font-semibold text-mute">{badge}</span> : null}
      </span>
    </Link>
  );
}
