"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type RoleAccess = "full" | "student" | "official";

type RoleOption = {
  label: string;
  access: RoleAccess;
};

const roleOptions: RoleOption[] = [
  { label: "理容師", access: "full" },
  { label: "サロンオーナー", access: "full" },
  { label: "アシスタント", access: "full" },
  { label: "スタイリスト", access: "full" },
  { label: "理容学生", access: "student" },
  { label: "その他理容業界関係者", access: "official" },
];

const areaOptions = [
  "九州・沖縄",
  "関東",
  "関西",
  "中部",
  "北海道・東北",
  "中国・四国",
  "その他",
];

const accessCopy: Record<RoleAccess, { title: string; body: string; href: string; cta: string }> = {
  full: {
    title: "通常のBack Roomに参加できます",
    body: "地域・経営・独立・技術・道具など、通常カテゴリのスレッドに参加できます。",
    href: "/backyard",
    cta: "Back Roomへ進む",
  },
  student: {
    title: "学生系カテゴリに参加できます",
    body: "理容学生は、学生・練習・進路相談などのカテゴリから参加できます。通常カテゴリへの参加範囲は段階的に広げます。",
    href: "/backyard?access=student",
    cta: "学生カテゴリへ進む",
  },
  official: {
    title: "参加範囲を確認します",
    body: "その他理容業界関係者は、通常カテゴリではなく公式プロフィールや協賛枠での参加を想定しています。MVPでは運営確認後の参加導線にします。",
    href: "/partners",
    cta: "公式参加の案内を見る",
  },
};

export function BackRoomSetupSheet() {
  const [role, setRole] = useState(roleOptions[0].label);
  const [industryChecked, setIndustryChecked] = useState(false);
  const [rulesChecked, setRulesChecked] = useState(false);
  const [rulesReadChecked, setRulesReadChecked] = useState(false);

  const selectedRole = useMemo(() => roleOptions.find((option) => option.label === role) ?? roleOptions[0], [role]);
  const copy = accessCopy[selectedRole.access];
  const canEnter = industryChecked && rulesChecked && rulesReadChecked;

  return (
    <section className="grid gap-4 px-4 pt-4">
      <div className="rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black leading-tight text-ink">Back Roomに参加する</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
          Back Roomは、理容師・理容業界で働く人のための営業後コミュニティです。
          表プロフィールとは別のニックネームで、技術・経営・地域・趣味の話をゆるくできます。
        </p>
      </div>

      <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-black text-ink">Back Room用ニックネーム</span>
            <input
              className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
              placeholder="例：営業後の理容師"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-ink">職種</span>
            <select
              className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {roleOptions.map((option) => (
                <option key={option.label}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-ink">地域</span>
            <select className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush" defaultValue="九州・沖縄">
              {areaOptions.map((area) => (
                <option key={area}>{area}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
        <div className="flex items-center gap-2 text-sm font-black text-ink">
          <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
          参加前の確認
        </div>
        <div className="mt-3 grid gap-2.5">
          <label className="flex items-start gap-2 text-xs font-bold leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={industryChecked}
              onChange={(event) => setIndustryChecked(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-blush"
            />
            私は理容師、理容学生、または理容業界関係者です。
          </label>
          <label className="flex items-start gap-2 text-xs font-bold leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={rulesChecked}
              onChange={(event) => setRulesChecked(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-blush"
            />
            個人攻撃、晒し、誹謗中傷をしません。
          </label>
          <label className="flex items-start gap-2 text-xs font-bold leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={rulesReadChecked}
              onChange={(event) => setRulesReadChecked(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-blush"
            />
            Back Room Rulesを確認しました。
          </label>
        </div>
        <Link href="/backyard-rules" className="mt-3 inline-flex text-xs font-black text-blush">
          Back Room Rulesを確認する
        </Link>
      </div>

      <div className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
        <p className="text-sm font-black text-ink">{copy.title}</p>
        <p className="mt-1.5 text-xs font-medium leading-relaxed text-mute">{copy.body}</p>
        <p className="mt-2 text-[0.68rem] font-bold leading-relaxed text-mute">
          今は理容師免許証アップロードを実装しません。将来的に任意で「理容師確認済み」ステータスを持てる設計にします。
        </p>
      </div>

      {canEnter ? (
        <Link href={copy.href} className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
          <CheckCircle2 aria-hidden="true" size={18} />
          {selectedRole.access === "full" ? "Back Roomに入る" : copy.cta}
        </Link>
      ) : (
        <button type="button" disabled className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-neutral-200 text-sm font-black text-mute">
          <CheckCircle2 aria-hidden="true" size={18} />
          確認チェック後に進む
        </button>
      )}
    </section>
  );
}
