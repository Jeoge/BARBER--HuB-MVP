type VisualTileProps = {
  variant: string;
  className?: string;
};

const variantMap: Record<string, string> = {
  haircut: "from-neutral-950 via-stone-700 to-neutral-300",
  tool: "from-stone-900 via-neutral-700 to-zinc-300",
  seminar: "from-neutral-900 via-neutral-600 to-stone-200",
  news: "from-zinc-950 via-neutral-800 to-neutral-400",
  student: "from-neutral-900 via-stone-600 to-neutral-200",
};

export function VisualTile({ variant, className = "" }: VisualTileProps) {
  return (
    <div className={
      "relative overflow-hidden rounded-[7px] bg-gradient-to-br " +
      (variantMap[variant] ?? variantMap.news) +
      " " +
      className
    }>
      <div className="absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_34%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/55 to-transparent" />
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
        <span className="h-8 w-8 rounded-full bg-white/85" />
        <span className="h-2.5 w-20 rounded-full bg-white/55" />
      </div>
    </div>
  );
}
