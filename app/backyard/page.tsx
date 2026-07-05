import { Building2, Clock, Flag, LockKeyhole, Plus, ShieldCheck, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { MagazinePageHeader, MagazineSectionHeading } from "@/components/MagazineListLayout";
import { PageChrome } from "@/components/PageChrome";
import {
  BACK_ROOM_COMMENTS_STEP,
  BACK_ROOM_COMMENT_LIMIT,
  BACK_ROOM_INITIAL_COMMENTS,
  backRoomRooms,
  firstRoomPrompts,
  moderationLabel,
  threadsForRoom,
} from "@/lib/backRoom";
import { backyardPosts } from "@/lib/mockData";

type BackRoomPageProps = {
  searchParams?: Promise<{ room?: string; access?: string }>;
};

const activeRoomIds = ["management", "tools", "hobby", "first"];

export default async function BackyardPage({ searchParams }: BackRoomPageProps) {
  const params = await searchParams;
  const selectedRoomId = params?.room;
  const selectedRoom = backRoomRooms.find((room) => room.id === selectedRoomId);
  const visibleThreads = threadsForRoom(selectedRoomId);
  const activeRooms = backRoomRooms.filter((room) => activeRoomIds.includes(room.id));
  const hotThreads = backyardPosts.slice(0, 5);

  return (
    <PageChrome>
      <MagazinePageHeader
        eyebrow="BACK ROOM"
        title="Back Room"
        description="営業後に、技術・経営・地域・趣味の話を静かに重ねるスレッド型コミュニティ。"
        tags={["ニックネーム参加", "スレッド型", "営業後トーク"]}
      />

      <section className="px-4 pt-4">
        <div className="rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
              <UserRoundPlus aria-hidden="true" size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-ink">まずは読むだけでもOK</h2>
              <p className="mt-1 text-sm font-medium leading-relaxed text-mute">
                気になる部屋をのぞいてみてください。話したくなったら、表プロフィールとは別のニックネームで参加できます。
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <Link href="/backyard/setup" className="inline-flex h-12 items-center justify-center rounded-[8px] bg-blush text-sm font-black text-white">
              Back Roomに参加する
            </Link>
            <Link href="/backyard-rules" className="inline-flex h-12 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">
              Rules
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <MagazineSectionHeading eyebrow="ROOMS" title="今日動いている部屋" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {activeRooms.map((room) => (
            <Link key={room.id} href={`/backyard?room=${room.id}#threads`} className="w-[68%] shrink-0 rounded-[10px] border border-line/80 bg-white p-4 shadow-[0_10px_26px_rgba(17,17,17,0.035)]">
              <p className="editorial-serif text-[1.08rem] leading-tight text-ink">{room.label}</p>
              <p className="mt-1 line-clamp-2 min-h-9 text-xs font-medium leading-relaxed text-mute">{room.description}</p>
              <p className="mt-3 text-[0.68rem] font-semibold text-blush">{room.latestActivity}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <MagazineSectionHeading eyebrow="CATEGORIES" title="部屋を選ぶ" />
        <div className="mt-3 grid gap-2.5">
          {backRoomRooms.map((room) => (
            <Link
              key={room.id}
              href={`/backyard?room=${room.id}#threads`}
              className={
                "rounded-[8px] border bg-white p-3 shadow-sm " +
                (room.id === selectedRoomId ? "border-blush/40 ring-2 ring-blush/10" : "border-line")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-sm font-black text-ink">{room.label}</h3>
                    {room.beginnerFriendly ? (
                      <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.58rem] font-black text-blush">初めて向け</span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{room.description}</p>
                  {room.futureChildren ? (
                    <p className="mt-1 text-[0.62rem] font-bold text-mute">将来: {room.futureChildren.slice(0, 3).join(" / ")} など</p>
                  ) : null}
                </div>
                <p className="shrink-0 text-right text-[0.68rem] font-semibold leading-relaxed text-blush">
                  {room.latestActivity}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <Link href="/salon-transition" className="flex items-center gap-3 rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
            <Building2 aria-hidden="true" size={19} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-ink">独立前に見ておきたい開業情報</span>
            <span className="mt-0.5 block text-xs font-bold leading-relaxed text-mute">居抜き、承継、備品譲渡はBack Roomで話す前の整理にも使えます。</span>
          </span>
        </Link>
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
            はじめての人へ
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            まずは気になる部屋をのぞいてみてください。読むだけでもOK。個人攻撃・晒しは禁止です。
          </p>
          <div className="mt-3 grid gap-1.5">
            {firstRoomPrompts.map((prompt) => (
              <p key={prompt} className="rounded-[8px] bg-neutral-50 px-3 py-2 text-xs font-black text-ink">
                {prompt}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <MagazineSectionHeading eyebrow="THREADS" title="最近の話題" />
        <div className="mt-3 grid gap-2">
          {hotThreads.slice(0, 5).map((thread) => (
            <Link key={thread.id} href={`/posts/${thread.id}`} className="rounded-[8px] border border-line bg-white px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-full bg-blushSoft px-2 py-0.5 text-[0.6rem] font-black text-blush">{thread.category}</span>
                <h3 className="min-w-0 flex-1 truncate text-[0.84rem] font-black text-ink">{thread.title ?? thread.body}</h3>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[0.68rem] font-bold text-mute">
                <span className="inline-flex items-center gap-1">
                  <Clock aria-hidden="true" size={13} />
                  {thread.latestCommentAt ?? "さっき"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="threads" className="px-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="editorial-label text-[0.62rem] uppercase text-blush">LATEST</p>
            <h2 className="editorial-serif mt-1 text-[1.14rem] leading-tight text-ink">{selectedRoom?.label ?? "スレッド一覧"}</h2>
            <p className="mt-1 text-xs font-medium text-mute">
              {selectedRoom?.description ?? "カテゴリを選ぶと、その部屋のスレッドだけを表示します。"}
            </p>
          </div>
          <Link href="/post/backyard" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] bg-ink px-3 text-xs font-black text-white">
            <Plus aria-hidden="true" size={14} />
            立てる
          </Link>
        </div>
        <div className="mt-3 grid gap-2.5">
          {visibleThreads.map((thread) => {
            const label = moderationLabel(thread.moderationStatus ?? "normal");

            return (
              <Link key={thread.id} href={`/posts/${thread.id}`} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.62rem] font-black text-blush">{thread.category}</span>
                      {label ? <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[0.6rem] font-black text-mute">{label}</span> : null}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-[0.96rem] font-black leading-snug text-ink">{thread.title ?? thread.body}</h3>
                    <p className="mt-1 text-xs font-bold text-mute">{thread.anonymousName}</p>
                    {thread.roleLabel ? (
                      <span className="mt-1 inline-flex rounded-full border border-line bg-neutral-50 px-2 py-0.5 text-[0.58rem] font-black text-mute">
                        {thread.roleLabel}
                      </span>
                    ) : null}
                  </div>
                  <button aria-label="不適切" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-50 text-mute">
                    <Flag aria-hidden="true" size={15} />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3 text-[0.72rem] font-bold text-mute">
                  <span>{thread.latestCommentAt ?? "さっき"}</span>
                  <span>{thread.status}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[8px] border border-line bg-white p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <LockKeyhole aria-hidden="true" size={18} className="text-blush" />
            スレッド型で運用します
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            1スレッドは最大{BACK_ROOM_COMMENT_LIMIT}コメント。初期表示は{BACK_ROOM_INITIAL_COMMENTS}件、もっと見るで{BACK_ROOM_COMMENTS_STEP}件ずつ表示します。
            不適切報告だけで即BANせず、最終判断は運営確認後に行う想定です。
          </p>
        </div>
      </section>
    </PageChrome>
  );
}
