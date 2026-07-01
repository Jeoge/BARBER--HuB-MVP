"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGateLink } from "./AuthGate";

const navItems = [
  { label: "ホーム", href: "/" },
  { label: "スナップ", displayLabel: "Snap", href: "/snap", signature: true },
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
    <nav className="border-b border-line bg-white py-1.5" aria-label="カテゴリー">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3.5">
        {navItems.map((item) => {
          const active = item.href === pathname || (pathname === "/explore" && item.href.startsWith("/explore"));
          const className =
            "shrink-0 rounded-full px-3 py-1.5 text-[0.74rem] font-black " +
            (item.signature ? "signature-type snap-signature " : "") +
            (active ? "bg-blush text-white" : "border border-line bg-white text-ink");
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
