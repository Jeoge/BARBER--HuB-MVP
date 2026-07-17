import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();
const require = createRequire(import.meta.url);
const FEED_ACCEPT_HEADER = "application/atom+xml, application/rss+xml, application/rdf+xml, application/xml, text/xml";
const FEED_USER_AGENT = "BARBER HUB news draft bot; RSS/Atom metadata only";
const XML_CONTENT_TYPE_PATTERN = /(xml|rss|atom|rdf)/i;
const TRACKING_QUERY_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];

function loadSources() {
  const filename = path.join(root, "lib/news-drafts/sources.ts");
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
    require: (specifier) => (specifier === "server-only" ? {} : require(specifier)),
    process,
    Number,
    Math,
  });
  return module.exports.NEWS_SOURCES.filter((sourceConfig) => sourceConfig.enabled);
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
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeFeedBody(body, contentType) {
  const bytes = new Uint8Array(body);
  const head = new TextDecoder("ascii").decode(bytes.slice(0, Math.min(bytes.length, 240)));
  const charset =
    contentType.match(/charset=([^;]+)/i)?.[1]?.trim().replace(/^["']|["']$/g, "") ||
    head.match(/<\?xml[^>]*encoding=["']([^"']+)["']/i)?.[1]?.trim() ||
    "utf-8";

  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

function qualifiedTagPattern(tagName) {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return tagName.includes(":") ? escaped : `(?:[\\w.-]+:)?${escaped}`;
}

function tagBlocks(xml, tagName) {
  const tag = qualifiedTagPattern(tagName);
  return xml.match(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi")) ?? [];
}

function tagValue(xml, tagName) {
  const tag = qualifiedTagPattern(tagName);
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function attrValueFromTag(tagXml, attrName) {
  const escapedAttr = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tagXml.match(new RegExp(`\\s${escapedAttr}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function atomLinkHref(xml) {
  const linkTag = qualifiedTagPattern("link");
  const links = Array.from(xml.matchAll(new RegExp(`<${linkTag}\\b[^>]*>`, "gi")))
    .map((match) => ({
      href: attrValueFromTag(match[0], "href"),
      rel: attrValueFromTag(match[0], "rel").toLowerCase(),
    }))
    .filter((link) => link.href);

  return links.find((link) => !link.rel || link.rel === "alternate")?.href ?? links[0]?.href ?? "";
}

function normalizeUrl(url, baseUrl) {
  try {
    const parsed = new URL(url, baseUrl);
    parsed.hash = "";
    for (const param of TRACKING_QUERY_PARAMS) {
      parsed.searchParams.delete(param);
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function isAllowedSourceUrl(sourceUrl, source) {
  if (source.allowedSourceHosts.length === 0) return true;

  try {
    const host = new URL(sourceUrl).hostname.toLowerCase();
    return source.allowedSourceHosts.some((allowedHost) => {
      const normalizedHost = allowedHost.toLowerCase();
      return host === normalizedHost || host.endsWith(`.${normalizedHost}`);
    });
  } catch {
    return false;
  }
}

function extractFeedItems(xml, source) {
  const entries = tagBlocks(xml, "entry");
  const rssItems = entries.length > 0 ? [] : tagBlocks(xml, "item");
  const blocks = entries.length > 0 ? entries : rssItems;

  return blocks
    .map((block) => {
      const atomLink = atomLinkHref(block);
      const rssLink = tagValue(block, "link");
      const sourceUrl = normalizeUrl(atomLink || rssLink, source.feedUrl);
      return {
        sourceTitle: tagValue(block, "title"),
        sourceUrl,
      };
    })
    .filter((item) => item.sourceTitle && item.sourceUrl && isAllowedSourceUrl(item.sourceUrl, source));
}

const sources = loadSources();
const results = [];

for (const source of sources) {
  try {
    const response = await fetch(source.feedUrl, {
      headers: {
        Accept: FEED_ACCEPT_HEADER,
        "User-Agent": FEED_USER_AGENT,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      throw new Error(`feed status=${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !XML_CONTENT_TYPE_PATTERN.test(contentType)) {
      throw new Error("feed content-type is not XML");
    }

    const body = await response.arrayBuffer();
    const items = extractFeedItems(decodeFeedBody(body, contentType), source);

    results.push({
      sourceName: source.sourceName,
      sourceGroup: source.sourceGroup,
      contentPillar: source.contentPillar,
      status: "ok",
      fetchedCount: items.length,
      sampleTitle: items[0]?.sourceTitle ?? "",
      error: "",
    });
  } catch (error) {
    results.push({
      sourceName: source.sourceName,
      sourceGroup: source.sourceGroup,
      contentPillar: source.contentPillar,
      status: "error",
      fetchedCount: 0,
      sampleTitle: "",
      error: error instanceof Error ? error.message : "failed",
    });
  }
}

console.table(results);

const failed = results.filter((result) => result.status !== "ok");
if (failed.length > 0) {
  process.exitCode = 1;
}
