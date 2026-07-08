"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";

type PendingLinkProps = {
  href: string;
  children: ReactNode;
  className: string;
  pendingLabel?: string;
  ariaLabel?: string;
};

export function PendingLink({ href, children, className, pendingLabel, ariaLabel }: PendingLinkProps) {
  const [pending, setPending] = useState(false);

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-busy={pending}
      onClick={() => setPending(true)}
      className={
        className +
        " transition active:scale-[0.98] " +
        (pending ? "pointer-events-none opacity-70" : "")
      }
    >
      {pending && pendingLabel ? (
        <>
          <Loader2 aria-hidden="true" size={16} className="animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Link>
  );
}
