import { Building2, Clock, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MagazineImage } from "@/components/MagazineImage";
import {
  MagazineCompactList,
  MagazineFeaturedCard,
  MagazinePageHeader,
  MagazineRail,
  MagazineSectionHeading,
  type MagazineListItem,
} from "@/components/MagazineListLayout";
import { PageChrome } from "@/components/PageChrome";
import { ToolActionLinks } from "@/components/ToolActionLinks";
import { toolPartners, type ToolPartner } from "@/lib/tool-partners";
import { getTopicBundle, topics, type TopicBundle } from "@/lib/topics";

export function generateStaticParams() {
  return topics.map((topic) => ({ slug: topic.slug }));
}

function SectionHeader({ title, actionHref }: { title: string; actionHref?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="editorial-serif text-[1.14rem] leading-tight text-ink">{title}</h2>
      {actionHref ? (
        <Link href={actionHref} className="text-xs font-black text-blush">
          すべて見る
        </Link>
      ) : null}
    </div>
  );
}

function articleItem(article: TopicBundle["articles"][number]): MagazineListItem {
  return {
    href: `/articles/${article.id}`,
    label: article.category,
    title: article.title,
    description: article.summary,
    imageUrl: article.imageUrl,
    variant: article.accent,
  };
}

function snapItem(snap: TopicBundle["snaps"][number]): MagazineListItem {
  return {
    href: `/posts/${snap.id}`,
    label: "SNAP",
    title: snap.body,
    description: `${snap.authorLabel} / ${snap.area}`,
    imageUrl: snap.imageUrl,
    variant: snap.accents[0],
    imageClassName: "object-[center_38%]",
  };
}

function EditorsPick({ bundle }: { bundle: TopicBundle }) {
  const pick = bundle.articles[0];
  if (pick == null) return null;

  return <MagazineFeaturedCard item={articleItem(pick)} />;
}

function SalonTransitionLinkCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="px-4 pt-6">
      <Link href="/salon-transition" className="flex items-center gap-3 rounded-[8px] border border-line bg-white p-4 shadow-sm">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
          <Building2 aria-hidden="true" size={19} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-black text-ink">{title}</span>
          <span className="mt-0.5 block text-xs font-bold leading-relaxed text-mute">{body}</span>
        </span>
      </Link>
    </section>
  );
}

