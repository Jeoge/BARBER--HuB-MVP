import { CheckCircle2, MessageCircle, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { qaItems } from "@/lib/mockData";

const filters = ["最新の相談", "解決済み", "ただ聞いてほしい", "値上げ", "技術", "お客様トラブル", "経営"];

export default function QaPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="Q&A"
        title="困りごと相談"
        body="ベストアンサーを競う場所ではなく、みんなで解決の糸口を探す場所です。"
      />
      <section className="pt-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
          {filters.map((filter, index) => (
            <button
              key={filter}
              className={
                "shrink-0 rounded-full px-3 py-2 text-xs font-black " +
                (index === 0 ? "bg-blush text-white" : "border border-line bg-white text-ink")
              }
            >
              {filter}
            </button>
          ))}
        </div>
      </section>
      <section className="grid gap-3 px-4 pt-4">
        {qaItems.map((question) => (
          <Link key={question.id} href={`/qa/${question.id}`} className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-blushSoft px-2 py-1 text-[0.64rem] font-black text-blush">
                {question.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[0.66rem] font-black text-mute">
                {question.status === "解決済み" ? <CheckCircle2 size={13} /> : <MessageSquare size={13} />}
                {question.status}
              </span>
            </div>
            <h2 className="mt-3 text-[0.98rem] font-black leading-snug text-ink">{question.title}</h2>
            <div className="mt-3 flex items-center gap-4 text-xs font-bold text-mute">
              <span className="inline-flex items-center gap-1">
                <MessageCircle aria-hidden="true" size={15} />
                コメント {question.comments}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users aria-hidden="true" size={15} />
                解決アイデア {question.ideas}
              </span>
            </div>
          </Link>
        ))}
      </section>
    </PageChrome>
  );
}
