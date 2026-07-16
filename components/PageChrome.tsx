import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { FloatingPostButton } from "./FloatingPostButton";
import { Header } from "./Header";
import { backRoomTheme } from "@/lib/backRoomTheme";

type PageChromeProps = {
  children: ReactNode;
  variant?: "default" | "backroom";
};

export function PageChrome({ children, variant = "default" }: PageChromeProps) {
  const isBackroom = variant === "backroom";

  return (
    <main className={"mx-auto min-h-screen max-w-[430px] overflow-x-hidden pb-40 shadow-[0_0_80px_rgba(17,17,17,0.08)] " + (isBackroom ? backRoomTheme.page : "bg-white")}>
      <Header variant={variant} />
      {children}
      <FloatingPostButton variant={variant} />
      <BottomNavigation />
    </main>
  );
}
