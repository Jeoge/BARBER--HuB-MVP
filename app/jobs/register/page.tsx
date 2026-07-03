"use client";

import { BriefcaseBusiness, Camera, Check, ChevronRight, Clock, Crown, LinkIcon, MapPin, Send, Sparkles } from "lucide-react";
import { type FormEvent, useState } from "react";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";

const requiredMark = <span className="text-blush">必須</span>;

const roleOptions = ["アシスタント", "スタイリスト", "理容学生アルバイト", "パート", "面貸し / 業務委託", "その他"];
const employmentOptions = ["正社員", "パート", "アルバイト", "業務委託", "面貸し", "相談可"];
const featureTags = [
  "メンズ特化",
  "フェード",
  "顔剃りあり",
  "ヘッドスパ",
  "白髪ぼかし",
  "育毛",
  "教育あり",
  "講習会あり",
  "独立支援",
  "少人数サロン",
  "駅近",
  "地域密着",
  "高単価サロン",
  "若手歓迎",
  "ブランク歓迎",
  "理容学生歓迎",
  "見学歓迎",
];

const plans = [
  {
    id: "free",
    title: "無料掲載",
    status: "受付中",
    icon: BriefcaseBusiness,
    body: "まずは無料で掲載できます。地域の求職者にサロン情報を届けましょう。",
    points: ["求人掲載", "基本情報", "募集条件", "ホームページ・SNSリンク", "写真1枚", "見学・面接申し込み受付"],
  },
  {
    id: "featured",
    title: "注目掲載",
    status: "準備中",
    icon: Sparkles,
    body: "正式公開時に提供予定。地域内で見つけてもらいやすくする掲載プランです。",
    points: ["無料掲載の内容", "地域内で上位表示", "注目求人ラベル", "写真3枚まで", "求人カードを少し目立つ表示", "閲覧数の簡易表示"],
  },
  {
    id: "boost",
    title: "強化掲載",
    status: "準備中",
    icon: Crown,
    body: "採用を強化したいサロン向けの上位プランです。正式公開時に提供予定。",
    points: ["注目掲載の内容", "写真5〜10枚", "スタッフ紹介", "Snap・記事との連動強化", "求人特集枠", "応募数・見学申込数の確認"],
  },
];

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

