import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { FloatingPostButton } from "./FloatingPostButton";
import { Header } from "./Header";
import { LegalLinks } from "./LegalLinks";

type PageChromeProps = {
  children: ReactNode;
};

export function PageChrome({ children }: PageChromeProps) {
  return (
    <main className="mx-auto min-h-screen max-w-[430px] overflow-x-hidden bg-white pb-40 shadow-[0_0_80px_rgba(17,17,17,0.08)]">
      <Header />
      {children}
      <LegalLinks />
      <FloatingPostButton />
      <BottomNavigation />
    </main>
  );
}
