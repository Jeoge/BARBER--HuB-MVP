"use client";

import { Send } from "lucide-react";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { BackroomImageAttachment } from "@/components/BackroomImageAttachment";
import { SafetyChecklist, type SafetyChecklistItem } from "@/components/SafetyChecklist";
import type { CompressedClientImage } from "@/lib/clientImageCompression";
import { backRoomTheme } from "@/lib/backRoomTheme";
import { BACKROOM_CATEGORIES } from "@/lib/backroomConstants";

type ServerAction = (formData: FormData) => void | Promise<void>;

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={pending}
      className={
        "inline-flex h-12 items-center justify-center gap-2 rounded-[8px] text-sm font-black transition active:scale-[0.98] " +
        (isDisabled ? "cursor-not-allowed bg-neutral-200 text-mute" : backRoomTheme.primaryButton)
      }
    >
      <Send aria-hidden="true" size={17} />
      {pending ? "作成中..." : "スレッドを作成"}
    </button>
  );
}

export function BackroomPostForm({
  action,
  error,
  safetyItems,
}: {
  action: ServerAction;
  error?: string;
  safetyItems: SafetyChecklistItem[];
}) {
  const selectedImageRef = useRef<CompressedClientImage | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [safetyReady, setSafetyReady] = useState(false);

  function handleImageChange(image: CompressedClientImage | null) {
    selectedImageRef.current = image;
  }

  async function submit(formData: FormData) {
    if (isCompressing || isSubmitting || !safetyReady) return;

    formData.delete("image");
    if (selectedImageRef.current) {
      formData.append("image", selectedImageRef.current.file, selectedImageRef.current.file.name);
    }

    setIsSubmitting(true);

    try {
      await action(formData);
    } catch (submitError) {
      setIsSubmitting(false);
      throw submitError;
    }
  }

  return (
    <form action={submit} className="grid gap-4 px-4 pt-4">
      {error ? <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">{error}</div> : null}

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">スレッドタイトル</span>
        <input
          name="title"
          maxLength={120}
          required
          className={"h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none " + backRoomTheme.focusRing}
          placeholder="例：静音バリカンでおすすめありますか？"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">カテゴリー</span>
        <select name="category" className={"h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none " + backRoomTheme.focusRing}>
          {BACKROOM_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">最初の本文</span>
        <textarea
          name="body"
          rows={9}
          maxLength={6000}
          required
          className={"resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none " + backRoomTheme.focusRing}
          placeholder="相談、経験共有、営業後トークを気軽に書いてください。"
        />
      </label>

      <BackroomImageAttachment
        inputId="backroom-thread-image-input"
        onPreparedImageChange={handleImageChange}
        onBusyChange={setIsCompressing}
      />

      <div className={"rounded-[8px] p-3 text-[0.78rem] font-medium leading-relaxed text-ink " + backRoomTheme.notice}>
        タイトル・カテゴリー・本文は必須です。個人名や店舗名を出した攻撃、晒しは避けてください。企業・団体から依頼された投稿や告知を主目的とする投稿は、PR・協賛掲載として扱う場合があります。
      </div>

      <SafetyChecklist
        title="Back Room投稿前の確認"
        body="Back Roomは会員限定の営業後コミュニティです。ただし、投稿内容の外部共有やスクリーンショットを完全に防ぐことはできません。個人名、顧客情報、他店批判、内部情報、機密情報は投稿しないでください。"
        items={safetyItems}
        onRequiredCompleteChange={setSafetyReady}
      />

      {!safetyReady ? <p className="text-[0.68rem] font-bold text-mute">確認欄にチェックすると送信できます。</p> : null}
      <SubmitButton disabled={isCompressing || isSubmitting || !safetyReady} />
    </form>
  );
}
