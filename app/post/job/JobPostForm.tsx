"use client";

import { BriefcaseBusiness, Camera, Check, ChevronRight, Clock, Crown, LinkIcon, MapPin, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createJobPostAction, updateJobPostAction } from "./actions";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  JOB_DIRECT_CONTACT_NOTICE,
  JOB_STATUS_OPTIONS,
  JOB_TAG_OPTIONS,
  JOB_TITLE_OPTIONS,
  splitJobMultiValue,
} from "@/lib/jobs";
import type { JobPost } from "@/lib/supabase/jobs";
import type { AccountProfile } from "@/lib/supabase/profiles";

const requiredMark = <span className="text-blush">必須</span>;

const plans = [
  {
    id: "free",
    title: "無料掲載",
    status: "受付中",
    icon: BriefcaseBusiness,
    body: "まずは無料で掲載できます。求職者が安心して見られる基本情報と直接連絡先を整えて届けます。",
    points: ["求人掲載", "基本情報", "募集条件", "ホームページ・SNSリンク", "写真URL", "直接連絡先"],
  },
  {
    id: "featured",
    title: "注目掲載",
    status: "問い合わせ",
    icon: Sparkles,
    body: "正式公開時に提供予定。地域内で見つけてもらいやすくする掲載プランです。",
    points: ["無料掲載の内容", "上位表示", "注目求人ラベル", "求人カードを少し目立つ表示", "編集部作成の求人記事"],
  },
  {
    id: "boost",
    title: "強化掲載",
    status: "問い合わせ",
    icon: Crown,
    body: "学校・組合・地域特集との連動など、採用を強化したいサロン向けの上位プランです。",
    points: ["注目掲載の内容", "トップページ掲載", "地域特集連動", "Snap・記事との連動強化", "求人特集枠"],
  },
];

type JobPostFormProps = {
  profile: AccountProfile;
  userEmail?: string | null;
  error?: string;
  initialJob?: JobPost | null;
};

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="flex items-center justify-between gap-3 text-sm font-black text-ink">
      {children}
      {required ? <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.6rem] font-black text-blush">{requiredMark}</span> : null}
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
  defaultValue?: string | null;
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

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-ink text-sm font-black text-white transition disabled:opacity-60"
    >
      <Send aria-hidden="true" size={17} />
      {pending ? "保存中..." : editing ? "求人を更新する" : "求人を掲載する"}
    </button>
  );
}

