import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { SUCCESSION_DIRECT_NOTICE, SUCCESSION_NOTICE } from "@/lib/succession";

const paidOptions = ["注目掲載", "上位表示", "編集部作成の承継紹介記事", "地域特集", "組合・学校・企業との連動", "開業支援パートナー掲載"];

export default function SuccessionAboutPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="ABOUT SUCCESSION"
        title="開業・承継情報の掲載について"
        body="理容室の開業・承継・居抜き・設備譲渡に関する情報を、公開情報と非公開情報に分けて掲載できます。"
      />

      <section className="grid gap-4 px-4 pt-5">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">FREE FIRST</p>
          <h2 className="mt-2 text-lg font-black leading-tight text-ink">掲載は基本無料です</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            開業・承継情報の掲載は基本無料です。公開ページには、地域、業態、席数、希望時期など、個人や店舗を特定しにくい情報だけを表示します。
          </p>
          <Link href="/post/succession" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
            開業・承継情報を掲載する
          </Link>
        </div>

        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">PRIVATE FIRST</p>
          <h2 className="mt-2 text-base font-black text-ink">非公開にする情報</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            店舗名、正確な住所、売上、利益、家賃、譲渡希望額、借入、顧客数、スタッフ情報、個人連絡先は公開ページには表示しません。
          </p>
        </div>

        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">BARBER HUB ROLE</p>
          <h2 className="mt-2 text-base font-black text-ink">BARBER HUBは情報掲載と問い合わせ導線を提供します</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">{SUCCESSION_NOTICE}</p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">{SUCCESSION_DIRECT_NOTICE}</p>
        </div>

        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">PAID OPTIONS</p>
          <h2 className="mt-2 text-base font-black text-ink">有料導線は問い合わせのみです</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            より目立たせたい場合や、編集部による紹介記事作成、地域特集との連動をご希望の場合は、運営までお問い合わせください。今は決済や有料販売は作りません。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {paidOptions.map((option) => (
              <span key={option} className="rounded-full border border-line bg-neutral-50 px-3 py-2 text-xs font-black text-ink">
                {option}
              </span>
            ))}
          </div>
          <Link href="/contact?topic=succession-paid" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] border border-line bg-white px-4 text-sm font-black text-ink">
            有料掲載について問い合わせる
          </Link>
        </div>
      </section>
    </PageChrome>
  );
}
