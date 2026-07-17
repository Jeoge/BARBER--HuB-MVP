"use client";

import Link from "next/link";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { safeDisplayImageSrc } from "@/lib/imageValidation";
import type { SnapDisplayImage } from "@/lib/supabase/snaps";
import { VisualTile } from "./VisualTile";

type SnapImageCarouselProps = {
  images: SnapDisplayImage[];
  alt: string;
  href?: string;
  variant?: string;
  className?: string;
  imageClassName?: string;
  compactIndicators?: boolean;
};

export function SnapImageCarousel({
  images,
  alt,
  href,
  variant = "news",
  className = "",
  imageClassName = "",
  compactIndicators = false,
}: SnapImageCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(() => new Set());
  const displayImages = useMemo(
    () =>
      images
        .map((image) => ({ ...image, url: safeDisplayImageSrc(image.url) }))
        .filter((image): image is SnapDisplayImage & { url: string } => image.url != null)
        .slice(0, 4),
    [images]
  );
  const imageSignature = displayImages.map((image) => `${image.id}:${image.url}`).join("|");

  useEffect(() => {
    setActiveIndex(0);
    setFailedImageIds(new Set());
  }, [imageSignature]);

  if (displayImages.length === 0) {
    return <VisualTile variant={variant} className={className} />;
  }

  function updateActiveIndex() {
    const viewport = viewportRef.current;
    if (viewport == null || viewport.clientWidth === 0) return;

    const nextIndex = Math.round(viewport.scrollLeft / viewport.clientWidth);
    setActiveIndex(Math.max(0, Math.min(displayImages.length - 1, nextIndex)));
  }

  function scrollToIndex(index: number) {
    const viewport = viewportRef.current;
    if (viewport == null) return;

    viewport.scrollTo({
      left: viewport.clientWidth * Math.max(0, Math.min(displayImages.length - 1, index)),
      behavior: "smooth",
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollToIndex(activeIndex + 1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollToIndex(activeIndex - 1);
    }
  }

  const frameClassName = "relative overflow-hidden rounded-[7px] bg-neutral-900 " + className;
  const imageNode = (image: SnapDisplayImage & { url: string }) => {
    const node = failedImageIds.has(image.id) ? (
      <VisualTile variant={variant} className="h-full w-full" />
    ) : (
      <img
        src={image.url}
        alt={alt}
        className={"h-full w-full object-cover object-center " + imageClassName}
        loading="lazy"
        decoding="async"
        sizes="(max-width: 430px) calc(100vw - 2rem), 398px"
        onError={() => {
          setFailedImageIds((current) => {
            if (current.has(image.id)) return current;
            const next = new Set(current);
            next.add(image.id);
            return next;
          });
        }}
      />
    );

    if (!href) return node;

    return (
      <Link href={href} className="block h-full w-full" prefetch={false}>
        {node}
      </Link>
    );
  };

  return (
    <div className={frameClassName}>
      <div
        ref={viewportRef}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth"
        onScroll={updateActiveIndex}
        onKeyDown={handleKeyDown}
        tabIndex={displayImages.length > 1 ? 0 : -1}
        role={displayImages.length > 1 ? "group" : undefined}
        aria-label={displayImages.length > 1 ? `Snap画像 ${displayImages.length}枚` : undefined}
      >
        {displayImages.map((image, index) => (
          <div key={image.id} className="h-full w-full shrink-0 snap-center">
            {imageNode(image)}
          </div>
        ))}
      </div>

      {displayImages.length > 1 ? (
        <div
          className={
            "pointer-events-none absolute inset-x-0 flex items-center justify-center gap-1 " +
            (compactIndicators ? "bottom-1" : "bottom-2")
          }
          aria-hidden="true"
        >
          {displayImages.map((image, index) => (
            <span
              key={`${image.id}-dot`}
              className={
                (compactIndicators ? "h-1 w-1 " : "h-1.5 w-1.5 ") +
                "rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.28)] " +
                (index === activeIndex ? "bg-white" : "bg-white/45")
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
