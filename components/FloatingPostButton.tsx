"use client";

import {
  BriefcaseBusiness,
  Building2,
  Camera,
  FilePenLine,
  FileText,
  Megaphone,
  MessageSquare,
  Plus,
  ShieldCheck,
  Trophy,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  canCreateArticle,
  canCreateBackroom,
  canCreateJob,
  canCreateQa,
  canCreateReport,
  canCreateSnap,
  canCreateSuccession,
  classifyAccountType,
  type AccountProfileLike,
} from "@/lib/accountTypes";
import type { PostCapability } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { AuthGateLink } from "./AuthGate";

type MenuProfile = AccountProfileLike;

type PostItem = {
  label: string;
  icon: typeof Camera;
  href: string;
  capability: PostCapability;
  kind?: "backyard" | "jobs" | "succession";
  signupNextHref?: string;
};

const postItems: PostItem[] = [
  { label: "スナップ投稿", icon: Camera, href: "/post/snap", capability: "snap" },
  { label: "経験記事を書く", icon: FilePenLine, href: "/post/article", capability: "article" },
  { label: "Q&Aで相談する", icon: MessageSquare, href: "/post/qa", capability: "qa" },
  { label: "Back Roomに投稿", icon: ShieldCheck, href: "/post/backroom", capability: "backroom", kind: "backyard", signupNextHref: "/post/backroom" },
  { label: "講習会レポートを書く", icon: Video, href: "/post/article?category=seminar_report", capability: "report" },
  { label: "コンクールレポートを書く", icon: Trophy, href: "/post/article?category=competition_report", capability: "report" },
  { label: "求人を掲載する", icon: BriefcaseBusiness, href: "/post/job", capability: "job", kind: "jobs", signupNextHref: "/post/job" },
  { label: "開業・承継を掲載", icon: Building2, href: "/post/succession", capability: "succession", kind: "succession", signupNextHref: "/post/succession" },
];

function canUseCapability(profile: MenuProfile | null, capability: PostCapability) {
  if (capability === "snap") return canCreateSnap(profile);
  if (capability === "article") return canCreateArticle(profile);
  if (capability === "report") return canCreateReport(profile);
  if (capability === "qa") return canCreateQa(profile);
  if (capability === "backroom") return canCreateBackroom(profile);
  if (capability === "job") return canCreateJob(profile);
  return canCreateSuccession(profile);
}

export function FloatingPostButton() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<MenuProfile | null>(null);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadProfile(userId: string) {
      const primary = await supabase
        .from("profiles")
        .select("job_type, salon_name, shop_address")
        .eq("id", userId)
        .maybeSingle<MenuProfile>();

      if (!active) return;

      if (primary.error) {
        const fallback = await supabase
          .from("profiles")
          .select("job_type, salon_name")
          .eq("id", userId)
          .maybeSingle<Pick<MenuProfile, "job_type" | "salon_name">>();

        if (!active) return;

        if (fallback.error) {
          setProfile(null);
          setProfileError(true);
          setReady(true);
          return;
        }

        setProfile(fallback.data ? { ...fallback.data, shop_address: null } : null);
        setProfileError(false);
        setReady(true);
        return;
      }

      setProfile(primary.data);
      setProfileError(false);
      setReady(true);
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;

      const user = data.user;
      setIsLoggedIn(user != null);

      if (user == null) {
        setProfile(null);
        setReady(true);
        return;
      }

      void loadProfile(user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      const user = session?.user ?? null;
      setIsLoggedIn(user != null);
      setReady(false);

      if (user == null) {
        setProfile(null);
        setProfileError(false);
        setReady(true);
        return;
      }

      void loadProfile(user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const accountClassification = classifyAccountType(profile);
  const allowedItems = postItems.filter((item) => canUseCapability(profile, item.capability));

  return (
    <div className="global-post-fab pointer-events-none fixed bottom-[4.5rem] left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 px-4">
      {open ? (
        <div className="pointer-events-auto mb-2.5 ml-auto w-64 rounded-[8px] border border-line/80 bg-white p-2 shadow-[0_14px_30px_rgba(17,17,17,0.1)]">
          <div className="mb-1 flex items-center gap-2 px-3 py-2 text-[0.72rem] font-black text-mute">
            <FileText aria-hidden="true" size={15} className="text-blush" />
            投稿メニュー
          </div>
          {!isLoggedIn ? (
            postItems.map(({ label, icon: Icon, href, kind, signupNextHref }) => (
              <AuthGateLink
                key={label}
                href={href}
                className="flex w-full items-center gap-2 rounded-[7px] px-3 py-2.5 text-left text-sm font-semibold text-ink transition active:scale-[0.98] disabled:opacity-60"
                kind={kind}
                ariaLabel={label}
                signupNextHref={signupNextHref}
              >
                <Icon aria-hidden="true" size={18} className="text-blush" />
                {label}
              </AuthGateLink>
            ))
          ) : !ready ? (
            <p className="rounded-[8px] bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
              登録区分を確認しています。
            </p>
          ) : profileError || accountClassification === "unset" || accountClassification === "unknown" ? (
            <div className="grid gap-2 px-2 pb-2">
              <p className="rounded-[8px] bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
                投稿するには登録区分の設定が必要です。
              </p>
              <Link href="/mypage/profile/edit" className="inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-3 text-xs font-black text-white">
                登録区分を設定する
              </Link>
            </div>
          ) : accountClassification === "organization" ? (
            <div className="grid gap-2 px-2 pb-2">
              <div className="rounded-[8px] bg-neutral-50 p-3">
                <div className="flex items-center gap-2 text-sm font-black text-ink">
                  <Megaphone aria-hidden="true" size={17} className="text-blush" />
                  PR・協賛導線
                </div>
                <p className="mt-2 text-xs font-bold leading-relaxed text-mute">
                  この登録区分では、通常のSnap・記事投稿はできません。告知・PR・協賛掲載をご希望の場合は、運営確認後に掲載できます。
                </p>
              </div>
              <Link href="/advertising" className="inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-3 text-xs font-black text-white">
                広告掲載・協賛を相談する
              </Link>
              <Link href="/advertising/apply" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">
                公式告知を問い合わせる
              </Link>
            </div>
          ) : (
            allowedItems.map(({ label, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="flex w-full items-center gap-2 rounded-[7px] px-3 py-2.5 text-left text-sm font-semibold text-ink transition active:scale-[0.98]"
                aria-label={label}
                onClick={() => setOpen(false)}
              >
                <Icon aria-hidden="true" size={18} className="text-blush" />
                {label}
              </Link>
            ))
          )}
        </div>
      ) : null}
      <button
        className="pointer-events-auto ml-auto grid h-9 w-9 place-items-center rounded-full bg-blush text-white shadow-[0_6px_14px_rgba(255,59,134,0.18)] transition active:scale-90"
        aria-label={open ? "投稿メニューを閉じる" : "投稿メニューを開く"}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X aria-hidden="true" size={19} /> : <Plus aria-hidden="true" size={23} />}
      </button>
    </div>
  );
}
