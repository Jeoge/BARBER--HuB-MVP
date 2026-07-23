"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { nextBackroomImageSourceAfterError, resolveBackroomImageSources } from "@/lib/imageValidation";

type BackroomDisplayImageProps = {
  src: string | null | undefined;
  thumbnailSrc: string | null | undefined;
  alt: string;
  className?: string;
};

export function BackroomDisplayImage({ src, thumbnailSrc, alt, className = "" }: BackroomDisplayImageProps) {
  const { displaySrc: initialDisplaySrc, fallbackSrc: safeSrc } = resolveBackroomImageSources(thumbnailSrc, src);
  const [displaySrc, setDisplaySrc] = useState(initialDisplaySrc);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [viewerFailed, setViewerFailed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const viewerDialogRef = useRef<HTMLDialogElement>(null);

  const closeViewer = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    setDisplaySrc(initialDisplaySrc);
    setFallbackAttempted(false);
    setFailed(false);
    setViewerFailed(false);
  }, [initialDisplaySrc, safeSrc]);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = viewerDialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeViewer();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (dialog?.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [closeViewer, isOpen]);

  function openViewer() {
    setViewerFailed(false);
    setIsOpen(true);
  }

  function handleDisplayImageError() {
    const next = nextBackroomImageSourceAfterError(displaySrc, safeSrc, fallbackAttempted);
    setFallbackAttempted(next.fallbackAttempted);

    if (next.src) {
      setDisplaySrc(next.src);
      return;
    }

    setFailed(true);
  }

  if (!initialDisplaySrc) return null;

  if (failed) {
    return (
      <div className={className}>
        <div className="flex h-40 w-40 max-w-full items-center justify-center rounded-[8px] border border-dashed border-line bg-white px-3 text-center text-xs font-bold text-mute" role="status">
          画像を読み込めませんでした。
        </div>
      </div>
    );
  }

  const thumbnailImage = (
    <img
      src={displaySrc ?? initialDisplaySrc}
      alt={alt}
      className="block h-full w-full object-cover object-center transition group-hover:opacity-90"
      loading="lazy"
      decoding="async"
      onError={handleDisplayImageError}
    />
  );

  return (
    <>
      <div className={className}>
        {safeSrc ? (
          <button
            ref={triggerRef}
            type="button"
            onClick={openViewer}
            aria-label={`画像を拡大して表示: ${alt}`}
            className="group block h-40 w-40 max-w-full overflow-hidden rounded-[8px] bg-neutral-950 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush focus-visible:ring-offset-2"
          >
            {thumbnailImage}
          </button>
        ) : (
          <div className="group block h-40 w-40 max-w-full overflow-hidden rounded-[8px] bg-neutral-950 text-left">{thumbnailImage}</div>
        )}
      </div>

      {isOpen && safeSrc
        ? createPortal(
            <dialog
              ref={viewerDialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={`画像を拡大表示: ${alt}`}
              className="fixed inset-0 z-[100] m-0 flex h-dvh max-h-none w-screen max-w-none items-center justify-center bg-black/85 p-4 text-left"
              style={{
                paddingTop: "max(1rem, env(safe-area-inset-top))",
                paddingRight: "max(1rem, env(safe-area-inset-right))",
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                paddingLeft: "max(1rem, env(safe-area-inset-left))",
              }}
              onCancel={(event) => {
                event.preventDefault();
                closeViewer();
              }}
              onClick={closeViewer}
            >
              <div className="relative flex max-h-full max-w-full items-center justify-center" onClick={(event) => event.stopPropagation()}>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeViewer}
                  aria-label="画像ビューアを閉じる"
                  className="absolute right-2 top-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <X aria-hidden="true" size={22} />
                </button>
                {viewerFailed ? (
                  <p className="rounded-[8px] bg-white px-4 py-3 text-sm font-black text-ink" role="status">
                    画像を読み込めませんでした。
                  </p>
                ) : (
                  <img
                    src={safeSrc}
                    alt={alt}
                    className="block max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] object-contain object-center"
                    loading="eager"
                    decoding="async"
                    onError={() => setViewerFailed(true)}
                  />
                )}
              </div>
            </dialog>,
            document.body
          )
        : null}
    </>
  );
}
