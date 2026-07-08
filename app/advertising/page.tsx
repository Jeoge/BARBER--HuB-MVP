import { ArrowRight, Megaphone, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { SafetyNotice } from "@/components/SafetyNotice";

type AdvertisingPageProps = {
  searchParams?: Promise<{ message?: string; inquiry?: string }>;
};

const offerings = [
  "注目掲載",
  "上位表示",
  "編集部作成の紹介記事",
  "地域特集",
  "組合・学校・企業との連動",
  "開業支援パートナー掲載",
];

export default async function AdvertisingPage({ searchParams }: AdvertisingPageProps) {
  const params = await searchParams;

  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="PR / SPONSORSHIP"
        title="広告掲載・協賛について"
        body="学校・メーカー・ディーラー・組合・求人会社・企業による告知や商品紹介は、通常投稿ではなくPR・協賛・公式告知として運営確認後に掲載します。"
      />

      <section className="px-4 pt-4">
        {params?.message ? (
          <div className="mb-4 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
            {params.message}
          </div>
        ) : null}
        {params?.inquiry === "sent" ? (
          <div className="mb-4 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
            問い合わせを受け付けました。内容を確認後、運営からご連絡します。
          </div>
        ) : null}

        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-blushSoft text-blush">
            <Megaphone aria-hidden="true" size={23} />
          </div>
          <h1 className="mt-4 text-[1.55rem] font-black leading-tight text-ink">通常投稿とPR掲載を分けます</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            BARBER HUBは理容師・学生・サロンの経験共有を中心とした業界プラットフォームです。企業・団体による告知、募集、商品紹介は通常のSnap・記事・Q&A・Back Roomではなく、運営確認後のPR・協賛・公式告知として扱います。
          </p>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            掲載内容・期間・料金は個別相談です。決済機能はまだ作らず、問い合わせ後に運営が内容を確認して連絡します。
          </p>
          <Link href="/advertising/apply" className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
            広告掲載・協賛を問い合わせる
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="rounded-[10px] border border-line bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck aria-hidden="true" size={17} className="text-blush" />
            掲載できる候補
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {offerings.map((offering) => (
              <span key={offering} className="rounded-[8px] bg-neutral-50 px-3 py-2 text-xs font-black text-ink">
                {offering}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-5">
        <SafetyNotice title="広告・協賛の掲載方針" href="/ad-policy" linkLabel="広告・PRポリシー" tone="blush">
          BARBER HUBでは、広告・PR・協賛・公式告知であることが分かる表記を行います。掲載による応募数、売上、集客効果を保証するものではありません。
        </SafetyNotice>
      </section>

      <section className="px-4 pt-5">
        <div className="rounded-[10px] border border-blush/20 bg-blushSoft p-4">
          <div className="flex items-start gap-2">
            <Sparkles aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-blush" />
            <p className="text-[0.78rem] font-black leading-relaxed text-ink">
              個人アカウントによる講習会参加レポート、コンクール出場レポート、組合活動の体験談は通常投稿として扱えます。所属先の有無だけで投稿を止めることはありません。
            </p>
          </div>
        </div>
      </section>
    </PageChrome>
  );
}
