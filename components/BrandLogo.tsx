import { Scissors } from "lucide-react";
import { backRoomTheme } from "@/lib/backRoomTheme";

type BrandLogoProps = {
  variant?: "default" | "backroom" | "home";
};

export function BrandLogo({ variant = "default" }: BrandLogoProps) {
  const isBackroom = variant === "backroom";
  const isHome = variant === "home";
  const iconClass = isBackroom ? backRoomTheme.logoIcon : "bg-ink text-white";

  return (
    <div className={isHome ? "flex items-center" : "flex items-center gap-2.5"}>
      {!isHome ? (
        <div className={"grid h-[1.95rem] w-[1.95rem] place-items-center rounded-full " + iconClass}>
          <Scissors aria-hidden="true" size={14} strokeWidth={2.1} />
        </div>
      ) : null}
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
