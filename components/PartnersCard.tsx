import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function PartnersCard() {
  return (
    <section className="px-4 pt-7" aria-label="PARTNERS">
      <Link
        href="/partners"
        className="pressable group block rounded-[10px] border border-line bg-[#fcfcfc] p-4 shadow-[0_8px_24px_rgba(17,17,17,0.035)] hover:border-blush/35 hover:bg-blushSoft/25"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="h-1 w-8 rounded-full bg-blush" />
            <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-blush">PARTNERS</p>
          </div>
          <ArrowRight aria-hidden="true" size={18} className="shrink-0 text-blush transition-transform group-hover:translate-x-0.5" />
        </div>
        <p className="mt-3 text-base font-black leading-snug text-ink">理容業界を、ともに盛り上げる。</p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-mute group-hover:text-ink">
          協賛・広告掲載について
          <ArrowRight aria-hidden="true" size={14} />
        </span>
      </Link>
    </section>
  );
}
