import { BadgeCheck, BriefcaseBusiness, Building2, FilePenLine, LogOut, MapPin, Megaphone, Pencil, Send, Sparkles, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { logoutAction } from "@/app/auth/actions";
import { deleteMySnapAction } from "@/app/mypage/actions";
import { closeJobPostAction } from "@/app/post/job/actions";
import { closeSuccessionPostAction } from "@/app/post/succession/actions";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { SnapImageCarousel } from "@/components/SnapImageCarousel";
import { canCreateJob, canCreateSuccession, classifyAccountType, getAccountTypeLabel } from "@/lib/accountTypes";
import { pathWithParams } from "@/lib/auth/redirects";
import {
  articleDateLabel,
  articleExcerpt,
  listMyArticleReactionCounts,
  listSavedArticles,
  listUserArticles,
  type ArticleWithAuthor,
} from "@/lib/supabase/articles";
import {
  backroomDateLabel,
  backroomExcerpt,
  listUserBackroomPosts,
  normalizeBackroomCategory,
  type BackroomPostWithAuthor,
} from "@/lib/supabase/backroom";
import { listFollowingProfiles } from "@/lib/supabase/follows";
import { listOwnedVerifiedBarberShops, shopAreaLabel, type BarberShop } from "@/lib/supabase/barber-shops";
import { jobAreaLabel, jobStatusLabel, listUserJobPosts, type JobPost } from "@/lib/supabase/jobs";
import { getAccountProfile } from "@/lib/supabase/profiles";
import {
  listUserQaAnswers,
  listUserQaQuestions,
  qaDateLabel,
  qaExcerpt,
  type QaAnswerWithQuestion,
  type QaQuestionWithAuthor,
} from "@/lib/supabase/qa";
import { listSavedSnaps } from "@/lib/supabase/saved";
import { createClient } from "@/lib/supabase/server";
import { listMySnapReactionCounts, listUserSnaps, snapDateLabel, snapDisplayImages, type SnapWithAuthor } from "@/lib/supabase/snaps";
import {
  listUserSuccessionPosts,
  successionAreaLabel,
  successionStatusLabel,
  type SuccessionPublicPost,
} from "@/lib/supabase/succession";

type JobApplication = { id: string; salonName: string; type: string; status: string };

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
      <span className="break-words font-semibold text-ink">{textOrUnset(value)}</span>
    </div>
  );
}

