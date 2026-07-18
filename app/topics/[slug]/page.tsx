import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleThemeLinks } from "@/components/ArticleThemeLinks";
import { BackRoomPromptCard } from "@/components/BackRoomPromptCard";
import { ContentAdCard } from "@/components/ContentAdCard";
import {
  MagazineFeaturedCard,
  MagazineRail,
  type MagazineListItem,
} from "@/components/MagazineListLayout";
import { PageChrome } from "@/components/PageChrome";
import { imageVariantForArticleCategory, isArticleTopicSlug } from "@/lib/articleCategories";
import { getBackRoomPromptState } from "@/lib/backroomPrompt";
import { topics } from "@/lib/topics";
import { resolveArticleImageUrls } from "@/lib/supabase/article-images";
import {
  articleAuthorMeta,
  articleAuthorName,
  articleExcerpt,
  listPublishedArticlesByTopic,
  type ArticleWithAuthor,
} from "@/lib/supabase/articles";
import { CATEGORY_AD_PLACEMENT_BY_TOPIC, getActiveContentAd } from "@/lib/supabase/content-ads";
import { createClient } from "@/lib/supabase/server";

export function generateStaticParams() {
  return topics.map((topic) => ({ slug: topic.slug }));
}

function dbArticleItem(article: ArticleWithAuthor): MagazineListItem {
  return {
    href: `/articles/${article.id}`,
    label: article.category ?? "経験記事",
    title: article.title,
    description: articleExcerpt(article.body, 72),
    imageUrl: article.image_url ?? undefined,
    variant: imageVariantForArticleCategory(article.category),
    authorName: articleAuthorName(article),
    profileId: article.author_id,
    avatarUrl: article.profiles?.avatar_url ?? null,
    authorMeta: articleAuthorMeta(article),
  };
}

function EditorsPick({ item }: { item?: MagazineListItem }) {
  if (item == null) return null;

  return <MagazineFeaturedCard item={item} eyebrow="NEW" />;
}

function EmptyTopicState({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="px-4 pt-6">
      <div className="rounded-[8px] border border-line bg-white px-3 py-3 shadow-sm">
        <p className="text-sm font-black text-ink">まだ記事がありません</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/#latest-articles" className="pressable inline-flex h-9 items-center justify-center rounded-[8px] bg-ink px-3 text-xs font-black text-white">
            新着記事へ
          </Link>
          {isLoggedIn ? (
            <Link href="/post/article" className="pressable inline-flex h-9 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">
              記事を書く
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = topics.find((item) => item.slug === slug);

  if (topic == null) {
    notFound();
  }

  const topicSlug = isArticleTopicSlug(slug) ? slug : null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { articles: dbTopicArticles, error: dbTopicArticlesError } = await listPublishedArticlesByTopic(supabase, slug, 12, user?.id);

  if (dbTopicArticlesError) {
    console.error("Topic DB articles lookup failed", {
      slug,
    });
  }

  const [signedDbTopicArticles, contentAd, backRoomState] = await Promise.all([
    resolveArticleImageUrls(dbTopicArticles),
    topicSlug == null ? Promise.resolve(null) : getActiveContentAd(supabase, CATEGORY_AD_PLACEMENT_BY_TOPIC[topicSlug], topicSlug),
    getBackRoomPromptState(supabase, user?.id),
  ]);
  const dbArticleItems = signedDbTopicArticles.map(dbArticleItem);
  const featuredArticle = dbArticleItems[0];
  const articleList = dbArticleItems.slice(1, 8);
  const showBackRoomPrompt = contentAd == null && dbArticleItems.length > 0;

  return (
    <PageChrome>
      <section className="px-4 pb-1 pt-7">
        <p className="editorial-label text-[0.78rem] uppercase text-blush">{topic.slug.toUpperCase()}</p>
        <h1 className="editorial-serif mt-2 text-[1.9rem] leading-[1.08] text-ink">{topic.label}</h1>
      </section>

      {featuredArticle ? <EditorsPick item={featuredArticle} /> : <EmptyTopicState isLoggedIn={user != null} />}

      <MagazineRail title="新着記事" eyebrow="ARTICLES" items={articleList} />

      <ContentAdCard ad={contentAd} />

      <ArticleThemeLinks currentSlug={topicSlug} />

      {showBackRoomPrompt ? <BackRoomPromptCard topicSlug={topicSlug} state={backRoomState} /> : null}
    </PageChrome>
  );
}
