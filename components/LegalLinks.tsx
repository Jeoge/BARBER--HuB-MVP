import Link from "next/link";
import { legalLinks } from "@/lib/legalPages";

export function LegalLinks() {
  return (
    <section className="px-4 pt-9">
      <div className="overflow-hidden rounded-[10px] bg-ink text-white shadow-[0_18px_42px_rgba(17,17,17,0.16)]">
        <div className="border-b border-white/10 px-4 pb-4 pt-5">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-blush">GUIDE</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-black tracking-[0.01em]">
                BARBER <span className="text-blush">HUB</span>
              </p>
              <p className="signature-type mt-1 text-[0.62rem] text-white/58">One Success. Shared Success.</p>
            </div>
            <p className="text-right text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/38">2026</p>
          </div>
        </div>
        <div className="grid grid-cols-2">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-[3.35rem] items-center justify-between gap-2 border-b border-white/10 px-3 py-3 text-[0.76rem] font-black leading-snug text-white/86 odd:border-r odd:border-white/10 hover:bg-white/[0.04]"
            >
              <span>{link.label}</span>
              <span className="shrink-0 text-blush">›</span>
            </Link>
          ))}
        </div>
        <div className="px-4 py-4 text-[0.58rem] font-black uppercase tracking-[0.18em] text-white/35">
          © 2026 BARBER HUB. ALL RIGHTS RESERVED.
        </div>
      </div>
    </section>
  );
}
