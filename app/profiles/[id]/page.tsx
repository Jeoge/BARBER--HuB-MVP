import { BadgeCheck, BriefcaseBusiness, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { FollowButton } from "@/components/FollowButton";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { articles, posts } from "@/lib/mockData";
import { findPublicProfile, type ProfileLinkKey } from "@/lib/publicProfiles";

const linkLabels: Record<ProfileLinkKey, string> = {
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
  website: "公式サイト",
  map: "Googleマップ",
};

const postDisplay: Record<string, string> = {
  "fade-voice": "仕上げ前の一言で、次回予約が変わる",
  "practice-report": "フェード練習会で学んだ光の見方",
  "owner-retention": "次回予約の声かけを施術中に変えた",
  "editor-weekly": "今週の理容業界メモ",
  "price-change": "価格改定の伝え方を変えてみた",
};

const articleDisplay: Record<string, string> = {
  "rakuten-ai": "AIで楽天ビューティー閲覧数1位になった話",
  "freee-api-cost": "freee APIで月2.5万円削減した話",
  "google-review-growth": "Google口コミで新規予約を増やす方法",
  "cti-pos": "CTI導入でPOSレジを解約した話",
  "gray-blending-40s-article": "40代提案は“若返り”より“清潔感”",
  "silent-clipper": "静音バリカン新商品レビュー",
  "fukuoka-seminar": "福岡フェードセミナー要点まとめ",
};

function profileInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = findPublicProfile(id);

  if (profile == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-blush">PROFILE</p>
          <h1 className="mt-2 text-2xl font-black text-ink">プロフィールが見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            指定されたプロフィールはまだ登録されていません。
          </p>
          <Link href="/" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
            ホームへ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  const recentPosts = posts
    .filter((post) => profile.recentPostIds?.includes(post.id) || post.profileId === profile.id)
    .slice(0, 4);
  const recentArticles = articles
    .filter((article) => profile.recentArticleIds?.includes(article.id) || article.profileId === profile.id)
    .slice(0, 4);
  const links = Object.entries(profile.links ?? {}) as [ProfileLinkKey, string][];

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-[10px] border border-line bg-white shadow-[0_10px_28px_rgba(17,17,17,0.045)]">
          <MagazineImage src={profile.coverImageUrl} alt={profile.displayName} variant={profile.type === "maker" || profile.type === "dealer" ? "tool" : "news"} className="aspect-[16/7]" />
          <div className="px-4 pb-4">
            <div className="-mt-8 flex items-end justify-between gap-3">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border-4 border-white bg-ink text-lg font-black text-white shadow-sm">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  profileInitial(profile.displayName)
                )}
              </div>
              {profile.isHiring ? (
                <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-blush/20 bg-blushSoft px-2.5 py-1 text-[0.66rem] font-black text-blush">
                  <BriefcaseBusiness aria-hidden="true" size={13} />
                  求人中
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {profile.badges.map((badge) => (
                <span key={badge} className="rounded-full border border-line bg-white px-2.5 py-1 text-[0.66rem] font-semibold text-ink/78">
                  {badge}
                </span>
              ))}
              {profile.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-line bg-neutral-50 px-2.5 py-1 text-[0.66rem] font-semibold text-mute">
                  <BadgeCheck aria-hidden="true" size={13} className="text-blush" />
                  認証済み
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 text-[1.55rem] font-black leading-tight text-ink">{profile.displayName}</h1>
            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-mute">
              <MapPin aria-hidden="true" size={14} />
              {profile.area}
            </p>
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

            <div className="mt-4 grid gap-2">
              <FollowButton profileId={profile.id} />
              {profile.isHiring && profile.jobId ? (
                <Link
                  href={`/jobs/${profile.jobId}`}
                  className="inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white"
                >
                  このサロンの求人を見る
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

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

      <section className="px-4 pt-7">
        <div className="flex items-end justify-between">
          <h2 className="text-base font-black text-ink">最近のSnap</h2>
          <Link href="/snap" className="text-xs font-semibold text-blush">
            Snapを見る
          </Link>
        </div>
        <div className="mt-3 grid gap-2.5">
          {recentPosts.length > 0 ? (
            recentPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <p className="text-[0.66rem] font-black text-blush">{post.category}</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-ink">{postDisplay[post.id] ?? post.body}</p>
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
                <p className="mt-1 text-sm font-black leading-snug text-ink">{articleDisplay[article.id] ?? article.title}</p>
              </Link>
            ))
          ) : (
            <p className="rounded-[8px] border border-line bg-white p-4 text-sm font-medium text-mute">まだ記事はありません。</p>
          )}
        </div>
      </section>
    </PageChrome>
  );
}
