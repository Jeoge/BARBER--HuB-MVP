"use client";

import { Bell, Home, Search, UserCircle, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGateLink } from "./AuthGate";

const navItems = [
  { label: "ホーム", href: "/", icon: Home },
  { label: "スナップ", href: "/snap", icon: Users },
  { label: "探す", href: "/explore", icon: Search },
  { label: "通知", href: "/notifications", icon: Bell, auth: true },
  { label: "マイページ", href: "/mypage", icon: UserCircle, auth: true },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-white/94 px-3 pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-1.5 shadow-[0_-10px_24px_rgba(17,17,17,0.05)] backdrop-blur-sm">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map(({ label, href, icon: Icon, auth }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const className =
            "flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-[8px] text-[0.6rem] font-black " +
            (active ? "text-blush" : "text-ink");

          const content = (
            <>
              <Icon aria-hidden="true" size={19} strokeWidth={active ? 2.8 : 2.2} />
              <span>{label}</span>
            </>
          );

          return auth ? (
            <AuthGateLink key={href} className={className} ariaLabel={label}>
              {content}
            </AuthGateLink>
          ) : (
            <Link key={href} href={href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
