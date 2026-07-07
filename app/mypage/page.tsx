import { BriefcaseBusiness, FilePenLine, LogOut, Pencil, Sparkles, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { deleteMySnapAction } from "@/app/mypage/actions";
import { logoutAction } from "@/app/auth/actions";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { pathWithParams } from "@/lib/auth/redirects";
import { listFollowingProfiles } from "@/lib/supabase/follows";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { getMySnapStats } from "@/lib/supabase/insights";
import { listSavedSnaps } from "@/lib/supabase/saved";
import { createClient } from "@/lib/supabase/server";
import { listUserSnaps, snapDateLabel, type SnapWithAuthor } from "@/lib/supabase/snaps";

// 応募・求人掲載はまだDBに保存していないため、現状は空。
// 将来 応募/求人掲載の保存機能ができたら、ここをDB取得に差し替えると自動で一覧に並ぶ。
type JobApplication = { id: string; salonName: string; type: string; status: string };
type SalonJobPosting = { id: string; title: string; status: string };

function accountInitial(nameOrEmail: string | undefined) {
  return (nameOrEmail?.trim().slice(0, 1) || "B").toUpperCase();
}

function textOrUnset(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : "未設定";
}

function ProfileRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-3 rounded-[8px] bg-neutral-50 px-3 py-2.5 text-sm">
      <span className="font-bold text-mute">{label}</span>
      <span className="font-semibold text-ink">{textOrUnset(value)}</span>
    </div>
  );
}

