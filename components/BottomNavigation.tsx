"use client";

import { Bell, Home, Search, UserCircle, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGateLink } from "./AuthGate";

const navItems = [
  { label: "ホーム", href: "/", icon: Home },
  { label: "スナップ", displayLabel: "Snap", href: "/snap", icon: Users },
  { label: "探す", href: "/explore", icon: Search },
  { label: "通知", href: "/notifications", icon: Bell, auth: true },
  { label: "マイページ", href: "/mypage", icon: UserCircle, auth: true },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-line/60 bg-white/88 px-3 pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-1.5 shadow-[0_-6px_14px_rgba(17,17,17,0.025)] backdrop-blur-sm">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map(({ label, displayLabel, href, icon: Icon, auth }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const className =
            "flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-[8px] text-[0.57rem] font-medium transition active:opacity-70 " +
            (active ? "text-blush/90" : "text-ink/68");

          const content = (
            <>
              <Icon aria-hidden="true" size={17} strokeWidth={active ? 2.25 : 1.9} />
              <span>{displayLabel ?? label}</span>
            </>
          );

          return auth ? (
            <AuthGateLink key={href} href={href} className={className} ariaLabel={label}>
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
