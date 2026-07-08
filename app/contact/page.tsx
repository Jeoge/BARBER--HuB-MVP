import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";

export default function ContactPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="CONTACT"
        title="お問い合わせ"
        body="運営へのお問い合わせ導線です。正式な送信フォームは準備中です。"
      />

      <section className="px-4 pt-5">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">COMING SOON</p>
          <h2 className="mt-2 text-lg font-black leading-tight text-ink">お問い合わせページ準備中</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            有料掲載、協賛、運営への相談窓口は準備中です。正式公開時に送信フォームまたは連絡先を掲載します。
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/jobs/about" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink">
              求人掲載について
            </Link>
            <Link href="/jobs" className="inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-3 text-sm font-black text-white">
              求人一覧へ
            </Link>
          </div>
        </div>
      </section>
    </PageChrome>
  );
}
