import { Sparkles } from "lucide-react";
import { AuthGateButton } from "./AuthGate";

type ThanksButtonProps = {
  count?: number;
  inverted?: boolean;
};

export function ThanksButton({ inverted = false }: ThanksButtonProps) {
  return (
    <AuthGateButton
      className={
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-black shadow-sm " +
        (inverted ? "bg-white text-blush" : "bg-blush text-white")
      }
      ariaLabel="THANKSを送る"
    >
      <Sparkles aria-hidden="true" size={17} />
      Thanks
    </AuthGateButton>
  );
}
