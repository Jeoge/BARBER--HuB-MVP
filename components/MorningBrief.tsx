import { Clock3 } from "lucide-react";

const timeline = [
  ["朝", "今日のニュース・経営ヒントを優先"],
  ["昼", "技術記事・集客記事を優先"],
  ["夜", "講習会・Q&A・AI活用を優先"],
];

export function MorningBrief() {
  return (
    <section className="px-4 pt-5">
      <div className="rounded-[8px] border border-blush/20 bg-white p-4">
        <div className="flex items-center gap-2 text-blush">
          <Clock3 aria-hidden="true" size={18} />
          <p className="text-xs font-black uppercase tracking-[0.16em]">開くたびに新しい発見</p>
        </div>
        <div className="mt-3 grid gap-2">
          {timeline.map(([time, text]) => (
            <div key={time} className="flex gap-3 rounded-[7px] bg-blushSoft px-3 py-2">
              <p className="w-8 shrink-0 text-sm font-black text-blush">{time}</p>
              <p className="text-sm font-bold leading-relaxed text-ink">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
