import { Archive, GraduationCap } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { VisualTile } from "@/components/VisualTile";
import { seminars } from "@/lib/mockData";

export default function SeminarsPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="SEMINARS"
        title="講習会・アーカイブ"
        body="行けなかった講習会、練習会、コンクールも後から学べる場所です。"
      />
      <section className="px-4 pt-4">
        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Archive aria-hidden="true" size={18} className="text-blush" />
            後から見られるアーカイブ
          </div>
          <p className="mt-1.5 text-[0.75rem] font-medium leading-relaxed text-mute">
            現地に行けない理容師にも、要点と雰囲気が伝わる形で編集します。
          </p>
        </div>
      </section>
      <section className="grid gap-3 px-4 pt-4">
        {seminars.map((seminar) => (
          <Link key={seminar.id} href="/articles/fukuoka-seminar" className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
            <VisualTile variant={seminar.accent} className="aspect-[16/8]" />
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="rounded-full bg-blushSoft px-2 py-1 text-[0.62rem] font-black text-blush">
                {seminar.category}
              </span>
              <GraduationCap aria-hidden="true" size={17} className="text-mute" />
            </div>
            <h2 className="mt-2 text-[0.96rem] font-black leading-snug text-ink">{seminar.title}</h2>
            <p className="mt-1 text-xs font-bold text-mute">{seminar.meta}</p>
          </Link>
        ))}
      </section>
    </PageChrome>
  );
}