function SectionCard({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <section className="px-4 pt-5">
      <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
        {eyebrow ? <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">{eyebrow}</p> : null}
        <h2 className="mt-1 text-base font-black text-ink">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}

type MyPageProps = {
  searchParams?: Promise<{ profile?: string; snap?: string; snapError?: string; job?: string; jobError?: string; succession?: string; successionError?: string; store?: string; storeError?: string }>;
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
      {snaps.map((snap) => {
        const images = snapDisplayImages(snap);

        return (
          <article key={snap.id} className="rounded-[8px] border border-line bg-neutral-50 p-3">
            <div className="flex gap-3">
              {images.length > 0 ? (
                <div className="h-20 w-16 shrink-0">
                  <SnapImageCarousel
                    images={images}
                    alt={snap.caption ?? "Snap"}
                    href={`/posts/${snap.id}`}
                    variant="news"
                    className="h-full w-full"
                    compactIndicators
                  />
                </div>
              ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-blush">{snap.category ?? "日常"}</span>
                <span className="text-[0.66rem] font-bold text-mute">{snapDateLabel(snap)}</span>
              </div>
              <Link href={`/posts/${snap.id}`} className="mt-1 block">
                <p className="line-clamp-2 break-words text-sm font-semibold leading-relaxed text-ink">{snap.caption}</p>
              </Link>
              <p className="mt-1 text-[0.68rem] font-bold text-mute">
                Thanks {snap.thanks_count} / いいね {snap.like_count} / コメント {snap.comment_count}
              </p>
            </div>
          </div>
          <form action={deleteMySnapAction} className="mt-2">
            <input type="hidden" name="snapId" value={snap.id} />
            <button type="submit" className="inline-flex h-9 w-full items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-mute">
              このSnapを削除
            </button>
          </form>
        </article>
        );
      })}
    </div>
  );
}

function MyArticleList({ articles }: { articles: ArticleWithAuthor[] }) {
  if (articles.length === 0) {
    return (
      <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
        <p className="text-sm font-black text-ink">まだ自分の記事はありません</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-mute">経験記事を投稿すると、ここに表示されます。</p>
        <Link href="/post/article" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
          記事を書く
        </Link>
      </div>
    );
  }

  return (
    <div className="grid max-h-[17.5rem] gap-2.5 overflow-y-auto overscroll-contain pr-1">
      {articles.map((article) => (
        <Link key={article.id} href={`/articles/${article.id}`} className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-blush">{article.category ?? "経験記事"}</span>
            <span className="text-[0.66rem] font-bold text-mute">{articleDateLabel(article)}</span>
          </div>
          <p className="mt-1 line-clamp-1 text-sm font-black text-ink">{article.title}</p>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{articleExcerpt(article.body, 78)}</p>
        </Link>
      ))}
    </div>
  );
}

function MyBackroomList({ posts }: { posts: BackroomPostWithAuthor[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
        <p className="text-sm font-black text-ink">まだ自分のBack Roomスレッドはありません</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-mute">営業後トークや相談のスレッドを立てると、ここに表示されます。</p>
        <Link href="/post/backroom" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
          スレッドを立てる
        </Link>
      </div>
    );
  }

  return (
    <div className="grid max-h-[17.5rem] gap-2.5 overflow-y-auto overscroll-contain pr-1">
      {posts.map((post) => (
        <Link key={post.id} href={`/backroom/${post.id}`} className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-blush">{normalizeBackroomCategory(post.category)}</span>
            <span className="text-[0.66rem] font-bold text-mute">{backroomDateLabel(post)}</span>
            <span className="text-[0.66rem] font-bold text-mute">コメント {post.comment_count}</span>
          </div>
          <p className="mt-1 line-clamp-1 text-sm font-black text-ink">{post.title}</p>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{backroomExcerpt(post.body, 78)}</p>
        </Link>
      ))}
    </div>
  );
}

function MyQaQuestionList({ questions }: { questions: QaQuestionWithAuthor[] }) {
  if (questions.length === 0) {
    return (
      <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
        <p className="text-sm font-black text-ink">まだ自分のQ&A質問はありません</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-mute">困りごとを相談すると、ここに表示されます。</p>
        <Link href="/post/qa" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
          Q&Aで相談する
        </Link>
      </div>
    );
  }

  return (
    <div className="grid max-h-[17.5rem] gap-2.5 overflow-y-auto overscroll-contain pr-1">
      {questions.map((question) => (
        <Link key={question.id} href={`/qa/${question.id}`} className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-blush">{question.category}</span>
            <span className="text-[0.66rem] font-bold text-mute">{qaDateLabel(question)}</span>
            <span className="text-[0.66rem] font-bold text-mute">回答 {question.answer_count}</span>
          </div>
          <p className="mt-1 line-clamp-1 text-sm font-black text-ink">{question.title}</p>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{qaExcerpt(question.body, 78)}</p>
        </Link>
      ))}
    </div>
  );
}

function MyQaAnswerList({ answers }: { answers: QaAnswerWithQuestion[] }) {
  if (answers.length === 0) {
    return (
      <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
        まだ自分のQ&A回答はありません。
      </div>
    );
  }

  return (
    <div className="grid max-h-[17.5rem] gap-2.5 overflow-y-auto overscroll-contain pr-1">
      {answers.map((answer) => (
        <Link key={answer.id} href={`/qa/${answer.question_id}`} className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-blush">{answer.qa_questions?.category ?? "Q&A"}</span>
            <span className="text-[0.66rem] font-bold text-mute">{qaDateLabel({ created_at: answer.created_at })}</span>
          </div>
          <p className="mt-1 line-clamp-1 text-sm font-black text-ink">{answer.qa_questions?.title ?? "質問"}</p>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{qaExcerpt(answer.body, 78)}</p>
        </Link>
      ))}
    </div>
  );
}

function SavedArticleList({ articles }: { articles: ArticleWithAuthor[] }) {
  if (articles.length === 0) {
    return (
      <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
        保存済みの記事はまだありません。
      </div>
    );
  }

  return (
    <div className="grid max-h-[14.25rem] gap-2 overflow-y-auto overscroll-contain pr-1">
      {articles.map((article) => (
        <Link key={article.id} href={`/articles/${article.id}`} className="block rounded-[8px] bg-neutral-50 p-3">
          <p className="line-clamp-1 text-sm font-black text-ink">{article.title}</p>
          <p className="mt-1 text-xs font-semibold text-mute">{article.category ?? "記事"} / {articleDateLabel(article)}</p>
        </Link>
      ))}
    </div>
  );
}

function OwnerReactionSummaries({ articles, snaps }: { articles: ArticleWithAuthor[]; snaps: SnapWithAuthor[] }) {
  const summaries = [
    ...articles.map((article) => ({
      id: article.id,
      href: `/articles/${article.id}`,
      title: article.title,
      likes: article.like_count,
      thanks: article.thanks_count,
      saves: article.save_count,
      comments: article.comment_count,
    })),
    ...snaps.map((snap) => ({
      id: snap.id,
      href: `/posts/${snap.id}`,
      title: snap.caption || "Snap",
      likes: snap.like_count,
      thanks: snap.thanks_count,
      saves: 0,
      comments: snap.comment_count,
    })),
  ];

  if (summaries.length === 0) {
    return (
      <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
        投稿すると、受け取った反応数がここに表示されます。
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {summaries.map((summary) => (
        <Link key={summary.id} href={summary.href} className="rounded-[8px] bg-neutral-50 p-3">
          <p className="line-clamp-1 text-sm font-black text-ink">{summary.title}</p>
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
        </Link>
      ))}
    </div>
  );
}

function MyJobPostList({ jobs, canCreate }: { jobs: JobPost[]; canCreate: boolean }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
        <p className="text-sm font-black text-ink">まだ掲載中の求人はありません</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-mute">求人を掲載すると、ここに表示されます。</p>
        {canCreate ? (
          <Link href="/post/job" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
            新しく求人を掲載する
          </Link>
        ) : (
          <Link href="/mypage/profile/edit" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
            登録区分を確認する
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      {canCreate ? (
        <Link href="/post/job" className="inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
          新しく求人を掲載する
        </Link>
      ) : null}
      {jobs.map((job) => (
        <article key={job.id} className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-blush">{jobStatusLabel(job.status)}</span>
                <span className="text-[0.66rem] font-bold text-mute">{jobAreaLabel(job)}</span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm font-black text-ink">{job.salon_name}</p>
              <p className="mt-1 line-clamp-1 text-xs font-semibold text-mute">{job.job_title}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {job.status === "published" ? (
              <Link href={`/jobs/${job.id}`} className="inline-flex h-9 items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-ink">
                表示
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-mute">
                非公開
              </span>
            )}
            <Link href={`/mypage/jobs/${job.id}/edit`} className="inline-flex h-9 items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-ink">
              編集する
            </Link>
            {job.status === "closed" ? (
              <span className="inline-flex h-9 items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-mute">
                停止中
              </span>
            ) : (
              <form action={closeJobPostAction}>
                <input type="hidden" name="jobId" value={job.id} />
                <button type="submit" className="inline-flex h-9 w-full items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-mute">
                  掲載停止
                </button>
              </form>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function MyVerifiedStoreList({ shops }: { shops: BarberShop[] }) {
  if (shops.length === 0) {
    return (
      <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
        認証済み店舗はまだありません。店舗検索からオーナー認証を申請できます。
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      {shops.map((shop) => (
        <article key={shop.id} className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-blush">
              <BadgeCheck aria-hidden="true" size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-blush">認証済み</span>
                <span className="inline-flex items-center gap-1 text-[0.66rem] font-bold text-mute">
                  <MapPin aria-hidden="true" size={12} />
                  {shopAreaLabel(shop)}
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm font-black text-ink">{shop.name}</p>
              <p className="mt-1 line-clamp-1 text-xs font-semibold text-mute">{shop.address}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href={`/stores/${shop.id}`} className="inline-flex h-9 items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-ink">
              表示
            </Link>
            <Link href={`/mypage/stores/${shop.id}/edit`} className="inline-flex h-9 items-center justify-center gap-1 rounded-[8px] border border-line bg-white text-xs font-black text-ink">
              <Pencil aria-hidden="true" size={13} />
              編集
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function MySuccessionPostList({ posts, canCreate }: { posts: SuccessionPublicPost[]; canCreate: boolean }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
        <p className="text-sm font-black text-ink">まだ開業・承継情報の掲載はありません</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-mute">掲載すると、ここに公開中・下書き・停止中の状態で表示されます。</p>
        {canCreate ? (
          <Link href="/post/succession" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
            新しく掲載する
          </Link>
        ) : (
          <Link href="/mypage/profile/edit" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
            登録区分を確認する
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      {canCreate ? (
        <Link href="/post/succession" className="inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
          新しく掲載する
        </Link>
      ) : null}
      {posts.map((post) => (
        <article key={post.id} className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-blush">
              <Building2 aria-hidden="true" size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-blush">{successionStatusLabel(post.status)}</span>
                <span className="text-[0.66rem] font-bold text-mute">{successionAreaLabel(post)}</span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm font-black text-ink">{post.title}</p>
              <p className="mt-1 line-clamp-1 text-xs font-semibold text-mute">{post.listing_type}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {post.status === "published" ? (
              <Link href={`/succession/${post.id}`} className="inline-flex h-9 items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-ink">
                表示
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-mute">
                非公開
              </span>
            )}
            <Link href={`/mypage/succession/${post.id}/edit`} className="inline-flex h-9 items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-ink">
              編集する
            </Link>
            {post.status === "closed" ? (
              <span className="inline-flex h-9 items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-mute">
                停止中
              </span>
            ) : (
              <form action={closeSuccessionPostAction}>
                <input type="hidden" name="postId" value={post.id} />
                <button type="submit" className="inline-flex h-9 w-full items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-mute">
                  掲載停止
                </button>
              </form>
            )}
          </div>
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
  const { articles: myArticles, error: myArticlesError } = await listUserArticles(supabase, user.id, 30, user.id);
  const { posts: myBackroomPosts, error: myBackroomPostsError } = await listUserBackroomPosts(supabase, user.id, 30);
  const { questions: myQaQuestions, error: myQaQuestionsError } = await listUserQaQuestions(supabase, user.id, 30);
  const { answers: myQaAnswers, error: myQaAnswersError } = await listUserQaAnswers(supabase, user.id, 30);
  const { articles: savedArticles, error: savedArticlesError } = await listSavedArticles(supabase, user.id, 30, user.id);
  const followedProfiles = await listFollowingProfiles(supabase, user.id);
  const savedSnapList = await listSavedSnaps(supabase, user.id);
  const [snapReactionCounts, articleReactionCounts] = await Promise.all([
    listMySnapReactionCounts(supabase),
    listMyArticleReactionCounts(supabase),
  ]);
  const profileDisplayName = profile?.display_name?.trim() || profile?.salon_name?.trim() || "プロフィール未設定";
  const loginEmail = user.email ?? "メールアドレス未取得";
  const hasProfile = profile != null;
  const accountClassification = classifyAccountType(profile);
  const canUseNormalPosting = accountClassification === "personal";
  const canUseJobPosting = canCreateJob(profile);
  const canUseSuccessionPosting = canCreateSuccession(profile);
  const showSalonAdmin = Boolean(canUseJobPosting || profile?.salon_name?.trim() || profile?.job_type?.includes("サロン"));
  const { jobs: salonJobPostings, error: salonJobPostingsError } = showSalonAdmin
    ? await listUserJobPosts(supabase, user.id, 30)
    : { jobs: [], error: null };
  const { posts: mySuccessionPosts, error: mySuccessionPostsError } = await listUserSuccessionPosts(supabase, user.id, 30);
  const { shops: verifiedBarberShops, error: verifiedBarberShopsError } = await listOwnedVerifiedBarberShops(supabase, user.id, 20);

  const snapCountsById = new Map(snapReactionCounts.map((counts) => [counts.snap_id, counts]));
  const articleCountsById = new Map(articleReactionCounts.map((counts) => [counts.article_id, counts]));
  const mySnapsWithCounts = mySnaps.map((snap) => {
    const counts = snapCountsById.get(snap.id);
    return {
      ...snap,
      thanks_count: Number(counts?.thanks_count ?? 0),
      like_count: Number(counts?.like_count ?? 0),
      comment_count: Number(counts?.comment_count ?? 0),
    };
  });
  const myArticlesWithCounts = myArticles.map((article) => {
    const counts = articleCountsById.get(article.id);
    return {
      ...article,
      thanks_count: Number(counts?.thanks_count ?? 0),
      like_count: Number(counts?.like_count ?? 0),
      save_count: Number(counts?.save_count ?? 0),
      comment_count: Number(counts?.comment_count ?? 0),
    };
  });

  const snapThanksPoints = mySnapsWithCounts.reduce((sum, snap) => sum + snap.thanks_count, 0);
  const articleThanksPoints = myArticlesWithCounts.reduce((sum, article) => sum + article.thanks_count, 0);
  const likesReceived =
    mySnapsWithCounts.reduce((sum, snap) => sum + snap.like_count, 0) +
    myArticlesWithCounts.reduce((sum, article) => sum + article.like_count, 0);
  const thanksPoints = snapThanksPoints + articleThanksPoints;
  const nextRewardAt = (Math.floor(thanksPoints / 100) + 1) * 100;
  const pointsToNext = nextRewardAt - thanksPoints;
  const commentsReceived =
    mySnapsWithCounts.reduce((sum, snap) => sum + snap.comment_count, 0) +
    myArticlesWithCounts.reduce((sum, article) => sum + article.comment_count, 0);
  const jobApplications: JobApplication[] = [];

  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="PRIVATE DASHBOARD"
        title="マイページ"
        body="自分の投稿、保存、フォロー中、Thanksポイント、自分の投稿への反応を確認する本人専用の管理画面です。"
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
          {params?.job === "closed" ? (
            <p className="mt-3 rounded-[8px] border border-white/15 bg-white/10 px-3 py-2 text-[0.72rem] font-black leading-relaxed text-white">
              求人を掲載停止にしました。
            </p>
          ) : null}
          {params?.job === "updated" ? (
            <p className="mt-3 rounded-[8px] border border-white/15 bg-white/10 px-3 py-2 text-[0.72rem] font-black leading-relaxed text-white">
              求人を更新しました。
            </p>
          ) : null}
          {params?.jobError ? (
            <p className="mt-3 rounded-[8px] border border-white/15 bg-white/10 px-3 py-2 text-[0.72rem] font-black leading-relaxed text-white">
              {params.jobError}
            </p>
          ) : null}
          {params?.succession === "closed" ? (
            <p className="mt-3 rounded-[8px] border border-white/15 bg-white/10 px-3 py-2 text-[0.72rem] font-black leading-relaxed text-white">
              開業・承継情報を掲載停止にしました。
            </p>
          ) : null}
          {params?.succession === "updated" ? (
            <p className="mt-3 rounded-[8px] border border-white/15 bg-white/10 px-3 py-2 text-[0.72rem] font-black leading-relaxed text-white">
              開業・承継情報を保存しました。
            </p>
          ) : null}
          {params?.successionError ? (
            <p className="mt-3 rounded-[8px] border border-white/15 bg-white/10 px-3 py-2 text-[0.72rem] font-black leading-relaxed text-white">
              {params.successionError}
            </p>
          ) : null}
          {params?.store === "updated" ? (
            <p className="mt-3 rounded-[8px] border border-white/15 bg-white/10 px-3 py-2 text-[0.72rem] font-black leading-relaxed text-white">
              店舗情報を保存しました。
            </p>
          ) : null}
          {params?.storeError ? (
            <p className="mt-3 rounded-[8px] border border-white/15 bg-white/10 px-3 py-2 text-[0.72rem] font-black leading-relaxed text-white">
              {params.storeError}
            </p>
          ) : null}
          <div className="mt-3 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-lg font-black">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : accountInitial(profileDisplayName ?? loginEmail)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black">{profileDisplayName}</h2>
              <p className="mt-1 text-xs font-semibold text-white/60">本人だけの管理情報です。</p>
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
            {canUseNormalPosting ? (
              <>
                <Link href="/post/snap" className="inline-flex h-10 items-center justify-center gap-1 rounded-[8px] bg-white/10 text-xs font-black text-white">
                  <FilePenLine aria-hidden="true" size={14} />
                  Snap
                </Link>
                <Link href="/post/article" className="inline-flex h-10 items-center justify-center gap-1 rounded-[8px] bg-white/10 text-xs font-black text-white">
                  <Send aria-hidden="true" size={14} />
                  記事
                </Link>
              </>
            ) : accountClassification === "organization" ? (
              <>
                <Link href="/advertising" className="inline-flex h-10 items-center justify-center gap-1 rounded-[8px] bg-white/10 text-xs font-black text-white">
                  <Megaphone aria-hidden="true" size={14} />
                  PR
                </Link>
                <Link href="/advertising/apply" className="inline-flex h-10 items-center justify-center gap-1 rounded-[8px] bg-white/10 text-xs font-black text-white">
                  <Send aria-hidden="true" size={14} />
                  相談
                </Link>
              </>
            ) : (
              <>
                <Link href="/mypage/profile/edit" className="inline-flex h-10 items-center justify-center gap-1 rounded-[8px] bg-white/10 text-xs font-black text-white">
                  <FilePenLine aria-hidden="true" size={14} />
                  区分
                </Link>
                <Link href="/advertising" className="inline-flex h-10 items-center justify-center gap-1 rounded-[8px] bg-white/10 text-xs font-black text-white">
                  <Megaphone aria-hidden="true" size={14} />
                  PR
                </Link>
              </>
            )}
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
            自分の投稿が受け取ったThanks 1件＝1ptです。投稿者本人のThanksは含めません。
          </p>
        </div>
      </SectionCard>

      <SectionCard eyebrow="MY ARTICLES" title="自分の記事">
        {myArticlesError ? (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
            自分の記事を読み込めませんでした。
          </div>
        ) : (
          <MyArticleList articles={myArticlesWithCounts} />
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
          <MySnapList snaps={mySnapsWithCounts} />
        )}
      </SectionCard>

      <SectionCard eyebrow="MY BACK ROOM" title="自分のBack Roomスレッド">
        {myBackroomPostsError ? (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
            自分のBack Roomスレッドを読み込めませんでした。
          </div>
        ) : (
          <MyBackroomList posts={myBackroomPosts} />
        )}
      </SectionCard>

      <SectionCard eyebrow="MY Q&A" title="自分のQ&A">
        <div className="grid gap-4">
          <div>
            <p className="mb-2 text-xs font-black text-mute">質問</p>
            {myQaQuestionsError ? (
              <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
                自分のQ&A質問を読み込めませんでした。
              </div>
            ) : (
              <MyQaQuestionList questions={myQaQuestions} />
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-black text-mute">回答</p>
            {myQaAnswersError ? (
              <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
                自分のQ&A回答を読み込めませんでした。
              </div>
            ) : (
              <MyQaAnswerList answers={myQaAnswers} />
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard eyebrow="SAVED" title="保存したもの">
        <div className="grid gap-3">
          <div>
            <p className="mb-2 text-xs font-black text-mute">記事</p>
            {savedArticlesError ? (
              <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
                保存した記事を読み込めませんでした。
              </div>
            ) : (
              <SavedArticleList articles={savedArticles} />
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-black text-mute">Snap</p>
            {savedSnapList.length === 0 ? (
              <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
                保存したSnapはまだありません。
              </div>
              ) : (
                <div className="grid max-h-[17.5rem] gap-2.5 overflow-y-auto overscroll-contain pr-1">
                  {savedSnapList.map((snap) => (
                    <div key={snap.id} className="flex gap-3 rounded-[8px] border border-line bg-neutral-50 p-3">
                      {snap.images.length > 0 ? (
                        <div className="h-16 w-14 shrink-0">
                          <SnapImageCarousel
                            images={snap.images}
                            alt={snap.caption ?? "Snap"}
                            href={`/posts/${snap.id}`}
                            variant="news"
                            className="h-full w-full"
                            compactIndicators
                          />
                        </div>
                      ) : null}
                      <Link href={`/posts/${snap.id}`} className="min-w-0 flex-1">
                        <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-blush">{snap.category ?? "日常"}</span>
                        <p className="mt-1 line-clamp-2 break-words text-sm font-semibold leading-relaxed text-ink">
                          {snap.caption?.trim() || "本文なしのSnapです。"}
                        </p>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
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
            <ProfileRow label="登録区分" value={getAccountTypeLabel(profile)} />
            <ProfileRow label="サロン" value={profile.salon_name} />
            <ProfileRow label="地域" value={profile.region} />
            <ProfileRow label="住所" value={profile.shop_address} />
            <div className="rounded-[8px] bg-neutral-50 px-3 py-3">
              <p className="text-xs font-bold text-mute">自己紹介</p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-relaxed text-ink">{textOrUnset(profile.bio)}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
            <p className="text-sm font-black text-ink">プロフィール未設定</p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-mute">
              表示名、登録区分、サロン名、地域、自己紹介を設定すると、ここに表示されます。
            </p>
            <Link href="/mypage/profile/edit" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
              プロフィールを設定する
            </Link>
          </div>
        )}
      </SectionCard>

      {verifiedBarberShopsError || verifiedBarberShops.length > 0 ? (
        <SectionCard eyebrow="STORE DIRECTORY" title="店舗ディレクトリ管理">
          {verifiedBarberShopsError ? (
            <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
              認証済み店舗を読み込めませんでした。時間をおいて再読み込みしてください。
            </div>
          ) : (
            <MyVerifiedStoreList shops={verifiedBarberShops} />
          )}
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="MEMO" title="自分用メモ">
        <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
          メモ機能は準備中です。
        </div>
      </SectionCard>

      <SectionCard eyebrow="OWNER VIEW" title="自分の投稿への反応">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[8px] bg-neutral-50 p-3 text-center">
            <p className="text-[0.62rem] font-bold text-mute">受け取ったThanks</p>
            <p className="mt-1 text-2xl font-black text-ink">{thanksPoints}</p>
          </div>
          <div className="rounded-[8px] bg-neutral-50 p-3 text-center">
            <p className="text-[0.62rem] font-bold text-mute">いいね</p>
            <p className="mt-1 text-2xl font-black text-ink">{likesReceived}</p>
          </div>
          <div className="rounded-[8px] bg-neutral-50 p-3 text-center">
            <p className="text-[0.62rem] font-bold text-mute">コメント</p>
            <p className="mt-1 text-2xl font-black text-ink">{commentsReceived}</p>
          </div>
        </div>
        <p className="my-3 text-xs font-medium leading-relaxed text-mute">
          表示カウントから投稿者本人のリアクションは除外しています。
        </p>
        <OwnerReactionSummaries articles={myArticlesWithCounts} snaps={mySnapsWithCounts} />
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
          {salonJobPostingsError ? (
            <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
              求人を読み込めませんでした。時間をおいて再読み込みしてください。
            </div>
          ) : (
            <MyJobPostList jobs={salonJobPostings} canCreate={canUseJobPosting} />
          )}
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="SUCCESSION ADMIN" title="開業・承継掲載管理">
        {mySuccessionPostsError ? (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
            開業・承継情報を読み込めませんでした。時間をおいて再読み込みしてください。
          </div>
        ) : (
          <MySuccessionPostList posts={mySuccessionPosts} canCreate={canUseSuccessionPosting} />
        )}
      </SectionCard>

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
