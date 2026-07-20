export const BACKROOM_CATEGORIES = [
  "営業後トーク",
  "相談",
  "経営",
  "独立",
  "スタッフ",
  "集客",
  "技術",
  "材料",
  "STU",
  "アシスタント",
  "趣味",
  "雑談",
] as const;

export type BackroomCategory = (typeof BACKROOM_CATEGORIES)[number];
