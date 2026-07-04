"use client";

import { Check, ChevronRight, ImagePlus, Send, ShieldCheck, Sparkles } from "lucide-react";
import { type FormEvent, useState } from "react";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { SalonTransitionNotice } from "@/components/SalonTransitionNotice";
import { transitionMonetizationItems } from "@/lib/salon-transition";

const listingTypes = ["居抜き・テナント", "事業承継", "備品・設備譲渡", "独立希望", "専門家に相談したい"];
const transferModes = ["まとめて譲渡", "個別譲渡", "どちらも相談"];
const consentOptions = ["未確認", "相談前", "貸主へ確認予定", "管理会社へ確認予定", "承諾済み"];
const healthCenterOptions = ["未確認", "確認予定", "相談済み", "該当なし"];

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="flex items-center justify-between gap-3 text-sm font-black text-ink">
      {children}
      {required ? <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.6rem] font-black text-blush">必須</span> : null}
    </span>
  );
}

function InputField({
  label,
  name,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        name={name}
        type={type}
        required={required}
        className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none transition placeholder:text-mute/60 focus:border-ink/30 focus:bg-neutral-50"
        placeholder={placeholder}
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  placeholder,
  required = false,
  rows = 4,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        name={name}
        required={required}
        rows={rows}
        className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none transition placeholder:text-mute/60 focus:border-ink/30 focus:bg-neutral-50"
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField({ label, name, options, required = false }: { label: string; name: string; options: string[]; required?: boolean }) {
  return (
    <label className="grid gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <select name={name} required={required} className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-ink/30">
        <option value="">選択</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export default function SalonTransitionRegisterPage() {
  const [submitted, setSubmitted] = useState(false);

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="TRANSITION REGISTER"
        title="開業・承継情報を掲載する"
        body="閉店予定、引退予定、居抜き、事業承継、備品譲渡、独立希望を、運営確認後に掲載するための仮登録フォームです。"
      />

      <section className="px-4 pt-4">
        {submitted ? (
          <div className="rounded-[10px] border border-blush/20 bg-blushSoft p-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-blush">
              <Check aria-hidden="true" size={20} />
            </div>
            <h2 className="mt-3 text-lg font-black text-ink">掲載内容を受け付けました</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-ink/78">
              正式公開時には、運営確認後に掲載されます。契約や条件交渉は、当事者および専門家の確認のもとで行ってください。
            </p>
          </div>
        ) : null}

        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
            掲載前に運営が確認します
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            契約成立に連動する課金ではなく、情報掲載・問い合わせ導線として運用します。正式版では無料掲載、詳細掲載、上位表示、PR枠などで展開予定です。
          </p>
        </div>
      </section>

      <form onSubmit={submitForm} className="grid gap-7 px-4 pt-6">
        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">A. TYPE</p>
            <h2 className="mt-1 text-base font-black text-ink">掲載種別</h2>
          </div>
          <SelectField label="掲載種別" name="listingType" options={listingTypes} required />
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">B. BASIC</p>
            <h2 className="mt-1 text-base font-black text-ink">基本情報</h2>
          </div>
          <InputField label="掲載タイトル" name="title" placeholder="例：福岡市西区の理容室、居抜き相談" required />
          <InputField label="地域" name="area" placeholder="例：福岡県" required />
          <InputField label="市区町村" name="city" placeholder="例：福岡市西区" required />
          <InputField label="最寄駅" name="station" placeholder="例：駅徒歩3分" />
          <label className="flex items-center gap-2 rounded-[8px] border border-line bg-white p-3 text-sm font-black text-ink">
            <input name="anonymous" type="checkbox" className="h-4 w-4 accent-blush" />
            匿名掲載を希望する
          </label>
          <InputField label="連絡用メール" name="email" type="email" placeholder="例：owner@example.com" required />
          <InputField label="希望時期" name="desiredTiming" placeholder="例：6か月以内 / 1年以内" required />
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">C. STORE</p>
            <h2 className="mt-1 text-base font-black text-ink">店舗情報</h2>
          </div>
          <InputField label="営業年数" name="yearsOpen" placeholder="例：12年" />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="セット面数" name="seats" placeholder="例：2席" />
            <InputField label="シャンプー台数" name="shampooUnits" placeholder="例：1台" />
          </div>
          <InputField label="広さ" name="size" placeholder="例：約16坪" />
          <InputField label="家賃目安" name="rentGuide" placeholder="例：要相談 / 月額目安" />
          <SelectField label="テナント / 自己所有" name="tenantType" options={["テナント", "自己所有", "未定", "その他"]} />
          <SelectField label="貸主承諾の状況" name="landlordConsent" options={consentOptions} />
          <SelectField label="保健所手続きの確認状況" name="healthCenterStatus" options={healthCenterOptions} />
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">D. EQUIPMENT</p>
            <h2 className="mt-1 text-base font-black text-ink">設備・備品</h2>
          </div>
          <TextareaField label="譲渡したい設備" name="equipment" placeholder="例：セット椅子、シャンプー台、鏡、消毒設備" rows={3} />
          <TextareaField label="譲渡したい備品" name="tools" placeholder="例：バリカン、シザー、タオルウォーマー、ワゴン" rows={3} />
          <div className="rounded-[8px] border border-line bg-white p-3">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <ImagePlus aria-hidden="true" size={17} className="text-blush" />
              写真アップロードは正式公開時に対応予定
            </div>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">MVPでは写真URLのみ入力できます。正式版では写真追加を掲載メニューにできます。</p>
          </div>
          <InputField label="写真URL" name="imageUrl" type="url" placeholder="/images/shop-interior.jpg または https://..." />
          <TextareaField label="状態説明" name="condition" placeholder="使用年数、傷、メンテナンス状況など。" rows={3} />
          <SelectField label="まとめて譲渡 / 個別譲渡" name="transferMode" options={transferModes} />
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">E. SUCCESSION</p>
            <h2 className="mt-1 text-base font-black text-ink">事業承継情報</h2>
          </div>
          <SelectField label="屋号引き継ぎ相談可否" name="tradeName" options={["相談可", "不可", "未定"]} />
          <SelectField label="顧客引き継ぎ相談可否" name="customerTransfer" options={["相談可", "不可", "未定"]} />
          <SelectField label="スタッフ引き継ぎ有無" name="staffTransfer" options={["あり", "なし", "未定"]} />
          <SelectField label="売上情報開示の可否" name="salesDisclosure" options={["相談可", "一部可", "不可", "未定"]} />
          <SelectField label="専門家相談の有無" name="expertConsulted" options={["相談済み", "相談予定", "未相談"]} />
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">F. INDEPENDENT</p>
            <h2 className="mt-1 text-base font-black text-ink">独立希望者情報</h2>
          </div>
          <InputField label="理容師歴" name="barberYears" placeholder="例：10年" />
          <InputField label="希望エリア" name="preferredArea" placeholder="例：福岡市内 / 地下鉄沿線" />
          <InputField label="希望家賃" name="preferredRent" placeholder="例：月15万円以内" />
          <InputField label="希望時期" name="preferredTiming" placeholder="例：1年以内" />
          <InputField label="自己資金目安" name="ownFunds" placeholder="例：300万円程度 / 相談中" />
          <div className="grid gap-2">
            {["居抜き希望", "備品譲渡希望", "事業承継に興味あり"].map((item) => (
              <label key={item} className="flex items-center gap-2 rounded-[8px] border border-line bg-white p-3 text-sm font-black text-ink">
                <input name="independentInterests" type="checkbox" value={item} className="h-4 w-4 accent-blush" />
                {item}
              </label>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">G. NOTE</p>
            <h2 className="mt-1 text-base font-black text-ink">自由記入</h2>
          </div>
          <TextareaField label="補足" name="note" placeholder="掲載時に伝えたい背景や条件を記入してください。" rows={4} />
          <TextareaField label="相談したいこと" name="consultation" placeholder="例：貸主承諾の進め方、備品譲渡、承継範囲など。" rows={4} />
        </section>

        <section className="rounded-[10px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Sparkles aria-hidden="true" size={18} className="text-blush" />
            収益化は掲載価値で設計します
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            契約成立に連動する課金に見えないよう、掲載料・上位表示・PR枠・専門家広告・ディーラー広告で展開できる設計にします。
          </p>
          <div className="mt-3 grid gap-1.5">
            {transitionMonetizationItems.slice(0, 8).map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-ink/76">
                <ChevronRight aria-hidden="true" size={12} className="text-mute" />
                {item}
              </span>
            ))}
          </div>
        </section>

        <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <p className="text-xs font-medium leading-relaxed text-mute">
            掲載内容、問い合わせ対応、契約条件、設備状態、受け渡し、税務・法務・雇用に関する確認は、掲載者および問い合わせ者の責任で行ってください。
            BARBER HUBは情報掲載と問い合わせ導線を提供します。
          </p>
          <label className="mt-3 flex items-start gap-2 text-sm font-black leading-relaxed text-ink">
            <input type="checkbox" required className="mt-1 h-4 w-4 accent-blush" />
            不動産仲介・契約代行ではなく、情報掲載として利用することを確認しました。
          </label>
        </div>

        <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-ink text-sm font-black text-white">
          <Send aria-hidden="true" size={17} />
          仮登録する
        </button>
      </form>

      <SalonTransitionNotice />
    </PageChrome>
  );
}
