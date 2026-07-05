export function SnapReactionNotice({ isOwnSnap, className = "" }: { isOwnSnap: boolean; className?: string }) {
  return (
    <p
      className={
        "rounded-[8px] border border-line/70 bg-neutral-50 px-3 py-2 text-[0.68rem] font-semibold leading-relaxed text-mute " +
        className
      }
    >
      {isOwnSnap ? "自分の投稿へのリアクションはカウントされません。" : "リアクション機能は次のPhaseで対応予定です。"}
    </p>
  );
}
