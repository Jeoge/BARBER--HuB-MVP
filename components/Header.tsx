import { Bell, Search, UserCircle } from "lucide-react";
import Link from "next/link";
import { AuthGateLink } from "./AuthGate";
import { BrandLogo } from "./BrandLogo";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[430px] items-center justify-between px-3.5">
        <Link href="/" aria-label="ホームへ戻る">
          <BrandLogo />
        </Link>
        <div className="flex items-center gap-0.5">
          <Link href="/explore" className="grid h-8 w-8 place-items-center rounded-full text-ink" aria-label="探す">
            <Search aria-hidden="true" size={17} />
          </Link>
          <AuthGateLink className="relative grid h-8 w-8 place-items-center rounded-full text-ink" ariaLabel="通知">
            <Bell aria-hidden="true" size={17} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blush" />
          </AuthGateLink>
          <AuthGateLink className="grid h-8 w-8 place-items-center rounded-full text-ink" ariaLabel="マイページ">
            <UserCircle aria-hidden="true" size={20} />
          </AuthGateLink>
        </div>
      </div>
    </header>
  );
}
