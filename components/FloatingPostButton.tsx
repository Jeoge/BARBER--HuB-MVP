"use client";

import { Camera, FilePenLine, FileText, MessageSquare, Plus, ShieldCheck, Video, X } from "lucide-react";
import { useState } from "react";
import { AuthGateLink } from "./AuthGate";

const postItems = [
  { label: "フィード投稿", icon: Camera },
  { label: "経験記事を書く", icon: FilePenLine },
  { label: "Q&Aで相談する", icon: MessageSquare },
  { label: "Backyardに匿名投稿", icon: ShieldCheck, kind: "backyard" as const },
  { label: "講習会レポートを書く", icon: Video },
];

export function FloatingPostButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed bottom-[4.65rem] left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 px-4">
      {open ? (
        <div className="pointer-events-auto mb-2.5 ml-auto w-64 rounded-[8px] border border-line bg-white p-2 shadow-soft">
          <div className="mb-1 flex items-center gap-2 px-3 py-2 text-[0.72rem] font-black text-mute">
            <FileText aria-hidden="true" size={15} className="text-blush" />
            投稿メニュー
          </div>
          {postItems.map(({ label, icon: Icon, kind }) => (
            <AuthGateLink
              key={label}
              className="flex w-full items-center gap-2 rounded-[7px] px-3 py-2.5 text-left text-sm font-black text-ink"
              kind={kind}
              ariaLabel={label}
            >
              <Icon aria-hidden="true" size={18} className="text-blush" />
              {label}
            </AuthGateLink>
          ))}
        </div>
      ) : null}
      <button
        className="pointer-events-auto ml-auto grid h-11 w-11 place-items-center rounded-full bg-blush text-white shadow-[0_10px_24px_rgba(255,59,134,0.25)]"
        aria-label={open ? "投稿メニューを閉じる" : "投稿メニューを開く"}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X aria-hidden="true" size={23} /> : <Plus aria-hidden="true" size={27} />}
      </button>
    </div>
  );
}
