import { PostFormPage } from "@/components/PostFormPage";

export default function FeedPostPage() {
  return (
    <PostFormPage
      title="フィード投稿"
      description="記事にするほどではない小さな気づきや営業メモを共有できます。"
      phrase="記事じゃなくても大丈夫。小さな気づきから共有できます。THANKSは、役に立った証です。"
      fields={[
        { kind: "select", label: "カテゴリー", options: ["技術", "道具", "営業メモ", "集客", "日常", "編集部へ共有"] },
        { kind: "textarea", label: "本文", placeholder: "今日の気づき、道具の感想、営業中の小さな発見を書いてください。", rows: 6 },
        { kind: "note", text: "THANKSは、あなたの投稿が誰かの役に立った証として届きます。" },
      ]}
    />
  );
}
