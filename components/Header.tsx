import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";

type HeaderProps = {
  action?: ReactNode;
  variant?: "default" | "backroom" | "home";
};

export function Header({ action, variant = "default" }: HeaderProps) {
  if (variant === "home") {
    return (
      <header className="sticky top-0 z-40 overflow-hidden border-b border-white/10 bg-[#050505] text-white">
        <div className="relative mx-auto flex min-h-[calc(7.25rem+env(safe-area-inset-top))] max-w-[430px] items-center justify-center overflow-hidden px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_-18%,rgba(255,59,134,0.11),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0)_48%)]"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10" />
          <div className="home-open-source-label absolute left-4 top-[calc(env(safe-area-inset-top)+0.78rem)] z-10 text-[0.78rem] text-white">
            <span>業界のオープンソース</span>
            <span className="mt-1 block h-[2px] w-12 rounded-full bg-blush" />
          </div>
          <Link href="/" aria-label="ホームへ戻る" className="relative z-10 shrink-0">
            <BrandLogo variant="home" />
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-white/96 backdrop-blur">
      <div className="mx-auto flex h-[3.05rem] max-w-[430px] items-center justify-between gap-3 px-4">
        <Link href="/" aria-label="ホームへ戻る" className="min-w-0 shrink-0">
          <BrandLogo variant={variant} />
        </Link>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
