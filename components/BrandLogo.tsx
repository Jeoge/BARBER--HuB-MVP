import { Scissors } from "lucide-react";
import { backRoomTheme } from "@/lib/backRoomTheme";

type BrandLogoProps = {
  variant?: "default" | "backroom" | "home";
};

export function BrandLogo({ variant = "default" }: BrandLogoProps) {
  const isBackroom = variant === "backroom";
  const isHome = variant === "home";
  const iconClass = isBackroom
    ? backRoomTheme.logoIcon
    : isHome
      ? "bg-white/10 text-white ring-1 ring-white/15 shadow-[0_0_0_3px_rgba(255,59,134,0.12),0_10px_24px_rgba(0,0,0,0.36)]"
      : "bg-ink text-white";

  return (
    <div className={isHome ? "flex items-center gap-3" : "flex items-center gap-2.5"}>
      <div className={(isHome ? "grid h-10 w-10 shrink-0 place-items-center rounded-full " : "grid h-[1.95rem] w-[1.95rem] place-items-center rounded-full ") + iconClass}>
        <Scissors aria-hidden="true" size={isHome ? 18 : 14} strokeWidth={isHome ? 2.25 : 2.1} />
      </div>
      <div className={isHome ? "leading-[0.9] text-white" : "leading-[0.94]"}>
        <p className={isHome ? "whitespace-nowrap text-[1.62rem] font-black tracking-normal text-white" : "text-[1.08rem] font-black tracking-[0.018em]"}>
          BARBER <span className={isBackroom ? backRoomTheme.logoHub : "text-blush"}>HUB</span>
        </p>
        <p className={isHome ? "signature-type home-brand-signature mt-[0.36rem] whitespace-nowrap text-center text-[0.66rem] text-white/72" : "signature-type brand-signature mt-[0.28rem] text-ink/72"}>
          One Success. Shared Success.
        </p>
      </div>
    </div>
  );
}
