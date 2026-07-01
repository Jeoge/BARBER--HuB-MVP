import { Flag, MapPin, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { CommentPanel } from "@/components/CommentPanel";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { ReactionBar } from "@/components/ReactionBar";
import { VisualTile } from "@/components/VisualTile";
import { findBackyardPost, findPost } from "@/lib/mockData";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = findPost(id);
  const backyardPost = findBackyardPost(id);

  if (post == null && backyardPost == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">投稿が見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            指定されたスナップ、またはBackyard投稿はまだ登録されていません。
          </p>
          <Link href="/snap" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            SNAPへ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  const isBackyard = backyardPost != null;
  const author = post?.authorLabel ?? backyardPost?.anonymousName ?? "";
  const area = post?.area ?? backyardPost?.attribute ?? "";
  const category = post?.category ?? backyardPost?.category ?? "";
  const body = post?.body ?? backyardPost?.body ?? "";
  const accents = post?.accents ?? ["news", "student", "tool"];
  const imageUrl = post?.imageUrl;
  const source = post?.source ?? "Backyard匿名投稿";

  return (
    <PageChrome>
      <article className="px-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-black text-ink">{author}</h1>
              <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.64rem] font-black text-blush">
                {category}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-mute">
              <MapPin aria-hidden="true" size={14} />
              {area} / {source}
            </p>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-neutral-50 text-ink" aria-label="投稿メニュー">
            <MoreHorizontal aria-hidden="true" size={19} />
          </button>
        </div>

        {isBackyard ? (
          <div className="mt-4 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-[0.78rem] font-black text-ink">
            Backyard投稿です。個別投稿を勝手に表側へ転載しません。
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
          <MagazineImage src={imageUrl} alt={body} variant={accents[0]} className="mt-4 aspect-[16/9]" />
        )}

        <ReactionBar commentHref="#comments" className="mt-4" />

        <button className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-mute">
          <Flag aria-hidden="true" size={14} />
          通報
        </button>
      </article>

      <CommentPanel title={isBackyard ? "Backyardコメント" : "スナップへのコメント"} placeholder="経験や気づきをコメントする" />
    </PageChrome>
  );
}
