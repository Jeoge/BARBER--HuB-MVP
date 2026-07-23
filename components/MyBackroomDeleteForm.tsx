"use client";

import { type FormEvent, type SyntheticEvent, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type MyBackroomDeleteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  postId: string;
  category: string;
  title: string;
  excerpt: string;
};

type DeleteDialogActionsProps = {
  isSubmitting: boolean;
  onCancel: () => void;
};

function DeleteDialogActions({ isSubmitting, onCancel }: DeleteDialogActionsProps) {
  const { pending } = useFormStatus();
  const isBusy = pending || isSubmitting;

  return (
    <div className="mt-4 grid gap-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={isBusy}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[8px] border border-line bg-white px-4 text-sm font-black text-mute focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        キャンセル
      </button>
      <button
        type="submit"
        disabled={isBusy}
        aria-busy={isBusy}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isBusy ? "削除しています..." : "削除する"}
      </button>
    </div>
  );
}

export function MyBackroomDeleteForm({ action, postId, category, title, excerpt }: MyBackroomDeleteFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const submittedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  function openConfirmation() {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }

  function closeConfirmation() {
    if (submittedRef.current) return;

    dialogRef.current?.close();
    triggerRef.current?.focus();
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    if (!submittedRef.current) closeConfirmation();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submittedRef.current) {
      event.preventDefault();
      return;
    }

    submittedRef.current = true;
    setIsSubmitting(true);
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="mt-2">
      <input type="hidden" name="postId" value={postId} />
      <button
        ref={triggerRef}
        type="button"
        onClick={openConfirmation}
        className="inline-flex h-9 w-full items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-mute focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush focus-visible:ring-offset-2"
      >
        このスレッドを削除
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-modal="true"
        onCancel={handleCancel}
        className="fixed inset-0 m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-md rounded-[8px] border border-line bg-white p-4 text-ink shadow-lg backdrop:bg-black/30"
      >
        <h2 id={titleId} className="text-base font-black">
          このスレッドを削除しますか？
        </h2>
        <p id={descriptionId} className="mt-2 text-sm font-medium leading-relaxed text-mute">
          削除すると元に戻せません。
        </p>
        <div className="mt-3 rounded-[8px] bg-neutral-50 p-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[0.66rem] font-bold text-mute">
            <span className="rounded-full bg-white px-2 py-0.5 font-black text-blush">{category}</span>
            <span>Back Roomスレッド</span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-black leading-relaxed text-ink">{title}</p>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{excerpt}</p>
        </div>
        <DeleteDialogActions isSubmitting={isSubmitting} onCancel={closeConfirmation} />
      </dialog>
    </form>
  );
}
