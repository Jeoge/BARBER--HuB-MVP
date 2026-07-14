import { Flag, MapPin } from "lucide-react";
import Link from "next/link";
import { BackRoomThreadDetail } from "@/components/BackRoomThreadDetail";
import { FollowButton } from "@/components/FollowButton";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { ProfileMiniLink } from "@/components/ProfileMiniLink";
import { ReactionBar } from "@/components/ReactionBar";
import { SnapCommentButton } from "@/components/SnapCommentButton";
import { SnapSaveButton } from "@/components/SnapSaveButton";
import { SnapLikeButton, SnapThanksButton } from "@/components/SnapThanksButton";
import { VisualTile } from "@/components/VisualTile";
import { pathWithParams } from "@/lib/auth/redirects";
import { findBackyardPost, findPost, posts } from "@/lib/mockData";
import { createClient } from "@/lib/supabase/server";
import { getPublishedSnapById, snapAuthorMeta, snapAuthorName, snapDateLabel } from "@/lib/supabase/snaps";
import { getPrimaryTopicSlug, getTopicBundle } from "@/lib/topics";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = findPost(id);
  const backyardPost = findBackyardPost(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { snap: dbSnap } = post == null && backyardPost == null ? await getPublishedSnapById(supabase, id, user?.id) : { snap: null };

  if (post == null && backyardPost == null && dbSnap == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">投稿が見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            指定されたスナップ、またはBack Room投稿はまだ登録されていません。
          </p>
          <Link href="/snap" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            SNAPへ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  if (dbSnap != null) {
    const authorName = snapAuthorName(dbSnap);
    const authorMeta = snapAuthorMeta(dbSnap);
    const caption = dbSnap.caption ?? "";
    const isOwnSnap = user?.id === dbSnap.author_id;
    const authorHref = `/profiles/${dbSnap.author_id}`;

    return (
      <PageChrome>
        <article className="px-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={authorHref} className="inline-flex min-w-0 items-center gap-2 rounded-full pr-1">
                  <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[0.68rem] font-black text-white">
                    {dbSnap.profiles?.avatar_url ? <img src={dbSnap.profiles.avatar_url} alt="" className="h-full w-full object-cover" /> : authorName.slice(0, 1)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold leading-tight text-ink">{authorName}</span>
                    {authorMeta ? <span className="mt-0.5 block truncate text-[0.62rem] font-semibold text-mute">{authorMeta}</span> : null}
                  </span>
                </Link>
                <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.64rem] font-black text-blush">
                  {dbSnap.category ?? "日常"}
                </span>
                {isOwnSnap ? null : <FollowButton authorId={dbSnap.author_id} variant="snapInline" />}
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs font-bold text-mute">
                <MapPin aria-hidden="true" size={14} />
                {dbSnap.region || dbSnap.profiles?.region || "地域未設定"} / {snapDateLabel(dbSnap)}
              </p>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-[0.94rem] font-medium leading-relaxed text-ink">{caption}</p>

          {dbSnap.image_url ? (
            <MagazineImage src={dbSnap.image_url} alt={caption} variant="news" className="mt-4 aspect-[4/5]" imageClassName="object-[center_38%]" />
          ) : (
            <div className="mt-4 rounded-[8px] border border-line bg-neutral-50 p-4">
              <p className="text-xs font-black text-blush">TEXT SNAP</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-ink">画像なしのSnapです。</p>
            </div>
          )}

          <SnapThanksButton
            snapId={dbSnap.id}
            authorId={dbSnap.author_id}
            currentUserId={user?.id}
            initialCount={dbSnap.thanks_count}
            initiallyThanked={dbSnap.viewer_has_thanked}
            showCount={false}
            nextPath={`/posts/${dbSnap.id}`}
            actions={
              <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5">
                <SnapLikeButton
                  snapId={dbSnap.id}
                  authorId={dbSnap.author_id}
                  currentUserId={user?.id}
                  initialCount={dbSnap.like_count}
                  initiallyThanked={dbSnap.viewer_has_liked}
                  showCount={false}
                  nextPath={`/posts/${dbSnap.id}`}
                />
                <SnapCommentButton snapId={dbSnap.id} currentUserId={user?.id} showCount initialCount={dbSnap.comment_count} />
                <SnapSaveButton snapId={dbSnap.id} currentUserId={user?.id} nextPath={`/posts/${dbSnap.id}`} />
              </div>
            }
          />

          <Link
            href={pathWithParams("/contact", { topic: "report", targetUrl: `/posts/${dbSnap.id}` })}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-mute transition active:scale-[0.98] active:opacity-70"
          >
            <Flag aria-hidden="true" size={14} />
            通報
          </Link>
        </article>
      </PageChrome>
    );
  }

  const isBackyard = backyardPost != null;
  const topicSlug = getPrimaryTopicSlug(post ?? backyardPost ?? {});
  const topicBundle = topicSlug == null ? undefined : getTopicBundle(topicSlug);
  const author = post?.authorLabel ?? backyardPost?.anonymousName ?? "";
  const area = post?.area ?? backyardPost?.attribute ?? "";
  const category = post?.category ?? backyardPost?.category ?? "";
  const body = post?.body ?? backyardPost?.body ?? "";
  const accents = post?.accents ?? ["news", "student", "tool"];
  const imageUrl = post?.imageUrl;
  const source = post?.source ?? "Back Room投稿";

  if (backyardPost != null) {
    return (
      <PageChrome>
        <BackRoomThreadDetail thread={backyardPost} />
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <article className="px-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {post ? (
                <ProfileMiniLink profileId={post.profileId} fallbackName={author} />
              ) : (
                <h1 className="text-lg font-black text-ink">{author}</h1>
              )}
              <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.64rem] font-black text-blush">
                {category}
              </span>
              {post?.profileId ? <FollowButton authorId={post.profileId} variant="snapInline" /> : null}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-mute">
              <MapPin aria-hidden="true" size={14} />
              {area} / {source}
            </p>
          </div>
        </div>

        {isBackyard ? (
          <div className="mt-4 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-[0.78rem] font-black text-ink">
            Back Room投稿です。匿名投稿を勝手に表側へ転載しません。
          </div>
        ) : null}

        <p className="mt-4 text-[0.94rem] font-medium leading-relaxed text-ink">{body}</p>

        {isBackyard ? (
          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {accents.map((accent, index) => (
              <VisualTile key={`${id}-${accent}-${index}`} variant={accent} className="aspect-square" />
            ))}
          </div>
        ) : (
          <MagazineImage src={imageUrl} alt={body} variant={accents[0]} className="mt-4 aspect-[4/5]" imageClassName="object-[center_38%]" />
        )}

        <ReactionBar
          contentId={isBackyard ? `backroom:${id}` : `post:${id}`}
          commentTitle={isBackyard ? "Back Roomコメント" : "スナップへのコメント"}
          className="mt-4"
          goodIconOnly={!isBackyard}
        />

        <Link
          href={pathWithParams("/contact", { topic: "report", targetUrl: `/posts/${id}` })}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-mute transition active:scale-[0.98] active:opacity-70"
        >
          <Flag aria-hidden="true" size={14} />
          通報
        </Link>
      </article>

      {topicBundle == null ? null : (
        <section className="px-4 pt-7">
          <h2 className="text-base font-black text-ink">この話題に近い投稿</h2>
          <div className="mt-3 grid gap-2">
            {(topicBundle.snaps.length > 0 ? topicBundle.snaps : posts)
              .filter((item) => item.id !== id)
              .slice(0, 2)
              .map((item) => (
                <Link key={item.id} href={`/posts/${item.id}`} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                  <p className="text-[0.68rem] font-black text-blush">{item.category}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-medium leading-relaxed text-ink">{item.body}</p>
                </Link>
              ))}
          </div>
        </section>
      )}

      {topicBundle == null ? null : (
        <section className="px-4 pt-5">
          <h2 className="text-base font-black text-ink">関連する記事</h2>
          <div className="mt-3 grid gap-2">
            {topicBundle.articles.slice(0, 2).map((article) => (
              <Link key={article.id} href={`/articles/${article.id}`} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
                <p className="text-[0.68rem] font-black text-blush">{article.category}</p>
                <p className="mt-1 text-sm font-black leading-snug text-ink">{article.title}</p>
              </Link>
            ))}
            {post ? (
              <Link href="/post/backroom" className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
                <p className="text-[0.68rem] font-black text-blush">Back Room</p>
                <p className="mt-1 text-sm font-black leading-snug text-ink">この話題をBack Roomで話す</p>
              </Link>
            ) : null}
          </div>
        </section>
      )}
    </PageChrome>
  );
}
