"use client";

import { useState } from "react";
import { safeDisplayImageSrc } from "@/lib/imageValidation";

type ProfileAvatarSize = "feed" | "compact" | "small";

type ProfileAvatarProps = {
  src?: string | null;
  name: string;
  size?: ProfileAvatarSize;
  className?: string;
};

const sizeClass: Record<ProfileAvatarSize, string> = {
  feed: "h-10 w-10 text-[0.78rem]",
  compact: "h-9 w-9 text-[0.72rem]",
  small: "h-8 w-8 text-[0.68rem]",
};

function initials(name: string) {
  return (name.trim().slice(0, 1) || "B").toUpperCase();
}

export function ProfileAvatar({ src, name, size = "feed", className = "" }: ProfileAvatarProps) {
  const [failed, setFailed] = useState(false);
  const imageSrc = safeDisplayImageSrc(src);

  return (
    <span
      className={
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-ink font-black text-white " +
        sizeClass[size] +
        (className ? " " + className : "")
      }
    >
      {imageSrc && !failed ? (
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export type { ProfileAvatarSize };
