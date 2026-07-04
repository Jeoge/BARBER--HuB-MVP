import { ShieldCheck } from "lucide-react";
import { salonTransitionNotice } from "@/lib/salon-transition";

export function SalonTransitionNotice() {
  return (
    <section className="px-4 pt-6">
      <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-4">
        <div className="flex items-center gap-2 text-sm font-black text-ink">
          <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
          情報掲載と問い合わせ導線です
        </div>
        <div className="mt-2 grid gap-1.5 text-xs font-medium leading-relaxed text-mute">
          {salonTransitionNotice.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
