"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "ホーム", href: "/" },
  { label: "Snap", href: "/snap" },
  { label: "経営", href: "/topics/management" },
  { label: "集客", href: "/topics/marketing" },
  { label: "AI", href: "/topics/ai" },
  { label: "Back Room", href: "/backroom" },
  { label: "求人", href: "/jobs" },
  { label: "開業承継", href: "/succession" },
  { label: "技術", href: "/topics/technique" },
  { label: "道具", href: "/topics/tools" },
];

export function CategoryNavigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-line/60 bg-white py-1.5" aria-label="カテゴリー">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4">
        {navItems.map((item) => {
          const active = item.href === pathname || (pathname.startsWith("/topics/") && item.href === pathname);
          const className =
            "pressable shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[0.7rem] font-semibold " +
            (active ? "bg-blush text-white" : "border border-line/80 bg-white text-ink/78");

          return (
            <Link key={item.href} href={item.href} className={className} aria-label={item.label}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
