"use client";

import { useEffect, useState } from "react";
import { safeDisplayImageSrc } from "@/lib/imageValidation";

export function BackroomDisplayImage({ src, alt, className }: { src: string | null | undefined; alt: string; className: string }) {
  const safeSrc = safeDisplayImageSrc(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [safeSrc]);

  if (!safeSrc || failed) return null;

  return (
    <img
      src={safeSrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
