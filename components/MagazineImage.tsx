"use client";

import { useState } from "react";
import { VisualTile } from "./VisualTile";

type MagazineImageProps = {
  src?: string;
  alt: string;
  variant?: string;
  className?: string;
  imageClassName?: string;
};

export function MagazineImage({ src, alt, variant = "news", className = "", imageClassName = "" }: MagazineImageProps) {
  const [failed, setFailed] = useState(false);

  if (src == null || src.length === 0 || failed) {
    return <VisualTile variant={variant} className={className} />;
  }

  return (
    <div className={"relative overflow-hidden rounded-[7px] bg-neutral-900 " + className}>
      <img
        src={src}
        alt={alt}
        className={"h-full w-full object-cover object-center " + imageClassName}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
