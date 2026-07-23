"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  compressClientImage,
  fileSizeLabel,
  isHeicLikeImage,
  waitForPaint,
  type CompressedClientImage,
} from "@/lib/clientImageCompression";
import { isAllowedSnapSourceImageFile } from "@/lib/imageValidation";
import { backRoomTheme } from "@/lib/backRoomTheme";
import { BACKROOM_SOURCE_IMAGE_MAX_BYTES } from "@/lib/backroomImages";

const TARGET_IMAGE_BYTES = 900 * 1024;
const MAX_COMPRESSED_IMAGE_BYTES = 2 * 1024 * 1024;

type BackroomImageAttachmentProps = {
  inputId: string;
  onPreparedImageChange: (image: CompressedClientImage | null) => void;
  onBusyChange: (busy: boolean) => void;
};

export function BackroomImageAttachment({
  inputId,
  onPreparedImageChange,
  onBusyChange,
}: BackroomImageAttachmentProps) {
  const [image, setImage] = useState<CompressedClientImage | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<CompressedClientImage | null>(null);

  useEffect(() => {
    imageRef.current = image;
  }, [image]);

  useEffect(() => {
    return () => {
      if (imageRef.current) URL.revokeObjectURL(imageRef.current.previewUrl);
    };
  }, []);

  function clearImage() {
    setImage((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    onPreparedImageChange(null);
    setError("");
    setStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");
    setStatus("");

    if (!file) return;

    if (!isAllowedSnapSourceImageFile(file)) {
      clearImage();
      setError("JPEG、PNG、WebPに対応しています。HEIC / HEIFはブラウザで変換できる場合だけ利用できます。");
      return;
    }

    if (file.size > BACKROOM_SOURCE_IMAGE_MAX_BYTES) {
      clearImage();
      setError("画像は1枚10MB以下にしてください。");
      return;
    }

    setImage((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    onPreparedImageChange(null);
    onBusyChange(true);

    try {
      setStatus("画像を圧縮しています...");
      await waitForPaint();
      const compressed = await compressClientImage(file, {
        fileNamePrefix: "backroom",
        targetBytes: TARGET_IMAGE_BYTES,
        hardBytes: MAX_COMPRESSED_IMAGE_BYTES,
        preserveAlpha: true,
      });
      setImage(compressed);
      onPreparedImageChange(compressed);
      setStatus("");
    } catch {
      setError(
        isHeicLikeImage(file)
          ? "HEIC / HEIFをブラウザで変換できませんでした。JPEGまたはPNGへ変換して再選択してください。"
          : "画像を圧縮できませんでした。別の画像をお試しください。"
      );
      setStatus("");
      onPreparedImageChange(null);
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-black text-ink">画像を追加</span>
        <span className="text-[0.68rem] font-semibold text-mute">1枚 / JPEG・PNG・WebP</span>
      </div>

      {image ? (
        <div className="relative overflow-hidden rounded-[8px] border border-line bg-neutral-50">
          <img
            src={image.previewUrl}
            alt="選択中の画像プレビュー"
            className="block max-h-[32rem] w-full bg-neutral-950 object-contain"
            loading="lazy"
            decoding="async"
          />
          <button
            type="button"
            onClick={clearImage}
            aria-label="選択画像を取り消す"
            className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-95"
          >
            <X aria-hidden="true" size={17} />
          </button>
          <div className="flex items-center justify-between gap-2 p-2 text-[0.68rem] font-bold text-mute">
            <span>{image.mimeType.replace("image/", "").toUpperCase()}</span>
            <span>{fileSizeLabel(image.byteSize)}</span>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={
            "flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-dashed px-3 py-4 text-sm font-black transition active:scale-[0.98] " +
            backRoomTheme.notice
          }
        >
          {status ? <Loader2 aria-hidden="true" size={19} className="animate-spin" /> : <ImagePlus aria-hidden="true" size={20} />}
          {status || "画像を追加"}
        </label>
      )}

      <input
        ref={fileInputRef}
        id={inputId}
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        aria-label="Back Room投稿に添付する画像を選択"
        className="sr-only"
        onChange={handleChange}
        disabled={Boolean(status)}
      />

      {status ? <p className="text-xs font-bold text-mute">元画像10MB以下、圧縮後2MB以内で送信します。</p> : null}
      {error ? <p className="rounded-[8px] border border-red-200 bg-red-50 p-2 text-xs font-bold leading-relaxed text-red-700">{error}</p> : null}
    </div>
  );
}
