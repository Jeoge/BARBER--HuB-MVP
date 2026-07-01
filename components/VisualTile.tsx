type VisualTileProps = {
  variant: string;
  className?: string;
};

const variantMap: Record<string, string> = {
  haircut: "from-neutral-950 via-stone-800 to-neutral-500",
  tool: "from-stone-950 via-neutral-800 to-zinc-500",
  seminar: "from-neutral-950 via-neutral-800 to-stone-500",
  news: "from-zinc-950 via-neutral-800 to-neutral-500",
  student: "from-neutral-950 via-stone-800 to-neutral-500",
};

export function VisualTile({ variant, className = "" }: VisualTileProps) {
  return (
    <div className={
      "relative overflow-hidden rounded-[7px] bg-gradient-to-br " +
      (variantMap[variant] ?? variantMap.news) +
      " " +
      className
    }>
      <div className="absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.16),transparent_36%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/48 to-transparent" />
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 opacity-70">
        <span className="h-6 w-6 rounded-full bg-white/65" />
        <span className="h-1.5 w-16 rounded-full bg-white/38" />
      </div>
    </div>
  );
}
