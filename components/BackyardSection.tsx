import {
  ArrowRight,
  LockKeyhole,
  UserRoundPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PendingLink } from "./PendingLink";

function BackRoomDoorIllustration() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute right-1 top-2 h-[128px] w-[84px] overflow-hidden">
      <Image
        src="/images/back-room-door-illustration.jpg"
        alt=""
        width={592}
        height={1280}
        className="absolute right-0 top-[-22px] h-[178px] w-auto max-w-none object-contain opacity-80 mix-blend-multiply"
        sizes="84px"
        priority={false}
      />
    </div>
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
