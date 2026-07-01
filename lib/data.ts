export type FeatureArticle = {
  id: number;
  label: string;
  title: string;
  summary: string;
  author: string;
  thanks: number;
  comments: number;
  tone: string;
};

export type RailItem = {
  tag: string;
  title: string;
  meta: string;
  accent: string;
};

export type FeedPost = {
  name: string;
  area: string;
  category: string;
  body: string;
  thanks: number;
  comments: number;
  accents: string[];
};

export type EditorPick = {
  type: "固定記事" | "投稿" | "業界ニュース" | "一般ニュース" | "新商品" | "講習会" | "Q&A" | "求人" | "学生";
  title: string;
  note: string;
  thanks: number;
  author: string;
  accent: string;
};

export type TodayNewsItem = {
  title: string;
  body: string;
};

export const featureArticles: FeatureArticle[] = [
  {
    id: 1,
    label: "今日の注目",
    title: "AIで楽天ビューティー閲覧数1位になった話",
    summary: "写真、説明文、口コミ返信をAI編集部が整えた30日間の記録。",
    author: "BARBER LEON 福岡",
    thanks: 128,
    comments: 24,
    tone: "from-neutral-950 via-neutral-900 to-neutral-700",
  },
  {
    id: 2,
    label: "経営",
    title: "freee APIで年間66万円固定費削減",
    summary: "支払いを見える化し、削れる月額費を朝の10分で発見。",
    author: "HUB経営編集部",
    thanks: 96,
    comments: 18,
    tone: "from-stone-950 via-zinc-900 to-zinc-700",
  },
  {
    id: 3,
    label: "集客",
    title: "Google口コミで新規客を増やす方法",
    summary: "お願いのタイミング、返信テンプレ、写真更新の順番まで公開。",
    author: "TAKA / 東京",
    thanks: 112,
    comments: 19,
    tone: "from-neutral-900 via-neutral-800 to-stone-600",
  },
  {
    id: 4,
    label: "技術",
    title: "40代以上に刺さる白髪ぼかし提案",
    summary: "若作りではなく清潔感へ。明日から使える会話の組み立て。",
    author: "RYO / 名古屋",
    thanks: 154,
    comments: 31,
    tone: "from-zinc-950 via-neutral-800 to-stone-500",
  },
  {
    id: 5,
    label: "REPORT",
    title: "講習会に行けない人のための全国レポート",
    summary: "現場で刺さった学びだけをAI編集部が3分で読める形へ。",
    author: "BARBER HUB編集部",
    thanks: 141,
    comments: 27,
    tone: "from-neutral-950 via-stone-900 to-neutral-600",
  },
];

export const categories = [
  "ホーム",
  "フィード",
  "経営",
  "集客",
  "AI",
  "技術",
  "道具",
  "Q&A",
  "講習会",
  "求人",
  "学生",
];

export const todayNews = [
  {
    title: "お客様との会話",
    body: "今日の話題は物価高。料金ではなく、長く通える安心感から話す。",
  },
  {
    title: "朝礼で使える話題",
    body: "一般ニュース、業界ニュース、予約状況を3行で共有して営業開始。",
  },
  {
    title: "経営・技術ヒント",
    body: "固定費チェックと白髪ぼかし提案を、今日の営業で1つ試す。",
  },
];

