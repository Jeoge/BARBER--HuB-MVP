import { PostFormPage } from "@/components/PostFormPage";

export default function ArticlePostPage() {
  return (
    <PostFormPage
      title="経験記事を書く"
      description="あなたの実体験が、誰かの経営や技術のヒントになります。"
      phrase="あなたの経験が、誰かのヒントになる。うまくいった話も、途中の試行錯誤も価値になります。"
      fields={[
        { kind: "input", label: "タイトル", placeholder: "例：Google口コミ返信を変えたら新規予約が増えた話" },
        { kind: "select", label: "カテゴリー", options: ["経営", "技術", "集客", "AI活用", "独立", "道具"] },
        { kind: "textarea", label: "本文", placeholder: "背景、試したこと、結果、学びを書いてください。", rows: 8 },
        { kind: "textarea", label: "この記事で伝えたいこと", placeholder: "読んだ人に一番持ち帰ってほしいこと。", rows: 3 },
      ]}
      imageLabel="記事画像を追加"
    />
  );
}
