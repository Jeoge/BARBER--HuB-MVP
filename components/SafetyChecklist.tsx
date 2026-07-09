"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { LoadingSubmitButton } from "@/components/LoadingButton";

export type SafetyChecklistItem = {
  name: string;
  label: string;
  required?: boolean;
};

type SafetyChecklistProps = {
  title?: string;
  body?: string;
  items: SafetyChecklistItem[];
  rulesHref?: string;
  rulesLabel?: string;
  onRequiredCompleteChange?: (complete: boolean) => void;
};

export function SafetyChecklist({
  title = "投稿前の確認",
  body,
  items,
  rulesHref = "/guidelines",
  rulesLabel = "投稿ガイドライン",
  onRequiredCompleteChange,
}: SafetyChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const requiredNames = useMemo(() => items.filter((item) => item.required !== false).map((item) => item.name), [items]);
  const allRequiredChecked = requiredNames.every((name) => checked[name]);

  useEffect(() => {
    onRequiredCompleteChange?.(allRequiredChecked);
  }, [allRequiredChecked, onRequiredCompleteChange]);

  return (
    <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
      <div className="flex items-center gap-2 text-sm font-black text-ink">
        <ShieldCheck aria-hidden="true" size={17} className="text-blush" />
        {title}
      </div>
      {body ? <p className="mt-2 text-xs font-medium leading-relaxed text-mute">{body}</p> : null}
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <label key={item.name} className="flex items-start gap-2 rounded-[8px] bg-white px-3 py-2 text-sm font-black leading-relaxed text-ink">
            <input
              type="checkbox"
              name={item.name}
              value="confirmed"
              required={item.required !== false}
              checked={Boolean(checked[item.name])}
              onChange={(event) => setChecked((current) => ({ ...current, [item.name]: event.target.checked }))}
              className="mt-1 h-4 w-4 shrink-0 accent-blush"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold text-mute">
        <CheckCircle2 aria-hidden="true" size={13} className="text-blush" />
        <span>必要な確認だけを保存前にチェックします。</span>
        {rulesHref ? (
          <Link href={rulesHref} className="font-black text-blush">
            {rulesLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

type SafetyChecklistSubmitProps = SafetyChecklistProps & {
  children: ReactNode;
  pendingText?: string;
  className: string;
  disabledHint?: string;
};

export function SafetyChecklistSubmit({
  children,
  pendingText,
  className,
  disabledHint = "確認欄にチェックすると送信できます。",
  ...checklistProps
}: SafetyChecklistSubmitProps) {
  const [ready, setReady] = useState(false);

  return (
    <>
      <SafetyChecklist {...checklistProps} onRequiredCompleteChange={setReady} />
      {!ready ? <p className="text-[0.68rem] font-bold text-mute">{disabledHint}</p> : null}
      <LoadingSubmitButton pendingText={pendingText} disabled={!ready} className={className}>
        {children}
      </LoadingSubmitButton>
    </>
  );
}