export const todayNewsSets: Record<"morning" | "noon" | "evening" | "night", TodayNewsItem[]> = {
  morning: [
    {
      title: "お客様との会話",
      body: "梅雨時期の頭皮ケアを一言で。かゆみ・匂い・整髪料残りを自然に話題へ。",
    },
    {
      title: "朝礼で使える3行",
      body: "一般ニュース、予約状況、今日の提案メニューを3行で共有して営業開始。",
    },
    {
      title: "経営ヒント",
      body: "当日キャンセル対策は、前日リマインド文の一言を柔らかく変える。",
    },
  ],
  noon: [
    {
      title: "技術ヒント",
      body: "フェードのつなぎは明るい席で一度確認。写真投稿にも残しやすい。",
    },
    {
      title: "スタッフ同士の会話",
      body: "午前の成功事例を1つ共有。次のお客様への提案にすぐ使う。",
    },
    {
      title: "メーカー新商品",
      body: "静音バリカンのレビューが増加中。昼休みに比較だけ見ておく。",
    },
  ],
  evening: [
    {
      title: "THANKSランキング",
      body: "今日伸びた投稿は、接客トークと白髪ぼかし提案。明日の朝礼候補に。",
    },
    {
      title: "講習会チェック",
      body: "今夜見返せるアーカイブを整理。行けない講習会も学びに変える。",
    },
    {
      title: "求人ヒント",
      body: "学生向け投稿は、店の空気が伝わる写真が反応されやすい。",
    },
  ],
  night: [
    {
      title: "今日のまとめ",
      body: "投稿・ニュース・Q&Aから、明日の営業に使える要点だけを整理。",
    },
    {
      title: "有料級記事",
      body: "固定費削減、口コミ返信、白髪ぼかし提案を保存して明日読む。",
    },
    {
      title: "明日の営業ヒント",
      body: "最初のお客様に話せる季節ネタと、提案メニューを1つ準備。",
    },
  ],
};

export const feedPosts: FeedPost[] = [
  {
    name: "TAKA",
    area: "東京・渋谷",
    category: "技術",
    body: "今日のフェード、仕上げ前の声かけを変えたら次回予約が入りました。写真は0.8mmからのつなぎ方です。",
    thanks: 128,
    comments: 13,
    accents: ["haircut", "news", "tool"],
  },
  {
    name: "RYO",
    area: "愛知・栄",
    category: "道具",
    body: "このバリカン、静音性がかなり良い。朝イチのお客様にも使いやすいので、しばらく主力にします。",
    thanks: 74,
    comments: 8,
    accents: ["tool", "tool", "haircut"],
  },
  {
    name: "SHOHEI",
    area: "福岡・天神",
    category: "講習会",
    body: "講習会メモをAI編集部に投げたら、朝礼ネタに変わりました。学びが店内に残る感じがいい。",
    thanks: 91,
    comments: 11,
    accents: ["seminar", "news", "student"],
  },
];

export const newArticles: RailItem[] = [
  {
    tag: "経営",
    title: "理容室の利益率を上げる5つの方法",
    meta: "3分で読む",
    accent: "news",
  },
  {
    tag: "技術",
    title: "フェードの高さ別スタイル解説",
    meta: "保存 214",
    accent: "haircut",
  },
  {
    tag: "集客",
    title: "インスタ集客で新規を増やす方法",
    meta: "THANKS 88",
    accent: "student",
  },
  {
    tag: "AI",
    title: "投稿カレンダーをAIで作る",
    meta: "今日から使える",
    accent: "seminar",
  },
];

