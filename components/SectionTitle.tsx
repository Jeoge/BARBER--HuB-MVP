import Link from "next/link";

type SectionTitleProps = {
  title: string;
  action?: string;
  actionHref?: string;
};

export function SectionTitle({ title, action, actionHref }: SectionTitleProps) {
  return (
    <div className="mb-3 flex items-end justify-between px-4">
      <h2 className="text-[0.92rem] font-black uppercase tracking-[0.08em] text-ink">{title}</h2>
      {action && actionHref ? (
        <Link href={actionHref} className="text-xs font-semibold text-blush">
          {action}
        </Link>
      ) : action ? (
        <span className="text-xs font-semibold text-mute">{action}</span>
      ) : null}
    </div>
  );
}
