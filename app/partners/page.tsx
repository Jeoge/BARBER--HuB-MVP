import { BadgeCheck, Building2, Handshake, PackageOpen, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { AuthGateLink } from "@/components/AuthGate";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { partners, products } from "@/lib/mockData";

const revenueModels = [
  "メーカー掲載枠",
  "新商品枠",
  "講習会連動枠",
  "商品ページ送客",
  "サンプル請求",
  "タイアップ記事",
];

export default function PartnersPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="PARTNERS"
        title="メーカー・ディーラー情報"
        body="商品を売り込む場所ではなく、記事・投稿・講習会の文脈で必要な商品に出会える場所です。"
      />

      <section className="px-4 pt-4">
        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
            信頼ルール
          </div>
          <p className="mt-1.5 text-[0.75rem] font-medium leading-relaxed text-mute">
            スポンサー、PR、メーカー提供、タイアップは必ず明記します。BARBER HUBは中立性を守ります。
          </p>
        </div>
      </section>

      <section className="px-4 pt-5">
        <h2 className="text-base font-black text-ink">パートナー導線</h2>
        <div className="mt-3 grid gap-2">
          {partners.map((partner) => (
            <div key={partner.id} className="flex gap-3 rounded-[8px] border border-line bg-white p-3 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
                {partner.id === "dealers" ? <Handshake aria-hidden="true" size={19} /> : <Building2 aria-hidden="true" size={19} />}
              </span>
              <div>
                <h3 className="text-sm font-black text-ink">{partner.title}</h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-mute">{partner.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-black text-ink">新商品・連動商品</h2>
          <span className="text-xs font-black text-blush">AI編集部整理</span>
        </div>
        <div className="mt-3 no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="w-[72%] shrink-0 rounded-[8px] border border-line bg-white p-3 shadow-sm">
              <MagazineImage src={product.imageUrl} alt={product.name} variant={product.accent} className="aspect-[16/8]" />
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-blushSoft px-2 py-1 text-[0.62rem] font-black text-blush">
                  {product.category}
                </span>
                {product.sponsorLabel ? (
                  <span className="rounded-full border border-line px-2 py-1 text-[0.62rem] font-black text-mute">
                    {product.sponsorLabel}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-2 text-sm font-black leading-snug text-ink">{product.name}</h3>
              <p className="mt-1 text-xs font-bold text-mute">{product.maker}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-5">
        <h2 className="text-base font-black text-ink">掲載モデル</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {revenueModels.map((model) => (
            <div key={model} className="flex items-center gap-2 rounded-[8px] border border-line bg-white p-3 text-xs font-black text-ink shadow-sm">
              <Sparkles aria-hidden="true" size={15} className="text-blush" />
              {model}
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <PackageOpen aria-hidden="true" size={19} className="text-blush" />
            掲載問い合わせ
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            単なる広告ではなく、記事・講習会・Q&Aの文脈に合う商品だけを、理容師に自然に届けます。
          </p>
          <AuthGateLink className="mt-3 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            <BadgeCheck aria-hidden="true" size={16} />
            メーカー掲載問い合わせ
          </AuthGateLink>
        </div>
      </section>
    </PageChrome>
  );
}
