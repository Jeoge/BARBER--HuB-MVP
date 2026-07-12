import {
  ArrowRight,
  LockKeyhole,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { PendingLink } from "./PendingLink";

function BackRoomDoorIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 132 142"
      className="pointer-events-none absolute right-1 top-4 h-[100px] w-[92px] text-ink/45"
      fill="none"
    >
      <path
        d="M75 18h41v83M75 18v89M75 107h41"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M52 10l23 15v86L52 101V10Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M58 68h3" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
      <path
        d="M113 64c9 1 14 6 15 15M120 57c5 4 7 10 6 17M118 102h13"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path
        d="M42 124c8 4 17 3 20-1M73 126c6 3 14 2 17-2"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="M66 50c-8 0-14-5-14-12 0-6 5-11 12-11 8 0 14 5 14 12 0 6-5 11-12 11Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M53 54c-10 6-16 17-15 31M77 55c11 8 15 23 13 43"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="M42 79c-5 2-9 3-14 2M28 81c-2 0-4 2-4 4 0 3 2 5 5 5 5 0 10-2 16-5"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50 57c12 8 25 9 36 2M53 57c-5 15-5 32-2 51M86 59c-1 15-3 31-7 49"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M51 108l-8 18M79 108l-6 18"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="M84 58c7 10 11 21 13 34M94 66l9 30"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BackyardSection() {
  return (
    <section className="px-4 pt-5">
      <div className="relative overflow-hidden rounded-[10px] border border-line/80 bg-white p-4 shadow-[0_12px_32px_rgba(17,17,17,0.045)]">
        <BackRoomDoorIllustration />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-3 py-1.5 text-[0.64rem] font-black tracking-[0.04em] text-white shadow-[0_0_0_3px_rgba(255,59,134,0.1),0_8px_20px_rgba(17,17,17,0.08)]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 ring-2 ring-blush/35">
                <LockKeyhole aria-hidden="true" size={15} strokeWidth={2.6} />
              </span>
              会員限定
            </div>
            <h2 className="editorial-serif mt-3 text-[1.52rem] leading-none text-ink">Back Room</h2>
            <p className="mt-2 text-[0.86rem] font-medium tracking-[0.04em] text-ink/78">理美容業界の営業後コミュニティ</p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-[1fr_auto] gap-2">
          <PendingLink href="/backroom" pendingLabel="入室中..." className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
            Back Roomに入る
            <ArrowRight aria-hidden="true" size={15} />
          </PendingLink>
          <PendingLink
            href="/backroom/setup?next=/backroom"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[8px] border border-line bg-white text-ink"
            aria-label="Back Room用ニックネームを設定する"
          >
            <UserRoundPlus aria-hidden="true" size={18} />
          </PendingLink>
        </div>

        <Link href="/backroom/setup?next=/backroom" className="relative mt-2 inline-flex text-[0.68rem] font-bold text-mute transition active:scale-[0.98]">
          ニックネーム未設定の方は参加設定へ
        </Link>
      </div>
    </section>
  );
}
