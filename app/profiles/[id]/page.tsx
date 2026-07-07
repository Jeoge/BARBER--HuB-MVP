import {
  BadgeCheck,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ExternalLink,
  MapPin,
  MessageSquareText,
  NotebookPen,
} from "lucide-react";
import Link from "next/link";
import { FollowButton } from "@/components/FollowButton";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { articles, posts } from "@/lib/mockData";
import { findPublicProfile, type ProfileLinkKey, type PublicProfile } from "@/lib/publicProfiles";
import { getFollowCounts } from "@/lib/supabase/follows";
import { getAccountProfile, type AccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { listUserSnaps, snapDateLabel, type SnapWithAuthor } from "@/lib/supabase/snaps";

const linkLabels: Record<ProfileLinkKey, string> = {
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
  website: "公式サイト",
  map: "Googleマップ",
};

const typeLabels: Record<PublicProfile["type"], string> = {
  individual: "個人",
  salon: "サロン",
  school: "学校",
  maker: "メーカー",
  manufacturer: "メーカー",
  dealer: "ディーラー",
  "regional-dealer": "地域ディーラー",
  "online-store": "オンライン購入先",
  organization: "組合",
  company: "企業",
  editor: "編集部",
};

function profileInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

function profileImageVariant(type: PublicProfile["type"]) {
  if (type === "maker" || type === "manufacturer" || type === "dealer" || type === "regional-dealer" || type === "online-store") return "tool";
  if (type === "school" || type === "organization") return "seminar";
  return "news";
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function profileTypeFromJobType(jobType: string | null | undefined): PublicProfile["type"] {
  if (!jobType) return "individual";
  if (jobType.includes("サロン")) return "salon";
  if (jobType.includes("学校")) return "school";
  if (jobType.includes("メーカー")) return "maker";
  if (jobType.includes("ディーラー")) return "dealer";
  if (jobType.includes("組合")) return "organization";
  return "individual";
}

function dbProfileToPublicProfile(profile: AccountProfile): PublicProfile {
  const type = profileTypeFromJobType(profile.job_type);
  const displayName = profile.display_name?.trim() || "プロフィール未設定";
  const area = profile.region?.trim() || "地域未設定";
  const badges = [profile.job_type, profile.salon_name].filter((value): value is string => Boolean(value && value.trim().length > 0));

  return {
    id: profile.id,
    displayName,
    type,
    badges: badges.length > 0 ? badges : ["BARBER HUB"],
    area,
    avatarUrl: profile.avatar_url ?? undefined,
    coverImageUrl: profile.cover_url ?? undefined,
    bio: profile.bio?.trim() || "BARBER HUBのプロフィールです。",
    specialtyTags: profile.job_type ? [profile.job_type] : undefined,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { profile: dbProfile, error: dbProfileError } = await getAccountProfile(supabase, id);

  if (dbProfileError) {
    console.error("Public profile DB lookup failed", {
      profileId: id,
      message: dbProfileError.message,
    });
  }

  const profile = dbProfile ? dbProfileToPublicProfile(dbProfile) : findPublicProfile(id);
  let dbRecentSnaps: SnapWithAuthor[] = [];

  if (dbProfile) {
    const { snaps, error } = await listUserSnaps(supabase, id, 4);

    if (error) {
      console.error("Public profile DB snap lookup failed", {
        profileId: id,
        message: errorMessage(error),
      });
    }

    dbRecentSnaps = snaps.filter((snap) => snap.is_published !== false);
  }

  if (profile == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-blush">PROFILE</p>
          <h1 className="mt-2 text-2xl font-black text-ink">プロフィールが見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            指定されたプロフィールは、まだ登録されていない可能性があります。
          </p>
          <Link href="/" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
            ホームへ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  const recentPosts = dbProfile
    ? []
    : posts
        .filter((post) => profile.recentPostIds?.includes(post.id) || post.profileId === profile.id)
        .slice(0, 4);
  const recentArticles = articles
    .filter((article) => profile.recentArticleIds?.includes(article.id) || article.profileId === profile.id)
    .slice(0, 4);
  const links = Object.entries(profile.links ?? {}) as [ProfileLinkKey, string][];
  const isHiringSalon = profile.type === "salon" && profile.isHiring && profile.jobId;
  const followCounts = await getFollowCounts(supabase, profile.id);

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-[10px] border border-line bg-white shadow-[0_10px_28px_rgba(17,17,17,0.045)]">
          <MagazineImage src={profile.coverImageUrl} alt={profile.displayName} variant={profileImageVariant(profile.type)} className="aspect-[16/7]" />
          <div className="px-4 pb-4">
            <div className="-mt-8 flex items-end justify-between gap-3">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border-4 border-white bg-ink text-lg font-black text-white shadow-sm">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : profileInitial(profile.displayName)}
              </div>
              {isHiringSalon ? (
                <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-blush/20 bg-blushSoft px-2.5 py-1 text-[0.66rem] font-black text-blush">
                  <BriefcaseBusiness aria-hidden="true" size={13} />
                  求人中
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-line bg-neutral-50 px-2.5 py-1 text-[0.66rem] font-semibold text-ink/78">
                {typeLabels[profile.type]}
              </span>
              {profile.badges.map((badge) => (
                <span key={badge} className="rounded-full border border-line bg-white px-2.5 py-1 text-[0.66rem] font-semibold text-ink/78">
                  {badge}
                </span>
              ))}
              {profile.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[0.66rem] font-semibold text-mute">
                  <BadgeCheck aria-hidden="true" size={13} className="text-blush" />
                  認証済み
                </span>
              ) : null}
              {profile.pr ? (
                <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[0.66rem] font-semibold text-mute">PR</span>
              ) : null}
            </div>

            <h1 className="mt-3 text-[1.55rem] font-black leading-tight text-ink">{profile.displayName}</h1>
            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-mute">
              <MapPin aria-hidden="true" size={14} />
              {profile.area}
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs font-bold text-mute">
              <span>
                <span className="font-black text-ink">{followCounts.followers.toLocaleString()}</span> フォロワー
              </span>
              <span>
                <span className="font-black text-ink">{followCounts.following.toLocaleString()}</span> フォロー中
              </span>
            </div>
            <p className="mt-3 text-[0.9rem] font-medium leading-relaxed text-ink">{profile.bio}</p>

            {profile.specialtyTags && profile.specialtyTags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.specialtyTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-neutral-50 px-2.5 py-1 text-[0.66rem] font-bold text-ink/70">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-3 gap-2">
              <FollowButton profileId={profile.id} />
              <button type="button" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white px-2 text-xs font-black text-ink">
                <Bookmark aria-hidden="true" size={15} />
                保存
              </button>
              <button type="button" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white px-2 text-xs font-black text-ink">
                <NotebookPen aria-hidden="true" size={15} />
                メモ
              </button>
            </div>
          </div>
        </div>
      </section>

      {isHiringSalon ? (
        <section className="px-4 pt-5">
          <div className="rounded-[10px] border border-blush/20 bg-white p-4 shadow-[0_10px_24px_rgba(17,17,17,0.04)]">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-blush">HIRING</p>
            <h2 className="mt-1 text-lg font-black text-ink">このサロンは見学・応募を受付中</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
              投稿やSnapでお店の雰囲気を見て、気になったら見学へ。
            </p>
            <div className="mt-3 grid gap-2">
              <Link href={`/jobs/${profile.jobId}`} className="inline-flex h-11 items-center justify-center rounded-[8px] bg-ink px-3 text-sm font-black text-white">
                このサロンの求人を見る
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/jobs/${profile.jobId}/apply?type=tour`} className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">
                  見学を申し込む
                </Link>
                <Link href={`/jobs/${profile.jobId}/apply?type=interview`} className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">
                  面接を申し込む
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {links.length > 0 ? (
        <section className="px-4 pt-6">
          <h2 className="text-sm font-black text-ink">リンク</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {links.map(([key, href]) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-ink shadow-[0_6px_18px_rgba(17,17,17,0.025)]"
              >
                {linkLabels[key]}
                <ExternalLink aria-hidden="true" size={12} className="text-mute" />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="px-4 pt-6">
        <Link href="/salon-transition" className="flex items-center gap-3 rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
            <Building2 aria-hidden="true" size={19} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-ink">開業・承継の情報を見る</span>
            <span className="mt-0.5 block text-xs font-bold leading-relaxed text-mute">居抜き、事業承継、備品譲渡、独立準備を情報掲載として確認できます。</span>
          </span>
        </Link>
      </section>

      {profile.detailRows && profile.detailRows.length > 0 ? (
        <section className="px-4 pt-6">
          <h2 className="text-sm font-black text-ink">基本情報</h2>
          <div className="mt-3 divide-y divide-line rounded-[8px] border border-line bg-white">
            {profile.detailRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[5rem_1fr] gap-3 px-3 py-3 text-sm">
                <span className="font-bold text-mute">{row.label}</span>
                <span className="font-semibold text-ink">{row.value}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {profile.type === "salon" ? (
        <section className="px-4 pt-7">
          <div className="rounded-[10px] border border-line bg-white p-4">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-blush">SALON MOOD</p>
            <h2 className="mt-1 text-base font-black text-ink">このサロンの雰囲気</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
              求人票だけでなく、Snapや記事から店の空気感、技術の方向性、オーナーの考え方を確認できます。
            </p>
            <MagazineImage src={profile.coverImageUrl} alt={`${profile.displayName}の雰囲気`} variant="news" className="mt-3 aspect-[16/8]" />
          </div>
        </section>
      ) : null}

      <section className="px-4 pt-7">
        <div className="flex items-end justify-between">
          <h2 className="text-base font-black text-ink">最近のSnap</h2>
          <Link href="/snap" className="text-xs font-semibold text-blush">
            Snapを見る
          </Link>
        </div>
        <div className="mt-3 grid gap-2.5">
          {dbRecentSnaps.length > 0 ? (
            dbRecentSnaps.map((snap) => (
              <Link key={snap.id} href={`/posts/${snap.id}`} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <p className="text-[0.66rem] font-black text-blush">{snap.category ?? "日常"}</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-ink">{snap.caption ?? "本文なしのSnapです。"}</p>
                <p className="mt-1 text-xs font-bold text-mute">{snapDateLabel(snap)}</p>
              </Link>
            ))
          ) : recentPosts.length > 0 ? (
            recentPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <p className="text-[0.66rem] font-black text-blush">{post.category}</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-ink">{post.body}</p>
              </Link>
            ))
          ) : (
            <p className="rounded-[8px] border border-line bg-white p-4 text-sm font-medium text-mute">まだSnapはありません。</p>
          )}
        </div>
      </section>

      <section className="px-4 pt-7">
        <h2 className="text-base font-black text-ink">最近の記事</h2>
        <div className="mt-3 grid gap-2.5">
          {recentArticles.length > 0 ? (
            recentArticles.map((article) => (
              <Link key={article.id} href={`/articles/${article.id}`} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <p className="text-[0.66rem] font-black text-blush">{article.category}</p>
                <p className="mt-1 text-sm font-black leading-snug text-ink">{article.title}</p>
              </Link>
            ))
          ) : (
            <p className="rounded-[8px] border border-line bg-white p-4 text-sm font-medium text-mute">まだ記事はありません。</p>
          )}
        </div>
      </section>

      <section className="px-4 pt-7">
        <h2 className="text-base font-black text-ink">予定・イベント</h2>
        <div className="mt-3 grid gap-2.5">
          {(profile.eventItems ?? []).length > 0 ? (
            profile.eventItems?.map((event) => (
              <Link key={event.title} href={event.href} className="flex items-start gap-3 rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-50 text-blush">
                  <CalendarDays aria-hidden="true" size={17} />
                </span>
                <span>
                  <span className="block text-sm font-black text-ink">{event.title}</span>
                  <span className="mt-0.5 block text-xs font-bold text-mute">{event.meta}</span>
                </span>
              </Link>
            ))
          ) : (
            <p className="rounded-[8px] border border-line bg-white p-4 text-sm font-medium text-mute">予定・イベントは準備中です。</p>
          )}
        </div>
      </section>

      {profile.type !== "individual" && profile.type !== "salon" ? (
        <section className="px-4 pt-7">
          <div className="rounded-[10px] border border-line bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              {profile.type === "maker" || profile.type === "manufacturer" || profile.type === "dealer" || profile.type === "regional-dealer" || profile.type === "online-store" ? <Building2 aria-hidden="true" size={17} /> : <MessageSquareText aria-hidden="true" size={17} />}
              {typeLabels[profile.type]}プロフィール
            </div>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
              学校、メーカー、ディーラー、オンライン購入先、組合の情報は、イベント・商品・講習会・支援情報として整理して表示します。
            </p>
          </div>
        </section>
      ) : null}
    </PageChrome>
  );
}
