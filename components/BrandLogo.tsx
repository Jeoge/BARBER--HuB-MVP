import { Scissors } from "lucide-react";
import { backRoomTheme } from "@/lib/backRoomTheme";

type BrandLogoProps = {
  variant?: "default" | "backroom";
};

export function BrandLogo({ variant = "default" }: BrandLogoProps) {
  const isBackroom = variant === "backroom";

  return (
    <div className="flex items-center gap-2.5">
      <div className={"grid h-[1.95rem] w-[1.95rem] place-items-center rounded-full " + (isBackroom ? backRoomTheme.logoIcon : "bg-ink text-white")}>
        <Scissors aria-hidden="true" size={14} strokeWidth={2.1} />
      </div>
      <div className="leading-[0.94]">
        <p className="text-[1.08rem] font-black tracking-[0.018em]">
          BARBER <span className={isBackroom ? backRoomTheme.logoHub : "text-blush"}>HUB</span>
        </p>
        <p className="signature-type brand-signature mt-[0.28rem] text-ink/72">
          One Success. Shared Success.
        </p>
      </div>
    </div>
  );
}
