"use client";

import { Loader2, Send } from "lucide-react";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { BackroomImageAttachment } from "@/components/BackroomImageAttachment";
import type { CompressedClientImage } from "@/lib/clientImageCompression";
import { backRoomTheme } from "@/lib/backRoomTheme";

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
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] text-sm font-black transition active:scale-[0.98] " +
        (isDisabled ? "cursor-not-allowed bg-neutral-200 text-mute" : backRoomTheme.primaryButton)
      }
    >
      <Send aria-hidden="true" size={16} />
      {pending ? "コメント中..." : "コメント投稿"}
    </button>
  );
}

export function BackroomCommentForm({
  action,
  postId,
  error,
}: {
  action: ServerAction;
  postId: string;
  error?: string;
}) {
  const [body, setBody] = useState("");
  const [selectedImage, setSelectedImage] = useState<CompressedClientImage | null>(null);
  const selectedImageRef = useRef<CompressedClientImage | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = body.trim().length > 0 || selectedImage != null;

  function handleImageChange(image: CompressedClientImage | null) {
    selectedImageRef.current = image;
    setSelectedImage(image);
  }

  async function submit(formData: FormData) {
    if (!canSubmit || isCompressing || isSubmitting) return;

    formData.set("body", body);
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
    <form action={submit} className="rounded-[10px] border border-line bg-white p-3 shadow-sm">
      <input type="hidden" name="postId" value={postId} />
      {error ? <div className="mb-3 rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">{error}</div> : null}
      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">コメントする</span>
        <textarea
          name="body"
          rows={4}
          maxLength={1000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className={"resize-none rounded-[8px] border border-line bg-neutral-50 px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:bg-white " + backRoomTheme.focusRing}
          placeholder="本文または画像を残してください。"
        />
      </label>

      <div className="mt-3">
        <BackroomImageAttachment
          inputId="backroom-comment-image-input"
          onPreparedImageChange={handleImageChange}
          onBusyChange={setIsCompressing}
        />
      </div>

      {!canSubmit && !isCompressing ? <p className="mt-2 text-xs font-bold text-mute">本文または画像を1つ以上入力してください。</p> : null}
      {isCompressing ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-mute">
          <Loader2 aria-hidden="true" size={13} className="animate-spin" /> 圧縮中...
        </p>
      ) : null}
      <SubmitButton disabled={!canSubmit || isCompressing || isSubmitting} />
      <p className="mt-2 text-[0.68rem] font-medium leading-relaxed text-mute">
        相手への敬意を持ってコメントしてください。個人攻撃、実名批判、顧客情報、他店への誹謗中傷は投稿できません。
      </p>
    </form>
  );
}
