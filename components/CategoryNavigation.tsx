"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGateLink } from "./AuthGate";

const navItems = [
  { label: "ホーム", href: "/" },
  { label: "スナップ", displayLabel: "Snap", href: "/snap" },
  { label: "経営", href: "/explore?category=business" },
  { label: "集客", href: "/explore?category=marketing" },
  { label: "AI", href: "/explore?category=ai" },
  { label: "技術", href: "/explore?category=tech" },
  { label: "道具", href: "/explore?category=tools" },
  { label: "メーカー", href: "/partners" },
  { label: "Q&A", href: "/qa" },
  { label: "講習会", href: "/seminars" },
  { label: "求人", href: "/jobs" },
  { label: "Backyard", href: "/backyard", auth: true },
];

export function CategoryNavigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-line/70 bg-white py-2" aria-label="カテゴリー">
      <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4">
        {navItems.map((item) => {
          const active = item.href === pathname || (pathname === "/explore" && item.href.startsWith("/explore"));
          const className =
            "shrink-0 rounded-full px-3.5 py-1.5 text-[0.74rem] font-semibold " +
            (active ? "bg-blush text-white" : "border border-line/80 bg-white text-ink/80");
          const label = item.displayLabel ?? item.label;

          return item.auth ? (
            <AuthGateLink key={item.href} className={className} kind="backyard" ariaLabel={item.label}>
              {label}
            </AuthGateLink>
          ) : (
            <Link key={item.href} href={item.href} className={className} aria-label={item.label}>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
