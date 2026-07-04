export type Article = {
  id: string;
  title: string;
  category: string;
  topicSlugs?: string[];
  author: string;
  profileId?: string;
  date: string;
  summary: string;
  body: string[];
  thanks: number;
  comments: number;
  likeCount?: number;
  thanksCount?: number;
  saveCount?: number;
  commentCount?: number;
  accent: string;
  imageUrl?: string;
};

// Image paths use files in public/images. Example:
// imageUrl: "/images/fade-cut.jpg"
// If a file is missing, MagazineImage falls back to the premium gray placeholder.

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
  profileId?: string;
  area: string;
  category: string;
  topicSlugs?: string[];
  source: string;
  body: string;
  thanks: number;
  comments: number;
  likeCount?: number;
  thanksCount?: number;
  saveCount?: number;
  commentCount?: number;
  accents: string[];
  imageUrl?: string;
};

export type QaItem = {
  id: string;
  title: string;
  profileId?: string;
  category: string;
  topicSlugs?: string[];
  status: string;
  body: string;
  comments: number;
  ideas: number;
};

export type Seminar = {
  id: string;
  title: string;
  category: string;
  topicSlugs?: string[];
  meta: string;
  accent: string;
  imageUrl?: string;
};

export type Job = {
  id: string;
  title: string;
  category: string;
  topicSlugs?: string[];
  meta: string;
  accent: string;
  imageUrl?: string;
};

export type BackRoomVerificationStatus = "self-declared" | "barber-verified";

// Future optional verification methods:
// barber license, salon/store info, Google Business Profile, business card,
// official SNS, association/school/salon confirmation, or manual operator review.
// "barber-verified" maps to an optional public/private status like "理容師確認済み".
export type BackyardPost = {
  id: string;
  anonymousName: string;
  attribute: string;
  roleLabel?: string;
  category: string;
  topicSlugs?: string[];
  roomId?: string;
  title?: string;
  body: string;
  verificationStatus?: BackRoomVerificationStatus;
  moderationStatus?: "normal" | "collapsed" | "review" | "hidden" | "locked";
  badCount?: number;
  createdAt?: string;
  empathy: number;
  comments: number;
  status: string;
  reaction: string;
  latestCommentAt?: string;
};

export type Product = {
  id: string;
  name: string;
  maker: string;
  category: string;
  description: string;
  priceLabel: string;
  sponsorLabel?: string;
  salonVerifiedLabel?: string;
  features: string[];
  useCases: string[];
  relatedArticleIds: string[];
  relatedSeminarIds: string[];
  accent: string;
  imageUrl?: string;
};

export type ReactionMetrics = {
  likeCount: number;
  thanksCount: number;
  saveCount: number;
  commentCount: number;
};

type CountableContent = {
  thanks?: number;
  comments?: number;
  likeCount?: number;
  thanksCount?: number;
  saveCount?: number;
  commentCount?: number;
};

export function getReactionMetrics(item: CountableContent): ReactionMetrics {
  const thanksCount = item.thanksCount ?? item.thanks ?? 0;
  const commentCount = item.commentCount ?? item.comments ?? 0;

  return {
    likeCount: item.likeCount ?? Math.max(thanksCount * 2 - commentCount, 0),
    thanksCount,
    saveCount: item.saveCount ?? Math.max(Math.round(thanksCount / 3), 0),
    commentCount,
  };
}

