import { MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { qaItems } from "@/lib/mockData";
import { SectionTitle } from "./SectionTitle";

export function QASection() {
  return (
    <section className="pt-7">
      <SectionTitle title="Q&A" action="相談する" />
      <div className="grid gap-2 px-4">
        {qaItems.map((question, index) => (
          <Link
            key={question.id}
            href={`/qa/${question.id}`}
            className="rounded-[8px] border border-line bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2 text-blush">
              <MessageSquare aria-hidden="true" size={18} />
              <p className="text-xs font-black uppercase tracking-[0.14em]">みんなで解決 #{index + 1}</p>
            </div>
            <h3 className="text-[0.98rem] font-black leading-snug text-ink">{question.title}</h3>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-mute">
              <Users aria-hidden="true" size={15} />
              {question.status} / コメント {question.comments}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
