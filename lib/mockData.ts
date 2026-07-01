export type Article = {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  summary: string;
  body: string[];
  thanks: number;
  comments: number;
  accent: string;
};

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  body: string;
  conversationTip: string;
  morningTip: string;
  category: string;
  time: string;
};

export type Post = {
  id: string;
  authorLabel: string;
  area: string;
  category: string;
  source: string;
  body: string;
  thanks: number;
  comments: number;
  accents: string[];
};

export type QaItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  body: string;
  comments: number;
  ideas: number;
};

export type Seminar = {
  id: string;
  title: string;
  category: string;
  meta: string;
  accent: string;
};

export type Job = {
  id: string;
  title: string;
  category: string;
  meta: string;
  accent: string;
};

export type BackyardPost = {
  id: string;
  anonymousName: string;
  attribute: string;
  category: string;
  body: string;
  empathy: number;
  comments: number;
  status: string;
  reaction: string;
};

export const articles: Article[] = [
  {
    id: "rakuten-ai",
    title: "AIで楽天ビューティー閲覧数1位になった話",
    category: "AI活用",
    author: "BARBER HUB編集部",
    date: "2026.07.01",
    summary: "写真、説明文、口コミ返信をAI編集部が整理し、閲覧数を伸ばした実践メモ。",
    body: [
      "サロンの魅力はあるのに、予約サイト上で伝わりきっていないケースは少なくありません。",
      "今回は写真の並び、メニュー説明、口コミ返信の言葉を見直し、初めて見るお客様にも安心感が伝わる形に整えました。",
      "AIは派手な文章を書くためではなく、日々の営業で伝えきれない価値を整理するために使います。",
    ],
    thanks: 128,
    comments: 24,
    accent: "news",
  },
  {
    id: "freee-api-cost",
    title: "freee APIで月2.5万円削減した話",
    category: "経営",
    author: "個人店オーナー",
    date: "2026.06.30",
    summary: "会計と予約まわりの手入力を減らし、固定費と作業時間を見直した記録。",
    body: [
      "毎月の小さな固定費は、気づくと利益を圧迫します。",
      "会計、予約、売上確認の流れを整理し、重複していた作業と不要な契約を洗い出しました。",
      "大切なのはツールを増やすことではなく、店主が営業に集中できる時間を取り戻すことです。",
    ],
    thanks: 96,
    comments: 18,
    accent: "student",
  },
  {
    id: "cti-pos",
    title: "CTI導入でPOSレジを解約した話",
    category: "経営",
    author: "BARBER HUB編集部",
    date: "2026.06.29",
    summary: "電話、顧客メモ、会計導線を見直し、店舗運営の無駄を減らしたケース。",
    body: [
      "電話予約の多いサロンでは、顧客情報の確認に時間がかかりがちです。",
      "CTIで着信時に顧客メモを確認できるようにし、会計と予約確認の流れを簡素化しました。",
      "システム導入は目的ではなく、接客の質を落とさずに手間を減らすための手段です。",
    ],
    thanks: 84,
    comments: 12,
    accent: "tool",
  },
  {
    id: "gray-blending-40s-article",
    title: "40代以上に刺さる白髪ぼかし提案",
    category: "技術",
    author: "BARBER HUB編集部",
    date: "2026.06.28",
    summary: "若返りではなく清潔感を軸に伝える、白髪ぼかし提案の考え方。",
    body: [
      "40代以上のお客様には、若返りという言葉よりも清潔感や自然さが伝わりやすいことがあります。",
      "白髪を隠すのではなく、全体の印象を整える提案にすると心理的なハードルが下がります。",
      "初回は変化を控えめにし、次回来店時に周囲の反応を聞く流れが自然です。",
    ],
    thanks: 154,
    comments: 31,
    accent: "haircut",
  },
  {
    id: "google-review-growth",
    title: "Google口コミで新規予約を増やす方法",
    category: "集客",
    author: "BARBER HUB編集部",
    date: "2026.06.27",
    summary: "口コミ依頼と返信を自然に続けるための、現場向けテンプレート集。",
    body: [
      "口コミは数だけでなく、返信の温度も見られています。",
      "短くても、お客様の具体的な言葉に触れた返信は安心感につながります。",
      "お願いするタイミングは、仕上がりに満足している瞬間が自然です。",
    ],
    thanks: 112,
    comments: 19,
    accent: "news",
  },
  {
    id: "silent-clipper",
    title: "静音バリカン新商品レビュー",
    category: "メーカー新商品",
    author: "メーカー情報 / BARBER HUB編集部",
    date: "2026.06.26",
    summary: "音と振動を抑えたバリカンを、朝イチ施術や子どもカット目線で確認。",
    body: [
      "道具の音や振動は、お客様の体験に思った以上に影響します。",
      "静音タイプは、朝イチの落ち着いた時間やお子様の施術で特に相性が良い印象です。",
      "切れ味だけでなく、店の空気に合う道具かどうかも選ぶ基準になります。",
    ],
    thanks: 76,
    comments: 11,
    accent: "tool",
  },
  {
    id: "fukuoka-seminar",
    title: "福岡フェードセミナー 要点まとめ",
    category: "講習会",
    author: "練習会レポート",
    date: "2026.06.25",
    summary: "現地に行けなかった理容師にも届く、フェード講習の学びの整理。",
    body: [
      "今回の講習では、刈り上げの高さよりも、つなぎの見え方を確認する順番が重視されていました。",
      "光、姿勢、コーム角度を変えながら見ることで、濃く残る場所の原因を切り分けやすくなります。",
      "学んだことを次の誰かへ残すことで、地域を越えて技術が共有されます。",
    ],
    thanks: 89,
    comments: 17,
    accent: "seminar",
  },
];

