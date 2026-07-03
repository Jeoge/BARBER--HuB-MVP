import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { ProductSection } from "@/components/ProductSection";
import { ProfileMiniLink } from "@/components/ProfileMiniLink";
import { ReactionBar } from "@/components/ReactionBar";
import { SponsorSection } from "@/components/SponsorSection";
import { articles, findArticle, getRelatedProducts } from "@/lib/mockData";
import { sponsorsForPlacement } from "@/lib/sponsors";
import { getPrimaryTopicSlug, getTopicBundle } from "@/lib/topics";

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = findArticle(id);
  const relatedProducts = getRelatedProducts(id);
  const topicSlug = article == null ? undefined : getPrimaryTopicSlug(article);
  const topicBundle = topicSlug == null ? undefined : getTopicBundle(topicSlug);

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
          <ProfileMiniLink profileId={article.profileId} fallbackName={article.author} compact />
          <span className="inline-flex items-center gap-1">
            <CalendarDays aria-hidden="true" size={15} />
            {article.date}
          </span>
        </div>
        <MagazineImage src={article.imageUrl} alt={article.title} variant={article.accent} className="mt-4 aspect-[16/10]" />
        <ReactionBar contentId={`article:${article.id}`} commentTitle="この記事へのコメント" className="mt-4" />
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
            {topicBundle.backRoomThreads.slice(0, 2).map((thread) => (
              <Link key={thread.id} href={`/backyard/setup?next=/posts/${thread.id}`} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <p className="text-[0.68rem] font-black text-blush">Back Room</p>
                <p className="mt-1 truncate text-sm font-black text-ink">{thread.title ?? thread.body}</p>
                <p className="mt-1 text-xs font-bold text-mute">{thread.comments}コメント / {thread.latestCommentAt ?? "さっき"}</p>
              </Link>
            ))}
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
