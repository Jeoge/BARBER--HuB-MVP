"use client";

import Link from "next/link";
import { type MouseEvent } from "react";
import { findPublicProfile, profileHref } from "@/lib/publicProfiles";
import { ProfileAvatar, type ProfileAvatarSize } from "./ProfileAvatar";

type ProfileMiniLinkProps = {
  profileId?: string;
  fallbackName?: string;
  avatarUrl?: string | null;
  meta?: string | null;
  href?: string;
  compact?: boolean;
  size?: ProfileAvatarSize;
  className?: string;
};

export function ProfileMiniLink({
  profileId,
  fallbackName = "BARBER HUB",
  avatarUrl,
  meta,
  href,
  compact = false,
  size,
  className = "",
}: ProfileMiniLinkProps) {
  const profile = findPublicProfile(profileId);
  const name = profile?.displayName ?? fallbackName;
  const badge = meta?.trim() || (profile?.isHiring ? "求人中" : profile?.badges?.[0]);
  const avatarSize = size ?? (compact ? "compact" : "feed");

  function stopParentNavigation(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
  }

  return (
    <Link
      href={href ?? profileHref(profileId)}
      onClick={stopParentNavigation}
      className={"inline-flex min-w-0 items-center gap-2.5 rounded-full pr-1 text-left transition hover:bg-neutral-50 " + className}
      aria-label={`${name}のプロフィールを見る`}
    >
      <ProfileAvatar src={avatarUrl ?? profile?.avatarUrl} name={name} size={avatarSize} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold leading-tight text-ink">{name}</span>
        {!compact && badge ? <span className="mt-0.5 block truncate text-[0.62rem] font-semibold text-mute">{badge}</span> : null}
      </span>
    </Link>
  );
}
