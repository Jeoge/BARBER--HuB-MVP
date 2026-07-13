import { Newspaper, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { getPublicNewsById, isUuid, listRelatedPublicNews, type PublicNewsItem } from "@/lib/news-drafts/public-news";
import { findNews, news } from "@/lib/mockData";
import { createClient } from "@/lib/supabase/server";

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const publicNewsResult = isUuid(id) ? await getPublicNewsById(supabase, id) : { news: null, error: null };
  const fallbackNews = isUuid(id) ? null : findNews(id);
  const item = publicNewsResult.news ?? fallbackNews;
  const relatedResult = await listRelatedPublicNews(supabase, id, 3);
  const relatedNews = relatedResult.news;

  if (publicNewsResult.error || relatedResult.error) {
    console.error("Public news detail lookup failed");
  }

  if (item == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">ニュースが見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            指定されたニュースは、AI編集部の一覧にまだ登録されていません。
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
        <span className="inline-flex items-center gap-1 rounded-full bg-blushSoft px-2.5 py-1 text-[0.68rem] font-black text-blush">
          <Newspaper aria-hidden="true" size={14} />
          {item.category} / {item.time}
        </span>
        <h1 className="mt-3 text-[1.5rem] font-black leading-tight text-ink">{item.title}</h1>

        <section className="mt-4 rounded-[8px] border border-line bg-neutral-50 p-4">
          <h2 className="text-sm font-black text-ink">3行要約</h2>
          <ol className="mt-3 space-y-2">
            {[item.summary, item.morningTip, item.conversationTip].map((line, index) => (
              <li key={line} className="flex gap-2 text-[0.86rem] font-medium leading-relaxed text-ink">
                <span className="font-black text-blush">{index + 1}</span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-5 space-y-4 text-[0.92rem] font-medium leading-relaxed text-ink">
          {item.body.split(/\n{2,}/).map((paragraph, index) => (
            <p key={`${index}-${paragraph}`}>{paragraph}</p>
          ))}
        </div>

        {isPublicNewsItem(item) ? (
          <section className="mt-5 rounded-[8px] border border-line bg-white p-3 shadow-sm">
            <p className="text-xs font-black text-mute">情報元</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-bold text-ink">{item.sourceName}</p>
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-black text-blush">
                情報元を確認
              </a>
            </div>
          </section>
        ) : null}

        <div className="mt-5 grid gap-3">
          <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <Sparkles aria-hidden="true" size={17} className="text-blush" />
              朝礼で使うなら
            </div>
            <p className="mt-2 text-[0.84rem] font-medium leading-relaxed text-ink">{item.morningTip}</p>
          </div>
          <div className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
            <h2 className="text-sm font-black text-ink">お客様との会話で使うなら</h2>
            <p className="mt-2 text-[0.84rem] font-medium leading-relaxed text-ink">{item.conversationTip}</p>
          </div>
        </div>
      </article>

      <section className="px-4 pt-7">
        <h2 className="text-base font-black text-ink">関連ニュース</h2>
        <div className="mt-3 grid gap-2">
          {(relatedNews.length > 0 ? relatedNews : news.filter((related) => related.id !== item.id).slice(0, 3))
            .map((related) => (
              <Link key={`${"origin" in related ? related.origin : "fallback"}-${related.id}`} href={`/news/${related.id}`} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <p className="text-sm font-black leading-snug text-ink">{related.title}</p>
                <p className="mt-1 text-xs font-bold text-mute">{related.summary}</p>
              </Link>
            ))}
        </div>
      </section>
    </PageChrome>
  );
}

function isPublicNewsItem(item: unknown): item is PublicNewsItem {
  return Boolean(item && typeof item === "object" && "sourceUrl" in item && "sourceName" in item);
}
