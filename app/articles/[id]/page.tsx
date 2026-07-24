import { CalendarDays, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { ArticleThemeLinks } from "@/components/ArticleThemeLinks";
import { ArticleEngagementPanel } from "@/components/ArticleEngagementPanel";
import { BackRoomPromptCard } from "@/components/BackRoomPromptCard";
import { ContentAdCard } from "@/components/ContentAdCard";
import { MagazineImage } from "@/components/MagazineImage";
import { PaidArticleCheckoutButton } from "@/components/PaidArticleCheckoutButton";
import { PageChrome } from "@/components/PageChrome";
import { ProfileMiniLink } from "@/components/ProfileMiniLink";
import { ARTICLE_IMAGE_MARKER_PATTERN, normalizeArticleImageMarkers, validArticleImageMarkerIndexes } from "@/lib/articleMedia";
import { imageVariantForArticleCategory, primaryTopicSlugForArticleCategory } from "@/lib/articleCategories";
import { isMonetizationEnabled } from "@/lib/monetization";
import { getBackRoomPromptState } from "@/lib/backroomPrompt";
import { resolveArticleImageUrl, resolveArticleImageUrls } from "@/lib/supabase/article-images";
import {
  type ArticleDisplayImage,
  type ArticleWithAuthor,
  articleAuthorMeta,
  articleAuthorName,
  articleDateLabel,
  getPublishedArticleById,
  getEntitledArticlePaidSection,
  listRelatedPublishedArticles,
  listArticleComments,
} from "@/lib/supabase/articles";
import { getActiveContentAd } from "@/lib/supabase/content-ads";
import { createClient } from "@/lib/supabase/server";

type ArticleDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    posted?: string;
    editorPick?: string;
    reactionError?: string;
    comment?: string;
    commentError?: string;
  }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function articleParagraphs(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function ArticleImageFigure({ image, title, index, className = "my-2" }: { image: ArticleDisplayImage; title: string; index: number; className?: string }) {
  if (image.url == null) return null;

  return (
    <figure className={className}>
      <MagazineImage
        src={image.url}
        alt={`${title} 写真${index + 1}`}
        variant="news"
        className="aspect-[16/10]"
        imageClassName="object-contain bg-neutral-50"
      />
    </figure>
  );
}

function ArticleImageStack({ images, title, excludeIndexes = new Set<number>() }: { images: ArticleDisplayImage[]; title: string; excludeIndexes?: Set<number> }) {
  if (!images.some((image, index) => image.url != null && !excludeIndexes.has(index))) return null;

  return (
    <div className="mt-4 grid gap-2.5">
      {images.map((image, index) =>
        image.url == null || excludeIndexes.has(index) ? null : (
          <ArticleImageFigure key={image.id} image={image} title={title} index={index} className="m-0" />
        )
      )}
    </div>
  );
}

function YoutubeArticleLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="pressable mt-5 flex items-center justify-between gap-3 rounded-[8px] border border-line bg-white p-3 text-sm font-black text-ink shadow-sm"
    >
      <span className="min-w-0">
        <span className="block">YouTube動画を見る</span>
        <span className="mt-0.5 block truncate text-[0.72rem] font-bold text-mute">{url}</span>
      </span>
      <ExternalLink aria-hidden="true" size={17} className="shrink-0 text-blush" />
    </a>
  );
}

