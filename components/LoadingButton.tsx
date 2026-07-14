"use client";

import { Loader2 } from "lucide-react";
import { type ReactNode } from "react";
import { useFormStatus } from "react-dom";

type LoadingSubmitButtonProps = {
  children: ReactNode;
  pendingText?: string;
  className: string;
  disabled?: boolean;
  ariaPressed?: boolean;
};

export function LoadingSubmitButton({
  children,
  pendingText = "送信中...",
  className,
  disabled = false,
  ariaPressed,
}: LoadingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={pending}
      aria-pressed={ariaPressed}
      className={
        className +
        " transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 " +
        (pending ? "pointer-events-none" : "")
      }
    >
      {pending ? (
        <>
          <Loader2 aria-hidden="true" size={16} className="animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
