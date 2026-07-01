import { PostFormPage } from "@/components/PostFormPage";

export default function SeminarPostPage() {
  return (
    <PostFormPage
      title="講習会レポートを書く"
      description="参加できなかった理容師にも学びが届くように、講習会や練習会の内容を共有できます。"
      phrase="学んだことを、次の誰かへ。現地に行けなかった人にも価値が届きます。"
      fields={[
        { kind: "input", label: "講習会名", placeholder: "例：福岡フェードセミナー" },
        { kind: "input", label: "開催地域", placeholder: "例：福岡 / 大阪 / オンライン" },
        { kind: "textarea", label: "学んだこと", placeholder: "印象に残った内容、明日から使えそうなことを書いてください。", rows: 7 },
        { kind: "input", label: "関連タグ", placeholder: "例：フェード, メンズカット, 集客" },
      ]}
      imageLabel="講習会写真を追加"
    />
  );
}
