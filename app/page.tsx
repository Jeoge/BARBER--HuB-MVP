import { BackyardSection } from "@/components/BackyardSection";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CategoryNavigation } from "@/components/CategoryNavigation";
import { ContributionSection } from "@/components/ContributionSection";
import { EditorialTrustSection } from "@/components/EditorialTrustSection";
import { FloatingPostButton } from "@/components/FloatingPostButton";
import { Header } from "@/components/Header";
import { HorizontalRail } from "@/components/HorizontalRail";
import { LiveEditorialCover } from "@/components/LiveEditorialCover";
import { MainFeature } from "@/components/MainFeature";
import { QASection } from "@/components/QASection";
import { SnapSection } from "@/components/SnapSection";
import { SponsorSection } from "@/components/SponsorSection";
import { ThanksRanking } from "@/components/ThanksRanking";
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
        subtitle="理容師に役立つ道具・講習・学校情報だけを、控えめに紹介。"
        items={sponsorsForPlacement("home")}
      />
      <BackyardSection />
      <HorizontalRail title="新着記事" items={articles.slice(0, 5)} />
      <ContributionSection />
      <EditorialTrustSection />
      <QASection />
      <ThanksRanking />
      <MainFeature />
      <HorizontalRail title="メーカー新商品" items={articles.filter((article) => article.category === "メーカー新商品")} />
      <HorizontalRail title="講習会" items={seminars} hrefPrefix="/seminars" />
      <HorizontalRail title="学生・求人" items={jobs} hrefPrefix="/jobs" />
      <section className="px-4 pt-9">
        <div className="rounded-[8px] bg-ink p-5 text-white">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/55">BARBER HUB EDIT</p>
          <p className="mt-2 text-xl font-black leading-tight">
            毎朝、理容業界の表紙を開く。
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-white/68">
            ニュース、SNAP、道具、講習会。今日見るべきものだけを、軽く。
          </p>
        </div>
      </section>
      <FloatingPostButton />
      <BottomNavigation />
    </main>
  );
}
