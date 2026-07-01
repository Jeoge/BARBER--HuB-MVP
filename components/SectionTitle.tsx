type SectionTitleProps = {
  title: string;
  action?: string;
};

export function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <div className="mb-2.5 flex items-end justify-between px-4">
      <h2 className="text-[0.98rem] font-black uppercase tracking-[0.02em] text-ink">{title}</h2>
      {action ? <button className="text-xs font-bold text-blush">{action}</button> : null}
    </div>
  );
}
