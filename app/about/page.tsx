import { ArrowRight, Building2, Mail, Megaphone } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";

const purposes = [
  "現場の経験、技術、経営の学びを残す",
  "求人、開業・承継、講習会レポート、Q&Aをつなぐ",
  "理容師・学生・サロン・学校・メーカー・組合・関係企業の接点を増やす",
];

export default function AboutPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="ABOUT"
        title="運営者情報"
        body="BARBER HUBは、理容業界の経験と情報を、次の人へ渡していくためのプラットフォームです。"
      />

      <section className="grid gap-4 px-4 pt-5">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-blush">BARBER HUB</p>
          <h2 className="mt-2 text-lg font-black leading-tight text-ink">理容業界の価値を、共有できる形にする</h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            BARBER HUBは、理容師・理容学生・サロン・学校・メーカー・組合・関係企業をつなぐ理容業界向けプラットフォームです。現場の経験、技術、経営、求人、開業・承継、講習会やコンクールの記録を共有し、業界の価値を高めることを目的としています。
          </p>
        </div>

        <div className="grid gap-2">
          {purposes.map((purpose) => (
            <div key={purpose} className="flex items-center gap-3 rounded-[8px] border border-line bg-white px-3 py-3 shadow-sm">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
                <Building2 aria-hidden="true" size={15} />
              </span>
              <p className="text-sm font-black leading-relaxed text-ink">{purpose}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <h2 className="text-base font-black text-ink">表示情報</h2>
          <div className="mt-3 divide-y divide-line rounded-[8px] border border-line">
            <div className="grid grid-cols-[5.5rem_1fr] gap-3 px-3 py-3 text-sm">
              <span className="font-bold text-mute">運営者名</span>
              <span className="font-semibold text-ink">BARBER HUB 運営</span>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr] gap-3 px-3 py-3 text-sm">
              <span className="font-bold text-mute">所在地域</span>
              <span className="font-semibold text-ink">日本</span>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium leading-relaxed text-mute">
            事業者情報の詳細は、公開内容や有料掲載の開始に合わせて必要事項を更新します。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-ink px-3 text-center text-xs font-black text-white">
            <Mail aria-hidden="true" size={15} />
            お問い合わせ
          </Link>
          <Link href="/advertising/apply" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] border border-line bg-white px-3 text-center text-xs font-black text-ink">
            <Megaphone aria-hidden="true" size={15} className="text-blush" />
            広告掲載の相談
          </Link>
        </div>

        <Link href="/guidelines" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] border border-blush/20 bg-blushSoft px-3 text-sm font-black text-ink">
          投稿ガイドラインを見る
          <ArrowRight aria-hidden="true" size={16} className="text-blush" />
        </Link>
      </section>
    </PageChrome>
  );
}
