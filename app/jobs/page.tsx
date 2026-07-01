import { Briefcase, GraduationCap, School, Sparkles } from "lucide-react";
import { AuthGateLink } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { jobs } from "@/lib/mockData";

const icons = [GraduationCap, Briefcase, School];

export default function JobsPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="JOBS"
        title="学生・求人"
        body="学生、求職者、サロンをつなぐ求人ページです。求人も広告ではなく、店の空気が伝わる情報にします。"
      />
      <section className="grid gap-3 px-4 pt-4">
        {jobs.map((job, index) => {
          const Icon = icons[index] ?? Briefcase;
          return (
            <article key={job.id} className="flex gap-3 rounded-[8px] border border-line bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
                <Icon aria-hidden="true" size={20} />
              </span>
              <div>
                <h2 className="text-sm font-black text-ink">{job.title}</h2>
                <p className="mt-1 text-[0.78rem] font-medium leading-relaxed text-mute">
                  {job.meta}
                </p>
              </div>
            </article>
          );
        })}
      </section>
      <section className="px-4 pt-5">
        <div className="rounded-[8px] bg-ink p-4 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-black">
            <Sparkles aria-hidden="true" size={13} />
            スポンサー枠
          </div>
          <h2 className="mt-3 text-lg font-black">理容業界に届く求人導線</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-white/72">
            学生、若手、復帰希望者に向けて、サロンの魅力を編集して届けます。
          </p>
          <AuthGateLink
            kind="jobs"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-blush text-sm font-black text-white"
          >
            求人掲載をはじめる
          </AuthGateLink>
        </div>
      </section>
    </PageChrome>
  );
}
