import { ArrowRight, CreditCard, Megaphone } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";

export default function CommercialDisclosurePage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="DISCLOSURE"
        title="特定商取引法に基づく表記"
        body="Treatと有料記事を利用する場合の、購入・返金・問い合わせに関する表示です。"
      />

      <section className="grid gap-4 px-4 pt-5">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-blushSoft text-blush">
            <CreditCard aria-hidden="true" size={20} />
          </div>
          <h2 className="mt-3 text-lg font-black leading-tight text-ink">Treat・有料記事について</h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            Treatは300円・500円・1,000円、有料記事は100円・300円・500円・1,000円（税込）の都度決済です。決済はStripeを通じて行い、購入完了後にTreatの確定または有料部分の閲覧権が反映されます。通信費などは利用者の負担です。
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">有料記事の提供者は各記事の投稿者です。BARBER HUBは決済・プラットフォーム運営を担い、販売価格の15%をプラットフォーム手数料として受け取ります。</p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">デジタルコンテンツの性質上、購入確定後の自己都合による取消し・返金は原則できません。二重決済、閲覧できない等の不具合、法令上必要な返金は内容を確認のうえ対応します。</p>
          <Link href="/contact?topic=payment" className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-line bg-white text-sm font-black text-ink">Treat・有料記事のお問い合わせ<ArrowRight aria-hidden="true" size={16} /></Link>
        </div>

        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Megaphone aria-hidden="true" size={16} className="text-blush" />
            広告・協賛について
          </div>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            広告・協賛は現在、個別相談・問い合わせベースで受け付けます。掲載内容、期間、料金は運営確認後に個別に相談します。
          </p>
          <Link href="/advertising/apply" className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-ink text-sm font-black text-white">
            広告掲載のお問い合わせ
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>
    </PageChrome>
  );
}
