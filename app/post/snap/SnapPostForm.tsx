"use client";

import { ImagePlus, Send, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { SafetyChecklist } from "@/components/SafetyChecklist";
import {
  compressClientImage,
  fileSizeLabel,
  isHeicLikeImage,
  waitForPaint,
  type CompressedClientImage,
} from "@/lib/clientImageCompression";
import { isAllowedSnapSourceImageFile } from "@/lib/imageValidation";
import { createSnapAction } from "./actions";

const categories = ["技術", "道具", "営業メモ", "集客", "日常", "編集部へ共有"];
const MAX_SOURCE_IMAGE_SIZE = 25 * 1024 * 1024;
const MAX_IMAGE_COUNT = 4;
const MAX_TOTAL_COMPRESSED_BYTES = 4 * 1024 * 1024;
const TARGET_IMAGE_BYTES = 900 * 1024;
const imageInputId = "snap-image-input";
const snapSafetyItems = [
  {
    name: "snapSafetyConfirmed",
    label: "写真・文章の投稿許可と権利関係を確認しました。",
  },
];

type SelectedSnapImage = CompressedClientImage;

function SubmitButton({
  disabledByValidation,
  busy,
  busyLabel,
}: {
  disabledByValidation: boolean;
  busy: boolean;
  busyLabel: string;
}) {
  const { pending } = useFormStatus();
  const disabled = pending || busy || disabledByValidation;

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
      {pending || busy ? busyLabel : "投稿する"}
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
  const [selectedImages, setSelectedImages] = useState<SelectedSnapImage[]>([]);
  const [imageError, setImageError] = useState("");
  const [imageNotice, setImageNotice] = useState("");
  const [compressionStatus, setCompressionStatus] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [safetyReady, setSafetyReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedImagesRef = useRef<SelectedSnapImage[]>([]);
  const captionRequired = caption.trim().length === 0;

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  function replaceSelectedImages(nextImages: SelectedSnapImage[]) {
    setSelectedImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return nextImages;
    });
  }

  function removeSelectedImage(imageId: string) {
    setSelectedImages((current) => {
      const target = current.find((image) => image.id === imageId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== imageId);
    });
    setImageError("");
    setImageNotice("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function compressAndSetImages(sourceFiles: File[]) {
    const compressed: SelectedSnapImage[] = [];
    const totalCount = sourceFiles.length;

    try {
      for (let index = 0; index < totalCount; index += 1) {
        setCompressionStatus(`画像を圧縮しています... ${index + 1} / ${totalCount}`);
        await waitForPaint();
        compressed.push(
          await compressClientImage(sourceFiles[index], {
            index,
            totalCount,
            fileNamePrefix: "snap",
            targetBytes: TARGET_IMAGE_BYTES,
            hardBytes: MAX_TOTAL_COMPRESSED_BYTES,
          })
        );
      }
    } catch (error) {
      compressed.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      throw error;
    }

    const totalBytes = compressed.reduce((sum, image) => sum + image.byteSize, 0);

    if (totalBytes > MAX_TOTAL_COMPRESSED_BYTES) {
      compressed.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      throw new Error("total too large");
    }

    replaceSelectedImages(compressed);
    setCompressionStatus("");
  }

  async function checkImages(event: ChangeEvent<HTMLInputElement>) {
    const pickedFiles = Array.from(event.target.files ?? []);
    setImageError("");
    setImageNotice("");

    if (pickedFiles.length === 0) {
      setImageError("画像を選択できませんでした。");
      return;
    }

    const remainingSlots = MAX_IMAGE_COUNT - selectedImages.length;

    if (remainingSlots <= 0) {
      setImageNotice("画像は4枚まで選択できます。");
      event.target.value = "";
      return;
    }

    const filesToAdd = pickedFiles.slice(0, remainingSlots);

    if (pickedFiles.length > remainingSlots) {
      setImageNotice("画像は4枚まで選択できます。");
    }

    for (const file of filesToAdd) {
      if (!isAllowedSnapSourceImageFile(file)) {
        setImageError("この写真形式は利用できません。JPEG、PNG、WebPまたはスクリーンショットをお試しください。");
        event.target.value = "";
        return;
      }

      if (file.size > MAX_SOURCE_IMAGE_SIZE) {
        setImageError("画像を圧縮できませんでした。別の写真をお試しください。");
        event.target.value = "";
        return;
      }
    }

    const nextSourceFiles = [...selectedImages.map((image) => image.sourceFile), ...filesToAdd].slice(0, MAX_IMAGE_COUNT);

    try {
      setIsCompressing(true);
      await compressAndSetImages(nextSourceFiles);
    } catch {
      setImageError(
        filesToAdd.some(isHeicLikeImage)
          ? "この写真形式は利用できません。JPEG、PNG、WebPまたはスクリーンショットをお試しください。"
          : "画像を圧縮できませんでした。別の写真をお試しください。"
      );
    } finally {
      setIsCompressing(false);
      setCompressionStatus("");
      event.target.value = "";
    }
  }

  const validationMessage = useMemo(() => {
    if (captionRequired) return "本文を入力してください。";
    if (imageError) return imageError;
    return "";
  }, [captionRequired, imageError]);

  const compressedTotalBytes = selectedImages.reduce((sum, image) => sum + image.byteSize, 0);
  const busyLabel = isCompressing ? "圧縮中..." : "投稿中...";

  async function submitSnap(formData: FormData) {
    if (captionRequired || imageError || isCompressing || isSubmitting || !safetyReady) return;

    formData.delete("image");
    formData.delete("images");
    selectedImages.forEach((image) => {
      formData.append("images", image.file, image.file.name);
    });

    setIsSubmitting(true);

    try {
      await createSnapAction(formData);
    } catch (submitError) {
      setIsSubmitting(false);
      throw submitError;
    }
  }

  return (
    <form action={submitSnap} className="grid gap-4 px-4 pt-4">
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
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-black text-ink">画像</span>
          <span className="text-xs font-black text-mute">画像 {selectedImages.length} / {MAX_IMAGE_COUNT}</span>
        </div>
        <input
          ref={fileInputRef}
          id={imageInputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="sr-only"
          onChange={checkImages}
          disabled={isCompressing || isSubmitting || selectedImages.length >= MAX_IMAGE_COUNT}
        />

        {selectedImages.length > 0 ? (
          <div className="overflow-hidden rounded-[10px] border border-line bg-white p-3 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              {selectedImages.map((image, index) => (
                <div key={image.id} className="overflow-hidden rounded-[8px] border border-line bg-neutral-50">
                  <img
                    src={image.previewUrl}
                    alt={`選択したSnap画像 ${index + 1}`}
                    className="aspect-[4/5] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="p-2">
                    <p className="line-clamp-1 break-all text-[0.68rem] font-black text-ink">
                      {index + 1}. {image.sourceFile.name}
                    </p>
                    <p className="mt-1 text-[0.64rem] font-semibold text-mute">
                      {image.mimeType.replace("image/", "").toUpperCase()} / {fileSizeLabel(image.byteSize)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(image.id)}
                      className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white text-[0.68rem] font-black text-mute"
                    >
                      <Trash2 aria-hidden="true" size={14} />
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {compressedTotalBytes > 0 ? (
              <p className="mt-3 text-xs font-bold text-mute">圧縮後 合計 {fileSizeLabel(compressedTotalBytes)}</p>
            ) : null}
            {selectedImages.length < MAX_IMAGE_COUNT ? (
              <label
                htmlFor={imageInputId}
                className="mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white text-xs font-black text-ink"
              >
                <ImagePlus aria-hidden="true" size={15} />
                画像を追加する
              </label>
            ) : null}
          </div>
        ) : (
          <label
            htmlFor={imageInputId}
            className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-blush/50 bg-blushSoft px-3 py-4 text-sm font-black text-blush"
          >
            <ImagePlus aria-hidden="true" size={24} />
            画像を追加
            <span className="text-[0.68rem] font-semibold text-mute">画像なしでも投稿できます / 最大4枚</span>
          </label>
        )}
        {compressionStatus ? (
          <p className="rounded-[8px] border border-line bg-neutral-50 p-2 text-xs font-bold leading-relaxed text-mute">
            {compressionStatus}
          </p>
        ) : null}
        {imageNotice ? (
          <p className="rounded-[8px] border border-line bg-neutral-50 p-2 text-xs font-bold leading-relaxed text-mute">
            {imageNotice}
          </p>
        ) : null}
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
      <SubmitButton
        disabledByValidation={captionRequired || Boolean(imageError) || isCompressing || !safetyReady}
        busy={isCompressing || isSubmitting}
        busyLabel={busyLabel}
      />
    </form>
  );
}
