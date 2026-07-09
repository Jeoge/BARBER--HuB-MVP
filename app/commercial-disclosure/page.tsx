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
        body="現在のBARBER HUBでは、サイト上で決済を伴う有料販売・有料掲載の申込みは行っていません。"
      />

      <section className="grid gap-4 px-4 pt-5">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-blushSoft text-blush">
            <CreditCard aria-hidden="true" size={20} />
          </div>
          <h2 className="mt-3 text-lg font-black leading-tight text-ink">オンライン販売はまだ行っていません</h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            現在、BARBER HUBではサイト上で決済を伴う有料販売・有料掲載の申込みは行っていません。有料掲載、月額プラン、掲載チケット、編集部作成プランなどをオンラインで販売する場合は、販売価格、支払方法、提供時期、キャンセル条件、事業者情報など必要事項を表示します。
          </p>
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
