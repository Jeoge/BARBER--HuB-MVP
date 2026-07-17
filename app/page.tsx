import { BackyardSection } from "@/components/BackyardSection";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CategoryNavigation } from "@/components/CategoryNavigation";
import { ContributionSection } from "@/components/ContributionSection";
import { FloatingPostButton } from "@/components/FloatingPostButton";
import { Header } from "@/components/Header";
import { HorizontalRail } from "@/components/HorizontalRail";
import { LiveEditorialCover } from "@/components/LiveEditorialCover";
import { LegalLinks } from "@/components/LegalLinks";
import { QASection } from "@/components/QASection";
import { SnapSection } from "@/components/SnapSection";
import { SponsorSection } from "@/components/SponsorSection";
import { StoreDirectoryProvider, StoreDirectoryStatsCard, StoreSearchHeaderButton } from "@/components/StoreDirectorySearch";
import { imageVariantForArticleCategory } from "@/lib/articleCategories";
import { composeHomeEditorPicks } from "@/lib/editorPicks";
import { composeNewsWithFallback, listPublicNews } from "@/lib/news-drafts/public-news";
import { articles, jobs, seminars } from "@/lib/mockData";
import { sponsorsForPlacement } from "@/lib/sponsors";
import { resolveArticleImageUrls } from "@/lib/supabase/article-images";
import {
  articleAuthorMeta,
  articleAuthorName,
  articleExcerpt,
  listEditorPickArticles,
  listPublishedArticles,
  type ArticleWithAuthor,
} from "@/lib/supabase/articles";
import { getPublicBarberShopCount } from "@/lib/supabase/barber-shops";
import { listQaQuestions } from "@/lib/supabase/qa";
import { createClient } from "@/lib/supabase/server";

function articleRailItem(article: ArticleWithAuthor) {
  return {
    id: article.id,
    title: article.title,
    category: article.category ?? "経験記事",
    author: articleAuthorName(article),
    profileId: article.author_id,
    avatarUrl: article.profiles?.avatar_url ?? null,
    meta: articleExcerpt(article.body, 54),
    summary: articleAuthorMeta(article),
    accent: imageVariantForArticleCategory(article.category),
    imageUrl: article.image_url ?? undefined,
  };
}

export default async function Home() {
  const supabase = await createClient();
  const [
    { count: storeCount, error: storeCountError },
    { news: approvedNews, error: publicNewsError },
    editorPickResult,
    latestArticleResult,
    qaQuestionResult,
  ] = await Promise.all([
    getPublicBarberShopCount(supabase),
    listPublicNews(supabase, 4),
    listEditorPickArticles(supabase, 3),
    listPublishedArticles(supabase, 5),
    listQaQuestions(supabase, 3),
  ]);

  if (storeCountError) {
    console.error("Store directory count lookup failed", {
      message: storeCountError.message,
    });
  }

  if (publicNewsError) {
    console.error("Public news lookup failed");
  }

  if (editorPickResult.error) {
    console.error("Editor pick articles lookup failed");
  }

  if (latestArticleResult.error) {
    console.error("Latest articles lookup failed");
  }

  if (qaQuestionResult.error) {
    console.error("Home Q&A questions lookup failed");
  }

  const [editorPickArticles, latestArticles] = await Promise.all([
    resolveArticleImageUrls(editorPickResult.articles),
    resolveArticleImageUrls(latestArticleResult.articles),
  ]);
  const homeNews = composeNewsWithFallback(approvedNews, 4);
  const homeEditorPicks = editorPickArticles.length > 0 ? composeHomeEditorPicks(editorPickArticles, 3) : undefined;
  const dbArticleRailItems = latestArticles.map(articleRailItem);
  const dbArticleIds = new Set(dbArticleRailItems.map((article) => article.id));
  const homeArticleRailItems =
    dbArticleRailItems.length > 0
      ? [
          ...dbArticleRailItems,
          ...articles.filter((article) => !dbArticleIds.has(article.id)),
        ].slice(0, 5)
      : articles.slice(0, 5);

  return (
    <StoreDirectoryProvider>
      <main className="mx-auto min-h-screen max-w-[430px] overflow-x-hidden bg-white pb-40 shadow-[0_0_70px_rgba(17,17,17,0.06)]">
        <Header action={<StoreSearchHeaderButton />} />
        <CategoryNavigation />
        <LiveEditorialCover newsItems={homeNews} editorPicks={homeEditorPicks} />
        <SnapSection />
        <SponsorSection
          eyebrow="Sponsored"
          title="今週の協賛パートナー"
          items={sponsorsForPlacement("home")}
        />
        <BackyardSection />
        <StoreDirectoryStatsCard count={storeCount} />
        <HorizontalRail title="新着記事" items={homeArticleRailItems} />
        <ContributionSection />
        <QASection questions={qaQuestionResult.questions} />
        <HorizontalRail title="メーカー新商品" items={articles.filter((article) => article.category === "メーカー新商品")} />
        <HorizontalRail title="講習会" items={seminars} hrefPrefix="/seminars" />
        <HorizontalRail title="学生・求人" items={jobs} hrefPrefix="/jobs" />
        <LegalLinks />
        <FloatingPostButton />
        <BottomNavigation />
      </main>
    </StoreDirectoryProvider>
  );
}
