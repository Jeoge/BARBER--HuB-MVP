import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

type FormDisclaimerProps = {
  children: ReactNode;
  className?: string;
};

export function FormDisclaimer({ children, className = "" }: FormDisclaimerProps) {
  return (
    <p
      className={
        "flex items-start gap-1.5 rounded-[8px] border border-line bg-neutral-50 px-3 py-2 text-[0.7rem] font-semibold leading-relaxed text-mute " +
        className
      }
    >
      <ShieldCheck aria-hidden="true" size={13} className="mt-0.5 shrink-0 text-blush" />
      <span>{children}</span>
    </p>
  );
}
