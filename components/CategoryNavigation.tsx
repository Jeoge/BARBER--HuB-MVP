"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGateLink } from "./AuthGate";

const navItems = [
  { label: "ホーム", href: "/" },
  { label: "Snap", href: "/snap" },
  { label: "経営", href: "/explore?category=business" },
  { label: "集客", href: "/explore?category=marketing" },
  { label: "AI", href: "/explore?category=ai" },
  { label: "Back Room", href: "/backyard", auth: true },
  { label: "技術", href: "/explore?category=tech" },
  { label: "求人", href: "/jobs" },
  { label: "講習", href: "/seminars" },
  { label: "道具", href: "/explore?category=tools" },
];

export function CategoryNavigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-line/60 bg-white py-1.5" aria-label="カテゴリー">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
        {navItems.map((item) => {
          const active = item.href === pathname || (pathname === "/explore" && item.href.startsWith("/explore"));
          const className =
            "shrink-0 rounded-full px-3 py-1.5 text-[0.72rem] font-semibold transition " +
            (active ? "bg-blush text-white" : "border border-line/80 bg-white text-ink/78");

          return item.auth ? (
            <AuthGateLink key={item.href} className={className} kind="backyard" ariaLabel={item.label}>
              {item.label}
            </AuthGateLink>
          ) : (
            <Link key={item.href} href={item.href} className={className} aria-label={item.label}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