export const news: NewsItem[] = [
  {
    id: "scalp-care-rainy",
    title: "梅雨時期の頭皮ケア需要が増加中",
    summary: "湿気と汗で頭皮のベタつき相談が増えやすい時期です。",
    body: "梅雨時期は髪型の崩れだけでなく、頭皮の不快感を相談される機会も増えます。短い会話から、シャンプーやヘッドスパの提案につなげやすいテーマです。",
    conversationTip: "最近、湿気で頭皮が重く感じる方が増えています。軽いケアだけでも変わりますよ。",
    morningTip: "今日は梅雨時期の頭皮ケアを一言添えて、店販や次回提案につなげましょう。",
    category: "会話ネタ",
    time: "07:30",
  },
  {
    id: "google-review-reply",
    title: "Google口コミ返信で新規予約率が変わる",
    summary: "短い返信でも、初めてのお客様の安心感につながります。",
    body: "口コミ返信は長文である必要はありません。お客様の言葉に触れながら、店の姿勢が伝わる返信を続けることで、新規客の不安を減らせます。",
    conversationTip: "口コミを見て来てくださる方も増えているので、いただいた声は大切に返しています。",
    morningTip: "口コミ返信は早く、丁寧に、店の温度が伝わる一言を意識しましょう。",
    category: "経営ヒント",
    time: "07:35",
  },
  {
    id: "silent-clipper-news",
    title: "静音バリカンの新商品が話題",
    summary: "朝イチ施術でも使いやすいという声が出ています。",
    body: "静音性を重視したバリカンは、子どもカットや落ち着いた空間づくりにも相性があります。道具選びもサービス体験の一部として見直せます。",
    conversationTip: "最近は音が静かな道具も増えていて、施術中の負担が少なくなっています。",
    morningTip: "道具の音や振動も、お客様の居心地に関わるポイントとして見直してみましょう。",
    category: "メーカー情報",
    time: "07:40",
  },
  {
    id: "gray-blending-40s",
    title: "40代男性に白髪ぼかし提案が増加",
    summary: "若返りより、清潔感を軸にした提案が受け入れられやすい傾向です。",
    body: "白髪ぼかしは、隠すより整えるという伝え方が自然です。初回は控えめな変化にすると、抵抗感が少なく次回提案につながります。",
    conversationTip: "白髪を隠すより、自然に整える方法もあります。少しだけ印象が軽くなりますよ。",
    morningTip: "白髪ぼかしは変身ではなく、清潔感を整える提案として伝えましょう。",
    category: "技術ヒント",
    time: "07:45",
  },
  {
    id: "heatstroke-smalltalk",
    title: "今日の時事メモ：熱中症対策を早めに",
    summary: "業界外ニュースも、お客様との自然な会話の入口になります。",
    body: "暑さ対策の話題は年齢を問わず使いやすい会話です。外仕事のお客様には、首元を軽くする提案にもつなげられます。",
    conversationTip: "今日は外かなり暑いですね。首元を少し軽くすると体感も変わりますよ。",
    morningTip: "業界外ニュースも会話の入口になります。今日は暑さ対策の一言を添えましょう。",
    category: "一般ニュース",
    time: "07:50",
  },
];

