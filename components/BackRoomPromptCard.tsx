import { ChevronRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { articleTopicLabel, type ArticleTopicSlug } from "@/lib/articleCategories";
import { pathWithParams } from "@/lib/auth/redirects";
import type { BackRoomPromptState } from "@/lib/backroomPrompt";

type BackRoomPromptCardProps = {
  topicSlug?: ArticleTopicSlug | null;
  state: BackRoomPromptState;
};

const promptByTopic: Record<ArticleTopicSlug, string> = {
  management: "この話題をBack Roomで話す",
  marketing: "この話題をBack Roomで話す",
  ai: "AI活用について話す",
  technique: "現場の使い方を共有する",
  tools: "現場の使い方を共有する",
};

function promptForTopic(topicSlug: ArticleTopicSlug | null | undefined) {
  if (topicSlug && promptByTopic[topicSlug]) return promptByTopic[topicSlug];
  return "Back Roomで話す";
}

function hrefForState(state: BackRoomPromptState) {
  if (state === "joined") return "/backroom";
  if (state === "setup") return pathWithParams("/backroom/setup", { next: "/backroom" });
  return pathWithParams("/login", { next: "/backroom", message: "Back Roomにはログインしてください。" });
}

function ctaForState(state: BackRoomPromptState) {
  if (state === "joined") return "Back Roomを開く";
  if (state === "setup") return "参加設定";
  return "ログイン";
}

export function BackRoomPromptCard({ topicSlug, state }: BackRoomPromptCardProps) {
  if (state === "unavailable") return null;

  const label = topicSlug ? articleTopicLabel(topicSlug) || "Back Room" : "Back Room";

  return (
    <section className="px-4 pt-6">
      <Link
        href={hrefForState(state)}
        className="flex items-center justify-between gap-3 rounded-[8px] border border-blush/20 bg-blushSoft px-3 py-3 shadow-sm"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-blush">
          <MessageCircle aria-hidden="true" size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.64rem] font-black uppercase tracking-[0.12em] text-blush">{label}</span>
          <span className="mt-0.5 block text-sm font-black leading-snug text-ink">{promptForTopic(topicSlug)}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-black text-blush">
          {ctaForState(state)}
          <ChevronRight aria-hidden="true" size={14} />
        </span>
      </Link>
    </section>
  );
}
