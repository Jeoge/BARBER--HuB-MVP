import { ArrowLeft, ImagePlus, Save, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "./PageChrome";

type Field =
  | { kind: "input"; label: string; placeholder: string }
  | { kind: "textarea"; label: string; placeholder: string; rows?: number }
  | { kind: "select"; label: string; options: string[] }
  | { kind: "checks"; label: string; options: string[] }
  | { kind: "note"; text: string };

type PostFormPageProps = {
  title: string;
  description: string;
  phrase: string;
  fields: Field[];
  imageLabel?: string;
};

export function PostFormPage({ title, description, phrase, fields, imageLabel = "画像追加" }: PostFormPageProps) {
  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          戻る
        </Link>
        <div className="mt-4 rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">POST</p>
          <h1 className="mt-1 text-[1.5rem] font-black leading-tight text-ink">{title}</h1>
          <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">{description}</p>
          <div className="mt-3 flex items-start gap-2 rounded-[8px] bg-blushSoft p-3">
            <Sparkles aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-blush" />
            <p className="text-[0.78rem] font-black leading-relaxed text-ink">{phrase}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 px-4 pt-4">
        {fields.map((field) => {
          if (field.kind === "input") {
            return (
              <label key={field.label} className="grid gap-2">
                <span className="text-sm font-black text-ink">{field.label}</span>
                <input
                  className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
                  placeholder={field.placeholder}
                />
              </label>
            );
          }

          if (field.kind === "textarea") {
            return (
              <label key={field.label} className="grid gap-2">
                <span className="text-sm font-black text-ink">{field.label}</span>
                <textarea
                  rows={field.rows ?? 6}
                  className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
                  placeholder={field.placeholder}
                />
              </label>
            );
          }

          if (field.kind === "select") {
            return (
              <label key={field.label} className="grid gap-2">
                <span className="text-sm font-black text-ink">{field.label}</span>
                <select className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush">
                  {field.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            );
          }

          if (field.kind === "checks") {
            return (
              <fieldset key={field.label} className="grid gap-2">
                <legend className="text-sm font-black text-ink">{field.label}</legend>
                <div className="grid gap-2">
                  {field.options.map((option) => (
                    <label key={option} className="flex items-center gap-2 rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-bold text-ink">
                      <input type="checkbox" className="h-4 w-4 accent-blush" />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          }

          return (
            <div key={field.text} className="rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-[0.78rem] font-medium leading-relaxed text-ink">
              {field.text}
            </div>
          );
        })}

        <button className="flex h-28 flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-blush/50 bg-blushSoft text-sm font-black text-blush">
          <ImagePlus aria-hidden="true" size={24} />
          {imageLabel}
        </button>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] border border-line bg-white text-sm font-black text-ink">
            <Save aria-hidden="true" size={17} />
            下書き保存
          </button>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
            <Send aria-hidden="true" size={17} />
            投稿する
          </button>
        </div>
      </section>
    </PageChrome>
  );
}
