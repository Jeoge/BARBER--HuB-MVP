"use client";

import { ImagePlus, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createSnapAction } from "./actions";

const categories = ["技術", "道具", "営業メモ", "集客", "日常", "編集部へ共有"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function SubmitButton({ disabledByValidation }: { disabledByValidation: boolean }) {
  const { pending } = useFormStatus();
  const disabled = pending || disabledByValidation;

  return (
    <button
      type="submit"
      disabled={disabled}
      className={
        "inline-flex h-12 items-center justify-center gap-2 rounded-[8px] text-sm font-black transition " +
        (disabled ? "cursor-not-allowed bg-neutral-200 text-mute" : "bg-blush text-white")
      }
    >
      <Send aria-hidden="true" size={17} />
      {pending ? "投稿中..." : "投稿する"}
    </button>
  );
}

export function SnapPostForm({
  initialRegion,
  error,
  posted,
}: {
  initialRegion?: string | null;
  error?: string;
  posted?: boolean;
}) {
  const [caption, setCaption] = useState("");
  const [imageError, setImageError] = useState("");
  const captionRequired = caption.trim().length === 0;

  function checkImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImageError("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("画像ファイルだけアップロードできます。");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("画像は10MB以下にしてください。");
      event.target.value = "";
    }
  }

  const validationMessage = useMemo(() => {
    if (captionRequired) return "本文を入力してください。";
    if (imageError) return imageError;
    return "";
  }, [captionRequired, imageError]);

  return (
    <form action={createSnapAction} className="grid gap-4 px-4 pt-4">
      {posted ? (
        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
          投稿できました。Snap一覧に表示されます。
          <Link href="/snap" className="mt-2 block text-xs font-black text-blush underline">
            Snap一覧で確認する
          </Link>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
          {error}
          {error.includes("プロフィール") ? (
            <Link href="/mypage/profile/edit" className="mt-2 block text-xs font-black text-red-700 underline">
              プロフィール設定へ進む
            </Link>
          ) : null}
        </div>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">カテゴリー</span>
        <select name="category" className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush">
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">地域</span>
        <input
          name="region"
          type="text"
          defaultValue={initialRegion ?? ""}
          className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
          placeholder="例：福岡県 福岡市"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">本文</span>
        <textarea
          name="caption"
          rows={6}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
          placeholder="今日の営業で気づいたことを書いてみましょう"
        />
      </label>

      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-blush/50 bg-blushSoft px-3 py-4 text-sm font-black text-blush">
        <ImagePlus aria-hidden="true" size={24} />
        画像を1枚追加
        <span className="text-[0.68rem] font-semibold text-mute">画像なしでも投稿できます / 10MB以下</span>
        <input name="image" type="file" accept="image/*" className="sr-only" onChange={checkImage} />
      </label>

      {validationMessage ? (
        <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
          {validationMessage}
        </div>
      ) : null}

      <div className="rounded-[8px] border border-line/80 bg-neutral-50 px-3 py-2.5 text-[0.72rem] font-medium leading-relaxed text-mute">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-black text-ink/70">投稿ルール</span>
          <Link href="/partners/dealers" className="font-black text-blush">
            広告掲載について相談する
          </Link>
        </div>
        <p className="mt-1">
          Snapは、現場の気づきや日常を共有する場所です。企業・学校・メーカー・ディーラー等の告知や広告掲載は、運営確認のうえ専用枠で行います。
        </p>
        <p className="mt-1">
          PR・協賛・提供を含む投稿は、広告であることが分かる表記を行い、広告と分からない投稿は避けてください。
        </p>
      </div>

      <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
        <div className="flex items-start gap-2">
          <Sparkles aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-blush" />
          <p className="text-[0.78rem] font-black leading-relaxed text-ink">
            画像は推奨ですが、文章だけのSnapも投稿できます。小さな気づきから共有できます。
          </p>
        </div>
      </div>

      <SubmitButton disabledByValidation={captionRequired || Boolean(imageError)} />
    </form>
  );
}
