"use client";

import { Trash2 } from "lucide-react";
import { type FormEvent, useRef } from "react";
import { LoadingSubmitButton } from "@/components/LoadingButton";

const DELETE_CONFIRMATION = "このスレッドを削除すると、本文・コメント・添付画像は元に戻せません。削除しますか？";

type BackroomThreadDeleteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  postId: string;
};

export function BackroomThreadDeleteForm({ action, postId }: BackroomThreadDeleteFormProps) {
  const submittedRef = useRef(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submittedRef.current || !window.confirm(DELETE_CONFIRMATION)) {
      event.preventDefault();
      return;
    }

    submittedRef.current = true;
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="postId" value={postId} />
      <LoadingSubmitButton
        pendingText="削除しています..."
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-red-500 bg-white px-4 text-sm font-black text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
      >
        <Trash2 aria-hidden="true" size={17} />
        このスレッドを削除
      </LoadingSubmitButton>
    </form>
  );
}
