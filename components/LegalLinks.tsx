import Link from "next/link";
import { legalLinks } from "@/lib/legalPages";

export function LegalLinks() {
  return (
    <section className="px-4 pt-8">
      <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-blush">RULES</p>
        <h2 className="mt-1 text-base font-black text-ink">法務・ルール</h2>
        <div className="mt-3 grid gap-2">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="flex min-h-10 items-center justify-between rounded-[8px] bg-neutral-50 px-3 text-sm font-black text-ink">
              {link.label}
              <span className="text-blush">›</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
