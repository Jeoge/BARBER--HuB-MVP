import { AlertCircle, CheckCircle2 } from "lucide-react";
import { PageChrome } from "./PageChrome";
import { PageHeaderBlock } from "./PageHeaderBlock";
import type { LegalPage } from "@/lib/legalPages";

type LegalPageContentProps = {
  page: LegalPage;
};

export function LegalPageContent({ page }: LegalPageContentProps) {
  return (
    <PageChrome>
      <PageHeaderBlock eyebrow={page.eyebrow} title={page.title} body={page.body} />

      <section className="grid gap-4 px-4 pt-5">
        {page.sections.map((section) => (
          <article key={section.heading} className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-ink">{section.heading}</h2>
            <div className="mt-3 grid gap-2.5">
              {section.items.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-blush" />
                  <p className="text-[0.84rem] font-medium leading-relaxed text-ink">{item}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="px-4 pt-5">
        <div className="flex items-start gap-2 rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <AlertCircle aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-blush" />
          <p className="text-[0.72rem] font-bold leading-relaxed text-mute">
            このページはMVP用の仮文章です。正式公開前に内容を確認・更新します。
          </p>
        </div>
      </section>
    </PageChrome>
  );
}
