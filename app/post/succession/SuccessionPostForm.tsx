"use client";

import { Check, ChevronRight, ImagePlus, LockKeyhole, Send, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { SafetyChecklist } from "@/components/SafetyChecklist";
import { createSuccessionPostAction, updateSuccessionPostAction } from "./actions";
import {
  SUCCESSION_BUSINESS_TYPES,
  SUCCESSION_CONTACT_METHODS,
  SUCCESSION_DIRECT_NOTICE,
  SUCCESSION_LISTING_TYPES,
  SUCCESSION_NOTICE,
  SUCCESSION_PRIVATE_WARNING,
  SUCCESSION_STATUS_OPTIONS,
} from "@/lib/succession";
import type { SuccessionOwnerPost } from "@/lib/supabase/succession";
import type { AccountProfile } from "@/lib/supabase/profiles";

type SuccessionPostFormProps = {
  profile: AccountProfile;
  error?: string;
  initialPost?: SuccessionOwnerPost | null;
};

const paidOptions = ["注目掲載", "上位表示", "編集部作成の承継紹介記事", "地域特集", "組合・学校・企業との連動", "開業支援パートナー掲載"];
const successionSafetyItems = [
  {
    name: "successionPublicPrivateConfirmed",
    label: "公開してよい情報と非公開情報を確認しました。",
  },
  {
    name: "successionSensitiveInfoConfirmed",
    label: "店名・正確な住所・売上・譲渡額など、慎重に扱う情報を不用意に公開していません。",
  },
  {
    name: "successionNoGuaranteeConfirmed",
    label: "BARBER HUBは情報掲載場所であり、契約や条件を保証するものではないことを理解しています。",
  },
];

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
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
  defaultValue?: string | number | null;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
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
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  rows?: number;
  defaultValue?: string | null;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        name={name}
        required={required}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none transition placeholder:text-mute/60 focus:border-ink/30 focus:bg-neutral-50"
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
  defaultValue?: string | null;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-ink/30"
      >
        <option value="">選択</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({ editing, disabled = false }: { editing: boolean; disabled?: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-ink text-sm font-black text-white transition disabled:opacity-60"
    >
      <Send aria-hidden="true" size={17} />
      {pending ? "保存中..." : editing ? "掲載内容を更新する" : "掲載する"}
    </button>
  );
}

export function SuccessionPostForm({ profile, error, initialPost }: SuccessionPostFormProps) {
  const editing = initialPost != null;
  const privatePost = initialPost?.private ?? null;
  const [safetyReady, setSafetyReady] = useState(false);

  return (
    <>
      <section className="px-4 pt-4">
        {error ? (
          <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm font-black leading-relaxed text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">FREE FIRST</p>
          <h2 className="mt-2 text-lg font-black leading-tight text-ink">開業・承継情報の掲載は基本無料です</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            より目立たせたい場合や、編集部による紹介記事作成、地域特集との連動をご希望の場合は、運営までお問い合わせください。決済はまだ行いません。
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {paidOptions.map((option) => (
              <span key={option} className="rounded-full border border-line bg-neutral-50 px-2.5 py-1 text-[0.62rem] font-black text-ink/72">
                {option}
              </span>
            ))}
          </div>
          <Link href="/contact?topic=succession-paid" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[8px] border border-line bg-white text-sm font-black text-ink">
            有料掲載について問い合わせる
          </Link>
        </div>
      </section>

      <form action={editing ? updateSuccessionPostAction : createSuccessionPostAction} className="grid gap-7 px-4 pt-6">
        {editing ? <input type="hidden" name="postId" value={initialPost.id} /> : null}

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">A. PUBLIC</p>
            <h2 className="mt-1 text-base font-black text-ink">公開される情報</h2>
          </div>
          <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
              公開欄に書かないこと
            </div>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">{SUCCESSION_PRIVATE_WARNING}</p>
          </div>
          <SelectField label="掲載タイプ" name="listingType" options={SUCCESSION_LISTING_TYPES} required defaultValue={initialPost?.listing_type} />
          <InputField label="公開用タイトル" name="title" placeholder="例：福岡市内で小規模サロンの承継相談" required defaultValue={initialPost?.title} />
          <TextareaField
            label="公開用説明文"
            name="publicDescription"
            placeholder="地域、業態、席数、希望時期など、個人や店舗を特定できない範囲で記入してください。"
            required
            rows={5}
            defaultValue={initialPost?.public_description}
          />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="都道府県" name="prefecture" placeholder="福岡県" required defaultValue={initialPost?.prefecture ?? profile.region} />
            <InputField label="市区町村" name="city" placeholder="福岡市" required defaultValue={initialPost?.city} />
          </div>
          <InputField label="エリア・最寄駅の有無" name="area" placeholder="例：地下鉄沿線 / 住宅地エリア / 駅徒歩圏" defaultValue={initialPost?.area} />
          <SelectField label="業態" name="businessType" options={SUCCESSION_BUSINESS_TYPES} defaultValue={initialPost?.business_type} />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="席数" name="seatsCount" type="number" placeholder="例：2" defaultValue={initialPost?.seats_count} />
            <InputField label="シャンプー台数" name="shampooCount" type="number" placeholder="例：1" defaultValue={initialPost?.shampoo_count} />
          </div>
          <InputField label="開業年数" name="yearsOpen" placeholder="例：10年以上 / 20年程度" defaultValue={initialPost?.years_open} />
          <InputField label="希望時期" name="desiredTiming" placeholder="例：6か月以内 / 1年以内 / 時期相談" defaultValue={initialPost?.desired_timing} />
          <InputField label="公開用画像URL" name="publicImageUrl" type="url" placeholder="/images/shop-interior.jpg または https://..." defaultValue={initialPost?.public_image_url} />
          <SelectField label="問い合わせ方法の表示" name="contactMethod" options={SUCCESSION_CONTACT_METHODS} defaultValue={initialPost?.contact_method} />
          <label className="grid gap-2">
            <FieldLabel>掲載状態</FieldLabel>
            <select
              name="status"
              defaultValue={initialPost?.status ?? "published"}
              className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-ink/30"
            >
              {SUCCESSION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">B. PRIVATE</p>
            <h2 className="mt-1 text-base font-black text-ink">非公開情報</h2>
          </div>
          <div className="rounded-[8px] border border-line bg-white p-3">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <LockKeyhole aria-hidden="true" size={18} className="text-blush" />
              公開ページには表示しません
            </div>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
              店舗名、正確な住所、売上、利益、家賃、譲渡希望額、借入、顧客数、個人連絡先は非公開情報として保存します。
            </p>
          </div>
          <InputField label="店舗名（非公開）" name="privateShopName" placeholder="正式な店舗名" defaultValue={privatePost?.private_shop_name} />
          <InputField label="正確な住所（非公開）" name="privateAddress" placeholder="番地・建物名まで" defaultValue={privatePost?.private_address} />
          <InputField label="譲渡希望額（非公開）" name="privatePrice" placeholder="例：相談中 / 〇〇万円程度" defaultValue={privatePost?.private_price} />
          <InputField label="家賃（非公開）" name="privateRent" placeholder="例：月〇〇万円" defaultValue={privatePost?.private_rent} />
          <TextareaField label="売上・利益メモ（非公開）" name="privateSalesNote" placeholder="公開されません。運営確認や当事者間確認用のメモです。" rows={3} defaultValue={privatePost?.private_sales_note} />
          <TextareaField label="借入状況メモ（非公開）" name="privateBorrowingNote" placeholder="公開されません。" rows={3} defaultValue={privatePost?.private_borrowing_note} />
          <TextareaField label="顧客数メモ（非公開）" name="privateCustomerCountNote" placeholder="公開されません。" rows={3} defaultValue={privatePost?.private_customer_count_note} />
          <TextareaField label="スタッフ情報メモ（非公開）" name="privateStaffNote" placeholder="公開されません。" rows={3} defaultValue={privatePost?.private_staff_note} />
          <TextareaField label="掲載者の連絡先（非公開）" name="privateOwnerContact" placeholder="メール、電話、希望連絡方法など。公開ページには表示しません。" rows={3} defaultValue={privatePost?.private_owner_contact} />
        </section>

        <section className="rounded-[10px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ImagePlus aria-hidden="true" size={18} className="text-blush" />
            写真について
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            個人や店舗名が分からない写真だけを公開してください。外観看板、住所が写る写真、スタッフや顧客が特定できる写真は避けてください。
          </p>
        </section>

        <section className="rounded-[10px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Sparkles aria-hidden="true" size={18} className="text-blush" />
            掲載価値を高めるメニュー
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            契約成立に連動する課金ではなく、掲載・編集・地域特集・パートナー掲載として設計します。
          </p>
          <div className="mt-3 grid gap-1.5">
            {paidOptions.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-ink/76">
                <ChevronRight aria-hidden="true" size={12} className="text-mute" />
                {item}
              </span>
            ))}
          </div>
        </section>

        <SafetyChecklist
          title="開業・承継掲載前の確認"
          body={`開業・承継情報は、公開範囲に十分ご注意ください。店名、正確な住所、売上、家賃、譲渡希望額、スタッフ情報、顧客情報などは、公開表示しない設定を推奨します。${SUCCESSION_NOTICE} ${SUCCESSION_DIRECT_NOTICE}`}
          items={successionSafetyItems}
          rulesHref="/terms"
          rulesLabel="開業・承継に関する利用規約"
          onRequiredCompleteChange={setSafetyReady}
        />

        {!safetyReady ? <p className="text-[0.68rem] font-bold text-mute">確認欄にチェックすると掲載できます。</p> : null}
        <SubmitButton editing={editing} disabled={!safetyReady} />
      </form>
    </>
  );
}
