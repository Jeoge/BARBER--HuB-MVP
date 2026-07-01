type PageHeaderBlockProps = {
  eyebrow: string;
  title: string;
  body: string;
};

export function PageHeaderBlock({ eyebrow, title, body }: PageHeaderBlockProps) {
  return (
    <section className="px-4 pt-5">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">{eyebrow}</p>
      <h1 className="mt-1 text-[1.55rem] font-black leading-tight text-ink">{title}</h1>
      <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">{body}</p>
    </section>
  );
}
