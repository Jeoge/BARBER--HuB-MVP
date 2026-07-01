import { Scissors } from "lucide-react";

export function BrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-7 w-7 place-items-center rounded-full bg-ink text-white">
        <Scissors aria-hidden="true" size={13} strokeWidth={2.25} />
      </div>
      <div className="leading-none">
        <p className="text-[0.98rem] font-black tracking-[0.015em]">
          BARBER <span className="text-blush">HUB</span>
        </p>
        <p className="signature-type brand-signature mt-1 text-ink/75">
          One Success. Shared Success.
        </p>
      </div>
    </div>
  );
}