export const articles: Article[] = [
  {
    id: "rakuten-ai",
    profileId: "barber-hub-editor",
    title: "AIで楽天ビューティー閲覧数1位になった話",
    category: "AI活用",
    topicSlugs: ["ai", "marketing"],
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
    imageUrl: "/images/fade-cut.jpg",
  },
  {
    id: "freee-api-cost",
    profileId: "barber-sample-fukuoka-nishi",
    title: "freee APIで月2.5万円削減した話",
    category: "経営",
    topicSlugs: ["management", "ai"],
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
    imageUrl: "/images/shop-interior.jpg",
  },
  {
    id: "cti-pos",
    profileId: "barber-hub-editor",
    title: "CTI導入でPOSレジを解約した話",
    category: "経営",
    topicSlugs: ["management", "ai"],
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
    imageUrl: "/images/shop-interior.jpg",
  },
  {
    id: "gray-blending-40s-article",
    profileId: "barber-hub-editor",
    title: "40代以上に刺さる白髪ぼかし提案",
    category: "技術",
    topicSlugs: ["technique", "management"],
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
    imageUrl: "/images/fade-cut.jpg",
  },
  {
    id: "google-review-growth",
    profileId: "barber-sample-fukuoka-nishi",
    title: "Google口コミで新規予約を増やす方法",
    category: "集客",
    topicSlugs: ["marketing", "management"],
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
    imageUrl: "/images/shop-interior.jpg",
  },
  {
    id: "silent-clipper",
    profileId: "maker-tools-demo",
    title: "静音バリカン新商品レビュー",
    category: "メーカー新商品",
    topicSlugs: ["tools", "technique"],
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
    imageUrl: "/images/tools-stilllife.jpg",
  },
  {
    id: "fukuoka-seminar",
    profileId: "fukuoka-barber",
    title: "福岡フェードセミナー 要点まとめ",
    category: "講習会",
    topicSlugs: ["technique"],
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
    imageUrl: "/images/fade-cut.jpg",
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
    profileId: "fukuoka-barber",
    authorLabel: "個人理容師",
    area: "東京",
    category: "技術",
    topicSlugs: ["technique", "marketing"],
    source: "個人理容師",
    body: "今日のフェード、仕上げ前の声かけを変えたら次回予約が入りました。写真は0.8mmからのつなぎです。",
    thanks: 128,
    comments: 13,
    accents: ["haircut", "news", "tool"],
    imageUrl: "/images/fade-cut.jpg",
  },
  {
    id: "price-change",
    profileId: "anonymous-barber",
    authorLabel: "匿名理容師",
    area: "関西",
    category: "経営",
    topicSlugs: ["management", "marketing"],
    source: "匿名理容師",
    body: "価格改定の説明文を変えたら、思ったより自然に受け入れてもらえました。値上げより、安心して通える理由を伝えることが大事でした。",
    thanks: 86,
    comments: 19,
    accents: ["news", "student", "tool"],
    imageUrl: "/images/shop-interior.jpg",
  },
  {
    id: "owner-retention",
    profileId: "barber-sample-fukuoka-nishi",
    authorLabel: "個人店オーナー",
    area: "中部",
    category: "経営",
    topicSlugs: ["management", "marketing"],
    source: "個人店オーナー",
    body: "次回予約の声かけを最後ではなく施術中に変えたら、自然に予約が入りやすくなりました。",
    thanks: 92,
    comments: 14,
    accents: ["student", "haircut", "news"],
    imageUrl: "/images/shop-interior.jpg",
  },
  {
    id: "editor-weekly",
    profileId: "barber-hub-editor",
    authorLabel: "BARBER HUB編集部",
    area: "編集部",
    category: "業界ニュース",
    topicSlugs: ["ai", "tools"],
    source: "BARBER HUB編集部",
    body: "今週は講習会アーカイブ、求人、メーカー新商品の動きが増えています。営業前に要点だけ整理しました。",
    thanks: 74,
    comments: 6,
    accents: ["seminar", "tool", "news"],
    imageUrl: "/images/shop-interior.jpg",
  },
  {
    id: "practice-report",
    profileId: "fukuoka-barber",
    authorLabel: "練習会レポート",
    area: "オンライン",
    category: "講習会",
    topicSlugs: ["technique"],
    source: "練習会レポート",
    body: "フェード練習会で、濃く残る場所は光と姿勢を変えて見るという話が印象に残りました。",
    thanks: 67,
    comments: 9,
    accents: ["seminar", "haircut", "tool"],
    imageUrl: "/images/fade-cut.jpg",
  },
];