export const posts: Post[] = [
  {
    id: "fade-voice",
    authorLabel: "個人理容師",
    area: "東京",
    category: "技術",
    source: "個人理容師",
    body: "今日のフェード、仕上げ前の声かけを変えたら次回予約が入りました。写真は0.8mmからのつなぎです。",
    thanks: 128,
    comments: 13,
    accents: ["haircut", "news", "tool"],
  },
  {
    id: "price-change",
    authorLabel: "匿名理容師",
    area: "関西",
    category: "経営",
    source: "匿名理容師",
    body: "価格改定の説明文を変えたら、思ったより自然に受け入れてもらえました。値上げより、安心して通える理由を伝えることが大事でした。",
    thanks: 86,
    comments: 19,
    accents: ["news", "student", "tool"],
  },
  {
    id: "owner-retention",
    authorLabel: "個人店オーナー",
    area: "中部",
    category: "経営",
    source: "個人店オーナー",
    body: "次回予約の声かけを最後ではなく施術中に変えたら、自然に予約が入りやすくなりました。",
    thanks: 92,
    comments: 14,
    accents: ["student", "haircut", "news"],
  },
  {
    id: "editor-weekly",
    authorLabel: "BARBER HUB編集部",
    area: "編集部",
    category: "業界ニュース",
    source: "BARBER HUB編集部",
    body: "今週は講習会アーカイブ、求人、メーカー新商品の動きが増えています。営業前に要点だけ整理しました。",
    thanks: 74,
    comments: 6,
    accents: ["seminar", "tool", "news"],
  },
  {
    id: "practice-report",
    authorLabel: "練習会レポート",
    area: "オンライン",
    category: "講習会",
    source: "練習会レポート",
    body: "フェード練習会で、濃く残る場所は光と姿勢を変えて見るという話が印象に残りました。",
    thanks: 67,
    comments: 9,
    accents: ["seminar", "haircut", "tool"],
  },
];

export const qaItems: QaItem[] = [
  {
    id: "fade-blend",
    title: "フェードのぼかしがつながらない",
    category: "技術",
    status: "みんなで解決中",
    body: "0.8mmから上のつなぎで、片側だけ濃く残ることがあります。光の当たり方なのか、手順なのか、確認する順番を知りたいです。",
    comments: 24,
    ideas: 11,
  },
  {
    id: "price-raise",
    title: "値上げの伝え方に悩んでいる",
    category: "価格改定",
    status: "ただ聞いてほしい",
    body: "長年通ってくださっているお客様ほど、価格改定の伝え方に悩みます。角が立たない一言を知りたいです。",
    comments: 18,
    ideas: 7,
  },
  {
    id: "google-review-request",
    title: "Google口コミを自然にお願いする方法",
    category: "集客",
    status: "みんなで解決中",
    body: "口コミをお願いしたいのですが、押し売りっぽくならない言い方を探しています。",
    comments: 16,
    ideas: 8,
  },
];

export const seminars: Seminar[] = [
  { id: "seminar-fade", title: "福岡フェードセミナー 要点まとめ", category: "講習会", meta: "アーカイブ", accent: "seminar" },
  { id: "contest-style", title: "コンクール入賞スタイルの見どころ", category: "コンクール", meta: "解説", accent: "haircut" },
  { id: "online-gray", title: "白髪ぼかし提案 オンライン講習", category: "オンライン講習", meta: "後から視聴", accent: "news" },
];

export const jobs: Job[] = [
  { id: "job-student", title: "学生向けサロン見学の選び方", category: "学生", meta: "編集部まとめ", accent: "student" },
  { id: "job-salon", title: "個人店の魅力が伝わる求人票の作り方", category: "求人", meta: "求人掲載", accent: "news" },
  { id: "job-school", title: "学校向け掲載メニュー準備中", category: "学校", meta: "問い合わせ", accent: "seminar" },
];

export const backyardPosts: BackyardPost[] = [
  {
    id: "backyard-price",
    anonymousName: "匿名理容師",
    attribute: "一人営業",
    category: "価格改定",
    body: "値上げを言い出せないまま数か月経っています。長年のお客様にどう伝えたらいいか悩んでいます。",
    empathy: 42,
    comments: 18,
    status: "ただ聞いてほしい",
    reaction: "わかる",
  },
  {
    id: "backyard-lonely",
    anonymousName: "個人店オーナー",
    attribute: "一人営業",
    category: "一人営業の孤独",
    body: "営業後に相談できる相手が少なく、判断を全部ひとりで抱えている感じがあります。",
    empathy: 51,
    comments: 16,
    status: "経験を聞きたい",
    reaction: "経験あり",
  },
  {
    id: "backyard-sns-fatigue",
    anonymousName: "匿名理容師",
    attribute: "SNS疲れ",
    category: "SNS・集客疲れ",
    body: "投稿しなきゃと思うほど手が止まります。毎日見られている感じに少し疲れました。",
    empathy: 58,
    comments: 21,
    status: "共感募集中",
    reaction: "応援",
  },
];

export function findArticle(id: string) {
  return articles.find((article) => article.id === id);
}

export function findNews(id: string) {
  return news.find((item) => item.id === id);
}

export function findPost(id: string) {
  return posts.find((post) => post.id === id);
}

export function findQaItem(id: string) {
  return qaItems.find((item) => item.id === id);
}

export function findBackyardPost(id: string) {
  return backyardPosts.find((post) => post.id === id);
}