function ToolPartnerCard({ partner }: { partner: ToolPartner }) {
  const actionLabel =
    partner.type === "online-store"
      ? "見る"
      : partner.type === "regional-dealer" || partner.type === "dealer"
        ? "相談する"
        : partner.type === "seminar"
          ? "講習を見る"
          : "見る";
  const card = (
    <article className="h-full rounded-[8px] border border-line bg-white p-3 shadow-[0_8px_20px_rgba(17,17,17,0.035)]">
      <MagazineImage src={partner.imageUrl} alt={partner.name} variant={partner.type === "seminar" ? "seminar" : "tool"} className="aspect-[16/8]" />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-line bg-neutral-50 px-2 py-0.5 text-[0.58rem] font-black text-mute">{partner.label}</span>
        <span className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-mute">
          <MapPin aria-hidden="true" size={12} />
          {partner.area}
        </span>
      </div>
      <h3 className="mt-2 text-sm font-black leading-snug text-ink">{partner.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{partner.description}</p>
      <p className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blush">
        {actionLabel}
        {partner.external ? <ExternalLink aria-hidden="true" size={12} /> : null}
      </p>
    </article>
  );

  if (partner.external) {
    return (
      <a href={partner.href} target="_blank" rel="noreferrer" className="block h-full">
        {card}
      </a>
    );
  }

  return (
    <Link href={partner.href} className="block h-full">
      {card}
    </Link>
  );
}

function ToolsTopicPage({ bundle }: { bundle: TopicBundle }) {
  const articleList = bundle.articles.slice(0, 6);
  const onlinePartners = toolPartners.filter((partner) => partner.type === "online-store");
  const consultPartners = toolPartners.filter((partner) => partner.type === "dealer" || partner.type === "regional-dealer");
  const learningPartners = toolPartners.filter((partner) => partner.type === "manufacturer" || partner.type === "seminar");

  return (
    <PageChrome>
      <MagazinePageHeader
        eyebrow="TOOLS"
        title="道具"
        description="バリカン、トリマー、コーム、整髪料。現場で使う道具を、記事・Snap・レビューから探す。"
        tags={["バリカン", "トリマー", "コーム", "店販", "ディーラー相談"]}
      />
      <section className="px-4 pt-4">
        <div className="mt-3 rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-medium leading-relaxed text-mute">
          BARBER HUBでは商品の販売、決済、配送、返品対応は行いません。気になる道具は、オンライン購入先・メーカー・ディーラー・地域ディーラーへ進めます。
        </div>
      </section>

      <EditorsPick bundle={bundle} />

      <SalonTransitionLinkCard
        title="開業前に見ておきたい情報"
        body="開業準備、居抜き、備品譲渡、地域ディーラー相談をまとめて確認できます。"
      />

      <MagazineRail title="道具記事" eyebrow="FEATURES" items={articleList.slice(1, 5).map(articleItem)} />

      <MagazineRail title="現場のSnap" eyebrow="SNAP" items={bundle.snaps.slice(0, 3).map(snapItem)} portrait />

      <section className="px-4 pt-7">
        <SectionHeader title="道具を探す・相談する" actionHref="/partners/dealers" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {toolPartners.slice(0, 5).map((partner) => (
            <div key={partner.id} className="w-[76%] shrink-0">
              <ToolPartnerCard partner={partner} />
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-7">
        <MagazineSectionHeading title="購入する / 相談する / 学ぶ" eyebrow="GUIDE" />
        <div className="grid gap-2.5">
          {onlinePartners.map((partner) => <ToolPartnerCard key={partner.id} partner={partner} />)}
          {consultPartners.slice(0, 2).map((partner) => <ToolPartnerCard key={partner.id} partner={partner} />)}
          {learningPartners.slice(0, 2).map((partner) => <ToolPartnerCard key={partner.id} partner={partner} />)}
        </div>
      </section>

      <ToolActionLinks />

      <MagazineCompactList
        title="関連講習"
        eyebrow="SEMINAR"
        actionHref="/seminars"
        items={bundle.seminars.slice(0, 3).map((seminar) => ({
          href: "/seminars",
          label: seminar.category,
          title: seminar.title,
          description: seminar.meta,
        }))}
      />
    </PageChrome>
  );
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = getTopicBundle(slug);

  if (bundle == null) {
    notFound();
  }

  if (bundle.topic.slug === "tools") {
    return <ToolsTopicPage bundle={bundle} />;
  }

  const articleList = bundle.articles.length > 1 ? bundle.articles.slice(1, 5) : bundle.articles.slice(0, 1);

  return (
    <PageChrome>
      <MagazinePageHeader
        eyebrow={bundle.topic.slug.toUpperCase()}
        title={bundle.topic.label}
        description={bundle.topic.description}
        tags={bundle.topic.tags}
      />

      <EditorsPick bundle={bundle} />

      {bundle.topic.slug === "management" ? (
        <SalonTransitionLinkCard
          title="事業承継を考えるサロンへ"
          body="閉店、引退、居抜き、備品譲渡を、情報掲載と問い合わせ導線として整理します。"
        />
      ) : null}

      <MagazineRail title="関連記事" eyebrow="FEATURES" items={articleList.map(articleItem)} />

      <MagazineRail title="関連Snap" eyebrow="SNAP" items={bundle.snaps.slice(0, 3).map(snapItem)} portrait />

      <MagazineCompactList
        title="関連Q&A"
        eyebrow="Q&A"
        actionHref="/qa"
        items={bundle.qa.slice(0, 3).map((item) => ({
          href: `/qa/${item.id}`,
          label: item.category,
          title: item.title,
          description: item.body,
          meta: item.status,
        }))}
      />

      <section className="px-4 pt-7">
        <MagazineSectionHeading title="Back Room最近の話題" eyebrow="BACK ROOM" actionHref="/backyard/setup?next=/backyard" />
        <div className="grid gap-2">
          {bundle.backRoomThreads.slice(0, 3).map((thread) => (
            <Link key={thread.id} href={`/backyard/setup?next=/posts/${thread.id}`} className="rounded-[8px] border border-line bg-white px-3 py-2.5 shadow-sm">
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

      <MagazineCompactList
        title="講習・求人"
        eyebrow="NEXT"
        items={[
          ...bundle.seminars.slice(0, 2).map((seminar) => ({
            href: "/seminars",
            label: seminar.category,
            title: seminar.title,
            description: seminar.meta,
          })),
          ...bundle.jobs.slice(0, 2).map((job) => ({
            href: "/jobs",
            label: job.category,
            title: job.title,
            description: job.meta,
          })),
        ]}
      />

      <section className="px-4 pt-7">
        <MagazineSectionHeading title="協賛・パートナー" eyebrow="PARTNER" />
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
