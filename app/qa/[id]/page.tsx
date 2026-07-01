import { CheckCircle2, MessageCircle, Users } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { ProductSection } from "@/components/ProductSection";
import { findQaItem, getRelatedProducts } from "@/lib/mockData";

export default async function QaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = findQaItem(id);
  const relatedProducts = getRelatedProducts(id);

  if (question == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">相談が見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            指定された相談は、Q&Aの一覧にまだ登録されていません。
          </p>
          <Link href="/qa" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            Q&Aへ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <article className="px-4 pt-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.68rem] font-black text-blush">
            {question.category}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-black text-mute">
            {question.status === "解決済み" ? <CheckCircle2 size={14} /> : <Users size={14} />}
            {question.status}
          </span>
        </div>
        <h1 className="mt-3 text-[1.45rem] font-black leading-tight text-ink">{question.title}</h1>
        <p className="mt-4 rounded-[8px] border border-line bg-white p-4 text-[0.92rem] font-medium leading-relaxed text-ink shadow-sm">
          {question.body}
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm font-bold text-mute">
          <span className="inline-flex items-center gap-1">
            <MessageCircle aria-hidden="true" size={16} />
            コメント {question.comments}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users aria-hidden="true" size={16} />
            解決アイデア {question.ideas}
          </span>
        </div>
      </article>

      <ProductSection
        title="この技術に使う道具メモ"
        subtitle="相談内容に関連する道具を、押し売りではなく確認用にまとめています。"
        products={relatedProducts}
      />

      <section className="px-4 pt-7">
        <h2 className="text-base font-black text-ink">みんなの解決アイデア</h2>
        <div className="mt-3 grid gap-2">
          <div className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
            <p className="text-xs font-black text-blush">BARBER HUB編集部</p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-ink">
              まず状況を分けて整理すると、経験談が集まりやすくなります。技術、接客、経営のどれに近い悩みかを書き添えるのがおすすめです。
            </p>
          </div>
        </div>
      </section>
    </PageChrome>
  );
}