export const qaItems: QaItem[] = [
  {
    id: "fade-blend",
    profileId: "fukuoka-barber",
    title: "フェードのぼかしがつながらない",
    category: "技術",
    topicSlugs: ["technique", "tools"],
    status: "みんなで解決中",
    body: "0.8mmから上のつなぎで、片側だけ濃く残ることがあります。光の当たり方なのか、手順なのか、確認する順番を知りたいです。",
    comments: 24,
    ideas: 11,
  },
  {
    id: "price-raise",
    profileId: "anonymous-barber",
    title: "値上げの伝え方に悩んでいる",
    category: "価格改定",
    topicSlugs: ["management"],
    status: "ただ聞いてほしい",
    body: "長年通ってくださっているお客様ほど、価格改定の伝え方に悩みます。角が立たない一言を知りたいです。",
    comments: 18,
    ideas: 7,
  },
  {
    id: "google-review-request",
    profileId: "barber-sample-fukuoka-nishi",
    title: "Google口コミを自然にお願いする方法",
    category: "集客",
    topicSlugs: ["marketing", "ai"],
    status: "みんなで解決中",
    body: "口コミをお願いしたいのですが、押し売りっぽくならない言い方を探しています。",
    comments: 16,
    ideas: 8,
  },
];

export const seminars: Seminar[] = [
  { id: "seminar-fade", title: "福岡フェードセミナー 要点まとめ", category: "講習会", topicSlugs: ["technique", "tools"], meta: "アーカイブ", accent: "seminar", imageUrl: "/images/fade-cut.jpg" },
  { id: "contest-style", title: "コンクール入賞スタイルの見どころ", category: "コンクール", topicSlugs: ["technique"], meta: "解説", accent: "haircut", imageUrl: "/images/fade-cut.jpg" },
  { id: "online-gray", title: "白髪ぼかし提案 オンライン講習", category: "オンライン講習", topicSlugs: ["technique", "management", "marketing"], meta: "後から視聴", accent: "news", imageUrl: "/images/fade-cut.jpg" },
  { id: "ai-review-reply", title: "口コミ返信AIワークショップ", category: "AI講習", topicSlugs: ["ai", "marketing"], meta: "オンライン", accent: "tool", imageUrl: "/images/shop-interior.jpg" },
];

export const jobs: Job[] = [
  { id: "job-student", title: "学生向けサロン見学の選び方", category: "学生", topicSlugs: ["technique"], meta: "編集部まとめ", accent: "student", imageUrl: "/images/shop-interior.jpg" },
  { id: "job-salon", title: "個人店の魅力が伝わる求人票の作り方", category: "求人", topicSlugs: ["management", "marketing"], meta: "求人掲載", accent: "news", imageUrl: "/images/shop-interior.jpg" },
  { id: "job-school", title: "学校向け掲載メニュー準備中", category: "学校", topicSlugs: ["technique"], meta: "問い合わせ", accent: "seminar", imageUrl: "/images/shop-interior.jpg" },
];

