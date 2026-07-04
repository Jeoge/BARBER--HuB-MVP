"use client";

import { LockKeyhole, X } from "lucide-react";
import Link from "next/link";
import { ReactNode, useState } from "react";

type GateKind = "default" | "backyard" | "jobs";

type Copy = {
  title: string;
  body: string;
  cta: string;
  href: string;
};

const copyMap: Record<GateKind, Copy> = {
  default: {
    title: "会員登録が必要です",
    body: "この機能はBARBER HUB会員限定です。無料登録すると、投稿・Thanks・Back Room・求人登録が使えるようになります。",
    cta: "無料で会員登録する",
    href: "/signup",
  },
  backyard: {
    title: "Back Roomは理美容業界向けです",
    body: "理容師を中心に、理美容業界の人が仕事終わりに技術・道具・経営・今日あったことを話せる会員限定エリアです。安心して使える場所にするため、会員登録が必要です。",
    cta: "会員登録して設定へ",
    href: "/signup?next=/backyard/setup",
  },
  jobs: {
    title: "求人掲載には会員登録が必要です",
    body: "BARBER HUBでは、理容業界に関心のある学生・理容師へ求人情報を届けられます。掲載を始めるには無料登録が必要です。",
    cta: "無料で会員登録する",
    href: "/signup?next=/jobs/register",
  },
};

type AuthRequiredModalProps = {
  kind?: GateKind;
  onClose: () => void;
};

function AuthRequiredModal({ kind = "default", onClose }: AuthRequiredModalProps) {
  const copy = copyMap[kind];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35 px-4 pb-4">
      <div className="w-full max-w-[398px] rounded-[8px] bg-white p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
              <LockKeyhole aria-hidden="true" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight text-ink">{copy.title}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-mute">{copy.body}</p>
            </div>
          </div>
          <button aria-label="閉じる" className="grid h-8 w-8 place-items-center rounded-full bg-neutral-50" onClick={onClose}>
            <X aria-hidden="true" size={17} />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <Link href={copy.href} className="inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            {copy.cta}
          </Link>
          <button className="h-11 rounded-[8px] border border-line bg-white px-4 text-sm font-black text-ink" onClick={onClose}>
            あとで見る
          </button>
        </div>
      </div>
    </div>
  );
}

type AuthGateLinkProps = {
  children: ReactNode;
  className?: string;
  kind?: GateKind;
  ariaLabel?: string;
};

export function AuthGateLink({ children, className, kind = "default", ariaLabel }: AuthGateLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" aria-label={ariaLabel} className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open ? <AuthRequiredModal kind={kind} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

type AuthGateButtonProps = {
  children: ReactNode;
  className?: string;
  kind?: GateKind;
  ariaLabel?: string;
};

export function AuthGateButton({ children, className, kind = "default", ariaLabel }: AuthGateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" aria-label={ariaLabel} className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open ? <AuthRequiredModal kind={kind} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function SignupRequiredCard({ kind = "default" }: { kind?: GateKind }) {
  const copy = copyMap[kind];

  return (
    <section className="px-4 pt-5">
      <div className="rounded-[8px] border border-blush/20 bg-white p-5 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-blushSoft text-blush">
          <LockKeyhole aria-hidden="true" size={23} />
        </div>
        <h1 className="mt-4 text-[1.5rem] font-black leading-tight text-ink">{copy.title}</h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-mute">{copy.body}</p>
        <Link href={copy.href} className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[8px] bg-blush text-sm font-black text-white">
          {copy.cta}
        </Link>
        <p className="mt-3 text-center text-xs font-bold text-mute">
          読むだけなら無料。参加すると、もっと広がる。
        </p>
      </div>
    </section>
  );
}
