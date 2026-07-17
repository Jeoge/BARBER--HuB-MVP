"use client";

import { useFormStatus } from "react-dom";

export function OpenBarberHubSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={
        "inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white transition " +
        "active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blush " +
        "disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-mute disabled:active:scale-100"
      }
    >
      {pending ? "確認しています..." : "BARBER HUBを開く"}
    </button>
  );
}
