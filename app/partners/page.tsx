import type { Metadata } from "next";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PartnerInquiryForm } from "./PartnerInquiryForm";

type PartnersPageProps = {
  searchParams?: Promise<{
    error?: string;
    submitted?: string;
  }>;
};

export async function generateMetadata({ searchParams }: PartnersPageProps): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};

  return {
    title: "協賛・広告掲載について | BARBER HUB",
    description: "BARBER HUBへの協賛、広告掲載、タイアップ・共同企画に関するご相談を受け付けています。",
    ...(params.submitted === "1" ? { robots: { index: false, follow: false } } : {}),
  };
}

const offerings = [
  {
    title: "協賛",
    body: "BARBER HUBの活動や特定企画を支える協賛についてご相談いただけます。",
  },
  {
    title: "広告掲載",
    body: "サイト内の広告枠を通じて、利用者に役立つサービスや情報を紹介します。",
  },
  {
    title: "タイアップ・共同企画",
    body: "記事、特集、調査、イベント、情報発信など、内容に応じて企画段階から相談できます。",
  },
  {
    title: "その他のご相談",
    body: "既存の枠に当てはまらない内容も、BARBER HUBとの相性を確認しながら個別に検討します。",
  },
];

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-blush">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-black leading-tight text-ink">{title}</h2>
    </div>
  );
}

export default async function PartnersPage({ searchParams }: PartnersPageProps) {
  const params = searchParams ? await searchParams : {};
  const isSubmitted = params.submitted === "1";

  return (
    <PageChrome>
      <div id="top" className="h-px scroll-mt-20" aria-hidden="true" />

      <section className="px-4 pt-5">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">PARTNERS</p>
        <h1 className="mt-2 text-[1.55rem] font-black leading-tight text-ink">
          BARBER HUBと、
          <br />
          理容業界のこれからをつくる。
        </h1>
        <div className="mt-4 grid gap-2 text-[0.86rem] font-medium leading-relaxed text-mute">
          <p>BARBER HUBは、理容に関わる知識や経験、新しい選択肢が集まる業界プラットフォームです。</p>
          <p>サービスや取り組みを一方的に紹介するだけではなく、理容師や店舗にとって意味のある情報を、適切な形で届けることを大切にしています。</p>
          <p>協賛、広告掲載、共同企画などのご相談を受け付けています。</p>
        </div>
        <Link href="#contact" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
          お問い合わせへ
        </Link>
      </section>

      <section className="px-4 pt-7">
        <SectionHeading eyebrow="WHAT WE CAN DISCUSS" title="できること" />
        <div className="mt-3 grid gap-2">
          {offerings.map((offering) => (
            <article key={offering.title} className="rounded-[9px] border border-line bg-white p-3.5 shadow-[0_8px_24px_rgba(17,17,17,0.03)]">
              <h3 className="text-sm font-black text-ink">{offering.title}</h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-mute">{offering.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs font-medium leading-relaxed text-mute">
          BARBER HUBの利用者にとって意味があり、業界の発展や課題解決につながる内容を、方針に合う形で個別に検討します。すべての依頼を自動的に掲載するものではありません。
        </p>
      </section>

      <section className="px-4 pt-7">
        <div className="rounded-[9px] border border-blush/20 bg-blushSoft/45 p-4">
          <SectionHeading eyebrow="EDITORIAL TRUST" title="BARBER HUBが大切にしていること" />
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            掲載内容は、BARBER HUBの利用者にとっての有益性と、情報の分かりやすさを大切にしています。
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            広告、協賛、タイアップであることは適切に表示し、BARBER HUBの方針や利用者との信頼に合わない内容は掲載をお断りする場合があります。
          </p>
          <ul className="mt-3 grid gap-2 text-xs font-bold leading-relaxed text-ink">
            <li className="flex gap-2"><span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blush" />利用者にとって有益であること</li>
            <li className="flex gap-2"><span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blush" />広告や協賛であることを分かりやすく表示すること</li>
            <li className="flex gap-2"><span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blush" />誤解を招く表現を避けること</li>
            <li className="flex gap-2"><span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blush" />BARBER HUBの編集方針と信頼性を守ること</li>
          </ul>
        </div>
      </section>

      <section className="px-4 pt-7">
        <SectionHeading eyebrow="INDIVIDUAL PROPOSAL" title="掲載方法・費用について" />
        <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
          掲載場所、期間、内容、制作の有無などを確認したうえで個別にご案内します。
        </p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
          まずは検討中の内容や目的をお問い合わせフォームからお知らせください。
        </p>
      </section>

      <section id="contact" className="scroll-mt-20 px-4 pt-8">
        <SectionHeading eyebrow="CONTACT" title="お問い合わせ" />
        <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
          協賛、広告掲載、共同企画など、検討中の内容をお知らせください。<br />
          内容を確認のうえ、必要に応じて運営からご連絡します。
        </p>

        {isSubmitted ? (
          <div className="mt-4 rounded-[9px] border border-blush/25 bg-blushSoft/50 p-4" role="status" aria-live="polite">
            <h3 className="text-base font-black text-ink">お問い合わせを受け付けました</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
              内容を確認のうえ、必要に応じて運営からご連絡します。<br />
              送信内容によっては、ご返信できない場合があります。あらかじめご了承ください。
            </p>
            <Link href="/" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
              トップページへ戻る
            </Link>
          </div>
        ) : (
          <PartnerInquiryForm error={params.error} />
        )}
      </section>

      <div className="px-4 pb-7 pt-7 text-center">
        <Link href="#top" className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-line bg-white px-4 text-xs font-black text-ink">
          ページ上部へ戻る ↑
        </Link>
      </div>
    </PageChrome>
  );
}
