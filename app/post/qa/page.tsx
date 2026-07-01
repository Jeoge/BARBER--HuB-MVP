import { PostFormPage } from "@/components/PostFormPage";

export default function QaPostPage() {
  return (
    <PostFormPage
      title="Q&Aで相談する"
      description="困っていることを相談すると、全国の理容師から知恵が集まります。"
      phrase="困ったことを言葉にするだけで、次の一手が見えやすくなります。"
      fields={[
        { kind: "input", label: "質問タイトル", placeholder: "例：値上げを常連のお客様にどう伝えていますか？" },
        { kind: "textarea", label: "詳しい内容", placeholder: "困っている状況、試したこと、聞きたいことを書いてください。", rows: 7 },
        { kind: "select", label: "カテゴリー", options: ["値上げ", "技術", "お客様トラブル", "経営", "スタッフ", "集客"] },
        { kind: "checks", label: "相談の温度感", options: ["ただ聞いてほしい", "解決したい"] },
      ]}
      imageLabel="参考画像を追加"
    />
  );
}