export const backyardPosts: BackyardPost[] = [
  {
    id: "backyard-price",
    anonymousName: "一人営業の理容師",
    attribute: "一人営業",
    roleLabel: "理容師",
    category: "経営",
    topicSlugs: ["management"],
    roomId: "management",
    title: "一人営業の予約、どこまで詰めてますか？",
    body: "営業後にふと、予約を詰めすぎている気がしました。みなさんは余白をどれくらい残していますか？",
    verificationStatus: "self-declared",
    moderationStatus: "normal",
    badCount: 0,
    createdAt: "今日 21:12",
    empathy: 42,
    comments: 34,
    status: "盛り上がり中",
    reaction: "わかる",
    latestCommentAt: "12分前",
  },
  {
    id: "backyard-lonely",
    anonymousName: "40代オーナー",
    attribute: "オーナー",
    roleLabel: "サロンオーナー",
    category: "道具",
    topicSlugs: ["tools", "technique"],
    roomId: "tools",
    title: "静音バリカンでおすすめありますか？",
    body: "朝イチや子どもカットで使いやすいものを探しています。音と振動が少ないものが知りたいです。",
    verificationStatus: "self-declared",
    moderationStatus: "normal",
    badCount: 0,
    createdAt: "今日 20:41",
    empathy: 51,
    comments: 18,
    status: "新着",
    reaction: "経験あり",
    latestCommentAt: "38分前",
  },
  {
    id: "backyard-sns-fatigue",
    anonymousName: "営業後の理容師",
    attribute: "スタッフ",
    roleLabel: "理容師",
    category: "今日の営業後",
    topicSlugs: ["management"],
    roomId: "hobby",
    title: "今日の営業後、何飲んでます？",
    body: "忙しい一日でした。みなさんの仕事終わりルーティンをゆるく聞きたいです。",
    verificationStatus: "self-declared",
    moderationStatus: "normal",
    badCount: 0,
    createdAt: "今日 19:54",
    empathy: 58,
    comments: 42,
    status: "盛り上がり中",
    reaction: "それな",
    latestCommentAt: "1時間前",
  },
  {
    id: "backyard-review-ai",
    anonymousName: "口コミ返信を見直したい美容師",
    attribute: "スタッフ",
    roleLabel: "美容師",
    category: "AI",
    topicSlugs: ["ai", "marketing"],
    roomId: "management",
    title: "口コミ返信、AIで下書きしている人いますか？",
    body: "短く自然に返したいのですが、AIの文章っぽさをどう直すか知りたいです。",
    verificationStatus: "self-declared",
    moderationStatus: "normal",
    badCount: 0,
    createdAt: "今日 19:10",
    empathy: 36,
    comments: 12,
    status: "経験募集",
    reaction: "知りたい",
    latestCommentAt: "2時間前",
  },
  {
    id: "backyard-referral-voice",
    anonymousName: "紹介を増やしたいオーナー",
    attribute: "オーナー",
    roleLabel: "サロンオーナー",
    category: "集客",
    topicSlugs: ["marketing", "management"],
    roomId: "management",
    title: "紹介が増える声かけ、どんな言い方してますか？",
    body: "押しつけにならずに、ご家族や友人を紹介してもらう流れを作りたいです。",
    verificationStatus: "self-declared",
    moderationStatus: "normal",
    badCount: 0,
    createdAt: "今日 18:45",
    empathy: 44,
    comments: 15,
    status: "相談中",
    reaction: "わかる",
    latestCommentAt: "3時間前",
  },
  {
    id: "backyard-rules-update",
    anonymousName: "BARBER HUB運営",
    attribute: "運営",
    roleLabel: "運営",
    category: "運営からのお知らせ",
    topicSlugs: ["management"],
    roomId: "notice",
    title: "Back Room Rules更新のお知らせ",
    body: "個人攻撃・晒しに関する運用方針を追記しました。営業後も落ち着いて話せる場所にしていきます。",
    verificationStatus: "barber-verified",
    moderationStatus: "locked",
    badCount: 0,
    createdAt: "昨日 18:00",
    empathy: 0,
    comments: 0,
    status: "ロック中",
    reaction: "確認",
    latestCommentAt: "昨日",
  },
];

