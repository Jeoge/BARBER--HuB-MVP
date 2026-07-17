"use client";

import type { MouseEvent } from "react";

type TitleAngle = "work" | "personal" | "conversation";
type TitleCandidates = Partial<Record<TitleAngle, string | null>>;

type TitleCandidatePickerProps = {
  candidates: TitleCandidates | null;
  primaryAngle: TitleAngle | null;
};

const titleAngles = [
  { id: "work", label: "仕事・経営" },
  { id: "personal", label: "若手目線" },
  { id: "conversation", label: "お客様との会話" },
] as const;

function cleanTitle(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function TitleCandidatePicker({ candidates, primaryAngle }: TitleCandidatePickerProps) {
  const items = titleAngles
    .map((angle) => ({
      angle: angle.id,
      label: angle.label,
      title: cleanTitle(candidates?.[angle.id]),
    }))
    .filter((item) => item.title);

  if (items.length === 0) return null;

  function applyTitle(event: MouseEvent<HTMLButtonElement>, title: string) {
    const input = event.currentTarget.form?.elements.namedItem("draft_title");
    if (!(input instanceof HTMLInputElement)) return;

    input.value = title;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }

  return (
    <section className="rounded-[8px] border border-line bg-neutral-50 p-3">
      <h2 className="text-xs font-black text-mute">タイトル候補</h2>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <button
            key={item.angle}
            type="button"
            onClick={(event) => applyTitle(event, item.title)}
            className="rounded-[8px] border border-line bg-white px-3 py-2 text-left shadow-sm transition hover:border-blush hover:bg-blushSoft focus:border-blush focus:outline-none"
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[0.68rem] font-black text-blush">{item.label}</span>
              {primaryAngle === item.angle ? (
                <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.62rem] font-black text-blush">AIおすすめ</span>
              ) : null}
            </span>
            <span className="mt-1 block text-sm font-semibold leading-snug text-ink">{item.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
