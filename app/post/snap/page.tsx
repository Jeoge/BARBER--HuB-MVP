import { PostFormPage } from "@/components/PostFormPage";

export default function SnapPostPage() {
  return (
    <PostFormPage
      title="スナップ投稿"
      description="今日の営業の1コマ、道具の感想、ちょっとした気づきを共有できます。"
      phrase="記事じゃなくても大丈夫。小さな気づきから共有できます。Thanksは、役に立った証です。"
      imageLabel="縦写真を追加"
      fields={[
        { kind: "select", label: "カテゴリー", options: ["技術", "道具", "営業メモ", "集客", "日常", "編集部へ共有"] },
        { kind: "textarea", label: "本文", placeholder: "今日の営業で気づいたことを書いてみましょう", rows: 6 },
        { kind: "note", text: "Thanksは、あなたのスナップが誰かの役に立った証として届きます。" },
      ]}
      postingNotice={{
        title: "投稿ルール",
        body: [
          "Snapは、現場の気づきや日常を共有する場所です。企業・学校・メーカー・ディーラー等の告知や広告掲載は、運営確認のうえ専用枠で行います。",
          "PR・協賛・提供を含む投稿は、広告であることが分かる表記を行い、広告と分からない投稿は避けてください。",
        ],
        link: {
          href: "/partners/dealers",
          label: "広告掲載について相談する",
        },
      }}
    />
  );
}
