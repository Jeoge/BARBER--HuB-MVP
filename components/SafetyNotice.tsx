import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type SafetyNoticeProps = {
  title?: string;
  children: ReactNode;
  href?: string;
  linkLabel?: string;
  tone?: "blush" | "neutral";
};

export function SafetyNotice({
  title = "安心して使うための確認",
  children,
  href = "/community-guidelines",
  linkLabel = "投稿ガイドライン",
  tone = "neutral",
}: SafetyNoticeProps) {
  const wrapperClass =
    tone === "blush"
      ? "rounded-[8px] border border-blush/20 bg-blushSoft p-3"
      : "rounded-[8px] border border-line bg-neutral-50 p-3";

  return (
    <div className={wrapperClass}>
      <div className="flex items-center gap-2 text-sm font-black text-ink">
        <ShieldCheck aria-hidden="true" size={17} className="text-blush" />
        {title}
      </div>
      <div className="mt-2 text-xs font-medium leading-relaxed text-mute">{children}</div>
      {href ? (
        <Link href={href} className="mt-2 inline-flex text-[0.68rem] font-black text-blush">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
