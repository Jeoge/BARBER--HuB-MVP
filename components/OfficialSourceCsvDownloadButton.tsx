"use client";

import { Download } from "lucide-react";
import { useState } from "react";

export function OfficialSourceCsvDownloadButton({ csv, fileName }: { csv: string; fileName: string }) {
  const [pending, setPending] = useState(false);

  async function handleDownload() {
    setPending(true);
    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-4 text-sm font-black text-ink disabled:cursor-wait disabled:opacity-60"
    >
      <Download aria-hidden="true" size={17} />
      {pending ? "CSVを準備中..." : "CSVをダウンロード"}
    </button>
  );
}
