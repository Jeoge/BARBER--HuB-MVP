import { Bell, Search, UserCircle } from "lucide-react";
import Link from "next/link";
import { AuthGateLink } from "./AuthGate";
import { BrandLogo } from "./BrandLogo";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/96 backdrop-blur">
      <div className="mx-auto flex h-[3.2rem] max-w-[430px] items-center justify-between px-4">
        <Link href="/" aria-label="ホームへ戻る">
          <BrandLogo />
        </Link>
        <div className="flex items-center gap-1.5">
          <Link href="/explore" className="grid h-8 w-8 place-items-center rounded-full text-ink/85" aria-label="探す">
            <Search aria-hidden="true" size={16} />
          </Link>
          <AuthGateLink className="relative grid h-8 w-8 place-items-center rounded-full text-ink/85" ariaLabel="通知">
            <Bell aria-hidden="true" size={16} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blush" />
          </AuthGateLink>
          <AuthGateLink className="grid h-8 w-8 place-items-center rounded-full text-ink/85" ariaLabel="マイページ">
            <UserCircle aria-hidden="true" size={19} />
          </AuthGateLink>
        </div>
      </div>
    </header>
  );
}
