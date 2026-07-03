import {
  articles,
  backyardPosts,
  jobs,
  posts,
  qaItems,
  seminars,
  type Article,
  type BackyardPost,
  type Job,
  type Post,
  type QaItem,
  type Seminar,
} from "@/lib/mockData";
import { sponsorItems, type SponsorItem } from "@/lib/sponsors";

export type TopicSlug = "management" | "marketing" | "ai" | "technique" | "tools";

export type TopicConfig = {
  slug: TopicSlug;
  label: string;
  description: string;
  tags: string[];
  sponsorCategories: SponsorItem["category"][];
};

export type TopicBundle = {
  topic: TopicConfig;
  articles: Article[];
  snaps: Post[];
  qa: QaItem[];
  seminars: Seminar[];
  jobs: Job[];
  backRoomThreads: BackyardPost[];
  sponsors: SponsorItem[];
};

export const topics: TopicConfig[] = [
  {
    slug: "management",
    label: "経営",
    description: "一人営業、単価、予約、スタッフ、数字の見直し。サロンを続けるための経営情報。",
    tags: ["一人営業", "値上げ", "予約", "スタッフ"],
    sponsorCategories: ["career", "seminar", "regional"],
  },
  {
    slug: "marketing",
    label: "集客",
    description: "口コミ、SNS、紹介、リピート。明日から試せる集客のヒント。",
    tags: ["口コミ", "SNS", "紹介", "リピート"],
    sponsorCategories: ["career", "regional"],
  },
  {
    slug: "ai",
    label: "AI",
    description: "投稿文、口コミ返信、予約前メッセージ。理容師の仕事に使えるAI活用。",
    tags: ["口コミ返信", "投稿文", "予約前メッセージ", "ニュース整理"],
    sponsorCategories: ["tools", "seminar"],
  },
  {
    slug: "technique",
    label: "技術",
    description: "フェード、白髪ぼかし、顔剃り、仕上げ。現場で使える技術の気づき。",
    tags: ["フェード", "白髪ぼかし", "顔剃り", "仕上げ"],
    sponsorCategories: ["seminar", "school", "tools"],
  },
  {
    slug: "tools",
    label: "道具",
    description: "バリカン、トリマー、コーム、整髪料。現場で使う道具の情報。",
    tags: ["バリカン", "トリマー", "コーム", "整髪料"],
    sponsorCategories: ["tools", "seminar"],
  },
];

function belongsToTopic(item: { topicSlugs?: string[] }, slug: TopicSlug) {
  return item.topicSlugs?.includes(slug) ?? false;
}

export function getTopicBySlug(slug: string) {
  return topics.find((topic) => topic.slug === slug);
}

export function getTopicBundle(slug: string): TopicBundle | undefined {
  const topic = getTopicBySlug(slug);
  if (topic == null) return undefined;

  return {
    topic,
    articles: articles.filter((item) => belongsToTopic(item, topic.slug)),
    snaps: posts.filter((item) => belongsToTopic(item, topic.slug)),
    qa: qaItems.filter((item) => belongsToTopic(item, topic.slug)),
    seminars: seminars.filter((item) => belongsToTopic(item, topic.slug)),
    jobs: jobs.filter((item) => belongsToTopic(item, topic.slug)),
    backRoomThreads: backyardPosts.filter((item) => belongsToTopic(item, topic.slug)),
    sponsors: sponsorItems.filter((item) => topic.sponsorCategories.includes(item.category)),
  };
}

export function getPrimaryTopicSlug(item: { topicSlugs?: string[] }) {
  return item.topicSlugs?.find((slug) => getTopicBySlug(slug) != null);
}
