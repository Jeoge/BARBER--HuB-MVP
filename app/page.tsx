import { BackyardSection } from "@/components/BackyardSection";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CategoryNavigation } from "@/components/CategoryNavigation";
import { ContributionSection } from "@/components/ContributionSection";
import { FloatingPostButton } from "@/components/FloatingPostButton";
import { Header } from "@/components/Header";
import { HorizontalRail } from "@/components/HorizontalRail";
import { LiveEditorialCover } from "@/components/LiveEditorialCover";
import { MainFeature } from "@/components/MainFeature";
import { QASection } from "@/components/QASection";
import { SnapSection } from "@/components/SnapSection";
import { SponsorSection } from "@/components/SponsorSection";
import { articles, jobs, seminars } from "@/lib/mockData";
import { sponsorsForPlacement } from "@/lib/sponsors";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-[430px] overflow-x-hidden bg-white pb-40 shadow-[0_0_70px_rgba(17,17,17,0.06)]">
      <Header />
      <CategoryNavigation />
      <LiveEditorialCover />
      <SnapSection />
      <SponsorSection
        eyebrow="Sponsored"
        title="今週の協賛パートナー"
        items={sponsorsForPlacement("home")}
      />
      <BackyardSection />
      <HorizontalRail title="新着記事" items={articles.slice(0, 5)} />
      <ContributionSection />
      <QASection />
      <MainFeature />
      <HorizontalRail title="メーカー新商品" items={articles.filter((article) => article.category === "メーカー新商品")} />
      <HorizontalRail title="講習会" items={seminars} hrefPrefix="/seminars" />
      <HorizontalRail title="学生・求人" items={jobs} hrefPrefix="/jobs" />
      <FloatingPostButton />
      <BottomNavigation />
    </main>
  );
}
