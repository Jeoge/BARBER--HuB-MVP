import { BadgeCheck, PackageCheck, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AuthGateLink } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { VisualTile } from "@/components/VisualTile";
import { findArticle, findProduct, seminars } from "@/lib/mockData";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = findProduct(id);

  if (product == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">商品が見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            指定された商品は、メーカー・ディーラー情報にまだ登録されていません。
          </p>
          <Link href="/partners" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            パートナー情報へ
          </Link>
        </section>
      </PageChrome>
    );
  }

  const relatedArticles = product.relatedArticleIds.map((articleId) => findArticle(articleId)).filter((article) => article != null);
  const relatedSeminars = seminars.filter((seminar) => product.relatedSeminarIds.includes(seminar.id));

  return (
    <PageChrome>
      <article className="px-4 pt-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.68rem] font-black text-blush">
            {product.category}
          </span>
          {product.sponsorLabel ? (
            <span className="rounded-full border border-line px-2.5 py-1 text-[0.68rem] font-black text-mute">
              {product.sponsorLabel}
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 text-[1.55rem] font-black leading-tight text-ink">{product.name}</h1>
        <p className="mt-2 text-sm font-black text-mute">{product.maker}</p>
        <VisualTile variant={product.accent} className="mt-4 aspect-[16/10]" />
        <p className="mt-4 text-[0.92rem] font-medium leading-relaxed text-ink">{product.description}</p>

        <div className="mt-4 rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
            業務用価格は認証会員向け
          </div>
          <p className="mt-1 text-xs font-bold leading-relaxed text-mute">
            MVPでは価格表示・決済は行いません。将来的にサロン確認済み会員へ、業務用価格やサンプル申請を開放します。
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <AuthGateLink className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] bg-ink px-3 text-sm font-black text-white">
            <Send aria-hidden="true" size={16} />
            ディーラーに問い合わせ
          </AuthGateLink>
          <AuthGateLink className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] bg-blush px-3 text-sm font-black text-white">
            <PackageCheck aria-hidden="true" size={16} />
            サンプル希望
          </AuthGateLink>
        </div>
      </article>

      <section className="px-4 pt-7">
        <h2 className="text-base font-black text-ink">特徴</h2>
        <div className="mt-3 grid gap-2">
          {product.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 rounded-[8px] border border-line bg-white p-3 text-sm font-bold text-ink shadow-sm">
              <BadgeCheck aria-hidden="true" size={16} className="text-blush" />
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-7">
        <h2 className="text-base font-black text-ink">どんな技術に使うか</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.useCases.map((useCase) => (
            <span key={useCase} className="rounded-full border border-line bg-white px-3 py-2 text-xs font-black text-ink">
              {useCase}
            </span>
          ))}
        </div>
      </section>

      {relatedArticles.length > 0 ? (
        <section className="px-4 pt-7">
          <h2 className="text-base font-black text-ink">関連記事</h2>
          <div className="mt-3 grid gap-2">
            {relatedArticles.map((article) => (
              <Link key={article.id} href={`/articles/${article.id}`} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <p className="text-[0.68rem] font-black text-blush">{article.category}</p>
                <p className="mt-1 text-sm font-black leading-snug text-ink">{article.title}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {relatedSeminars.length > 0 ? (
        <section className="px-4 pt-7">
          <h2 className="text-base font-black text-ink">関連講習会</h2>
          <div className="mt-3 grid gap-2">
            {relatedSeminars.map((seminar) => (
              <Link key={seminar.id} href="/seminars" className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <p className="text-[0.68rem] font-black text-blush">{seminar.category}</p>
                <p className="mt-1 text-sm font-black leading-snug text-ink">{seminar.title}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </PageChrome>
  );
}
