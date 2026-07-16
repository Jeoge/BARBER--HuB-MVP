import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";

type HeaderProps = {
  action?: ReactNode;
  variant?: "default" | "backroom";
};

export function Header({ action, variant = "default" }: HeaderProps) {
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