function SectionCard({
  title,
  eyebrow,
  testNote,
  children,
}: {
  title: string;
  eyebrow?: string;
  testNote?: string;
  children: ReactNode;
}) {
  return (
    <section className="px-4 pt-5">
      <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
        {eyebrow ? <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">{eyebrow}</p> : null}
        <h2 className="mt-1 text-base font-black text-ink">{title}</h2>
        {testNote ? (
          <p className="mt-1.5 rounded-[7px] border border-line/70 bg-neutral-50 px-2.5 py-1.5 text-[0.68rem] font-semibold leading-relaxed text-mute">
            {testNote}
          </p>
        ) : null}
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}

type MyPageProps = {
  searchParams?: Promise<{ profile?: string; snap?: string; snapError?: string }>;
};

function MySnapList({ snaps }: { snaps: SnapWithAuthor[] }) {
  if (snaps.length === 0) {
    return (
      <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
        <p className="text-sm font-black text-ink">まだ自分のSnapはありません</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-mute">最初のSnapを投稿すると、ここに表示されます。</p>
        <Link href="/post/snap" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
          Snapを投稿する
        </Link>
      </div>
    );
  }

  return (
    <div className="grid max-h-[17.5rem] gap-2.5 overflow-y-auto overscroll-contain pr-1">
      {snaps.map((snap) => (
        <article key={snap.id} className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <div className="flex gap-3">
            {snap.image_url ? (
              <Link href={`/posts/${snap.id}`} className="h-20 w-16 shrink-0">
                <MagazineImage src={snap.image_url} alt={snap.caption ?? "Snap"} variant="news" className="h-full w-full" />
              </Link>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-blush">{snap.category ?? "日常"}</span>
                <span className="text-[0.66rem] font-bold text-mute">{snapDateLabel(snap)}</span>
              </div>
              <Link href={`/posts/${snap.id}`} className="mt-1 block">
                <p className="line-clamp-2 break-words text-sm font-semibold leading-relaxed text-ink">{snap.caption}</p>
              </Link>
            </div>
          </div>
          <form action={deleteMySnapAction} className="mt-2">
            <input type="hidden" name="snapId" value={snap.id} />
            <button type="submit" className="inline-flex h-9 w-full items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-mute">
              このSnapを削除
            </button>
          </form>
        </article>
      ))}
    </div>
  );
}

export default async function MyPage({ searchParams }: MyPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect(
      pathWithParams("/login", {
        next: "/mypage",
        message: "マイページを見るにはログインしてください。",
      })
    );
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);
  const { snaps: mySnaps, error: mySnapsError } = await listUserSnaps(supabase, user.id, 30, user.id);
  const profileDisplayName = profile?.display_name?.trim() || "プロフィール未設定";
  const loginEmail = user.email ?? "メールアドレス未取得";
  const hasProfile = profile != null;
  const showSalonAdmin = Boolean(profile?.salon_name?.trim() || profile?.job_type?.includes("サロン"));
  const followedProfiles = await listFollowingProfiles(supabase, user.id);
  const savedSnapList = await listSavedSnaps(supabase, user.id);
  const stats = await getMySnapStats(supabase, user.id);
  // Thanksポイント：受け取ったThanks 1件＝1pt。
  const thanksPoints = stats.thanksReceived;
  const nextRewardAt = (Math.floor(thanksPoints / 100) + 1) * 100;
  const pointsToNext = nextRewardAt - thanksPoints;
  // 応募・求人掲載の保存機能ができるまでは空（実際に応募/掲載したら並ぶ受け皿）。
  const jobApplications: JobApplication[] = [];
  const salonJobPostings: SalonJobPosting[] = [];

  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="PRIVATE DASHBOARD"
        title="マイページ"
        body="保存、メモ、フォロー中、Thanksポイント、自分の投稿への反応を確認する本人専用の管理画面です。"
      />

      <section className="px-4 pt-5">
        <div className="rounded-[10px] bg-ink p-4 text-white">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-white/55">ONLY YOU</p>
          {params?.profile === "updated" ? (
            <p className="mt-3 rounded-[8px] border border-white/15 bg-white/10 px-3 py-2 text-[0.72rem] font-black leading-relaxed text-white">
              プロフィールを保存しました。
            </p>
          ) : null}
          {params?.snap === "deleted" ? (
            <p className="mt-3 rounded-[8px] border border-white/15 bg-white/10 px-3 py-2 text-[0.72rem] font-black leading-relaxed text-white">
              削除しました
            </p>
          ) : null}
          <div className="mt-3 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-lg font-black">
              {accountInitial(profile?.display_name ?? loginEmail)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black">{profileDisplayName}</h2>
              <p className="mt-1 text-xs font-semibold text-white/60">公開プロフィールとは別の、本人だけの管理情報です。</p>
              <p className="mt-1 break-words text-xs font-semibold text-white/65">ログイン中: {loginEmail}</p>
            </div>
          </div>
          {profileError ? (
            <p className="mt-3 rounded-[8px] border border-white/10 bg-white/5 px-3 py-2 text-[0.7rem] font-semibold leading-relaxed text-white/62">
              プロフィール情報を取得できませんでした。時間をおいて再読み込みしてください。
            </p>
          ) : null}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Link href="/mypage/profile/edit" className="inline-flex h-10 items-center justify-center gap-1 rounded-[8px] bg-white text-xs font-black text-ink">
              <Pencil aria-hidden="true" size={14} />
              編集
            </Link>
            <Link href="/post/snap" className="inline-flex h-10 items-center justify-center gap-1 rounded-[8px] bg-white/10 text-xs font-black text-white">
              <FilePenLine aria-hidden="true" size={14} />
              投稿
            </Link>
            <Link href="/jobs/register" className="inline-flex h-10 items-center justify-center gap-1 rounded-[8px] bg-white/10 text-xs font-black text-white">
              <BriefcaseBusiness aria-hidden="true" size={14} />
              求人
            </Link>
          </div>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[8px] border border-white/15 bg-white/5 text-xs font-black text-white">
              <LogOut aria-hidden="true" size={14} />
              ログアウト
            </button>
          </form>
        </div>
      </section>

      <SectionCard eyebrow="THANKS POINTS" title="Thanksポイント">
        <div className="rounded-[8px] bg-neutral-50 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold text-mute">受け取ったThanks</p>
              <p className="mt-1 text-2xl font-black text-ink">
                {thanksPoints}
                <span className="text-base"> pt</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-mute">次の特典まで</p>
              <p className="mt-1 text-2xl font-black text-ink">
                {pointsToNext}
                <span className="text-base"> pt</span>
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium leading-relaxed text-mute">
            自分の投稿が受け取ったThanks 1件＝1ptです（{nextRewardAt}ptで次の特典）。
          </p>
        </div>
      </SectionCard>

      <SectionCard eyebrow="MY SNAP" title="自分のSnap">
        {params?.snapError ? (
          <div className="mb-3 rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            {params.snapError}
          </div>
        ) : null}
        {mySnapsError ? (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
            自分のSnapを読み込めませんでした。
          </div>
        ) : (
          <MySnapList snaps={mySnaps} />
        )}
      </SectionCard>

      <SectionCard eyebrow="SAVED" title="保存したもの">
        {savedSnapList.length === 0 ? (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
            保存したSnapはまだありません。
          </div>
        ) : (
          <div className="grid max-h-[17.5rem] gap-2.5 overflow-y-auto overscroll-contain pr-1">
            {savedSnapList.map((snap) => (
              <Link key={snap.id} href={`/posts/${snap.id}`} className="flex gap-3 rounded-[8px] border border-line bg-neutral-50 p-3">
                {snap.image_url ? (
                  <div className="h-16 w-14 shrink-0">
                    <MagazineImage src={snap.image_url} alt={snap.caption ?? "Snap"} variant="news" className="h-full w-full" />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-blush">{snap.category ?? "日常"}</span>
                  <p className="mt-1 line-clamp-2 break-words text-sm font-semibold leading-relaxed text-ink">
                    {snap.caption?.trim() || "本文なしのSnapです。"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard eyebrow="FOLLOWING" title="フォロー中">
        {followedProfiles.length === 0 ? (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
            まだフォローしていません。
          </div>
        ) : (
          <div className="grid max-h-[13.75rem] gap-2 overflow-y-auto overscroll-contain pr-1">
            {followedProfiles.map((profile) => {
              const meta = [profile.job_type, profile.salon_name, profile.region].filter(Boolean).join(" / ");
              return (
                <Link key={profile.id} href={`/profiles/${profile.id}`} className="flex items-center justify-between gap-3 rounded-[8px] bg-neutral-50 p-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-ink">
                      {profile.display_name?.trim() || "プロフィール未設定"}
                    </span>
                    <span className="mt-1 block truncate text-xs font-semibold text-mute">
                      {meta || "BARBER HUB"}
                    </span>
                  </span>
                  <UserRoundCheck aria-hidden="true" size={16} className="shrink-0 text-blush" />
                </Link>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard eyebrow="PROFILE" title="プロフィール">
        {hasProfile ? (
          <div className="grid gap-2.5">
            <ProfileRow label="表示名" value={profile.display_name} />
            <ProfileRow label="職種" value={profile.job_type} />
            <ProfileRow label="サロン" value={profile.salon_name} />
            <ProfileRow label="地域" value={profile.region} />
            <div className="rounded-[8px] bg-neutral-50 px-3 py-3">
              <p className="text-xs font-bold text-mute">自己紹介</p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-relaxed text-ink">{textOrUnset(profile.bio)}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
            <p className="text-sm font-black text-ink">プロフィール未設定</p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-mute">
              表示名、職種、サロン名、地域、自己紹介を設定すると、ここに表示されます。
            </p>
            <Link href="/mypage/profile/edit" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
              プロフィールを設定する
            </Link>
          </div>
        )}
      </SectionCard>

      <SectionCard eyebrow="MEMO" title="自分用メモ">
        <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
          メモ機能は準備中です。
        </div>
      </SectionCard>

      <SectionCard eyebrow="OWNER VIEW" title="自分の投稿への反応">
        {stats.snapCount === 0 ? (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
            まだ投稿がありません。Snapを投稿すると、他の人からの反応がここに集計されます。
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[8px] bg-neutral-50 p-3 text-center">
                <p className="text-[0.62rem] font-bold text-mute">受け取ったThanks</p>
                <p className="mt-1 text-2xl font-black text-ink">{stats.thanksReceived}</p>
              </div>
              <div className="rounded-[8px] bg-neutral-50 p-3 text-center">
                <p className="text-[0.62rem] font-bold text-mute">コメント</p>
                <p className="mt-1 text-2xl font-black text-ink">{stats.commentsReceived}</p>
              </div>
            </div>
            <p className="mt-3 text-xs font-medium leading-relaxed text-mute">
              あなたの{stats.snapCount}件の投稿に、他の人から届いた反応です。
            </p>
          </>
        )}
      </SectionCard>

      <SectionCard eyebrow="APPLICATIONS" title="応募履歴">
        {jobApplications.length === 0 ? (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
            まだ応募はありません。求人に応募すると、ここに履歴が表示されます。
          </div>
        ) : (
          <div className="grid gap-2">
            {jobApplications.map((application) => (
              <div key={application.id} className="flex items-center justify-between gap-3 rounded-[8px] bg-neutral-50 p-3">
                <span>
                  <span className="block text-sm font-black text-ink">{application.salonName}</span>
                  <span className="mt-1 block text-xs font-semibold text-mute">{application.type}</span>
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[0.66rem] font-black text-ink">{application.status}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {showSalonAdmin ? (
        <SectionCard eyebrow="SALON ADMIN" title="求人掲載管理">
          {salonJobPostings.length === 0 ? (
            <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
              まだ掲載中の求人はありません。求人を掲載すると、ここに表示されます。
            </div>
          ) : (
            <div className="grid gap-2">
              {salonJobPostings.map((posting) => (
                <div key={posting.id} className="flex items-center justify-between gap-3 rounded-[8px] bg-neutral-50 p-3">
                  <span className="block text-sm font-black text-ink">{posting.title}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[0.66rem] font-black text-ink">{posting.status}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      ) : null}

      <section className="px-4 pt-5">
        <div className="rounded-[10px] border border-blush/20 bg-blushSoft p-4">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Sparkles aria-hidden="true" size={17} className="text-blush" />
            本人専用情報について
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            保存一覧、自分用メモ、Thanksポイント、反応数、応募履歴は公開プロフィールには表示されません。
          </p>
        </div>
      </section>
    </PageChrome>
  );
}
