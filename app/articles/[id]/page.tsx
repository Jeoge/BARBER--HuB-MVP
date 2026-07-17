import { CalendarDays, ExternalLink } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { ArticleEngagementPanel } from "@/components/ArticleEngagementPanel";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { ProductSection } from "@/components/ProductSection";
import { ProfileMiniLink } from "@/components/ProfileMiniLink";
import { SponsorSection } from "@/components/SponsorSection";
import { ToolActionLinks } from "@/components/ToolActionLinks";
import { ARTICLE_IMAGE_MARKER_PATTERN, normalizeArticleImageMarkers, validArticleImageMarkerIndexes } from "@/lib/articleMedia";
import { articles, findArticle, getRelatedProducts } from "@/lib/mockData";
import { sponsorsForPlacement } from "@/lib/sponsors";
import { resolveArticleImageUrl } from "@/lib/supabase/article-images";
import {
  type ArticleDisplayImage,
  articleAuthorMeta,
  articleAuthorName,
  articleDateLabel,
  getArticleEngagement,
  getPublishedArticleById,
  listArticleComments,
} from "@/lib/supabase/articles";
import { createClient } from "@/lib/supabase/server";
import { getPrimaryTopicSlug, getTopicBundle } from "@/lib/topics";

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
      className="mt-5 flex items-center justify-between gap-3 rounded-[8px] border border-line bg-white p-3 text-sm font-black text-ink shadow-sm"
    >
      <span className="min-w-0">
        <span className="block">YouTube動画を見る</span>
        <span className="mt-0.5 block truncate text-[0.72rem] font-bold text-mute">{url}</span>
      </span>
      <ExternalLink aria-hidden="true" size={17} className="shrink-0 text-blush" />
    </a>
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
    const { comments } = await listArticleComments(supabase, id, 30);
    const articleBody = normalizeArticleImageMarkers(resolvedDbArticle.body, resolvedDbArticle.images.length);
    const inlineImageIndexes = validArticleImageMarkerIndexes(articleBody, resolvedDbArticle.images.length);
    const renderedInlineImageIndexes = new Set(Array.from(inlineImageIndexes).filter((imageIndex) => resolvedDbArticle.images[imageIndex]?.url != null));

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
          <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.68rem] font-black text-blush">
            {resolvedDbArticle.category ?? "経験記事"}
          </span>
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

          <ArticleEngagementPanel
            articleId={resolvedDbArticle.id}
            authorId={resolvedDbArticle.author_id}
            currentUserId={user?.id}
            metrics={resolvedDbArticle}
            comments={comments}
            reactionError={query?.reactionError}
            commentError={query?.commentError}
            commentPosted={query?.comment === "posted"}
          />

          <div className="mt-5 space-y-4 text-[0.92rem] font-medium leading-relaxed text-ink">
            {renderArticleBodyBlocks(articleBody, resolvedDbArticle.images, resolvedDbArticle.title)}
          </div>

          {resolvedDbArticle.youtube_url ? <YoutubeArticleLink url={resolvedDbArticle.youtube_url} /> : null}
        </article>
      </PageChrome>
    );
  }

  const article = findArticle(id);
  const relatedProducts = getRelatedProducts(id);
  const topicSlug = article == null ? undefined : getPrimaryTopicSlug(article);
  const topicBundle = topicSlug == null ? undefined : getTopicBundle(topicSlug);
  const isToolArticle = article?.topicSlugs?.includes("tools") ?? false;
  const fallbackMetrics = await getArticleEngagement(supabase, id, null, user?.id);
  const { comments: fallbackComments } = await listArticleComments(supabase, id, 30);

  if (article == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">記事が見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            指定された記事は、編集部の一覧にまだ登録されていません。
          </p>
          <Link href="/" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            ホームへ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <article className="px-4 pt-5">
        <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.68rem] font-black text-blush">
          {article.category}
        </span>
        <h1 className="mt-3 text-[1.55rem] font-black leading-tight text-ink">{article.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-mute">
          <ProfileMiniLink profileId={article.profileId} fallbackName={article.author} compact size="feed" />
          <span className="inline-flex items-center gap-1">
            <CalendarDays aria-hidden="true" size={15} />
            {article.date}
          </span>
        </div>
        <MagazineImage src={article.imageUrl} alt={article.title} variant={article.accent} className="mt-4 aspect-[16/10]" />

        <ArticleEngagementPanel
          articleId={article.id}
          currentUserId={user?.id}
          metrics={fallbackMetrics}
          comments={fallbackComments}
          reactionError={query?.reactionError}
          commentError={query?.commentError}
          commentPosted={query?.comment === "posted"}
        />

        <div className="mt-5 space-y-4 text-[0.92rem] font-medium leading-relaxed text-ink">
          <p className="font-bold text-mute">{article.summary}</p>
          {article.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>

      <ProductSection
        title="この記事に出てきた道具"
        subtitle="記事の文脈に合う商品だけを、BARBER HUB編集部が整理します。"
        products={relatedProducts}
      />

      {isToolArticle ? <ToolActionLinks /> : null}

      <SponsorSection
        eyebrow="PR / Partner"
        title="この記事に関連する協賛情報"
        subtitle="記事内容に近い道具・講習だけを表示します。"
        items={sponsorsForPlacement("article")}
        compact
      />

      <section className="px-4 pt-7">
        <h2 className="text-base font-black text-ink">{topicBundle == null ? "関連記事" : `関連する${topicBundle.topic.label}情報`}</h2>
        <div className="mt-3 grid gap-2">
          {(topicBundle?.articles ?? articles)
            .filter((item) => item.id !== article.id)
            .slice(0, 3)
            .map((item) => (
              <Link key={item.id} href={`/articles/${item.id}`} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <p className="text-[0.68rem] font-black text-blush">{item.category}</p>
                <p className="mt-1 text-sm font-black leading-snug text-ink">{item.title}</p>
              </Link>
            ))}
        </div>
      </section>

      {topicBundle == null ? null : (
        <section className="px-4 pt-5">
          <div className="grid gap-2">
            <Link href="/post/backroom" className="rounded-[8px] border border-blush/20 bg-blushSoft p-3 shadow-sm">
              <p className="text-[0.68rem] font-black text-blush">Back Room</p>
              <p className="mt-1 text-sm font-black leading-snug text-ink">この記事の話題をBack Roomで話す</p>
            </Link>
            {topicBundle.seminars.slice(0, 1).map((seminar) => (
              <Link key={seminar.id} href="/seminars" className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <p className="text-[0.68rem] font-black text-blush">関連講習</p>
                <p className="mt-1 text-sm font-black leading-snug text-ink">{seminar.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageChrome>
  );
}
