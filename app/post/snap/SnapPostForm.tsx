"use client";

import { ImagePlus, Send, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { SafetyChecklist } from "@/components/SafetyChecklist";
import { isAllowedImageFile } from "@/lib/imageValidation";
import { createSnapAction } from "./actions";

const categories = ["技術", "道具", "営業メモ", "集客", "日常", "編集部へ共有"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const imageInputId = "snap-image-input";
const snapSafetyItems = [
  {
    name: "snapSafetyConfirmed",
    label: "写真・文章の投稿許可と権利関係を確認しました。",
  },
];

function SubmitButton({ disabledByValidation }: { disabledByValidation: boolean }) {
  const { pending } = useFormStatus();
  const disabled = pending || disabledByValidation;

  return (
    <button
      type="submit"
      disabled={disabled}
      className={
        "inline-flex h-12 items-center justify-center gap-2 rounded-[8px] text-sm font-black transition active:scale-[0.98] " +
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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [safetyReady, setSafetyReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionRequired = caption.trim().length === 0;

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  function isHeicLike(file: File) {
    return file.type === "image/heic" || file.type === "image/heif" || /\.(heic|heif)$/i.test(file.name);
  }

  function fileSizeLabel(bytes: number) {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  function clearSelectedImage() {
    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
    }
    setSelectedImageFile(null);
    setSelectedImagePreviewUrl("");
    setImageError("");
    setPreviewError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function checkImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl);
    }
    setSelectedImageFile(null);
    setSelectedImagePreviewUrl("");
    setImageError("");
    setPreviewError("");

    if (!file) {
      setImageError("画像を選択できませんでした。");
      return;
    }

    if (!isAllowedImageFile(file)) {
      setImageError("画像ファイルだけアップロードできます。");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("画像は10MB以下で選択してください。");
      event.target.value = "";
      return;
    }

    setSelectedImageFile(file);
    setSelectedImagePreviewUrl(URL.createObjectURL(file));

    if (isHeicLike(file)) {
      setPreviewError("この写真形式は表示できない可能性があります。スクリーンショット、JPEG、PNG画像でお試しください。");
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
              プロフィールを設定する
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

      <div className="grid gap-2">
        <span className="text-sm font-black text-ink">画像</span>
        <input
          ref={fileInputRef}
          id={imageInputId}
          name="image"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={checkImage}
        />

        {selectedImageFile ? (
          <div className="overflow-hidden rounded-[10px] border border-line bg-white p-3 shadow-sm">
            {selectedImagePreviewUrl ? (
              <div className="overflow-hidden rounded-[8px] bg-neutral-100">
                <img
                  src={selectedImagePreviewUrl}
                  alt="選択したSnap画像のプレビュー"
                  className="aspect-[4/5] max-h-[22rem] w-full object-cover"
                  onError={() => setPreviewError("画像の読み込みに失敗しました。別の画像でお試しください。")}
                />
              </div>
            ) : null}
            <div className="mt-3">
              <p className="line-clamp-1 break-all text-sm font-black text-ink">選択済み: {selectedImageFile.name}</p>
              <p className="mt-1 text-xs font-semibold text-mute">
                {selectedImageFile.type || "形式不明"} / {fileSizeLabel(selectedImageFile.size)}
              </p>
            </div>
            {previewError ? (
              <p className="mt-2 rounded-[8px] border border-line bg-neutral-50 p-2 text-xs font-bold leading-relaxed text-mute">
                {previewError}
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label
                htmlFor={imageInputId}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white text-xs font-black text-ink"
              >
                <ImagePlus aria-hidden="true" size={15} />
                画像を変更する
              </label>
              <button
                type="button"
                onClick={clearSelectedImage}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white text-xs font-black text-mute"
              >
                <Trash2 aria-hidden="true" size={15} />
                画像を削除する
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor={imageInputId}
            className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-blush/50 bg-blushSoft px-3 py-4 text-sm font-black text-blush"
          >
            <ImagePlus aria-hidden="true" size={24} />
            画像を1枚追加
            <span className="text-[0.68rem] font-semibold text-mute">画像なしでも投稿できます / 10MB以下</span>
          </label>
        )}
      </div>

      {validationMessage ? (
        <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
          {validationMessage}
        </div>
      ) : null}

      <div className="rounded-[8px] border border-line/80 bg-neutral-50 px-3 py-2.5 text-[0.72rem] font-medium leading-relaxed text-mute">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-black text-ink/70">投稿ルール</span>
          <Link href="/advertising" className="font-black text-blush">
            広告掲載について相談する
          </Link>
        </div>
        <p className="mt-1">
          Snapは、現場の気づきや日常を共有する場所です。企業・学校・メーカー・ディーラー等の告知や広告掲載は、運営確認のうえ専用枠で行います。
        </p>
        <p className="mt-1">
          企業・団体から依頼された投稿、報酬や商品提供を受けた投稿、告知・販売を主目的とする投稿は、PR・協賛掲載として扱う場合があります。
        </p>
      </div>

      <SafetyChecklist
        title="Snap投稿前の確認"
        body="写真にお客様の顔、個人情報、他店や第三者の権利物が写っていないか確認してください。商品紹介・企業依頼・報酬ありの投稿はPR申告が必要です。"
        items={snapSafetyItems}
        onRequiredCompleteChange={setSafetyReady}
      />

      <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
        <div className="flex items-start gap-2">
          <Sparkles aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-blush" />
          <p className="text-[0.78rem] font-black leading-relaxed text-ink">
            画像は推奨ですが、文章だけのSnapも投稿できます。小さな気づきから共有できます。
          </p>
        </div>
      </div>

      {!safetyReady ? <p className="text-[0.68rem] font-bold text-mute">確認欄にチェックすると投稿できます。</p> : null}
      <SubmitButton disabledByValidation={captionRequired || Boolean(imageError) || !safetyReady} />
    </form>
  );
}
