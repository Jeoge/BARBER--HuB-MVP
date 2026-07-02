import { PostFormPage } from "@/components/PostFormPage";

export default function BackyardPostPage() {
  return (
    <PostFormPage
      title="Back Roomに投稿"
      description="仕事終わりに、技術・道具・経営・今日あったことをスレッドで気軽に話せます。"
      phrase="スレッドを立てて、理容師同士でゆるく話そう。"
      fields={[
        { kind: "input", label: "ニックネーム表示", placeholder: "例：営業後の理容師 / 40代オーナー" },
        { kind: "input", label: "タイトル", placeholder: "例：静音バリカンでおすすめありますか？" },
        { kind: "select", label: "カテゴリー", options: ["技術", "道具", "経営", "集客", "求人", "学生", "今日の営業後", "ちょっと相談", "雑談"] },
        { kind: "textarea", label: "本文", placeholder: "気軽に話したいことを書いてください。", rows: 7 },
        {
          kind: "note",
          text: "店名や本名を出さずに話せますが、個人名・店舗名を出した攻撃や晒しは禁止です。",
        },
      ]}
      imageLabel="必要なら画像を追加"
    />
  );
}
