"use client";

import { useEffect } from "react";

let openCommentSheetCount = 0;

function syncCommentSheetFlag() {
  if (typeof document === "undefined") return;

  if (openCommentSheetCount > 0) {
    document.body.dataset.commentSheetOpen = "true";
    return;
  }

  delete document.body.dataset.commentSheetOpen;
}

export function useCommentSheetFabHidden(open: boolean) {
  useEffect(() => {
    if (!open) return;

    openCommentSheetCount += 1;
    syncCommentSheetFlag();

    return () => {
      openCommentSheetCount = Math.max(0, openCommentSheetCount - 1);
      syncCommentSheetFlag();
    };
  }, [open]);
}