function RelatedArticlesSection({ title, articles }: { title: "関連記事" | "あわせて読む"; articles: ArticleWithAuthor[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="px-4 pt-7">
      <h2 className="text-base font-black text-ink">{title}</h2>
      <div className="mt-3 grid gap-2.5">
        {articles.map((article) => (
          <Link key={article.id} href={`/articles/${article.id}`} className="pressable flex gap-3 rounded-[8px] border border-line bg-white p-3 shadow-sm">
            <div className="w-24 shrink-0">
              <MagazineImage
                src={article.image_url ?? undefined}
                alt={article.title}
                variant={imageVariantForArticleCategory(article.category)}
                className="aspect-[4/3]"
              />
            </div>
            <span className="min-w-0 flex-1">
              <span className="text-[0.62rem] font-black text-blush">{article.category ?? "経験記事"}</span>
              <span className="mt-1 line-clamp-2 block text-sm font-black leading-snug text-ink">{article.title}</span>
              <span className="mt-1 block text-[0.68rem] font-bold text-mute">{articleDateLabel(article)}</span>
            </span>
            <ChevronRight aria-hidden="true" size={16} className="mt-1 shrink-0 text-mute" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function renderArticleBodyBlocks(body: string, images: ArticleDisplayImage[], title: string) {
  const blocks: ReactNode[] = [];

  articleParagraphs(body).forEach((paragraph, paragraphIndex) => {
    const markerPattern = new RegExp(ARTICLE_IMAGE_MARKER_PATTERN.source, "g");
    let lastIndex = 0;
    let textChunk = "";

    const flushText = () => {
      const text = textChunk.trim();
      if (text.length > 0) {
        blocks.push(
          <p key={`paragraph-${paragraphIndex}-${blocks.length}`} className="whitespace-pre-wrap">
            {text}
          </p>,
        );
      }
      textChunk = "";
    };

    for (const match of paragraph.matchAll(markerPattern)) {
      const markerStart = match.index ?? 0;
      const markerEnd = markerStart + match[0].length;
      textChunk += paragraph.slice(lastIndex, markerStart);
      flushText();

      const imageIndex = Number(match[1]) - 1;
      const image = images[imageIndex];
      if (image?.url != null) {
        blocks.push(
          <ArticleImageFigure key={`image-${paragraphIndex}-${imageIndex}-${blocks.length}`} image={image} title={title} index={imageIndex} />,
        );
      }

      lastIndex = markerEnd;
    }

    textChunk += paragraph.slice(lastIndex);
    flushText();
  });

  return blocks;
}

export default async function ArticleDetailPage({ params, searchParams }: ArticleDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { article: dbArticle } = isUuid(id)
    ? await getPublishedArticleById(supabase, id, user?.id)
    : { article: null };
  const resolvedDbArticle = await resolveArticleImageUrl(dbArticle);

  if (resolvedDbArticle != null) {
    const authorName = articleAuthorName(resolvedDbArticle);
    const authorMeta = articleAuthorMeta(resolvedDbArticle);
    const primaryTopicSlug = primaryTopicSlugForArticleCategory(resolvedDbArticle.category);
    const isPaidArticle = resolvedDbArticle.access_type === "paid";
    const [commentResult, relatedResult, contentAd, backRoomState] = await Promise.all([
      listArticleComments(supabase, id, 30),
      listRelatedPublishedArticles(supabase, resolvedDbArticle, 3, user?.id),
      getActiveContentAd(supabase, "article_bottom", primaryTopicSlug ?? "all"),
      getBackRoomPromptState(supabase, user?.id),
    ]);
    const paidBody = isPaidArticle ? await getEntitledArticlePaidSection(supabase, resolvedDbArticle.id) : null;
    const canReadPaidSection = !isPaidArticle || paidBody != null || user?.id === resolvedDbArticle.author_id;
    const signedRelatedArticles = await resolveArticleImageUrls(relatedResult.articles);
    const articleBody = normalizeArticleImageMarkers(resolvedDbArticle.body, resolvedDbArticle.images.length);
    const inlineImageIndexes = validArticleImageMarkerIndexes(articleBody, resolvedDbArticle.images.length);
    const renderedInlineImageIndexes = new Set(Array.from(inlineImageIndexes).filter((imageIndex) => resolvedDbArticle.images[imageIndex]?.url != null));
    const showBackRoomPrompt = contentAd == null;

    return (
      <PageChrome>
        <article className="px-4 pt-5">
          {query?.posted === "1" ? (
            <div className="mb-3 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
              投稿できました
            </div>
          ) : null}
          {query?.editorPick === "1" ? (
            <div className="mb-3 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
              EDITOR&apos;S PICKに掲載しました。
            </div>
          ) : null}
          {query?.editorPick === "failed" || query?.editorPick === "unavailable" ? (
            <div className="mb-3 rounded-[8px] border border-line bg-neutral-50 p-3 text-sm font-black leading-relaxed text-mute">
              記事は投稿できました。EDITOR&apos;S PICK設定は保存できませんでした。
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {(resolvedDbArticle.categories?.length ? resolvedDbArticle.categories : [resolvedDbArticle.category ?? "経験記事"]).map((category) => (
              <span key={category} className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.68rem] font-black text-blush">{category}</span>
            ))}
          </div>
          <h1 className="mt-3 text-[1.55rem] font-black leading-tight text-ink">{resolvedDbArticle.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-mute">
            <ProfileMiniLink
              profileId={resolvedDbArticle.author_id}
              fallbackName={authorName}
              avatarUrl={resolvedDbArticle.profiles?.avatar_url}
              meta={authorMeta}
              href={`/profiles/${resolvedDbArticle.author_id}`}
              className="max-w-full"
            />
            <span className="inline-flex items-center gap-1">
              <CalendarDays aria-hidden="true" size={15} />
              {articleDateLabel(resolvedDbArticle)}
            </span>
          </div>

          <ArticleImageStack images={resolvedDbArticle.images} title={resolvedDbArticle.title} excludeIndexes={renderedInlineImageIndexes} />

          <div className="mt-5 space-y-4 text-[0.92rem] font-medium leading-relaxed text-ink">
            {renderArticleBodyBlocks(articleBody, resolvedDbArticle.images, resolvedDbArticle.title)}
          </div>

          {isPaidArticle ? (
            canReadPaidSection ? (
              <section className="mt-5 rounded-[10px] border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-xs font-black text-amber-800">ここから有料</p>
                <div className="mt-3 space-y-4 text-[0.92rem] font-medium leading-relaxed text-ink">
                  {renderArticleBodyBlocks(paidBody ?? "", [], resolvedDbArticle.title)}
                </div>
              </section>
            ) : (
              <section className="mt-5 rounded-[10px] border border-amber-200 bg-amber-50/50 p-4">
                <p className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-[0.64rem] font-black text-amber-900">ここから有料</p>
                <h2 className="mt-3 text-lg font-black text-ink">続きを読むには購入が必要です</h2>
                <p className="mt-1 text-sm font-medium leading-relaxed text-mute">購入確定後に、有料部分をすぐに読めます。</p>
                {isMonetizationEnabled() && resolvedDbArticle.price_amount ? <PaidArticleCheckoutButton articleId={resolvedDbArticle.id} price={resolvedDbArticle.price_amount} currentUserId={user?.id} /> : <p className="mt-3 text-sm font-bold text-mute">この有料記事は現在購入準備中です。</p>}
              </section>
            )
          ) : null}

          {resolvedDbArticle.youtube_url && (!isPaidArticle || canReadPaidSection) ? <YoutubeArticleLink url={resolvedDbArticle.youtube_url} /> : null}

          <ArticleEngagementPanel
            articleId={resolvedDbArticle.id}
            authorId={resolvedDbArticle.author_id}
            currentUserId={user?.id}
            metrics={resolvedDbArticle}
            comments={commentResult.comments}
            reactionError={query?.reactionError}
            commentError={query?.commentError}
            commentPosted={query?.comment === "posted"}
            monetizationEnabled={isMonetizationEnabled()}
            treatEnabled={isMonetizationEnabled() && (!isPaidArticle || canReadPaidSection)}
          />
        </article>

        <ContentAdCard ad={contentAd} />

        <RelatedArticlesSection title={relatedResult.heading} articles={signedRelatedArticles} />

        <ArticleThemeLinks currentSlug={primaryTopicSlug} />

        {showBackRoomPrompt ? <BackRoomPromptCard topicSlug={primaryTopicSlug} state={backRoomState} /> : null}
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <section className="px-4 pt-8">
        <h1 className="text-2xl font-black text-ink">記事が見つかりません</h1>
        <Link href="/" className="pressable mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
          ホームへ戻る
        </Link>
      </section>
    </PageChrome>
  );
}
