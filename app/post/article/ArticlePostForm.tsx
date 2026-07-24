"use client";

import { Image as ImageIcon, ImagePlus, Save, Send, Trash2 } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { SafetyChecklist } from "@/components/SafetyChecklist";
import {
  articleImageMarker,
  MAX_ARTICLE_IMAGE_COUNT,
  removeArticleImageMarkerReferences,
  shouldShowArticleVideoRightsConfirmation,
} from "@/lib/articleMedia";
import { ARTICLE_CATEGORIES, isPaidEligibleArticleCategory, supportsArticleYoutubeUrl } from "@/lib/articleCategories";
import { PAID_ARTICLE_PRICES } from "@/lib/monetization";
import {
  compressClientImage,
  fileSizeLabel,
  isHeicLikeImage,
  waitForPaint,
  type CompressedClientImage,
} from "@/lib/clientImageCompression";
import { isAllowedSnapSourceImageFile } from "@/lib/imageValidation";
import { createArticleAction } from "./actions";

const MAX_SOURCE_IMAGE_SIZE = 25 * 1024 * 1024;
const TARGET_IMAGE_BYTES = 900 * 1024;
const MAX_TOTAL_COMPRESSED_IMAGE_BYTES = 4 * 1024 * 1024;
const imageInputId = "article-image-input";

