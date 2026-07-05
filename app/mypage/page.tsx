import { Bookmark, BriefcaseBusiness, FilePenLine, LogOut, Pencil, Send, Sparkles, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { deleteMySnapAction } from "@/app/mypage/actions";
import { logoutAction } from "@/app/auth/actions";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { pathWithParams } from "@/lib/auth/redirects";
import { findPublicProfile } from "@/lib/publicProfiles";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { listUserSnaps, snapDateLabel, type SnapWithAuthor } from "@/lib/supabase/snaps";
import {
  currentUser,
  jobApplications,
  privateMemos,
  reactionSummaries,
  salonJobAdminItems,
  savedArticles,
  savedJobs,
  savedSnaps,
} from "@/lib/userDashboard";

const testDisplayNote = "現在はテスト表示です。投稿保存は次のPhaseで対応予定です。";

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

function DashboardLinkList({ items }: { items: { id: string; title: string; meta: string; href: string }[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <Link key={item.id} href={item.href} className="block rounded-[8px] bg-neutral-50 p-3">
          <p className="line-clamp-1 text-sm font-black text-ink">{item.title}</p>
          <p className="mt-1 text-xs font-semibold text-mute">{item.meta}</p>
        </Link>
      ))}
    </div>
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
    <div className="grid gap-2.5">
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
  const { snaps: mySnaps, error: mySnapsError } = await listUserSnaps(supabase, user.id, 3);
  const profileDisplayName = profile?.display_name?.trim() || "プロフィール未設定";
  const loginEmail = user.email ?? "メールアドレス未取得";
  const hasProfile = profile != null;
  const showSalonAdmin = Boolean(profile?.salon_name?.trim() || profile?.job_type?.includes("サロン"));
  const followedProfiles = currentUser.followedProfileIds
    .map((profileId) => findPublicProfile(profileId))
    .filter((profile): profile is NonNullable<typeof profile> => profile != null);

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
              Snapを削除しました。
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

      <SectionCard eyebrow="SAVED" title="保存したもの" testNote={testDisplayNote}>
        <div className="grid gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black text-ink">
              <Bookmark aria-hidden="true" size={15} className="text-blush" />
              保存した記事
            </h3>
            <div className="mt-2">
              <DashboardLinkList items={savedArticles} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black text-ink">保存したSnap</h3>
            <div className="mt-2">
              <DashboardLinkList items={savedSnaps} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black text-ink">保存した求人</h3>
            <div className="mt-2">
              <DashboardLinkList items={savedJobs} />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard eyebrow="MEMO" title="自分用メモ" testNote={testDisplayNote}>
        <div className="grid gap-3">
          <label className="grid gap-2">
            <span className="text-xs font-bold text-mute">メモを書く</span>
            <textarea
              rows={3}
              className="resize-none rounded-[8px] border border-line bg-neutral-50 px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
              placeholder="あとで試したいこと、見学候補、気になる道具など"
            />
          </label>
          <button type="button" className="inline-flex h-10 items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
            保存する
          </button>
          <div className="grid gap-2">
            {privateMemos.map((memo) => (
              <p key={memo} className="rounded-[8px] bg-neutral-50 p-3 text-sm font-semibold text-ink">
                {memo}
              </p>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard eyebrow="FOLLOWING" title="フォロー中" testNote={testDisplayNote}>
        <div className="grid gap-2">
          {followedProfiles.map((profile) => (
            <Link key={profile.id} href={`/profiles/${profile.id}`} className="flex items-center justify-between gap-3 rounded-[8px] bg-neutral-50 p-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-ink">{profile.displayName}</span>
                <span className="mt-1 block text-xs font-semibold text-mute">
                  {[...profile.badges, ...(profile.isHiring ? ["求人中"] : [])].join(" / ")}
                </span>
              </span>
              <UserRoundCheck aria-hidden="true" size={16} className="shrink-0 text-blush" />
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard eyebrow="THANKS POINTS" title="Thanksポイント" testNote={testDisplayNote}>
        <div className="rounded-[8px] bg-neutral-50 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold text-mute">今月の獲得ポイント</p>
              <p className="mt-1 text-2xl font-black text-ink">{currentUser.thanksPoints}pt</p>
            </div>
            <div>
              <p className="text-xs font-bold text-mute">商品交換まであと</p>
              <p className="mt-1 text-2xl font-black text-ink">{currentUser.pointsToNextReward}pt</p>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium leading-relaxed text-mute">
            投稿に届いた反応が、Thanksポイントとして貯まります。将来的に理容道具・材料・講習特典などと交換できる予定です。
          </p>
        </div>
      </SectionCard>

      <SectionCard eyebrow="OWNER VIEW" title="自分の投稿への反応" testNote={testDisplayNote}>
        <p className="text-xs font-medium leading-relaxed text-mute">
          この数字は投稿者本人だけが見る管理情報です。公開カードや他人のプロフィールには表示しません。
        </p>
        <div className="mt-3 grid gap-3">
          {reactionSummaries.map((summary) => (
            <div key={summary.contentId} className="rounded-[8px] bg-neutral-50 p-3">
              <p className="text-sm font-black text-ink">{summary.title}</p>
              <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
                <div className="rounded-[7px] bg-white px-1.5 py-2">
                  <p className="text-[0.62rem] font-bold text-mute">いいね</p>
                  <p className="text-sm font-black text-ink">{summary.likes}</p>
                </div>
                <div className="rounded-[7px] bg-white px-1.5 py-2">
                  <p className="text-[0.62rem] font-bold text-mute">Thanks</p>
                  <p className="text-sm font-black text-ink">{summary.thanks}</p>
                </div>
                <div className="rounded-[7px] bg-white px-1.5 py-2">
                  <p className="text-[0.62rem] font-bold text-mute">保存</p>
                  <p className="text-sm font-black text-ink">{summary.saves}</p>
                </div>
                <div className="rounded-[7px] bg-white px-1.5 py-2">
                  <p className="text-[0.62rem] font-bold text-mute">コメント</p>
                  <p className="text-sm font-black text-ink">{summary.comments}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard eyebrow="APPLICATIONS" title="応募履歴" testNote={testDisplayNote}>
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
        <p className="mt-3 text-xs font-medium leading-relaxed text-mute">
          応募後の連絡や採用判断は求人掲載サロンが行います。BARBER HUBは応募導線を提供するプラットフォームです。
        </p>
      </SectionCard>

      {showSalonAdmin ? (
        <SectionCard eyebrow="SALON ADMIN" title="求人掲載管理" testNote={testDisplayNote}>
          <div className="grid gap-2">
            {salonJobAdminItems.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-[8px] bg-neutral-50 p-3 text-sm font-black text-ink">
                <Send aria-hidden="true" size={14} className="text-blush" />
                {item}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-medium leading-relaxed text-mute">
            MVPでは表示枠のみです。正式版では求人内容編集、応募者確認、露出強化の管理に使います。
          </p>
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
