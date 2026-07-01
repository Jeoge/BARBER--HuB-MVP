import { Sparkles } from "lucide-react";
import { todayNews } from "@/lib/data";

export function AiEditorial() {
  return (
    <section className="px-4 pt-5">
      <div className="rounded-[8px] border border-line bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blush">AI編集部</p>
            <h1 className="mt-1 text-2xl font-black leading-tight text-ink">
              成功を共有しよう。
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-mute">
              One Success. Shared Success.
            </p>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-full bg-blushSoft text-blush">
            <Sparkles aria-hidden="true" size={22} />
          </div>
        </div>
        <div className="grid gap-2">
          {todayNews.map((item) => (
            <article key={item.title} className="rounded-[7px] border border-line bg-white p-3">
              <p className="text-sm font-black text-ink">{item.title}</p>
              <p className="mt-1 text-[0.8rem] leading-relaxed text-mute">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
