import { LockKeyhole, UserRoundPlus } from "lucide-react";
import { PendingLink } from "@/components/PendingLink";
import { pathWithParams } from "@/lib/auth/redirects";

type BackroomSetupRequiredCardProps = {
  next?: string;
};

export function BackroomSetupRequiredCard({ next = "/backroom" }: BackroomSetupRequiredCardProps) {
  return (
    <section className="px-4 pt-5">
      <div className="rounded-[10px] border border-blush/20 bg-white p-4 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-blushSoft text-blush ring-4 ring-blush/10">
          <LockKeyhole aria-hidden="true" size={24} />
        </div>
        <p className="mt-4 text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">BACK ROOM SETUP</p>
        <h1 className="mt-1 text-[1.45rem] font-black leading-tight text-ink">Back Room専用ニックネームが必要です</h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
          Back Roomでは、通常プロフィールとは別のニックネームで参加できます。設定するとスレッド一覧、詳細、コメントが見られるようになります。
        </p>
        <PendingLink
          href={pathWithParams("/backroom/setup", { next })}
          pendingLabel="設定へ移動中..."
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-ink text-sm font-black text-white"
        >
          <UserRoundPlus aria-hidden="true" size={17} />
          ニックネームを設定する
        </PendingLink>
      </div>
    </section>
  );
}
