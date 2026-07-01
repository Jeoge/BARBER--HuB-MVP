import { BadgeCheck, ExternalLink, PackageCheck, Send } from "lucide-react";
import Link from "next/link";
import { AuthGateLink } from "./AuthGate";
import { VisualTile } from "./VisualTile";
import type { Product } from "@/lib/mockData";

type ProductSectionProps = {
  title: string;
  subtitle?: string;
  products: Product[];
};

export function ProductSection({ title, subtitle, products }: ProductSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="px-4 pt-7">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-blush">PRODUCT MEMO</p>
          <h2 className="mt-1 text-base font-black text-ink">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs font-bold leading-relaxed text-mute">{subtitle}</p> : null}
        </div>
        <Link href="/partners" className="shrink-0 text-xs font-black text-blush">
          掲載元
        </Link>
      </div>

      <div className="mt-3 no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {products.map((product) => (
          <article key={product.id} className="w-[82%] shrink-0 rounded-[8px] border border-line bg-white p-3 shadow-sm">
            <Link href={`/products/${product.id}`} className="block">
              <VisualTile variant={product.accent} className="aspect-[16/8]" />
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-blushSoft px-2 py-1 text-[0.62rem] font-black text-blush">
                  {product.category}
                </span>
                {product.sponsorLabel ? (
                  <span className="rounded-full border border-line px-2 py-1 text-[0.62rem] font-black text-mute">
                    {product.sponsorLabel}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-2 text-[0.96rem] font-black leading-snug text-ink">{product.name}</h3>
              <p className="mt-1 text-xs font-bold text-mute">{product.maker}</p>
              <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-ink">{product.description}</p>
            </Link>

            <div className="mt-3 flex items-center gap-1.5 rounded-[8px] bg-neutral-50 px-2.5 py-2 text-[0.7rem] font-black text-mute">
              <BadgeCheck aria-hidden="true" size={14} className="text-blush" />
              {product.salonVerifiedLabel ?? product.priceLabel}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <Link
                href={`/products/${product.id}`}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-[8px] bg-ink px-2 text-[0.68rem] font-black text-white"
              >
                <ExternalLink aria-hidden="true" size={13} />
                詳細
              </Link>
              <AuthGateLink className="inline-flex h-9 items-center justify-center gap-1 rounded-[8px] border border-line bg-white px-2 text-[0.68rem] font-black text-ink">
                <Send aria-hidden="true" size={13} />
                問合せ
              </AuthGateLink>
              <AuthGateLink className="inline-flex h-9 items-center justify-center gap-1 rounded-[8px] border border-blush/20 bg-blushSoft px-2 text-[0.68rem] font-black text-blush">
                <PackageCheck aria-hidden="true" size={13} />
                サンプル
              </AuthGateLink>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
