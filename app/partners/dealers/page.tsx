import { BadgeCheck, Handshake, PackageOpen, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { toolPartners } from "@/lib/tool-partners";

const menuItems = [
  "道具カテゴリ協賛",
  "記事下の関連商品枠",
  "メーカー講習枠",
  "地域ディーラー相談枠",
  "タイアップ記事",
  "Snap連動企画",
  "開業準備特集",
];

export default function DealerPartnerPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="PARTNER GUIDE"
        title="理容師が買う前に見る場所へ。"
        body="BARBER HUBは、商品を売る場所ではありません。理容師が道具を知り、比較し、現場の声を見て、購入先や相談先へ進むための業界メディアです。"
      />

      <section className="px-4 pt-4">
        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
            物販は行いません
          </div>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-mute">
            BARBER HUBでは商品の販売、決済、配送、返品対応は行いません。記事・Snap・道具レビューから、購入先や相談先へ送客します。
          </p>
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-black text-ink">共存できる導線</h2>
        <div className="mt-3 grid gap-2.5">
          {toolPartners.slice(0, 4).map((partner) => (
            <Link key={partner.id} href={partner.href} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
              <div className="flex gap-3">
                <MagazineImage src={partner.imageUrl} alt={partner.name} variant={partner.type === "seminar" ? "seminar" : "tool"} className="h-16 w-20 shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-line bg-neutral-50 px-2 py-0.5 text-[0.58rem] font-black text-mute">{partner.label}</span>
                    <span className="text-[0.62rem] font-bold text-mute">{partner.area}</span>
                  </div>
                  <h3 className="mt-1 text-sm font-black leading-snug text-ink">{partner.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{partner.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-black text-ink">掲載メニュー例</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {menuItems.map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-[8px] border border-line bg-white p-3 text-xs font-black text-ink shadow-sm">
              <PackageOpen aria-hidden="true" size={15} className="shrink-0 text-blush" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Handshake aria-hidden="true" size={18} className="text-blush" />
            PR表記を明確にします
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            PR / Sponsored / 協賛 / Partner / 提供 の表記を小さく上品に出し、広告枠か編集枠かが分かるようにします。
          </p>
          <Link href="/partners" className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
            <BadgeCheck aria-hidden="true" size={16} />
            掲載について相談する
          </Link>
        </div>
      </section>
    </PageChrome>
  );
}
