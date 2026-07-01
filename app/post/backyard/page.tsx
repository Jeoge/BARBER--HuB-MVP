import { PostFormPage } from "@/components/PostFormPage";

export default function BackyardPostPage() {
  return (
    <PostFormPage
      title="Backyardに匿名投稿"
      description="普段言えない悩みや本音を、理容師限定エリアで匿名投稿できます。"
      phrase="本音はBackyardで。匿名でも、安心して話せる場所にします。"
      fields={[
        { kind: "input", label: "匿名表示名", placeholder: "例：一人営業 / 30代オーナー / 九州の理容師" },
        { kind: "select", label: "カテゴリー", options: ["売上・経営", "お客様トラブル", "スタッフ・人間関係", "価格改定", "一人営業の孤独", "SNS疲れ", "今日だけ聞いてほしい"] },
        { kind: "textarea", label: "本文", placeholder: "普段言えない悩みや本音を書いてください。", rows: 7 },
        { kind: "checks", label: "投稿の目的", options: ["ただ聞いてほしい", "経験を聞きたい"] },
        {
          kind: "note",
          text: "個人名・店舗名を出した攻撃や晒しは禁止です。本音を言える場所ですが、荒れる場所にはしません。",
        },
      ]}
      imageLabel="必要なら画像を追加"
    />
  );
}