export default function JobsRegisterPage() {
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [selectedTags, setSelectedTags] = useState<string[]>(["メンズ特化", "見学歓迎"]);
  const [submitted, setSubmitted] = useState(false);

  function toggleTag(tag: string) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="JOB REGISTER"
        title="求人を掲載する"
        body="まずは無料で、あなたのサロンの求人をBARBER HUBに掲載できます。"
      />

      <section className="px-4 pt-4">
        {submitted ? (
          <div className="rounded-[10px] border border-blush/20 bg-blushSoft p-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-blush">
              <Check aria-hidden="true" size={20} />
            </div>
            <h2 className="mt-3 text-lg font-black text-ink">求人掲載の仮登録を受け付けました</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-ink/78">
              これはMVP用の仮登録です。実装時には、サロン情報が運営確認後に求人一覧へ掲載されます。
            </p>
          </div>
        ) : null}

        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">FREE FIRST</p>
          <h2 className="mt-2 text-lg font-black leading-tight text-ink">求人掲載は基本無料です</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            無料でも、求職者が安心して見られる基本情報は必ず入力してください。注目掲載・上位表示などの有料プランは正式公開時にご案内します。
          </p>
          <div className="mt-3 grid gap-2 text-xs font-bold text-ink/75">
            <span className="inline-flex items-center gap-2">
              <MapPin aria-hidden="true" size={14} className="text-blush" />
              地域の理容師・理容学生に届く
            </span>
            <span className="inline-flex items-center gap-2">
              <LinkIcon aria-hidden="true" size={14} className="text-blush" />
              ホームページ・SNSリンクも掲載可能
            </span>
          </div>
        </div>
      </section>

      <form onSubmit={submitForm} className="grid gap-7 px-4 pt-6">
        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">A. SALON</p>
            <h2 className="mt-1 text-base font-black text-ink">サロン基本情報</h2>
          </div>
          <InputField label="サロン名" name="salonName" placeholder="例：BARBER SAMPLE 福岡西" required />
          <InputField label="店舗所在地" name="address" placeholder="例：福岡県福岡市西区..." required />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="都道府県" name="prefecture" placeholder="福岡県" required />
            <InputField label="市区町村" name="city" placeholder="福岡市西区" required />
          </div>
          <InputField label="最寄駅" name="nearestStation" placeholder="例：姪浜駅 徒歩7分" />
          <InputField label="連絡用メール" name="contactEmail" type="email" placeholder="例：salon@example.com" required />
          <InputField label="GoogleマップURL" name="googleMapUrl" type="url" placeholder="https://..." />
          <InputField label="公式ホームページURL" name="websiteUrl" type="url" placeholder="https://..." />
          <InputField label="Instagram URL" name="instagramUrl" type="url" placeholder="https://instagram.com/..." />
          <InputField label="X URL" name="xUrl" type="url" placeholder="https://x.com/..." />
          <InputField label="YouTube URL" name="youtubeUrl" type="url" placeholder="https://youtube.com/..." />
          <InputField label="その他SNS URL" name="otherSocialUrl" type="url" placeholder="https://..." />
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">B. JOB</p>
            <h2 className="mt-1 text-base font-black text-ink">求人基本情報</h2>
          </div>

          <div className="grid gap-2">
            <FieldLabel required>募集職種</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((role) => (
                <label key={role} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-ink">
                  <input name="roles" type="checkbox" value={role} className="accent-black" />
                  {role}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <FieldLabel required>雇用形態</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {employmentOptions.map((type) => (
                <label key={type} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-ink">
                  <input name="employmentTypes" type="checkbox" value={type} className="accent-black" />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <InputField label="給与目安" name="salary" placeholder="例：月給22万円から / 技術歩合あり" required />
          <InputField label="勤務時間" name="workingHours" placeholder="例：9:00から19:00" required />
          <InputField label="休日" name="holidays" placeholder="例：月8日 / 相談可" required />
          <InputField label="福利厚生" name="benefits" placeholder="例：雇用保険、講習会補助、交通費相談" />
          <InputField label="試用期間" name="trialPeriod" placeholder="例：3ヶ月 / 条件変更なし" />
          <InputField label="応募条件" name="requirements" placeholder="例：理容師免許取得者 / 学生相談可" />
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <FieldLabel required>見学可否</FieldLabel>
              <select name="canVisit" required className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-ink/30">
                <option value="">選択</option>
                <option>見学歓迎</option>
                <option>相談可</option>
                <option>不可</option>
              </select>
            </label>
            <label className="grid gap-2">
              <FieldLabel>面接可否</FieldLabel>
              <select name="canInterview" className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-ink/30">
                <option>面接可</option>
                <option>見学後に相談</option>
                <option>準備中</option>
              </select>
            </label>
          </div>
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">C. TAGS</p>
            <h2 className="mt-1 text-base font-black text-ink">サロンの特徴</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {featureTags.map((tag) => {
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
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">D. STORY</p>
            <h2 className="mt-1 text-base font-black text-ink">サロンPR</h2>
          </div>
          <TextareaField label="サロン紹介文" name="description" placeholder="店の雰囲気、得意な技術、客層などを簡潔に書いてください。" required />
          <TextareaField label="どんな人に向いているか" name="fitMessage" placeholder="例：落ち着いた接客を大切にしたい方、フェードを学びたい方。" rows={3} />
          <TextareaField label="教育・練習環境" name="education" placeholder="例：営業後に週1回の練習会、講習会参加補助あり。" rows={3} />
          <TextareaField label="オーナーからのメッセージ" name="ownerMessage" placeholder="求職者へ伝えたい考え方を短く。" rows={3} />
          <TextareaField label="求職者への一言" name="message" placeholder="例：まずは見学から気軽にお越しください。" required rows={3} />
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
              MVPではURL入力のみです。無料プランは写真1枚、有料プランでは写真枚数を増やせる想定です。
            </p>
          </div>
          <InputField label="メイン写真URL" name="imageUrl" type="url" placeholder="/images/shop-interior.jpg または https://..." />
          <InputField label="店内写真URL" name="interiorImageUrl" type="url" placeholder="https://..." />
          <InputField label="スタッフ写真URL" name="staffImageUrl" type="url" placeholder="https://..." />
          <InputField label="施術写真URL" name="workImageUrl" type="url" placeholder="https://..." />
        </section>

        <section className="grid gap-4">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">PLAN</p>
            <h2 className="mt-1 text-base font-black text-ink">掲載プラン</h2>
          </div>
          <div className="grid gap-3">
            {plans.map((plan) => {
              const selected = selectedPlan === plan.id;
              const Icon = plan.icon;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={
                    "rounded-[10px] border bg-white p-4 text-left transition " +
                    (selected ? "border-ink shadow-[0_10px_24px_rgba(17,17,17,0.06)]" : "border-line shadow-[0_8px_20px_rgba(17,17,17,0.025)]")
                  }
                >
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
                    {selected ? <Check aria-hidden="true" size={18} className="text-blush" /> : null}
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
                </button>
              );
            })}
          </div>
          {selectedPlan !== "free" ? (
            <p className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
              有料プランは準備中です。今は無料掲載として仮登録し、正式公開時にアップグレードをご案内します。決済は行われません。
            </p>
          ) : null}
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
            掲載前に運営が内容を確認します
          </div>
          <p className="mt-2 text-[0.78rem] font-medium leading-relaxed text-mute">
            求人広告ではなく、サロンの空気や働き方が伝わる情報に整えて掲載します。
          </p>
        </div>

        <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <p className="text-xs font-medium leading-relaxed text-mute">
            掲載する求人内容、応募者への連絡、面接対応、採用可否、労働条件の説明については、求人掲載サロンの責任で行ってください。
            BARBER HUBは求人情報の掲載場所と応募導線を提供するプラットフォームです。
          </p>
          <label className="mt-3 flex items-start gap-2 text-sm font-black leading-relaxed text-ink">
            <input type="checkbox" required className="mt-1 h-4 w-4 accent-blush" />
            求人内容と応募者対応は、掲載サロンの責任で行うことを確認しました。
          </label>
        </div>

        <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-ink text-sm font-black text-white">
          <Send aria-hidden="true" size={17} />
          仮登録する
        </button>
      </form>

      {/*
        Hiring access policy:
        - Keeping basic job listing free lowers the barrier for regional barber shops.
        - This can support areas facing staffing and succession shortages.
        - Future sponsorship from associations, schools, and companies should fit this public-interest layer.
        - BARBER HUB should keep editorial and product ownership of the hiring surface.
        - Paid plans should improve exposure and expression, not close off basic job posting.
      */}
    </PageChrome>
  );
}
