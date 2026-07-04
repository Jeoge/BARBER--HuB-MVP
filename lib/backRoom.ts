import { backyardPosts, type BackyardPost } from "@/lib/mockData";

export type BackRoomModerationStatus = "normal" | "collapsed" | "review" | "hidden" | "locked";

export type BackRoomRoom = {
  id: string;
  label: string;
  description: string;
  threadCount: number;
  latestActivity: string;
  beginnerFriendly?: boolean;
  futureChildren?: string[];
};

export type BackRoomComment = {
  id: string;
  threadId: string;
  nickname: string;
  body: string;
  createdAt: string;
  badCount: number;
  moderationStatus: BackRoomModerationStatus;
};

export const BACK_ROOM_COMMENT_LIMIT = 500;
export const BACK_ROOM_INITIAL_COMMENTS = 20;
export const BACK_ROOM_COMMENTS_STEP = 20;

export const backRoomRooms: BackRoomRoom[] = [
  { id: "first", label: "はじめての部屋", description: "最初の自己紹介、買ってよかった道具、営業後の雑談。", threadCount: 8, latestActivity: "5分前", beginnerFriendly: true },
  { id: "kyushu", label: "九州・沖縄", description: "地域の講習、求人、営業の話。", threadCount: 12, latestActivity: "15分前" },
  { id: "kanto", label: "関東", description: "都市部サロン、集客、講習会の情報交換。", threadCount: 14, latestActivity: "22分前" },
  { id: "kansai", label: "関西", description: "地域の営業感、道具、休日の話。", threadCount: 11, latestActivity: "28分前" },
  { id: "chubu", label: "中部", description: "地方案件、単価、採用、講習の話。", threadCount: 9, latestActivity: "36分前" },
  { id: "hokkaido-tohoku", label: "北海道・東北", description: "季節営業、地域集客、道具の情報。", threadCount: 7, latestActivity: "52分前" },
  { id: "chugoku-shikoku", label: "中国・四国", description: "地域サロン、講習、求人の相談。", threadCount: 6, latestActivity: "1時間前" },
  { id: "management", label: "経営", description: "一人営業、単価、予約、スタッフの話。", threadCount: 18, latestActivity: "8分前" },
  { id: "independence", label: "独立", description: "開業前後のお金、物件、準備の話。", threadCount: 10, latestActivity: "18分前" },
  { id: "assistant", label: "アシスタント", description: "練習、接客、先輩への相談、デビュー前後の話。", threadCount: 8, latestActivity: "19分前", beginnerFriendly: true },
  { id: "tools", label: "技術・道具", description: "フェード、顔剃り、バリカン、コームの話。", threadCount: 16, latestActivity: "25分前" },
  { id: "staffing", label: "求人・スタッフ", description: "採用、教育、スタッフとの向き合い方。", threadCount: 9, latestActivity: "41分前" },
  {
    id: "hobby",
    label: "趣味",
    description: "営業後の一杯、釣り、車、ゴルフなど。",
    threadCount: 9,
    latestActivity: "30分前",
    futureChildren: ["酒・ごはん", "釣り", "車・バイク", "ゴルフ", "時計・ファッション", "筋トレ・健康"],
  },
  { id: "chat", label: "雑談", description: "今日あったこと、ちょっと聞いてほしいこと。", threadCount: 13, latestActivity: "12分前", beginnerFriendly: true },
  { id: "notice", label: "運営からのお知らせ", description: "Back Room Rulesや運営からの更新。", threadCount: 3, latestActivity: "昨日" },
];

export const firstRoomPrompts = [
  "どの地域で営業していますか？",
  "最近買ってよかった道具ありますか？",
  "営業後、何飲んでます？",
  "独立前に知りたかったこと",
];

export function getBackRoomRoom(id: string | undefined) {
  return backRoomRooms.find((room) => room.id === id);
}

export function roomForThread(thread: BackyardPost) {
  return getBackRoomRoom(thread.roomId) ?? backRoomRooms.find((room) => room.label === thread.category) ?? backRoomRooms[0];
}

export function threadsForRoom(roomId: string | undefined) {
  if (roomId == null || roomId.length === 0) return backyardPosts;
  return backyardPosts.filter((thread) => (thread.roomId ?? roomForThread(thread).id) === roomId);
}

export const backRoomComments: BackRoomComment[] = [
  ...Array.from({ length: 24 }, (_, index) => ({
    id: `price-${index + 1}`,
    threadId: "backyard-price",
    nickname: index % 3 === 0 ? "一人営業の理容師" : index % 3 === 1 ? "郊外サロン店主" : "営業後のスタッフ",
    body:
      index === 4
        ? "うちは昼前後に10分だけ余白を作っています。遅れた時の戻し場所があるだけで気持ちが違います。"
        : index === 8
          ? "常連さんほど詰めすぎないようにしています。少し話す時間がある方が結果的に次回予約につながりました。"
          : "予約の余白は悩みますね。曜日によって詰め方を変えるのが現実的かもしれません。",
    createdAt: `${index + 1}分前`,
    badCount: index === 6 ? 3 : index === 12 ? 5 : index === 16 ? 8 : 0,
    moderationStatus: (index === 6 ? "collapsed" : index === 12 ? "review" : index === 16 ? "hidden" : "normal") as BackRoomModerationStatus,
  })),
  {
    id: "tool-1",
    threadId: "backyard-lonely",
    nickname: "40代オーナー",
    body: "静音タイプは朝イチのお客様にかなり相性がよかったです。替刃の手入れも含めて選びたいです。",
    createdAt: "20分前",
    badCount: 0,
    moderationStatus: "normal",
  },
  {
    id: "drink-1",
    threadId: "backyard-sns-fatigue",
    nickname: "営業後の理容師",
    body: "今日は炭酸水です。忙しい日は甘いものよりさっぱりしたものに落ち着きます。",
    createdAt: "1時間前",
    badCount: 0,
    moderationStatus: "normal",
  },
];

export function commentsForThread(threadId: string) {
  return backRoomComments.filter((comment) => comment.threadId === threadId);
}

export function moderationLabel(status: BackRoomModerationStatus) {
  const labels: Record<BackRoomModerationStatus, string> = {
    normal: "",
    collapsed: "折りたたみ",
    review: "運営確認中",
    hidden: "一時非表示",
    locked: "ロック中",
  };
  return labels[status];
}
