import { ChevronRight, Clock, MessageCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { getTopicBundle, topics, type TopicBundle } from "@/lib/topics";

export function generateStaticParams() {
  return topics.map((topic) => ({ slug: topic.slug }));
}

function SectionHeader({ title, actionHref }: { title: string; actionHref?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-base font-black text-ink">{title}</h2>
      {actionHref ? (
        <Link href={actionHref} className="text-xs font-black text-blush">
          すべて見る
        </Link>
      ) : null}
    </div>
  );
}

function CompactLinkCard({ href, label, title, meta }: { href: string; label: string; title: string; meta?: string }) {
  return (
    <Link href={href} className="block rounded-[8px] border border-line bg-white p-3 shadow-[0_8px_20px_rgba(17,17,17,0.03)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.64rem] font-black text-blush">{label}</p>
          <h3 className="mt-1 line-clamp-2 text-sm font-black leading-snug text-ink">{title}</h3>
          {meta ? <p className="mt-1 text-xs font-bold text-mute">{meta}</p> : null}
        </div>
        <ChevronRight aria-hidden="true" size={16} className="mt-1 shrink-0 text-mute" />
      </div>
    </Link>
  );
}

function EditorsPick({ bundle }: { bundle: TopicBundle }) {
  const pick = bundle.articles[0];
  if (pick == null) return null;

  return (
    <section className="px-4 pt-5">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-blush">EDITOR'S PICK</p>
      <Link href={`/articles/${pick.id}`} className="mt-3 block rounded-[8px] border border-line bg-white p-3 shadow-[0_12px_30px_rgba(17,17,17,0.045)]">
        <MagazineImage src={pick.imageUrl} alt={pick.title} variant={pick.accent} className="aspect-[16/9]" />
        <p className="mt-3 text-[0.68rem] font-black text-blush">{pick.category}</p>
        <h2 className="mt-1 text-lg font-black leading-tight text-ink">{pick.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-mute">{pick.summary}</p>
      </Link>
    </section>
  );
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = getTopicBundle(slug);

  if (bundle == null) {
    notFound();
  }

  const articleList = bundle.articles.length > 1 ? bundle.articles.slice(1, 5) : bundle.articles.slice(0, 1);

  return (
    <PageChrome>
      <section className="px-4 pt-5">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">TOPIC</p>
        <h1 className="mt-1 text-[1.65rem] font-black leading-tight text-ink">{bundle.topic.label}</h1>
        <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">{bundle.topic.description}</p>
        <div className="mt-3 no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {bundle.topic.tags.map((tag) => (
            <span key={tag} className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-[0.68rem] font-black text-ink">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <EditorsPick bundle={bundle} />

      <section className="px-4 pt-7">
        <SectionHeader title="関連記事" />
        <div className="grid gap-2.5">
          {articleList.map((article) => (
            <CompactLinkCard key={article.id} href={`/articles/${article.id}`} label={article.category} title={article.title} meta={article.summary} />
          ))}
        </div>
      </section>

      <section className="px-4 pt-7">
        <SectionHeader title="関連Snap" actionHref="/snap" />
        <div className="grid gap-2.5">
          {bundle.snaps.slice(0, 3).map((snap) => (
            <Link key={snap.id} href={`/posts/${snap.id}`} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
              <p className="text-[0.64rem] font-black text-blush">{snap.category}</p>
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-relaxed text-ink">{snap.body}</p>
              <p className="mt-2 text-xs font-bold text-mute">{snap.authorLabel} / {snap.area}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-7">
        <SectionHeader title="関連Q&A" actionHref="/qa" />
        <div className="grid gap-2.5">
          {bundle.qa.slice(0, 3).map((item) => (
            <CompactLinkCard key={item.id} href={`/qa/${item.id}`} label={item.category} title={item.title} meta={item.status} />
          ))}
        </div>
      </section>

      <section className="px-4 pt-7">
        <SectionHeader title="Back Room最近の話題" actionHref="/backyard/setup?next=/backyard" />
        <div className="grid gap-2">
          {bundle.backRoomThreads.slice(0, 3).map((thread) => (
            <Link key={thread.id} href={`/backyard/setup?next=/posts/${thread.id}`} className="rounded-[8px] border border-line bg-white px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-full bg-blushSoft px-2 py-0.5 text-[0.6rem] font-black text-blush">{thread.category}</span>
                <h3 className="min-w-0 flex-1 truncate text-[0.84rem] font-black text-ink">{thread.title ?? thread.body}</h3>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[0.68rem] font-bold text-mute">
                <span className="inline-flex items-center gap-1">
                  <MessageCircle aria-hidden="true" size={13} />
                  {thread.comments}コメント
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock aria-hidden="true" size={13} />
                  {thread.latestCommentAt ?? "さっき"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-7">
        <SectionHeader title="講習・求人" />
        <div className="grid gap-2.5">
          {bundle.seminars.slice(0, 2).map((seminar) => (
            <CompactLinkCard key={seminar.id} href="/seminars" label={seminar.category} title={seminar.title} meta={seminar.meta} />
          ))}
          {bundle.jobs.slice(0, 2).map((job) => (
            <CompactLinkCard key={job.id} href="/jobs" label={job.category} title={job.title} meta={job.meta} />
          ))}
        </div>
      </section>

      <section className="px-4 pt-7">
        <SectionHeader title="協賛・パートナー" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {bundle.sponsors.slice(0, 3).map((sponsor) => (
            <Link key={sponsor.id} href={sponsor.href} className="w-[74%] shrink-0 rounded-[8px] border border-line bg-white p-3 shadow-[0_8px_20px_rgba(17,17,17,0.035)]">
              <MagazineImage src={sponsor.imageUrl} alt={sponsor.title} variant={sponsor.category === "tools" ? "tool" : "seminar"} className="aspect-[16/8]" />
              <p className="mt-2 text-[0.62rem] font-black text-blush">{sponsor.label}</p>
              <h3 className="mt-1 line-clamp-2 text-sm font-black leading-snug text-ink">{sponsor.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{sponsor.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageChrome>
  );
}
