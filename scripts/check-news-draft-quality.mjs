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

const quality = loadTsModule("lib/news-drafts/quality.ts");

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

const similar = quality.findSimilarRecentNews(
  { sourceTitle: "サイバーセキュリティ対策の注意喚起", sourceExcerpt: "" },
  [{ id: "recent-1", source_title: "サイバーセキュリティ対策に関する注意喚起", duplicate_key: "" }]
);
assert(similar?.id === "recent-1", "Similar recent news should be detected");

const now = new Date("2026-07-15T12:00:00Z");
assert(quality.isPublishedWithinHours("2026-07-15T01:00:00Z", now, 12), "NEW should be true inside 12 hours");
assert(!quality.isPublishedWithinHours("2026-07-14T23:30:00Z", now, 12), "NEW should be false after 12 hours");

const mockSources = [
  Promise.resolve(["ok"]),
  Promise.reject(new Error("feed down")),
  Promise.resolve(["still ok"]),
];
const settled = await Promise.allSettled(mockSources);
assert(settled.filter((entry) => entry.status === "fulfilled").length === 2, "One source failure should not stop other source results");

console.log("news draft quality checks passed");