export const products: Product[] = [
  {
    id: "quiet-clipper-pro",
    imageUrl: "/images/tools-stilllife.jpg",
    name: "静音プロクリッパー S1",
    maker: "メーカー情報",
    category: "バリカン",
    description: "朝イチ施術や子どもカットでも使いやすい、音と振動を抑えたプロ向けクリッパー。",
    priceLabel: "業務用価格",
    sponsorLabel: "メーカー提供",
    salonVerifiedLabel: "サロン確認済み会員向け",
    features: ["静音モーター", "フェード向け薄刃対応", "長時間営業でも扱いやすい軽量設計"],
    useCases: ["フェード", "子どもカット", "朝イチ施術"],
    relatedArticleIds: ["silent-clipper", "rakuten-ai"],
    relatedSeminarIds: ["seminar-fade"],
    accent: "tool",
  },
  {
    id: "fade-brush-comb-set",
    imageUrl: "/images/tools-stilllife.jpg",
    name: "フェードブラシ & コームセット",
    maker: "ディーラーセレクト",
    category: "フェード道具",
    description: "ぼかしの境目を確認しやすく、講習会でも紹介されることが多い基本セット。",
    priceLabel: "参考価格 3,800円前後",
    salonVerifiedLabel: "サロン確認済み会員向け",
    features: ["境目の確認がしやすい", "細かい毛払いに対応", "練習会の持ち物にも向く"],
    useCases: ["フェード", "刈り上げ", "講習会"],
    relatedArticleIds: ["fukuoka-seminar"],
    relatedSeminarIds: ["seminar-fade", "contest-style"],
    accent: "haircut",
  },
  {
    id: "gray-blend-toner",
    imageUrl: "/images/tools-stilllife.jpg",
    name: "白髪ぼかし用グレイトナー",
    maker: "メーカー新商品",
    category: "カラー剤",
    description: "40代以上の男性に、若返りより清潔感を提案しやすい白髪ぼかし用トナー。",
    priceLabel: "業務用価格",
    sponsorLabel: "PR",
    salonVerifiedLabel: "サロン確認済み会員向け",
    features: ["自然ななじみ", "短時間メニュー化しやすい", "カウンセリング提案に向く"],
    useCases: ["白髪ぼかし", "単価アップ", "40代以上の提案"],
    relatedArticleIds: ["gray-blending-40s-article"],
    relatedSeminarIds: ["online-gray"],
    accent: "news",
  },
  {
    id: "scalp-care-starter",
    imageUrl: "/images/tools-stilllife.jpg",
    name: "頭皮ケア スターターセット",
    maker: "プロ向け商材",
    category: "スキャルプケア",
    description: "梅雨時期や汗をかく季節の会話から提案につなげやすい、シャンプーと頭皮用化粧水のセット。",
    priceLabel: "参考価格 6,500円前後",
    salonVerifiedLabel: "サロン確認済み会員向け",
    features: ["季節提案に使いやすい", "店販導線を作りやすい", "ヘッドスパ前の説明に向く"],
    useCases: ["頭皮ケア", "店販", "ヘッドスパ"],
    relatedArticleIds: ["google-review-growth"],
    relatedSeminarIds: [],
    accent: "student",
  },
  {
    id: "review-request-card",
    imageUrl: "/images/tools-stilllife.jpg",
    name: "口コミ依頼カード テンプレート",
    maker: "BARBER HUB編集部",
    category: "集客ツール",
    description: "Google口コミを自然にお願いするための、店頭配布・LINE送信用の説明カード案。",
    priceLabel: "無料テンプレート予定",
    features: ["売り込み感を抑える文面", "再来店後に渡しやすい", "口コミ返信例と連動"],
    useCases: ["Google口コミ", "新規予約", "接客後フォロー"],
    relatedArticleIds: ["google-review-growth"],
    relatedSeminarIds: [],
    accent: "seminar",
  },
];

export const partners = [
  {
    id: "makers",
    title: "メーカー一覧",
    body: "新商品、講習会連動商品、タイアップ記事を整理して掲載します。",
  },
  {
    id: "dealers",
    title: "ディーラー一覧",
    body: "地域の理容師が相談しやすい仕入れ先・問い合わせ先をまとめます。",
  },
  {
    id: "sponsor",
    title: "スポンサー商品",
    body: "スポンサー、PR、メーカー提供は必ず明記し、中立性を守ります。",
  },
];

const relatedProductMap: Record<string, string[]> = {
  "rakuten-ai": ["quiet-clipper-pro", "review-request-card"],
  "silent-clipper": ["quiet-clipper-pro", "fade-brush-comb-set"],
  "fukuoka-seminar": ["fade-brush-comb-set", "quiet-clipper-pro"],
  "gray-blending-40s-article": ["gray-blend-toner"],
  "google-review-growth": ["review-request-card", "scalp-care-starter"],
  "fade-blend": ["quiet-clipper-pro", "fade-brush-comb-set"],
  "google-review-request": ["review-request-card"],
  "seminar-fade": ["fade-brush-comb-set", "quiet-clipper-pro"],
  "online-gray": ["gray-blend-toner"],
};

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

export function findProduct(id: string) {
  return products.find((product) => product.id === id);
}

export function getRelatedProducts(contentId: string) {
  const ids = relatedProductMap[contentId] ?? [];
  return ids.map((id) => findProduct(id)).filter((product): product is Product => product != null);
}
