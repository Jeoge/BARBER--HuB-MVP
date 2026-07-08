import {
  ArrowRight,
  LockKeyhole,
  MessageCircle,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";

export function BackyardSection() {
  return (
    <section className="px-4 pt-5">
      <div className="rounded-[10px] border border-line/80 bg-white p-4 shadow-[0_12px_32px_rgba(17,17,17,0.045)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-ink px-3 py-1.5 text-[0.64rem] font-black tracking-[0.04em] text-white shadow-[0_8px_20px_rgba(17,17,17,0.08)]">
              <LockKeyhole aria-hidden="true" size={12} />
              会員限定
            </div>
            <h2 className="editorial-serif mt-3 text-[1.52rem] leading-none text-ink">Back Room</h2>
            <p className="mt-2 text-[0.86rem] font-medium tracking-[0.04em] text-ink/78">理美容業界の営業後コミュニティ</p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-blush/15 bg-blushSoft text-blush">
            <MessageCircle aria-hidden="true" size={21} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
          <Link href="/backroom" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
            Back Roomに入る
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
          <Link
            href="/backyard/setup?next=/backroom"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[8px] border border-line bg-white text-ink"
            aria-label="Back Room用ニックネームを設定する"
          >
            <UserRoundPlus aria-hidden="true" size={18} />
          </Link>
        </div>

        <Link href="/backyard/setup?next=/backroom" className="mt-2 inline-flex text-[0.68rem] font-bold text-mute">
          ニックネーム未設定の方は参加設定へ
        </Link>
      </div>
    </section>
  );
}