export const editorPicks: EditorPick[] = [
  {
    type: "固定記事",
    title: "AIで楽天ビューティー閲覧数1位になった話",
    note: "長く読まれる集客ノウハウ",
    thanks: 128,
    author: "AI編集部",
    accent: "news",
  },
  {
    type: "投稿",
    title: "今日のフェード、声かけを変えたら次回予約が入った",
    note: "全国の理容師が今シェア",
    thanks: 94,
    author: "TAKA / 東京",
    accent: "haircut",
  },
  {
    type: "一般ニュース",
    title: "今日のお客様との会話ネタ：梅雨時期の頭皮ケア",
    note: "営業前の3分で使える話題",
    thanks: 72,
    author: "AI編集部",
    accent: "student",
  },
  {
    type: "新商品",
    title: "静音バリカンレビュー：朝イチでも使いやすい1台",
    note: "メーカー情報をAI編集部が要約",
    thanks: 76,
    author: "メーカー情報",
    accent: "tool",
  },
  {
    type: "Q&A",
    title: "フェードのぼかしがつながらない時の確認ポイント",
    note: "みんなで解決中",
    thanks: 61,
    author: "Q&A編集部",
    accent: "haircut",
  },
  {
    type: "講習会",
    title: "福岡フェードセミナー：行けなかった人向け要点まとめ",
    note: "講習会アーカイブ",
    thanks: 89,
    author: "BARBER HUB編集部",
    accent: "seminar",
  },
  {
    type: "求人",
    title: "週休2日サロン求人ピックアップ",
    note: "夕方に反応が伸びています",
    thanks: 48,
    author: "求人編集部",
    accent: "news",
  },
  {
    type: "学生",
    title: "学生が見たいサロン情報の作り方",
    note: "学校・採用向け",
    thanks: 55,
    author: "学生向け",
    accent: "student",
  },
  {
    type: "業界ニュース",
    title: "理容業界ニュース：国家試験と採用動向を3分で確認",
    note: "朝の確認に最適",
    thanks: 83,
    author: "AI編集部",
    accent: "news",
  },
];

export const thanksRankings = [
  {
    name: "TAKA",
    title: "フェード前の声かけを変えた話",
    count: 128,
  },
  {
    name: "RYO",
    title: "静音バリカンを営業で試したレビュー",
    count: 114,
  },
  {
    name: "SHOHEI",
    title: "講習会メモを朝礼ネタに変えた",
    count: 91,
  },
];

export const makerItems: RailItem[] = [
  {
    tag: "新商品",
    title: "静音バリカン PRO X1 レビュー",
    meta: "THANKS 76",
    accent: "tool",
  },
  {
    tag: "比較",
    title: "コードレスクリッパー3機種を営業目線で比較",
    meta: "保存 142",
    accent: "tool",
  },
  {
    tag: "メーカー",
    title: "梅雨時期の頭皮ケア商品まとめ",
    meta: "3分で確認",
    accent: "news",
  },
];

export const seminarItems: RailItem[] = [
  {
    tag: "LIVE",
    title: "北海道フェード講習会 LIVE中",
    meta: "128人が視聴中",
    accent: "seminar",
  },
  {
    tag: "ARCHIVE",
    title: "関西バーバーフェス2024",
    meta: "6/30 大阪南港ATC",
    accent: "news",
  },
  {
    tag: "CONTEST",
    title: "九州理容コンクール 入賞スタイル解説",
    meta: "6/25 福岡",
    accent: "haircut",
  },
];

export const recruitmentItems: RailItem[] = [
  {
    tag: "学生",
    title: "学生が見たいサロン情報の作り方",
    meta: "学校向け",
    accent: "student",
  },
  {
    tag: "求人",
    title: "週休2日サロン求人ピックアップ",
    meta: "全国 42件",
    accent: "news",
  },
  {
    tag: "学校広告",
    title: "学校広告の掲載枠を確認する",
    meta: "資料あり",
    accent: "seminar",
  },
];

export const questions = [
  {
    title: "白髪ぼかしの説明、料金アップをどう伝えていますか？",
    meta: "経営・技術 / 18件の解決アイデア",
  },
  {
    title: "新卒スタッフがSNS投稿を続けやすい仕組みを知りたいです。",
    meta: "求人・集客 / 12件の解決アイデア",
  },
  {
    title: "キャンセルが続くお客様への連絡文、角が立たない書き方は？",
    meta: "接客・予約 / 21件の解決アイデア",
  },
];

export const archives = seminarItems.map((item) => ({
  tag: item.tag,
  title: item.title,
  date: item.meta,
}));

export const quickAccessItems = ["Q&A", "講習会", "求人", "学生", "メーカー", "AI編集部"];

export const studentRecruitment = ["学生向け", "サロン求人", "学校広告"];
