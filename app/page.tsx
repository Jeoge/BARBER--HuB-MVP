import { BackyardSection } from "@/components/BackyardSection";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CategoryNavigation } from "@/components/CategoryNavigation";
import { ContributionSection } from "@/components/ContributionSection";
import { EditorialTrustSection } from "@/components/EditorialTrustSection";
import { Feed } from "@/components/Feed";
import { FloatingPostButton } from "@/components/FloatingPostButton";
import { Header } from "@/components/Header";
import { HorizontalRail } from "@/components/HorizontalRail";
import { LiveEditorialCover } from "@/components/LiveEditorialCover";
import { MainFeature } from "@/components/MainFeature";
import { QASection } from "@/components/QASection";
import { ThanksRanking } from "@/components/ThanksRanking";
import { articles, jobs, seminars } from "@/lib/mockData";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-[430px] overflow-x-hidden bg-white pb-40 shadow-[0_0_80px_rgba(17,17,17,0.08)]">
      <Header />
      <CategoryNavigation />
      <LiveEditorialCover />
      <Feed />
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
      <section className="px-4 pt-7">
        <div className="rounded-[8px] bg-ink p-5 text-white">
          <p className="text-xl font-black leading-tight">
            BARBER HUBは、毎日編集される理容業界の表紙です
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-white/72">
            固定記事だけでなく、投稿・ニュース・新商品もAI編集部が整理。開くたびに、今日の理容業界が見えてきます。
          </p>
        </div>
      </section>
      <FloatingPostButton />
      <BottomNavigation />
    </main>
  );
}
