import { Scissors } from "lucide-react";

export function BrandLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="grid h-7 w-7 place-items-center rounded-full bg-ink text-white">
        <Scissors aria-hidden="true" size={14} strokeWidth={2.4} />
      </div>
      <div className="leading-none">
        <p className="text-[1.02rem] font-black tracking-[0.02em]">
          BARBER <span className="text-blush">HUB</span>
        </p>
        <p className="mt-0.5 text-[0.47rem] font-bold uppercase tracking-[0.14em] text-ink">
          One Success. Shared Success.
        </p>
      </div>
    </div>
  );
}
