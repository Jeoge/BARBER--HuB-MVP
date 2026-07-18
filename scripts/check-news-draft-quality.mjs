import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();
const require = createRequire(import.meta.url);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadTsModule(relativePath) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module,
    exports: module.exports,
    require,
    console,
    Date,
    Math,
    Number,
    RegExp,
    Set,
    String,
    URL,
  });
  return module.exports;
}

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(xml, tagName) {
  const tag = tagName.includes(":") ? tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : `(?:[\\w.-]+:)?${tagName}`;
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function parseFixtureFeed(xml, baseUrl) {
  const entryBlocks = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  const itemBlocks = entryBlocks.length > 0 ? [] : (xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []);
  return (entryBlocks.length > 0 ? entryBlocks : itemBlocks)
    .map((block) => {
      const atomHref = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ?? "";
      const sourceUrl = new URL(atomHref || tagValue(block, "link"), baseUrl).toString();
      return {
        title: tagValue(block, "title"),
        url: sourceUrl,
        publishedAt: tagValue(block, "published") || tagValue(block, "updated") || tagValue(block, "pubDate") || tagValue(block, "dc:date"),
      };
    })
    .filter((item) => item.title && item.url);
}

function publicNewsSortRank(item) {
  return [item.risk_level === "high" ? 0 : 1, -Date.parse(item.reviewed_at), -Date.parse(item.updated_at), -Date.parse(item.created_at)];
}

function comparePublicNewsItems(a, b) {
  const left = publicNewsSortRank(a);
  const right = publicNewsSortRank(b);

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }

  return 0;
}

function composePublicNewsLikeRpc(items, limit = 4) {
  const publishable = items.filter((item) => publication.getNewsPublicationBlocker(item, { requireReviewedAt: true }) === null);
  const latest = [...publishable].sort((a, b) => Date.parse(b.reviewed_at) - Date.parse(a.reviewed_at) || Date.parse(b.updated_at) - Date.parse(a.updated_at) || Date.parse(b.created_at) - Date.parse(a.created_at))[0];
  const selected = new Map();

  for (const pillar of ["work", "style", "talk"]) {
    const pillarItems = publishable.filter((item) => item.content_pillar === pillar).sort(comparePublicNewsItems);
    const pillarLimit = pillar === "work" ? 2 : pillar === "style" ? 2 : 1;

    pillarItems.forEach((item, index) => {
      const pillarRank = index + 1;
      const include =
        (pillar === "work" && (pillarRank <= pillarLimit || (item.risk_level === "high" && pillarRank <= 3))) ||
        (pillar !== "work" && pillarRank <= pillarLimit);

      if (include) selected.set(item.id, item);
    });
  }

  if (latest) selected.set(latest.id, latest);
  return [...selected.values()].sort(comparePublicNewsItems).slice(0, limit);
}

const quality = loadTsModule("lib/news-drafts/quality.ts");
const publication = loadTsModule("lib/news-drafts/publication.ts");

const rdfFixture = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF>
  <item>
    <title>サロンの個人情報管理に関する注意喚起</title>
    <link>/security/example.html</link>
    <dc:date>2026-07-15T09:00:00+09:00</dc:date>
    <description>予約台帳や顧客情報の確認に関係する短い概要です。</description>
  </item>
</rdf:RDF>`;

const atomFixture = `<?xml version="1.0" encoding="UTF-8"?>
<feed>
  <entry>
    <title>小規模事業者向け支援制度の受付開始</title>
    <link href="https://example.jp/business/support.html" rel="alternate" />
    <updated>2026-07-15T12:00:00+09:00</updated>
    <summary>店舗経営に関係する短い概要です。</summary>
  </entry>