export function JobPostForm({ profile, userEmail, error, initialJob }: JobPostFormProps) {
  const editing = initialJob != null;
  const initialTags = useMemo(() => (initialJob?.tags.length ? initialJob.tags : ["見学歓迎"]), [initialJob]);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const initialJobTitles = splitJobMultiValue(initialJob?.job_title);
  const initialEmploymentTypes = splitJobMultiValue(initialJob?.employment_type);
  const profileHref = `/profiles/${profile.id}`;

  function toggleTag(tag: string) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

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
          <h2 className="mt-2 text-lg font-black leading-tight text-ink">求人掲載は基本無料です</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            まずは無料で、あなたのサロンの求人をBARBER HUBに掲載できます。注目掲載・上位表示・編集部作成などの有料プランは、準備が整い次第ご案内します。
          </p>
          <div className="mt-3 grid gap-2 text-xs font-bold text-ink/75">
            <span className="inline-flex items-center gap-2">
              <MapPin aria-hidden="true" size={14} className="text-blush" />
              地域の理容師・理容学生に届く
            </span>
            <span className="inline-flex items-center gap-2">
              <LinkIcon aria-hidden="true" size={14} className="text-blush" />
              応募・見学はサロンの直接連絡先へ案内
            </span>
          </div>
        </div>
      </section>

      <form action={editing ? updateJobPostAction : createJobPostAction} className="grid gap-7 px-4 pt-6">
        {editing ? <input type="hidden" name="jobId" value={initialJob.id} /> : null}
        <input type="hidden" name="planType" value="free" />
        {selectedTags.map((tag) => (
          <input key={tag} type="hidden" name="tags" value={tag} />
        ))}

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">A. SALON</p>
            <h2 className="mt-1 text-base font-black text-ink">サロン基本情報</h2>
          </div>
          <InputField label="サロン名" name="salonName" placeholder="例：BARBER HUB 福岡西" required defaultValue={initialJob?.salon_name ?? profile.salon_name} />
          <InputField label="募集主名" name="employerName" placeholder="例：代表 山田 太郎" defaultValue={initialJob?.employer_name ?? profile.display_name} />
          <InputField label="店舗所在地" name="address" placeholder="例：福岡県福岡市西区..." required defaultValue={initialJob?.address ?? profile.shop_address} />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="都道府県" name="prefecture" placeholder="福岡県" required defaultValue={initialJob?.prefecture ?? profile.region} />
            <InputField label="市区町村" name="city" placeholder="福岡市西区" required defaultValue={initialJob?.city} />
          </div>
          <InputField label="最寄駅" name="station" placeholder="例：姪浜駅 徒歩7分" defaultValue={initialJob?.station} />
          <InputField label="サロン写真URL" name="imageUrl" type="url" placeholder="/images/shop-interior.jpg または https://..." defaultValue={initialJob?.image_url} />

          <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <LinkIcon aria-hidden="true" size={17} className="text-blush" />
              店舗プロフィールと連携します
            </div>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
              保存後の求人詳細には、店舗プロフィールへのリンクを自動で表示します。
            </p>
            <Link href={profileHref} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-ink">
              店舗プロフィールを見る
            </Link>
          </div>
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">B. JOB</p>
            <h2 className="mt-1 text-base font-black text-ink">募集内容</h2>
          </div>

          <div className="grid gap-2">
            <FieldLabel required>募集職種</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {JOB_TITLE_OPTIONS.map((role) => (
                <label key={role} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-ink">
                  <input name="jobTitle" type="checkbox" value={role} defaultChecked={initialJobTitles.includes(role)} className="accent-black" />
                  {role}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <FieldLabel required>雇用形態</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                <label key={type} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-ink">
                  <input name="employmentType" type="checkbox" value={type} defaultChecked={initialEmploymentTypes.includes(type)} className="accent-black" />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <TextareaField label="仕事内容" name="description" placeholder="仕事内容、入客の流れ、得意な技術、客層などを具体的に書いてください。" required defaultValue={initialJob?.description} />
          <InputField label="給与" name="salary" placeholder="例：月給22万円から / 技術歩合あり" required defaultValue={initialJob?.salary} />
          <InputField label="勤務時間" name="workingHours" placeholder="例：9:00から19:00" required defaultValue={initialJob?.working_hours} />
          <InputField label="休日" name="holidays" placeholder="例：月8日 / 相談可" required defaultValue={initialJob?.holidays} />
          <InputField label="技術歩合・手当・福利厚生" name="benefits" placeholder="例：雇用保険、講習会補助、交通費相談" defaultValue={initialJob?.benefits} />
          <InputField label="試用期間" name="trialPeriod" placeholder="例：3ヶ月 / 条件変更なし" defaultValue={initialJob?.trial_period} />
          <TextareaField label="サロンPR" name="prMessage" placeholder="求職者へ伝えたい店の空気、教育方針、向いている人など。" rows={3} defaultValue={initialJob?.pr_message} />
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">C. TAGS</p>
            <h2 className="mt-1 text-base font-black text-ink">働き方タグ</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {JOB_TAG_OPTIONS.map((tag) => {
              const selected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition " +
                    (selected ? "border-blush/25 bg-blushSoft text-ink" : "border-line bg-white text-ink/76")
                  }
                  aria-pressed={selected}
                >
                  {selected ? <Check aria-hidden="true" size={13} className="text-blush" /> : null}
                  {tag}
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">D. CONTACT</p>
            <h2 className="mt-1 text-base font-black text-ink">応募・見学導線</h2>
          </div>
          <TextareaField
            label="応募方法"
            name="applicationMethod"
            placeholder="例：まずは電話またはInstagram DMで見学希望とお伝えください。"
            required
            rows={3}
            defaultValue={initialJob?.application_method}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <FieldLabel required>見学可否</FieldLabel>
              <select
                name="visitAvailable"
                defaultValue={initialJob?.visit_available === false ? "false" : "true"}
                required
                className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-ink/30"
              >
                <option value="true">見学歓迎</option>
                <option value="false">見学は相談</option>
              </select>
            </label>
            <label className="grid gap-2">
              <FieldLabel>掲載状態</FieldLabel>
              <select
                name="status"
                defaultValue={initialJob?.status ?? "published"}
                className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-ink/30"
              >
                {JOB_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <InputField label="電話番号" name="contactPhone" placeholder="例：092-000-0000" defaultValue={initialJob?.contact_phone} />
          <InputField label="メールアドレス" name="contactEmail" type="email" placeholder="例：salon@example.com" defaultValue={initialJob?.contact_email ?? userEmail} />
          <InputField label="公式サイトURL" name="websiteUrl" type="url" placeholder="https://..." defaultValue={initialJob?.website_url ?? profile.website_url} />
          <InputField label="Instagram URL" name="instagramUrl" type="url" placeholder="https://instagram.com/..." defaultValue={initialJob?.instagram_url ?? profile.instagram_url} />
          <InputField label="LINE公式URL" name="lineUrl" type="url" placeholder="https://..." defaultValue={initialJob?.line_url ?? profile.line_url} />
          <InputField label="予約/見学申し込みURL" name="applicationUrl" type="url" placeholder="https://..." defaultValue={initialJob?.application_url ?? profile.booking_url} />
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">E. PHOTOS</p>
            <h2 className="mt-1 text-base font-black text-ink">写真</h2>
          </div>
          <div className="rounded-[8px] border border-line bg-white p-3">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <Camera aria-hidden="true" size={17} className="text-blush" />
              写真アップロードは正式公開時に対応予定
            </div>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
              MVPではURL入力のみです。未入力の場合はBARBER HUBの標準画像で表示します。
            </p>
          </div>
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">PLAN</p>
            <h2 className="mt-1 text-base font-black text-ink">掲載プラン</h2>
          </div>
          <div className="grid gap-3">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const card = (
                <div className={"rounded-[10px] border bg-white p-4 text-left shadow-[0_8px_20px_rgba(17,17,17,0.025)] " + (plan.id === "free" ? "border-ink" : "border-line")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-50 text-ink">
                        <Icon aria-hidden="true" size={17} />
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-ink">{plan.title}</h3>
                        <p className={"mt-0.5 text-[0.62rem] font-black " + (plan.status === "受付中" ? "text-blush" : "text-mute")}>{plan.status}</p>
                      </div>
                    </div>
                    {plan.id === "free" ? <Check aria-hidden="true" size={18} className="text-blush" /> : <ChevronRight aria-hidden="true" size={18} className="text-mute" />}
                  </div>
                  <p className="mt-3 text-xs font-medium leading-relaxed text-mute">{plan.body}</p>
                  <div className="mt-3 grid gap-1.5">
                    {plan.points.map((point) => (
                      <span key={point} className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-ink/76">
                        <ChevronRight aria-hidden="true" size={12} className="text-mute" />
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              );

              return plan.id === "free" ? (
                <div key={plan.id}>{card}</div>
              ) : (
                <Link key={plan.id} href="/contact?topic=paid-jobs" className="block">
                  {card}
                </Link>
              );
            })}
          </div>
          <p className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
            より目立たせたいサロン向けに、注目掲載・上位表示・編集部作成プランを準備しています。有料掲載をご希望の方は、運営までお問い合わせください。決済はまだ行いません。
          </p>
        </section>

        <section className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">BARBER HUBらしい求人</p>
          <h2 className="mt-2 text-base font-black text-ink">求人票だけでなく、投稿もサロンの魅力になる</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            普段のSnapや記事も、求職者が「見学したい」と思うきっかけになります。技術・店の雰囲気・考え方を少しずつ伝えてください。
          </p>
        </section>

        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Clock aria-hidden="true" size={18} className="text-blush" />
            掲載後も内容は自分で停止・編集できます
          </div>
          <p className="mt-2 text-[0.78rem] font-medium leading-relaxed text-mute">
            審査制に切り替えられるように掲載状態を保存しています。今は公開状態で掲載できます。
          </p>
        </div>

        <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <p className="text-xs font-medium leading-relaxed text-mute">{JOB_DIRECT_CONTACT_NOTICE}</p>
          <label className="mt-3 flex items-start gap-2 text-sm font-black leading-relaxed text-ink">
            <input type="checkbox" required className="mt-1 h-4 w-4 accent-blush" />
            求人内容と応募者対応は、掲載サロンの責任で行うことを確認しました。
          </label>
        </div>

        <SubmitButton editing={editing} />
      </form>
    </>
  );
}
