"use client";

import { ImagePlus, Save, Send, Trash2 } from "lucide-react";
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
import { ARTICLE_CATEGORIES } from "@/lib/articleCategories";
import { isAllowedSnapSourceImageFile } from "@/lib/imageValidation";
import { createArticleAction } from "./actions";

const MAX_SOURCE_IMAGE_SIZE = 25 * 1024 * 1024;
const TARGET_IMAGE_BYTES = 1500 * 1024;
const MAX_COMPRESSED_IMAGE_BYTES = 2 * 1024 * 1024;
const imageInputId = "article-image-input";

const articleSafetyItems = [
  {
    name: "articleExperienceConfirmed",
    label: "自分の経験・考えとして投稿します。",
  },
  {
    name: "articleNoHarmConfirmed",
    label: "他店・個人・お客様が不利益を受ける内容は含めていません。",
  },
  {
    name: "articlePrDisclosureChecked",
    label: "企業依頼・報酬・商品提供がある場合はPRとして申告します。",
  },
];

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

export function ArticlePostForm({
  defaultCategory,
  error,
  canSetEditorPick,
}: {
  defaultCategory: string;
  error?: string;
  canSetEditorPick: boolean;
}) {
  const [selectedImage, setSelectedImage] = useState<CompressedClientImage | null>(null);
  const [imageError, setImageError] = useState("");
  const [imageNotice, setImageNotice] = useState("");
  const [compressionStatus, setCompressionStatus] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [safetyReady, setSafetyReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedImageRef = useRef<CompressedClientImage | null>(null);

  useEffect(() => {
    selectedImageRef.current = selectedImage;
  }, [selectedImage]);

  useEffect(() => {
    return () => {
      if (selectedImageRef.current) {
        URL.revokeObjectURL(selectedImageRef.current.previewUrl);
      }
    };
  }, []);

  function replaceSelectedImage(nextImage: CompressedClientImage | null) {
    setSelectedImage((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return nextImage;
    });
  }

  function removeSelectedImage() {
    replaceSelectedImage(null);
    setImageError("");
    setImageNotice("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function checkImage(event: ChangeEvent<HTMLInputElement>) {
    const pickedFiles = Array.from(event.target.files ?? []);
    setImageError("");
    setImageNotice("");

    if (pickedFiles.length === 0) {
      return;
    }

    if (pickedFiles.length > 1) {
      setImageError("写真は1枚だけ選択できます。");
      event.target.value = "";
      return;
    }

    const file = pickedFiles[0];

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

    try {
      setIsCompressing(true);
      setCompressionStatus("画像を圧縮しています...");
      await waitForPaint();
      const compressed = await compressClientImage(file, {
        index: 0,
        totalCount: 1,
        fileNamePrefix: "article",
        targetBytes: TARGET_IMAGE_BYTES,
        hardBytes: MAX_COMPRESSED_IMAGE_BYTES,
      });
      replaceSelectedImage(compressed);
      setCompressionStatus("");
    } catch {
      setImageError(
        isHeicLikeImage(file)
          ? "HEIC / HEIFはブラウザで変換できる場合のみ投稿できます。JPEGまたはPNGに変換して再選択してください。"
          : "画像を圧縮できませんでした。別の写真をお試しください。"
      );
    } finally {
      setIsCompressing(false);
      setCompressionStatus("");
      event.target.value = "";
    }
  }

  const validationMessage = useMemo(() => {
    if (imageError) return imageError;
    return "";
  }, [imageError]);
  const busyLabel = isCompressing ? "圧縮中..." : "投稿中...";

  async function submitArticle(formData: FormData) {
    if (imageError || isCompressing || isSubmitting || !safetyReady) return;

    formData.delete("image");
    if (selectedImage) {
      formData.append("image", selectedImage.file, selectedImage.file.name);
    }

    setIsSubmitting(true);

    try {
      await createArticleAction(formData);
    } catch (submitError) {
      setIsSubmitting(false);
      throw submitError;
    }
  }

  return (
    <form action={submitArticle} className="grid gap-4 px-4 pt-4">
      {error ? (
        <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
          {error}
        </div>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">タイトル</span>
        <input
          name="title"
          maxLength={120}
          required
          className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
          placeholder="例：Google口コミ返信を変えたら新規予約が増えた話"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">カテゴリー</span>
        <select name="category" defaultValue={defaultCategory} className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush">
          {ARTICLE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">本文</span>
        <textarea
          name="body"
          rows={9}
          required
          className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
          placeholder="背景、試したこと、結果、学びを書いてください。"
        />
      </label>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-black text-ink">写真</span>
          <span className="text-xs font-black text-mute">最大1枚</span>
        </div>
        <input
          ref={fileInputRef}
          id={imageInputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          onChange={checkImage}
          disabled={isCompressing || isSubmitting || selectedImage != null}
        />

        {selectedImage ? (
          <div className="overflow-hidden rounded-[10px] border border-line bg-white p-3 shadow-sm">
            <img
              src={selectedImage.previewUrl}
              alt="選択した記事写真"
              className="aspect-[16/10] w-full rounded-[8px] object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="mt-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-1 break-all text-[0.68rem] font-black text-ink">{selectedImage.sourceFile.name}</p>
                <p className="mt-1 text-[0.64rem] font-semibold text-mute">
                  {selectedImage.mimeType.replace("image/", "").toUpperCase()} / {fileSizeLabel(selectedImage.byteSize)}
                </p>
              </div>
              <button
                type="button"
                onClick={removeSelectedImage}
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white px-3 text-[0.68rem] font-black text-mute"
              >
                <Trash2 aria-hidden="true" size={14} />
                削除
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor={imageInputId}
            className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-blush/50 bg-blushSoft px-3 py-4 text-sm font-black text-blush"
          >
            <ImagePlus aria-hidden="true" size={24} />
            写真を追加
            <span className="text-[0.68rem] font-semibold text-mute">画像なしでも投稿できます</span>
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
        <p className="font-black text-ink/70">投稿ルール</p>
        <p className="mt-1">
          企業・団体から依頼された投稿、報酬や商品提供を受けた投稿、告知・販売を主目的とする投稿は、PR・協賛掲載として扱う場合があります。
        </p>
        <p className="mt-1">
          講習会・コンクールのレポートは、参加して感じたこと、学んだこと、次に活かしたいことを自由に残してください。
        </p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">この記事で伝えたいこと</span>
        <textarea
          name="takeaway"
          rows={3}
          className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
          placeholder="読んだ人に一番持ち帰ってほしいこと。"
        />
      </label>

      {canSetEditorPick ? (
        <label className="flex items-start gap-2 rounded-[8px] border border-blush/20 bg-blushSoft px-3 py-3 text-sm font-black leading-relaxed text-ink">
          <input type="checkbox" name="editorPick" value="1" className="mt-1 h-4 w-4 shrink-0 accent-blush" />
          <span>EDITOR&apos;S PICKに掲載する</span>
        </label>
      ) : null}

      <SafetyChecklist
        title="記事投稿前の確認"
        body="経験記事は、あなたの実体験・工夫・学びを共有する場所です。断定的な効果保証、他店批判、無断転載、PR表記のない広告投稿は避けてください。講習会・コンクールのレポートは、参加して感じたことや次に活かしたいことを中心に残してください。"
        items={articleSafetyItems}
        onRequiredCompleteChange={setSafetyReady}
      />

      {!safetyReady ? <p className="text-[0.68rem] font-bold text-mute">確認欄にチェックすると送信できます。</p> : null}
      <SubmitButton
        disabledByValidation={Boolean(imageError) || isCompressing || !safetyReady}
        busy={isCompressing || isSubmitting}
        busyLabel={busyLabel}
      />

      <button type="button" disabled className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] border border-line bg-neutral-50 text-sm font-black text-mute">
        <Save aria-hidden="true" size={17} />
        下書き
      </button>
    </form>
  );
}
