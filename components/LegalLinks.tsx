import Link from "next/link";
import { legalLinks } from "@/lib/legalPages";

export function LegalLinks() {
  return (
    <section className="px-4 pb-2 pt-7">
      <div className="overflow-hidden rounded-[10px] bg-[#151515] text-white shadow-[0_14px_34px_rgba(17,17,17,0.14)]">
        <div className="border-b border-white/10 px-3.5 pb-3 pt-4">
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-blush">GUIDE</p>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <div>
              <p className="text-base font-semibold tracking-[0.01em]">
                BARBER <span className="text-blush">HUB</span>
              </p>
              <p className="signature-type mt-0.5 text-[0.58rem] text-white/58">One Success. Shared Success.</p>
            </div>
            <p className="text-right text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-white/38">2026</p>
          </div>
        </div>
        <div className="grid grid-cols-2">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-[2.75rem] items-center justify-between gap-2 border-b border-white/10 px-2.5 py-2 text-[0.7rem] font-semibold leading-snug text-white/86 odd:border-r odd:border-white/10 hover:bg-white/[0.04]"
            >
              <span>{link.label}</span>
              <span className="shrink-0 text-blush">›</span>
            </Link>
          ))}
        </div>
        <div className="px-3.5 py-3 text-[0.54rem] font-semibold uppercase tracking-[0.16em] text-white/35">
          © 2026 BARBER HUB. ALL RIGHTS RESERVED.
        </div>
      </div>
    </section>
  );
}
