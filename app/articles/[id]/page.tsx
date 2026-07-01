import { CalendarDays, MessageCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { ProductSection } from "@/components/ProductSection";
import { articles, findArticle, getRelatedProducts } from "@/lib/mockData";

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = findArticle(id);
  const relatedProducts = getRelatedProducts(id);

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
          <span className="inline-flex items-center gap-1">
            <UserRound aria-hidden="true" size={15} />
            {article.author}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays aria-hidden="true" size={15} />
            {article.date}
          </span>
        </div>
        <MagazineImage src={article.imageUrl} alt={article.title} variant={article.accent} className="mt-4 aspect-[16/10]" />
        <div className="mt-4 flex items-center justify-between">
          <span className="rounded-full bg-blush px-4 py-2 text-sm font-black text-white">
            THANKS {article.thanks}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-mute">
            <MessageCircle aria-hidden="true" size={17} />
            {article.comments}
          </span>
        </div>
        <div className="mt-5 space-y-4 text-[0.92rem] font-medium leading-relaxed text-ink">
          <p className="font-bold text-mute">{article.summary}</p>
          {article.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>

      <ProductSection
        title="この記事に出てきた道具"
        subtitle="AI編集部が、記事の文脈に合う商品だけを整理しています。"
        products={relatedProducts}
      />

      <section className="px-4 pt-7">
        <h2 className="text-base font-black text-ink">関連記事</h2>
        <div className="mt-3 grid gap-2">
          {articles
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
    </PageChrome>
  );
}
