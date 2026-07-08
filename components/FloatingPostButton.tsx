"use client";

import { Camera, FilePenLine, FileText, MessageSquare, Plus, ShieldCheck, Video, X } from "lucide-react";
import { useState } from "react";
import { AuthGateLink } from "./AuthGate";

const postItems = [
  { label: "スナップ投稿", icon: Camera, href: "/post/snap" },
  { label: "経験記事を書く", icon: FilePenLine, href: "/post/article" },
  { label: "Q&Aで相談する", icon: MessageSquare, href: "/post/qa" },
  { label: "Back Roomに投稿", icon: ShieldCheck, href: "/post/backroom", kind: "backyard" as const, signupNextHref: "/post/backroom" },
  { label: "講習会レポートを書く", icon: Video, href: "/post/seminar" },
];

export function FloatingPostButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed bottom-[4.5rem] left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 px-4">
      {open ? (
        <div className="pointer-events-auto mb-2.5 ml-auto w-64 rounded-[8px] border border-line/80 bg-white p-2 shadow-[0_14px_30px_rgba(17,17,17,0.1)]">
          <div className="mb-1 flex items-center gap-2 px-3 py-2 text-[0.72rem] font-black text-mute">
            <FileText aria-hidden="true" size={15} className="text-blush" />
            投稿メニュー
          </div>
          {postItems.map(({ label, icon: Icon, href, kind, signupNextHref }) => (
            <AuthGateLink
              key={label}
              href={href}
              className="flex w-full items-center gap-2 rounded-[7px] px-3 py-2.5 text-left text-sm font-semibold text-ink transition active:scale-[0.98] disabled:opacity-60"
              kind={kind}
              ariaLabel={label}
              signupNextHref={signupNextHref}
            >
              <Icon aria-hidden="true" size={18} className="text-blush" />
              {label}
            </AuthGateLink>
          ))}
        </div>
      ) : null}
      <button
        className="pointer-events-auto ml-auto grid h-9 w-9 place-items-center rounded-full bg-blush text-white shadow-[0_6px_14px_rgba(255,59,134,0.18)] transition active:scale-90"
        aria-label={open ? "投稿メニューを閉じる" : "投稿メニューを開く"}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X aria-hidden="true" size={19} /> : <Plus aria-hidden="true" size={23} />}
      </button>
    </div>
  );
}