</feed>`;

const rdfItems = parseFixtureFeed(rdfFixture, "https://example.jp/feed.rdf");
const atomItems = parseFixtureFeed(atomFixture, "https://example.jp/feed.atom");
assert(rdfItems.length === 1 && rdfItems[0].url === "https://example.jp/security/example.html", "RDF fixture should parse a relative item URL");
assert(atomItems.length === 1 && atomItems[0].publishedAt.includes("2026-07-15"), "Atom fixture should parse updated timestamp");

const duplicateA = quality.newsDuplicateKey("小規模事業者向け支援制度について公表します");
const duplicateB = quality.newsDuplicateKey("【お知らせ】小規模事業者向け支援制度を公表");
assert(duplicateA === duplicateB, "Normalized duplicate titles should match");

const lowValue = quality.lowValueRejectReason({
  sourceTitle: "第12回審議会の開催資料を掲載しました",
  sourceExcerpt: "",
});
assert(Boolean(lowValue), "Committee material notices should be rejected as low value");

const gossip = quality.lowValueRejectReason({
  sourceTitle: "人気俳優に熱愛報道 SNSで炎上",
  sourceExcerpt: "",
});
assert(Boolean(gossip), "Entertainment gossip should be rejected before AI");

const medicalClaim = quality.lowValueRejectReason({
  sourceTitle: "薄毛が必ず改善する新スカルプ施術を発表",
  sourceExcerpt: "",
});
assert(Boolean(medicalClaim), "Medical and beauty effect claims should be rejected before AI");

const minorSports = quality.lowValueRejectReason({
  sourceTitle: "練習試合で白星 2勝1敗に",
  sourceExcerpt: "",
  sourceGroup: "sports_talk",
});
assert(Boolean(minorSports), "Minor sports result items should be rejected before AI");

const styleCandidate = quality.lowValueRejectReason({
  sourceTitle: "メンズヘアの新しいフェード提案を解説",
  sourceExcerpt: "男性客へのヘアスタイル提案に使える内容です。",
  sourceGroup: "fashion_beauty",
  contentPillar: "style",
});
assert(!styleCandidate, "Relevant men's style items should pass low-value rejection");

const similar = quality.findSimilarRecentNews(
  { sourceTitle: "サイバーセキュリティ対策の注意喚起", sourceExcerpt: "" },
  [{ id: "recent-1", source_title: "サイバーセキュリティ対策に関する注意喚起", duplicate_key: "" }]
);
assert(similar?.id === "recent-1", "Similar recent news should be detected");

const now = new Date("2026-07-15T12:00:00Z");
assert(quality.isPublishedWithinHours("2026-07-15T01:00:00Z", now, 12), "NEW should be true inside 12 hours");
assert(!quality.isPublishedWithinHours("2026-07-14T23:30:00Z", now, 12), "NEW should be false after 12 hours");

const publishableDraft = {
  status: "approved",
  reviewed_at: "2026-07-15T12:00:00Z",
  generation_error: null,
  duplicate_of: null,
  content_pillar: "work",
  draft_title: "サロンが朝確認したい制度変更",
  draft_summary: "制度変更の要点を短く整理します。",
  draft_body: "何が起きたか、サロンへの影響、会話での使い方を確認します。",
  morning_tip: "朝礼で共有し、必要な確認事項を決めます。",
  conversation_tip: "お客様には、必要に応じて確認していると自然に伝えられます。",
  category: "店舗経営",
  source_name: "公的機関",
  source_url: "https://example.jp/news",
};

assert(publication.getNewsPublicationBlocker(publishableDraft, { requireReviewedAt: true }) === null, "Complete approved news should be publishable");
assert(
  publication.getNewsPublicationBlocker({ ...publishableDraft, morning_tip: "" }, { requireReviewedAt: true }) === "朝礼のヒントが空のため公開できません。",
  "Missing morning tip should block publication with a concrete message"
);
assert(
  publication.getNewsPublicationBlocker({ ...publishableDraft, conversation_tip: "" }, { requireReviewedAt: true }) === "会話のヒントが空のため公開できません。",
  "Missing conversation tip should block publication with a concrete message"
);
assert(
  publication.getNewsPublicationBlocker({ ...publishableDraft, generation_error: "AI error" }, { requireReviewedAt: true }) === "生成エラーが残っているため公開できません。",
  "Generation errors should block publication"
);
assert(
  publication.getNewsPublicationBlocker({ ...publishableDraft, duplicate_of: "recent-id" }, { requireReviewedAt: true }) === "重複候補の記事は公開できません。",
  "Duplicate drafts should block publication"
);
assert(
  publication.getNewsPublicationBlocker({ ...publishableDraft, content_pillar: "personal" }, { requireReviewedAt: true }) ===
    "分類（WORK / STYLE / TALK）が未設定のため公開できません。",
  "Invalid content pillars should block publication"
);
assert(
  publication.getPublicNewsFieldBlocker({ ...publishableDraft, reviewed_at: null }, { requireReviewedAt: true }) === "公開日時が保存されていないため公開できません。",
  "Public news rows should require reviewed_at"
);

const publicNewsCandidates = [
  {
    ...publishableDraft,
    id: "latest-style",
    content_pillar: "style",
    risk_level: "low",
    reviewed_at: "2026-07-15T12:00:00Z",
    updated_at: "2026-07-15T12:00:00Z",
    created_at: "2026-07-15T11:59:00Z",
  },
  {
    ...publishableDraft,
    id: "high-risk-work",
    content_pillar: "work",
    risk_level: "high",
    reviewed_at: "2026-07-15T11:55:00Z",
    updated_at: "2026-07-15T11:55:00Z",
    created_at: "2026-07-15T11:54:00Z",
  },
  {
    ...publishableDraft,
    id: "normal-work",
    content_pillar: "work",
    risk_level: "low",
    reviewed_at: "2026-07-15T11:40:00Z",
    updated_at: "2026-07-15T11:40:00Z",
    created_at: "2026-07-15T11:39:00Z",
  },
  {
    ...publishableDraft,
    id: "talk",
    content_pillar: "talk",
    risk_level: "low",
    reviewed_at: "2026-07-15T11:30:00Z",
    updated_at: "2026-07-15T11:30:00Z",
    created_at: "2026-07-15T11:29:00Z",
  },
  {
    ...publishableDraft,
    id: "older-style",
    content_pillar: "style",
    risk_level: "low",
    reviewed_at: "2026-07-15T11:20:00Z",
    updated_at: "2026-07-15T11:20:00Z",
    created_at: "2026-07-15T11:19:00Z",
  },
];
const selectedPublicNews = composePublicNewsLikeRpc(publicNewsCandidates, 4);
const selectedPublicNewsIds = selectedPublicNews.map((item) => item.id);
assert(selectedPublicNews.length <= 4, "Public news selection should not exceed the top limit");
assert(selectedPublicNewsIds.includes("latest-style"), "Latest published news should remain a candidate");
assert(selectedPublicNewsIds.includes("high-risk-work"), "High-risk work news should remain a candidate");
assert(selectedPublicNewsIds.indexOf("high-risk-work") < selectedPublicNewsIds.indexOf("latest-style"), "High-risk news should sort before newer low-risk news");

const mockSources = [
  Promise.resolve(["ok"]),
  Promise.reject(new Error("feed down")),
  Promise.resolve(["still ok"]),
];
const settled = await Promise.allSettled(mockSources);
assert(settled.filter((entry) => entry.status === "fulfilled").length === 2, "One source failure should not stop other source results");

console.log("news draft quality checks passed");
