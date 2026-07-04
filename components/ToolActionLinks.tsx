import { ExternalLink, GraduationCap, MapPin, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { primaryToolPartner, type ToolPartner } from "@/lib/tool-partners";

type ToolAction = {
  key: "buy" | "consult" | "learn";
  label: ToolPartner["label"];
  title: string;
  description: string;
  cta: string;
  partner: ToolPartner;
  icon: typeof ShoppingBag;
};

const actions: ToolAction[] = [
  {
    key: "buy",
    label: "PR",
    title: "オンライン購入先で見る",
    description: "気になった道具を、プロ向けオンライン卸サイトで確認できます。",
    cta: "BEAUTY GARAGEで見る（サンプル導線）",
    partner: primaryToolPartner("online-store"),
    icon: ShoppingBag,
  },
  {
    key: "consult",
    label: "Partner",
    title: "地域ディーラーに相談する",
    description: "導入前の相談、講習、使い方、地域のサロン事情は、ディーラーに相談できます。",
    cta: "相談できるディーラーを見る",
    partner: primaryToolPartner("regional-dealer"),
    icon: MapPin,
  },
  {
    key: "learn",
    label: "Sponsored",
    title: "メーカー講習・商品説明を見る",
    description: "道具の特徴や使い方を、メーカーやディーラーの講習で確認できます。",
    cta: "関連講習を見る",
    partner: primaryToolPartner("seminar"),
    icon: GraduationCap,
  },
];

export function ToolActionLinks() {
  return (
    <section className="px-4 pt-7">
      <div className="rounded-[8px] border border-line bg-white p-4 shadow-[0_10px_26px_rgba(17,17,17,0.04)]">
        <p className="text-[0.64rem] font-black uppercase tracking-[0.14em] text-blush">TOOLS GUIDE</p>
        <h2 className="mt-1 text-base font-black text-ink">購入・相談・学ぶ</h2>
        <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
          BARBER HUBでは商品の販売、決済、配送、返品対応は行いません。購入・在庫・価格・配送・返品などは、各外部サイトまたは取扱先でご確認ください。
        </p>
        <div className="mt-4 grid gap-2.5">
          {actions.map(({ key, label, title, description, cta, partner, icon: Icon }) => {
            const content = (
              <article className="rounded-[8px] border border-line bg-white p-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
                    <Icon aria-hidden="true" size={17} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-line bg-neutral-50 px-2 py-0.5 text-[0.58rem] font-black text-mute">{label}</span>
                      <span className="text-[0.62rem] font-bold text-mute">{partner.name}</span>
                    </div>
                    <h3 className="mt-1 text-sm font-black text-ink">{title}</h3>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-mute">{description}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blush">
                      {cta}
                      {partner.external ? <ExternalLink aria-hidden="true" size={12} /> : null}
                    </p>
                  </div>
                </div>
              </article>
            );

            if (partner.external) {
              return (
                <a key={key} href={partner.href} target="_blank" rel="noreferrer" className="block">
                  {content}
                </a>
              );
            }

            return (
              <Link key={key} href={partner.href} className="block">
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
