type SectionTitleProps = {
  title: string;
  action?: string;
};

export function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <div className="mb-3 flex items-end justify-between px-4">
      <h2 className="text-[0.92rem] font-black uppercase tracking-[0.08em] text-ink">{title}</h2>
      {action ? <button className="text-xs font-semibold text-blush">{action}</button> : null}
    </div>
  );
}
