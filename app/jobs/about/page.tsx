import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { SafetyNotice } from "@/components/SafetyNotice";
import { JOB_DIRECT_CONTACT_NOTICE } from "@/lib/jobs";

const paidOptions = ["注目掲載", "上位表示", "トップページ掲載", "編集部作成の求人記事", "学校・組合・地域特集との連動"];

export default function JobsAboutPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="ABOUT JOBS"
        title="求人掲載について"
        body="BARBER HUBの求人掲載は、まず無料で始められます。応募・見学はサロンの直接連絡先へ案内します。"
      />

      <section className="grid gap-4 px-4 pt-5">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">FREE FIRST</p>
          <h2 className="mt-2 text-lg font-black leading-tight text-ink">求人掲載は基本無料です</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            まずは無料で、あなたのサロンの求人をBARBER HUBに掲載できます。求職者が安心して見られる基本情報、勤務条件、直接連絡先を入力してください。
          </p>
          <Link href="/post/job" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
            求人を掲載する
          </Link>
        </div>

        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">DIRECT CONTACT</p>
          <h2 className="mt-2 text-base font-black text-ink">BARBER HUBは求人情報の掲載場所です</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">{JOB_DIRECT_CONTACT_NOTICE}</p>
        </div>

        <SafetyNotice title="求人掲載の確認" href="/terms" linkLabel="利用規約">
          BARBER HUBは求人情報の掲載場所です。応募・見学・条件確認は掲載サロンと応募者の間で直接行ってください。採用成立、勤務条件、雇用契約の内容を保証するものではありません。
        </SafetyNotice>

        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">PAID OPTIONS</p>
          <h2 className="mt-2 text-base font-black text-ink">有料プランは問い合わせ導線だけ用意しています</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            より目立たせたいサロン向けに、注目掲載・上位表示・編集部作成プランを準備しています。今は決済を作らず、お問い合わせだけ受け付けます。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {paidOptions.map((option) => (
              <span key={option} className="rounded-full border border-line bg-neutral-50 px-3 py-2 text-xs font-black text-ink">
                {option}
              </span>
            ))}
          </div>
          <Link href="/contact?topic=paid-jobs" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] border border-line bg-white px-4 text-sm font-black text-ink">
            有料掲載について問い合わせる
          </Link>
        </div>
      </section>
    </PageChrome>
  );
}