const baseArticleSafetyItems = [
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

const youtubeSafetyItem = {
  name: "articleVideoRightsConfirmed",
  label: "動画URLは自分が公開権限を持ち、関係者の許可に配慮したものです。",
};

type SelectedArticleImage = CompressedClientImage;

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
  paidPublishingEnabled,
}: {
  defaultCategory: string;
  error?: string;
  canSetEditorPick: boolean;
  paidPublishingEnabled: boolean;
}) {
  const [category, setCategory] = useState(defaultCategory);
  const [body, setBody] = useState("");
  const [paidBody, setPaidBody] = useState("");
  const [accessType, setAccessType] = useState<"free" | "paid">("free");
  const [priceAmount, setPriceAmount] = useState<number>(PAID_ARTICLE_PRICES[1]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedArticleImage[]>([]);
  const [imageError, setImageError] = useState("");
  const [imageNotice, setImageNotice] = useState("");
  const [compressionStatus, setCompressionStatus] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [safetyReady, setSafetyReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const selectedImagesRef = useRef<SelectedArticleImage[]>([]);
  const paidEligible = isPaidEligibleArticleCategory(category);
  const isPaidArticle = paidPublishingEnabled && paidEligible && accessType === "paid";
  const bodyRequired = body.trim().length === 0 || (isPaidArticle && paidBody.trim().length === 0);
  const youtubeEnabled = supportsArticleYoutubeUrl(category);
  const youtubeVideoConfirmationRequired = shouldShowArticleVideoRightsConfirmation(youtubeEnabled, youtubeUrl);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    if (!youtubeEnabled && youtubeUrl) {
      setYoutubeUrl("");
    }
  }, [youtubeEnabled, youtubeUrl]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  function replaceSelectedImages(nextImages: SelectedArticleImage[]) {
    setSelectedImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return nextImages;
    });
  }

  function removeSelectedImage(imageId: string) {
    const removeIndex = selectedImages.findIndex((image) => image.id === imageId);
    if (removeIndex < 0) return;

    setSelectedImages((current) => {
      const target = current[removeIndex];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== imageId);
    });
    setBody((current) => removeArticleImageMarkerReferences(current, removeIndex));
    setImageError("");
    setImageNotice("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function compressAndSetImages(sourceFiles: File[]) {
    const compressed: SelectedArticleImage[] = [];
    const totalCount = sourceFiles.length;

    try {
      for (let index = 0; index < totalCount; index += 1) {
        setCompressionStatus(`画像を圧縮しています... ${index + 1} / ${totalCount}`);
        await waitForPaint();
        compressed.push(
          await compressClientImage(sourceFiles[index], {
            index,
            totalCount,
            fileNamePrefix: "article",
            targetBytes: TARGET_IMAGE_BYTES,
            hardBytes: MAX_TOTAL_COMPRESSED_IMAGE_BYTES,
          })
        );
      }
    } catch (error) {
      compressed.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      throw error;
    }

    const totalBytes = compressed.reduce((sum, image) => sum + image.byteSize, 0);

    if (totalBytes > MAX_TOTAL_COMPRESSED_IMAGE_BYTES) {
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
      return;
    }

    const remainingSlots = MAX_ARTICLE_IMAGE_COUNT - selectedImages.length;

    if (remainingSlots <= 0) {
      setImageNotice("写真は4枚まで選択できます。");
      event.target.value = "";
      return;
    }

    const filesToAdd = pickedFiles.slice(0, remainingSlots);

    if (pickedFiles.length > remainingSlots) {
      setImageNotice("写真は4枚まで選択できます。");
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

    const nextSourceFiles = [...selectedImages.map((image) => image.sourceFile), ...filesToAdd].slice(0, MAX_ARTICLE_IMAGE_COUNT);

    try {
      setIsCompressing(true);
      await compressAndSetImages(nextSourceFiles);
    } catch {
      setImageError(
        filesToAdd.some(isHeicLikeImage)
          ? "HEIC / HEIFはブラウザで変換できる場合のみ投稿できます。JPEGまたはPNGに変換して再選択してください。"
          : "画像を圧縮できませんでした。別の写真をお試しください。"
      );
    } finally {
      setIsCompressing(false);
      setCompressionStatus("");
      event.target.value = "";
    }
  }

  function insertImageMarker(index: number) {
    const textarea = bodyRef.current;
    const marker = articleImageMarker(index);

    if (textarea == null) {
      setBody((current) => `${current.trimEnd()}\n\n${marker}\n\n`.trimStart());
      return;
    }

    const start = textarea.selectionStart ?? body.length;
    const end = textarea.selectionEnd ?? start;
    const before = body.slice(0, start);
    const after = body.slice(end);
    const prefix = before.length === 0 || before.endsWith("\n") ? "" : "\n\n";
    const suffix = after.length === 0 || after.startsWith("\n") ? "" : "\n\n";
    const insertion = `${prefix}${marker}${suffix}`;
    const nextBody = `${before}${insertion}${after}`;
    const nextCursor = before.length + prefix.length + marker.length;

    setBody(nextBody);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }

  const validationMessage = useMemo(() => {
    if (bodyRequired) return "本文を入力してください。";
    if (imageError) return imageError;
    return "";
  }, [bodyRequired, imageError]);
  const busyLabel = isCompressing ? "圧縮中..." : "投稿中...";
  const compressedTotalBytes = selectedImages.reduce((sum, image) => sum + image.byteSize, 0);
  const articleSafetyItems = useMemo(
    () => (youtubeVideoConfirmationRequired ? [...baseArticleSafetyItems, youtubeSafetyItem] : baseArticleSafetyItems),
    [youtubeVideoConfirmationRequired]
  );

  async function submitArticle(formData: FormData) {
    if (bodyRequired || imageError || isCompressing || isSubmitting || !safetyReady) return;

    formData.delete("image");
    formData.delete("images");
    selectedImages.forEach((image) => {
      formData.append("images", image.file, image.file.name);
    });

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

      {paidPublishingEnabled && paidEligible ? (
        <fieldset className="grid gap-2 rounded-[8px] border border-amber-200 bg-amber-50/60 p-3">
          <legend className="px-1 text-sm font-black text-ink">公開設定</legend>
          <label className="flex items-center gap-2 text-sm font-black text-ink"><input type="radio" name="accessType" value="free" checked={accessType === "free"} onChange={() => setAccessType("free")} className="accent-ink" />無料公開</label>
          <label className="flex items-center gap-2 text-sm font-black text-ink"><input type="radio" name="accessType" value="paid" checked={accessType === "paid"} onChange={() => setAccessType("paid")} className="accent-ink" />有料公開</label>
          {accessType === "paid" ? (
            <label className="mt-1 grid gap-1 text-xs font-black text-ink">販売価格
              <select name="priceAmount" value={priceAmount} onChange={(event) => setPriceAmount(Number(event.target.value))} className="h-10 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink">
                {PAID_ARTICLE_PRICES.map((price) => <option key={price} value={price}>{price}円</option>)}
              </select>
            </label>
          ) : null}
          <p className="text-[0.68rem] font-medium leading-relaxed text-mute">無料で多くの人に読んでもらうことで、Treatにつながりやすい場合もあります。</p>
        </fieldset>
      ) : null}

      {category === "経験記事" ? (
        <fieldset className="grid gap-2 rounded-[8px] border border-line bg-neutral-50 p-3">
          <legend className="px-1 text-sm font-black text-ink">経験記事の関連カテゴリ（複数可）</legend>
          <p className="text-[0.68rem] font-medium text-mute">記事一覧やテーマ導線で使う追加カテゴリです。主カテゴリは「経験記事」のまま残ります。</p>
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {ARTICLE_CATEGORIES.filter((item) => item !== "経験記事").map((item) => <label key={item} className="inline-flex items-center gap-1.5 text-xs font-bold text-ink"><input type="checkbox" name="experienceCategory" value={item} className="accent-ink" />{item}</label>)}
          </div>
        </fieldset>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">カテゴリー</span>
        <select
          name="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush"
        >
          {ARTICLE_CATEGORIES.map((categoryOption) => (
            <option key={categoryOption} value={categoryOption}>
              {categoryOption}
            </option>
          ))}
        </select>
      </label>

      {youtubeEnabled ? (
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">YouTube動画URL（任意）</span>
          <input
            name="youtubeUrl"
            type="url"
            maxLength={300}
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <span className="text-[0.68rem] font-semibold leading-relaxed text-mute">
            通常公開または限定公開のURLを設定できます。
          </span>
        </label>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">{isPaidArticle ? "無料公開部分" : "本文"}</span>
        <textarea
          ref={bodyRef}
          name="body"
          rows={9}
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
          placeholder={isPaidArticle ? "購入前に公開する導入・要約を書いてください。" : "背景、試したこと、結果、学びを書いてください。"}
        />
      </label>

      {isPaidArticle ? (
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">ここから有料</span>
          <textarea name="paidBody" rows={9} required value={paidBody} onChange={(event) => setPaidBody(event.target.value)} className="resize-none rounded-[8px] border border-amber-200 bg-amber-50/40 px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-amber-400" placeholder="購入者だけに公開する詳細・手順・数値・学びを書いてください。" />
        </label>
      ) : null}

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-black text-ink">写真</span>
          <span className="text-xs font-black text-mute">写真 {selectedImages.length} / {MAX_ARTICLE_IMAGE_COUNT}</span>
        </div>
        <input
          ref={fileInputRef}
          id={imageInputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="sr-only"
          onChange={checkImages}
          disabled={isCompressing || isSubmitting || selectedImages.length >= MAX_ARTICLE_IMAGE_COUNT}
        />

        {selectedImages.length > 0 ? (
          <div className="overflow-hidden rounded-[10px] border border-line bg-white p-3 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              {selectedImages.map((image, index) => (
                <div key={image.id} className="overflow-hidden rounded-[8px] border border-line bg-neutral-50">
                  <img
                    src={image.previewUrl}
                    alt={`選択した記事写真 ${index + 1}`}
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
                    <div className="mt-2 grid gap-2">
                      <button
                        type="button"
                        onClick={() => insertImageMarker(index)}
                        className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[8px] border border-blush/25 bg-blushSoft text-[0.68rem] font-black text-blush"
                      >
                        <ImageIcon aria-hidden="true" size={14} />
                        本文に挿入
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSelectedImage(image.id)}
                        className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white text-[0.68rem] font-black text-mute"
                      >
                        <Trash2 aria-hidden="true" size={14} />
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {compressedTotalBytes > 0 ? (
              <p className="mt-3 text-xs font-bold text-mute">圧縮後 合計 {fileSizeLabel(compressedTotalBytes)}</p>
            ) : null}
            {selectedImages.length < MAX_ARTICLE_IMAGE_COUNT ? (
              <label
                htmlFor={imageInputId}
                className="mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white text-xs font-black text-ink"
              >
                <ImagePlus aria-hidden="true" size={15} />
                写真を追加する
              </label>
            ) : null}
          </div>
        ) : (
          <label
            htmlFor={imageInputId}
            className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-blush/50 bg-blushSoft px-3 py-4 text-sm font-black text-blush"
          >
            <ImagePlus aria-hidden="true" size={24} />
            写真を追加
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
        disabledByValidation={bodyRequired || Boolean(imageError) || isCompressing || !safetyReady}
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
