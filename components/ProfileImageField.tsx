"use client";

import { Camera, ImagePlus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

type ProfileImageFieldProps = {
  label: string;
  currentUrl?: string | null;
  shape: "circle" | "wide";
  libraryInputName: string;
  cameraInputName: string;
  removeInputName: string;
  cameraCapture: "user" | "environment";
};

function actionButtonClassName(extra = "") {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border px-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush focus-visible:ring-offset-2 active:translate-y-px ${extra}`;
}

export function ProfileImageField({
  label,
  currentUrl,
  shape,
  libraryInputName,
  cameraInputName,
  removeInputName,
  cameraCapture,
}: ProfileImageFieldProps) {
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const [removePending, setRemovePending] = useState(false);

  useEffect(() => {
    return () => {
      if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
    };
  }, [selectedPreviewUrl]);

  const clearFileInputs = () => {
    if (libraryInputRef.current) libraryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, source: "library" | "camera") => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    if (source === "library" && cameraInputRef.current) cameraInputRef.current.value = "";
    if (source === "camera" && libraryInputRef.current) libraryInputRef.current.value = "";

    setSelectedFile(file);
    setSelectedPreviewUrl(URL.createObjectURL(file));
    setRemovePending(false);
  };

  const cancelSelection = () => {
    clearFileInputs();
    setSelectedFile(null);
    setSelectedPreviewUrl(null);
    setRemovePending(false);
  };

  const scheduleRemoval = () => {
    clearFileInputs();
    setSelectedFile(null);
    setSelectedPreviewUrl(null);
    setRemovePending(true);
  };

  const cancelRemoval = () => {
    setRemovePending(false);
  };

  const previewUrl = selectedPreviewUrl ?? (removePending ? null : currentUrl ?? null);
  const previewClassName =
    shape === "circle" ? "h-20 w-20 rounded-full object-cover" : "aspect-[16/7] w-full rounded-[7px] object-cover";
  const fallbackClassName =
    shape === "circle"
      ? "grid h-20 w-20 place-items-center rounded-full bg-neutral-100 text-[0.68rem] font-black text-mute"
      : "grid aspect-[16/7] w-full place-items-center rounded-[7px] bg-neutral-100 text-[0.68rem] font-black text-mute";

  return (
    <div className="grid min-w-0 gap-2">
      <span className="text-sm font-black text-ink">{label}</span>
      <div className="overflow-hidden rounded-[8px] border border-line bg-neutral-50 p-2">
        {previewUrl ? <img src={previewUrl} alt="" className={previewClassName} /> : <div className={fallbackClassName}>写真なし</div>}
      </div>

      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        <button
          type="button"
          className={actionButtonClassName("border-line bg-white text-ink hover:border-blush/60")}
          onClick={() => libraryInputRef.current?.click()}
        >
          <ImagePlus aria-hidden="true" size={17} className="shrink-0 text-blush" />
          フォトライブラリ
        </button>
        <button
          type="button"
          className={actionButtonClassName("border-line bg-white text-ink hover:border-blush/60")}
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera aria-hidden="true" size={17} className="shrink-0 text-blush" />
          写真を撮る
        </button>
      </div>

      <input
        ref={libraryInputRef}
        name={libraryInputName}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleFileChange(event, "library")}
      />
      <input
        ref={cameraInputRef}
        name={cameraInputName}
        type="file"
        accept="image/*"
        capture={cameraCapture}
        className="sr-only"
        onChange={(event) => handleFileChange(event, "camera")}
      />
      <input type="hidden" name={removeInputName} value={removePending ? "1" : ""} readOnly />

      {selectedFile ? (
        <button
          type="button"
          className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush focus-visible:ring-offset-2 active:translate-y-px"
          onClick={cancelSelection}
        >
          <RotateCcw aria-hidden="true" size={14} className="text-mute" />
          選択を取り消す
        </button>
      ) : null}

      {currentUrl && removePending ? (
        <div className="grid gap-2">
          <p className="text-xs font-black text-red-700">保存すると写真を削除します。</p>
          <button
            type="button"
            className={actionButtonClassName("w-fit border-red-200 bg-white text-red-700 hover:border-red-300")}
            onClick={cancelRemoval}
          >
            <RotateCcw aria-hidden="true" size={15} />
            削除を取り消す
          </button>
        </div>
      ) : currentUrl ? (
        <button
          type="button"
          className={actionButtonClassName("w-fit border-red-200 bg-white text-red-700 hover:border-red-300")}
          onClick={scheduleRemoval}
        >
          <Trash2 aria-hidden="true" size={15} />
          写真を削除する
        </button>
      ) : null}

      <span className="text-[0.68rem] font-semibold leading-relaxed text-mute">5MB以下。保存前の選択・削除は確定しません。</span>
    </div>
  );
}
