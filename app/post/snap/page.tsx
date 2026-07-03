import { PostFormPage } from "@/components/PostFormPage";

export default function SnapPostPage() {
  return (
    <PostFormPage
      title="スナップ投稿"
      description="今日の営業の1コマ、道具の感想、ちょっとした気づきを共有できます。"
      phrase="記事じゃなくても大丈夫。小さな気づきから共有できます。Thanksは、役に立った証です。"
      fields={[
        { kind: "select", label: "カテゴリー", options: ["技術", "道具", "営業メモ", "集客", "日常", "編集部へ共有"] },
        { kind: "textarea", label: "本文", placeholder: "今日の営業で気づいたことを書いてみましょう", rows: 6 },
        { kind: "note", text: "Thanksは、あなたのスナップが誰かの役に立った証として届きます。" },
      ]}
    />
  );
}
