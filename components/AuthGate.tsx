"use client";

import { LockKeyhole, X } from "lucide-react";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";

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
    href: "/signup?next=/backroom",
  },
  jobs: {
    title: "求人掲載には会員登録が必要です",
    body: "BARBER HUBでは、理容業界に関心のある学生・理容師へ求人情報を届けられます。掲載を始めるには無料登録が必要です。",
    cta: "無料で会員登録する",
    href: "/signup?next=/post/job",
  },
};

type AuthRequiredModalProps = {
  kind?: GateKind;
  targetHref?: string;
  onClose: () => void;
};

function defaultNextForKind(kind: GateKind) {
  if (kind === "backyard") return "/backroom";
  if (kind === "jobs") return "/post/job";
  return "/mypage";
}

function useAuthState() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { ready, userEmail, isLoggedIn: userEmail != null };
}

function AuthRequiredModal({ kind = "default", targetHref, onClose }: AuthRequiredModalProps) {
  const copy = copyMap[kind];
  const next = targetHref ?? defaultNextForKind(kind);
  const signupHref = pathWithParams("/signup", { next });
  const loginHref = pathWithParams("/login", { next });

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
          <Link href={signupHref} className="inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            {copy.cta}
          </Link>
          <Link href={loginHref} className="inline-flex h-11 items-center justify-center rounded-[8px] border border-line bg-white px-4 text-sm font-black text-ink">
            ログイン
          </Link>
        </div>
        <button className="mt-2 h-10 w-full rounded-[8px] text-xs font-black text-mute" onClick={onClose}>
          あとで見る
        </button>
      </div>
    </div>
  );
}

type AuthGateLinkProps = {
  children: ReactNode;
  href?: string;
  className?: string;
  kind?: GateKind;
  ariaLabel?: string;
  signupNextHref?: string;
};

export function AuthGateLink({ children, href, className, kind = "default", ariaLabel, signupNextHref }: AuthGateLinkProps) {
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const { isLoggedIn } = useAuthState();

  if (isLoggedIn && href) {
    return (
      <Link
        href={href}
        className={(className ?? "") + (navigating ? " pointer-events-none opacity-70" : "")}
        aria-label={ariaLabel}
        aria-busy={navigating}
        onClick={() => setNavigating(true)}
      >
        {children}
      </Link>
    );
  }

  return (
    <>
      <button type="button" aria-label={ariaLabel} className={className} onClick={() => !isLoggedIn && setOpen(true)}>
        {children}
      </button>
      {open ? <AuthRequiredModal kind={kind} targetHref={signupNextHref ?? href} onClose={() => setOpen(false)} /> : null}
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
  const { isLoggedIn } = useAuthState();

  return (
    <>
      <button type="button" aria-label={ariaLabel} className={className} onClick={() => !isLoggedIn && setOpen(true)}>
        {children}
      </button>
      {open ? <AuthRequiredModal kind={kind} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function SignupRequiredCard({ kind = "default" }: { kind?: GateKind }) {
  const copy = copyMap[kind];
  const { isLoggedIn, userEmail } = useAuthState();

  if (isLoggedIn) {
    return (
      <section className="px-4 pt-5">
        <div className="rounded-[8px] border border-line bg-white p-5 shadow-sm">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-blushSoft text-blush">
            <LockKeyhole aria-hidden="true" size={23} />
          </div>
          <h1 className="mt-4 text-[1.5rem] font-black leading-tight text-ink">ログイン済みです</h1>
          <p className="mt-2 break-words text-sm font-medium leading-relaxed text-mute">
            ログイン中: {userEmail}
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            この機能の本番データ保存は次のPhaseで接続します。
          </p>
        </div>
      </section>
    );
  }

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
        <Link href="/login" className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-[8px] border border-line bg-white text-sm font-black text-ink">
          ログイン
        </Link>
        <p className="mt-3 text-center text-xs font-bold text-mute">
          読むだけなら無料。参加すると、もっと広がる。
        </p>
      </div>
    </section>
  );
}
