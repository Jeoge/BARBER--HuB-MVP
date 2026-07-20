import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { createBarberShopCsv, parseDelimitedText } from "./csv";
import { cleanImportText } from "./normalization";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_SOURCE_REDIRECTS = 3;
const SOURCE_TIMEOUT_MS = 15_000;
const MAX_SOURCE_ROWS = 20_000;
const MAX_SOURCE_COLUMNS = 80;

const AUTO_PARSE_FAILURE_MESSAGE = "このページまたはファイルは自動解析できませんでした。手動で確認してください";
const HTML_TABLE_NOT_FOUND_MESSAGE = "HTMLテーブルが見つかりません。CSVなどの掲載ファイルURLを直接指定してください。";
const SEARCH_REQUIRED_MESSAGE = "このページは検索操作が必要なため自動取得できません。検索結果ページのURL、CSV、Excel、PDFを指定してください";
const CSV_PARSE_FAILURE_MESSAGE = "CSVまたはTSVを表として解析できませんでした。見出し行とデータ行を確認してください。";
const XLSX_PARSE_FAILURE_MESSAGE = "Excelファイルを表として解析できませんでした。ファイルをダウンロードして手動で確認してください。";
const PDF_PARSE_FAILURE_MESSAGE = "このPDFは自動解析できませんでした。ファイルをダウンロードして手動で確認してください";
const UNSUPPORTED_FORMAT_MESSAGE = "対応していないファイル形式です。CSV、TSV、xlsx、HTML表、テキストPDFに対応しています。";
const CKAN_RESOURCE_DOWNLOAD_MESSAGE = "CKANのリソースページからダウンロード先を確認できませんでした。CSVなどのファイルURLを直接指定してください。";
const CKAN_API_UNSUPPORTED_MESSAGE = "CKANのAPI URLには対応していません。リソースページまたはCSVダウンロードURLを指定してください。";

export type SourceFormat = "CSV" | "TSV" | "xlsx" | "HTML table" | "text PDF";

export type SourceColumnMapping = {
  name: number | null;
  address: number | null;
  phone: number | null;
};

export type BarberShopSourceAnalysis = {
  sourceUrl: string;
  finalUrl: string;
  format: SourceFormat;
  headers: string[];
  sampleRows: string[][];
  autoMapping: SourceColumnMapping;
  excludedColumnIndexes: number[];
  pageDisplayCount: number;
  paginationDetected: boolean;
  prefecture: string;
  municipality: string;
  sourceName: string;
};

export type BarberShopSourcePreviewRow = {
  rowNumber: number;
  name: string;
  prefecture: string;
  municipality: string;
  address: string;
  phone: string;
  validationErrors: string[];
};

export type BarberShopSourcePreview = {
  format: SourceFormat;
  finalUrl: string;
  fileName: string;
  csv: string;
  rows: BarberShopSourcePreviewRow[];
  fetchedCount: number;
  pageDisplayCount: number;
  paginationDetected: boolean;
  outputCount: number;
  validCount: number;
  blankCounts: {
    name: number;
    prefecture: number;
    municipality: number;
    address: number;
    phone: number;
    source: number;
  };
  excludedCount: number;
  errorCount: number;
};

export class BarberShopSourceError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid_url" | "blocked_url" | "fetch_failed" | "unsupported" | "parse_failed" | "pdf_parse_failed"
  ) {
    super(message);
    this.name = "BarberShopSourceError";
  }
}

type SourceResponse = {
  bytes: Uint8Array;
  contentType: string;
  finalUrl: string;
  fileName: string;
};

type SourceTable = {
  headers: string[];
  rows: string[][];
  format: SourceFormat;
  pageDisplayCount: number;
  paginationDetected: boolean;
};

const SOURCE_HEADER_ALIASES = {
  name: ["店名", "店舗名", "屋号", "理容所名称", "理容所名", "施設名称", "施設名", "営業所名称", "営業所名", "事業所名", "名称"],
  prefecture: ["都道府県", "都道府県名", "県名"],
  municipality: ["市区町村", "市町村", "自治体", "所在地市区町村", "所在市区町村"],
  address: ["住所", "所在地", "施設所在地", "営業所在地", "営業所所在地", "所在地住所"],
  phone: ["電話", "電話番号", "TEL", "連絡先", "電話番号等"],
  postalCode: ["郵便番号", "郵便番号〒", "〒"],
  representative: ["氏名", "氏名代表者名", "代表者名", "代表者", "設置者氏名", "開設者名", "管理者名"],
  verification: ["認証状態", "認証ステータス", "認証区分"],
} as const;

type SourceField = keyof typeof SOURCE_HEADER_ALIASES;

function normalizeHeader(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u3000、。・:：/\\_\-（）()［］\[\]「」『』]/g, "")
    .trim();
}

function headerMatches(header: string, alias: string) {
  const normalizedHeader = normalizeHeader(header);
  const normalizedAlias = normalizeHeader(alias);
  return normalizedHeader === normalizedAlias || normalizedHeader.includes(normalizedAlias);
}

function fieldHeaderIndex(headers: string[], field: SourceField) {
  const aliases = SOURCE_HEADER_ALIASES[field];
  const usableHeader = (header: string) => {
    if (field === "name" && SOURCE_HEADER_ALIASES.representative.some((alias) => headerMatches(header, alias))) return false;
    if (field === "address" && /市区町村|市町村|郵便番号/.test(normalizeHeader(header))) return false;
    return true;
  };
  const exactIndex = headers.findIndex((header) => usableHeader(header) && aliases.some((alias) => normalizeHeader(header) === normalizeHeader(alias)));
  if (exactIndex >= 0) return exactIndex;
  return headers.findIndex((header) => usableHeader(header) && aliases.some((alias) => headerMatches(header, alias)));
}

function recognizedHeaderCount(headers: string[]) {
  return (Object.keys(SOURCE_HEADER_ALIASES) as SourceField[]).filter((field) => fieldHeaderIndex(headers, field) >= 0).length;
}

function hasSearchForm(html: string) {
  return /<form\b/i.test(html) && /<(?:select|input|textarea|button)\b/i.test(html);
}

function htmlSignalText(value: string) {
  return htmlEntityDecode(value).replace(/<[^>]*>/g, " ").replace(/[\r\n]+/g, " ");
}

function tableHasShopSignal(headers: string[], rows: string[][]) {
  if (fieldHeaderIndex(headers, "name") >= 0 || fieldHeaderIndex(headers, "address") >= 0 || fieldHeaderIndex(headers, "phone") >= 0) return true;
  const text = [...headers, ...rows.slice(0, 5).flat()].map(htmlSignalText).join(" ");
  return /理容|店舗|店名|営業所|施設|住所|所在地|電話|TEL/i.test(text);
}

function detectPagination(html: string) {
  const linkText = Array.from(html.matchAll(/<(?:a|button)\b[^>]*>([\s\S]*?)<\/(?:a|button)>/gi))
    .map((match) => htmlSignalText(match[1] ?? ""))
    .join(" ");
  return /(?:pagination|pager|paging)/i.test(html)
    || /(?:次へ|次のページ|前へ|前のページ|next|previous|page\s*\d+|ページ\s*\d+)/i.test(linkText)
    || /<(?:a|link)\b[^>]*(?:href|rel)\s*=\s*["'][^"']*(?:[?&](?:page|paged|pageno|page_no|offset)=|(?:next|prev))/i.test(html);
}

function cleanCell(value: unknown, maxLength = 500) {
  return cleanImportText(typeof value === "string" ? value : String(value ?? ""), maxLength);
}

function decodeText(bytes: Uint8Array) {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const shiftJis = new TextDecoder("shift_jis", { fatal: false }).decode(bytes);
  const score = (text: string) => {
    const headers = text.split(/\r\n|\n|\r/, 1)[0] ?? "";
    const hints = Object.values(SOURCE_HEADER_ALIASES).flat();
    const matched = hints.filter((hint) => headers.includes(hint)).length;
    const replacements = (text.match(/\uFFFD/g) ?? []).length;
    return matched * 20 - replacements;
  };

  return score(shiftJis) > score(utf8)
    ? { text: shiftJis, encoding: "shift_jis" as const }
    : { text: utf8, encoding: "utf-8" as const };
}

function detectDelimiter(text: string, fileName: string, contentType: string) {
  if (/\.tsv$/i.test(fileName) || contentType.includes("tab-separated")) return "\t";
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0] ?? "";
  if (firstLine.includes("\t")) return "\t";
  return ",";
}

function stripBom(text: string) {
  return text.replace(/^\uFEFF/, "");
}

function htmlEntityDecode(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match);
}

function isCkanResourcePage(url: URL) {
  return /^\/dataset\/[^/]+\/resource\/[^/]+\/?$/i.test(url.pathname);
}

function isCkanApiUrl(url: URL) {
  return url.hostname.toLowerCase() === "data.bodik.jp" && url.pathname.startsWith("/api/");
}

function extractCkanDownloadUrl(html: string, baseUrl: URL) {
  const links = Array.from(html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])([\s\S]*?)\1/gi));
  for (const match of links) {
    const href = htmlEntityDecode(match[2] ?? "").trim();
    if (!href) continue;
    try {
      const candidate = new URL(href, baseUrl);
      if (/^\/dataset\/[^/]+\/resource\/[^/]+\/download(?:\/|$)/i.test(candidate.pathname)) return candidate;
    } catch {
      // Ignore malformed links in untrusted HTML and continue searching.
    }
  }
  return null;
}

function fileNameFromUrl(url: string) {
  try {
    const value = new URL(url).pathname.split("/").pop() ?? "";
    return value && value !== "download" ? decodeURIComponent(value) : "";
  } catch {
    return "";
  }
}

function fileNameFromContentDisposition(value: string | null) {
  if (!value) return "";
  const encoded = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.replace(/^"|"$/g, ""));
    } catch {
      return encoded.replace(/^"|"$/g, "");
    }
  }
  return value.match(/filename\s*=\s*"?([^";]+)"?/i)?.[1]?.trim() ?? "";
}

function htmlCellText(value: string) {
  return cleanCell(
    htmlEntityDecode(value)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/[\r\n]+/g, " "),
    500
  );
}

function parseHtmlTable(html: string): SourceTable {
  const safeHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  const tables = Array.from(safeHtml.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)).map((match) => match[1] ?? "");
  let best: SourceTable | null = null;
  let bestHasShopSignal = false;

  for (const tableHtml of tables) {
    const rowMatches = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi));
    const parsedRows = rowMatches
      .map((rowMatch) => Array.from((rowMatch[1] ?? "").matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)).map((cell) => htmlCellText(cell[1] ?? "")))
      .filter((row) => row.some(Boolean));

    if (parsedRows.length < 2) continue;
    const headerIndex = parsedRows.slice(0, 5).reduce((bestIndex, row, index) => (
      recognizedHeaderCount(row) > recognizedHeaderCount(parsedRows[bestIndex] ?? []) ? index : bestIndex
    ), 0);
    const headers = parsedRows[headerIndex] ?? [];
    const score = recognizedHeaderCount(headers);

    const candidate = {
      headers,
      rows: parsedRows.slice(headerIndex + 1),
      format: "HTML table" as const,
      pageDisplayCount: parsedRows.slice(headerIndex + 1).length,
      paginationDetected: detectPagination(safeHtml),
    };
    const candidateHasShopSignal = tableHasShopSignal(candidate.headers, candidate.rows);
    const bestScore = best ? recognizedHeaderCount(best.headers) : -1;
    const shouldReplace = !best
      || (candidateHasShopSignal && !bestHasShopSignal)
      || (candidateHasShopSignal === bestHasShopSignal && (score > bestScore || (score === bestScore && candidate.rows.length > best.rows.length)));
    if (shouldReplace) {
      best = candidate;
      bestHasShopSignal = candidateHasShopSignal;
    }
  }

  if (tables.length === 0) {
    throw new BarberShopSourceError(hasSearchForm(safeHtml) ? SEARCH_REQUIRED_MESSAGE : HTML_TABLE_NOT_FOUND_MESSAGE, "parse_failed");
  }
  if (!best) throw new BarberShopSourceError(AUTO_PARSE_FAILURE_MESSAGE, "parse_failed");
  if (hasSearchForm(safeHtml) && !bestHasShopSignal) throw new BarberShopSourceError(SEARCH_REQUIRED_MESSAGE, "parse_failed");
  return best;
}

function parsePdfLines(text: string): SourceTable {
  const lines = text
    .split(/\r\n|\n|\r/)
    .map((line) => cleanCell(line, 1000))
    .filter(Boolean);
  const pdfCells = (line: string) => {
    const separated = line.includes("\t")
      ? parseDelimitedText(line, "\t")[0] ?? []
      : line.includes(",")
        ? parseDelimitedText(line, ",")[0] ?? []
        : line.split(/\s{2,}/);
    const whitespaceSeparated = line.split(/\s+/).filter(Boolean);
    return recognizedHeaderCount(whitespaceSeparated) > recognizedHeaderCount(separated) ? whitespaceSeparated : separated;
  };
  const headerIndex = lines.slice(0, 30).findIndex((line) => recognizedHeaderCount(pdfCells(line)) > 0);

  if (headerIndex < 0) throw new BarberShopSourceError(PDF_PARSE_FAILURE_MESSAGE, "pdf_parse_failed");

  const headerLine = lines[headerIndex];
  const headers = pdfCells(headerLine).map((cell) => cleanCell(cell));
  const rows = lines.slice(headerIndex + 1).map((line) => pdfCells(line).map((cell) => cleanCell(cell))).filter((row) => row.some(Boolean));

  if (rows.length === 0 || recognizedHeaderCount(headers) === 0) throw new BarberShopSourceError(PDF_PARSE_FAILURE_MESSAGE, "pdf_parse_failed");
  return { headers, rows, format: "text PDF", pageDisplayCount: rows.length, paginationDetected: false };
}

async function parseXlsx(bytes: Uint8Array): Promise<SourceTable> {
  try {
    const xlsx = await import("xlsx");
    const workbook = xlsx.read(bytes, { type: "array", raw: false, cellDates: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("missing sheet");
    const values = xlsx.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false });
    const rows = values.map((row) => row.slice(0, MAX_SOURCE_COLUMNS).map((cell) => cleanCell(cell))).filter((row) => row.some(Boolean));
    const headerIndex = rows.slice(0, 5).reduce((bestIndex, row, index) => (
      recognizedHeaderCount(row) > recognizedHeaderCount(rows[bestIndex] ?? []) ? index : bestIndex
    ), 0);
    const headers = rows[headerIndex] ?? [];
    if (headers.length === 0) throw new Error("missing headers");
    const dataRows = rows.slice(headerIndex + 1);
    return { headers, rows: dataRows, format: "xlsx", pageDisplayCount: dataRows.length, paginationDetected: false };
  } catch (error) {
    if (error instanceof BarberShopSourceError) throw error;
    throw new BarberShopSourceError(XLSX_PARSE_FAILURE_MESSAGE, "parse_failed");
  }
}

async function parsePdf(bytes: Uint8Array): Promise<SourceTable> {
  try {
    const pdfModule = (await import("pdf-parse")) as unknown as {
      PDFParse?: new (options: { data: Uint8Array }) => { getText: () => Promise<{ text?: string }>; destroy?: () => Promise<void> };
    };
    if (!pdfModule.PDFParse) throw new Error("PDF parser unavailable");
    const parser = new pdfModule.PDFParse({ data: bytes });
    try {
      const result = await parser.getText();
      return parsePdfLines(result.text ?? "");
    } finally {
      await parser.destroy?.();
    }
  } catch (error) {
    if (error instanceof BarberShopSourceError) throw error;
    throw new BarberShopSourceError(PDF_PARSE_FAILURE_MESSAGE, "pdf_parse_failed");
  }
}

function isPrivateIpv4(value: string) {
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const number = (((parts[0] * 256 + parts[1]) * 256 + parts[2]) * 256 + parts[3]);
  return parts[0] === 0
    || parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
    || (parts[0] === 192 && parts[1] === 0 && parts[2] === 0)
    || (parts[0] === 192 && parts[1] === 0 && parts[2] === 2)
    || (parts[0] === 198 && parts[1] === 18)
    || (parts[0] === 198 && parts[1] === 19)
    || (parts[0] === 198 && parts[1] === 51 && parts[2] === 100)
    || (parts[0] === 203 && parts[1] === 0 && parts[2] === 113)
    || number === 0
    || number >= 0xe0000000;
}

function isPrivateIp(value: string) {
  const normalized = value.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(normalized) === 4) return isPrivateIpv4(normalized);
  if (isIP(normalized) !== 6) return true;
  if (normalized.startsWith("::ffff:")) return isPrivateIpv4(normalized.slice("::ffff:".length));
  return normalized === "::1"
    || normalized === "::"
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
    || normalized.startsWith("ff")
    || normalized.startsWith("2001:db8")
    || /^fe[89a-f]/.test(normalized)
    || normalized.startsWith("::ffff:127.");
}

async function assertSafeUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new BarberShopSourceError("URLの形式を確認してください。", "invalid_url");
  }

  if (url.protocol !== "https:" || url.username || url.password) throw new BarberShopSourceError("安全のため、https:// で始まるURLだけ取得できます。", "blocked_url");
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname === "metadata.google.internal" || hostname === "metadata") {
    throw new BarberShopSourceError("このURLは安全のため取得できません。", "blocked_url");
  }

  const directIp = isIP(hostname) > 0;
  const addresses = directIp ? [hostname] : (await lookup(hostname, { all: true, verbatim: true })).map((entry) => entry.address);
  if (addresses.length === 0 || addresses.some(isPrivateIp)) throw new BarberShopSourceError("このURLは安全のため取得できません。", "blocked_url");
  return url;
}

async function readResponseBody(response: Response) {
  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (contentLength > MAX_SOURCE_BYTES) throw new BarberShopSourceError("取得ファイルが大きすぎます（最大8MB）。", "fetch_failed");
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_SOURCE_BYTES) throw new BarberShopSourceError("取得ファイルが大きすぎます（最大8MB）。", "fetch_failed");
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_SOURCE_BYTES) throw new BarberShopSourceError("取得ファイルが大きすぎます（最大8MB）。", "fetch_failed");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

async function fetchSource(input: string): Promise<SourceResponse> {
  let current = await assertSafeUrl(input);
  if (isCkanApiUrl(current)) throw new BarberShopSourceError(CKAN_API_UNSUPPORTED_MESSAGE, "unsupported");
  let fileNameHint = fileNameFromUrl(current.toString());
  let ckanPageResolved = false;

  for (let redirectCount = 0; redirectCount <= MAX_SOURCE_REDIRECTS; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(current, { redirect: "manual", signal: controller.signal, headers: { Accept: "text/html,text/csv,text/tab-separated-values,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream;q=0.5" } });
    } catch {
      clearTimeout(timeout);
      throw new BarberShopSourceError("公式ページを取得できませんでした。URL、公開状態、ネットワークを確認してください。", "fetch_failed");
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      clearTimeout(timeout);
      if (!location || redirectCount === MAX_SOURCE_REDIRECTS) throw new BarberShopSourceError("リダイレクト回数が上限を超えました。", "fetch_failed");
      const nextUrl = await assertSafeUrl(new URL(location, current).toString());
      fileNameHint = fileNameFromUrl(nextUrl.toString()) || fileNameHint;
      current = nextUrl;
      continue;
    }
    if (!response.ok) {
      clearTimeout(timeout);
      if (response.status === 401 || response.status === 403) throw new BarberShopSourceError("ファイルを取得できませんでした。ログインやアクセス制限のない公開URLを指定してください。", "fetch_failed");
      throw new BarberShopSourceError("公式ページを取得できませんでした。URLと公開状態を確認してください。", "fetch_failed");
    }

    try {
      const bytes = await readResponseBody(response);
      const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
      const type = contentType.split(";", 1)[0];
      if (!ckanPageResolved && isCkanResourcePage(current) && (type === "text/html" || type === "application/xhtml+xml")) {
        const downloadUrl = extractCkanDownloadUrl(new TextDecoder("utf-8", { fatal: false }).decode(bytes), current);
        if (!downloadUrl) throw new BarberShopSourceError(CKAN_RESOURCE_DOWNLOAD_MESSAGE, "parse_failed");
        fileNameHint = fileNameFromUrl(downloadUrl.toString()) || fileNameHint;
        current = await assertSafeUrl(downloadUrl.toString());
        ckanPageResolved = true;
        redirectCount -= 1;
        continue;
      }
      return {
        bytes,
        contentType,
        finalUrl: current.toString(),
        fileName: fileNameFromContentDisposition(response.headers.get("content-disposition")) || fileNameFromUrl(current.toString()) || fileNameHint || "official-source",
      };
    } catch (error) {
      if (error instanceof BarberShopSourceError) throw error;
      throw new BarberShopSourceError("公式ページを取得できませんでした。", "fetch_failed");
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new BarberShopSourceError("公式ページを取得できませんでした。", "fetch_failed");
}

async function parseSource(response: SourceResponse): Promise<SourceTable> {
  const fileName = response.fileName;
  const contentType = response.contentType;
  const type = contentType.split(";", 1)[0];
  const genericType = type === "" || type === "application/octet-stream";
  const pdfExtension = /\.pdf$/i.test(fileName);
  const xlsxExtension = /\.xlsx$/i.test(fileName);
  const htmlExtension = /\.html?$/i.test(fileName);
  const textExtension = /\.(?:csv|tsv|txt)$/i.test(fileName);

  if (type === "application/pdf" || (pdfExtension && genericType)) return parsePdf(response.bytes);
  if (pdfExtension && type !== "application/pdf" && !genericType) throw new BarberShopSourceError(UNSUPPORTED_FORMAT_MESSAGE, "unsupported");
  if (type.includes("spreadsheet") || type === "application/vnd.ms-excel" || (xlsxExtension && genericType)) return parseXlsx(response.bytes);
  if (xlsxExtension && !type.includes("spreadsheet") && type !== "application/vnd.ms-excel" && !genericType) throw new BarberShopSourceError(UNSUPPORTED_FORMAT_MESSAGE, "unsupported");

  const isHtml = type === "text/html" || type === "application/xhtml+xml" || (htmlExtension && genericType);
  if (isHtml) return parseHtmlTable(new TextDecoder("utf-8", { fatal: false }).decode(response.bytes));
  if (htmlExtension && !isHtml && !genericType) throw new BarberShopSourceError(UNSUPPORTED_FORMAT_MESSAGE, "unsupported");

  const textType = type.startsWith("text/") || type === "application/csv" || (genericType && textExtension);
  if (textType) {
    const decoded = decodeText(response.bytes);
    const delimiter = detectDelimiter(decoded.text, fileName, contentType);
    const rows = parseDelimitedText(stripBom(decoded.text), delimiter).map((row) => row.slice(0, MAX_SOURCE_COLUMNS).map((cell) => cleanCell(cell)));
    const headers = rows[0] ?? [];
    if (headers.length === 0 || rows.length < 2) throw new BarberShopSourceError(CSV_PARSE_FAILURE_MESSAGE, "parse_failed");
    const dataRows = rows.slice(1);
    return { headers, rows: dataRows, format: delimiter === "\t" ? "TSV" : "CSV", pageDisplayCount: dataRows.length, paginationDetected: false };
  }

  throw new BarberShopSourceError(UNSUPPORTED_FORMAT_MESSAGE, "unsupported");
}

type SourceConversionInput = {
  sourceUrl: string;
  prefecture: string;
  municipality: string;
  sourceName: string;
  mapping: SourceColumnMapping;
};

function autoSourceColumnMapping(table: SourceTable): SourceColumnMapping {
  return {
    name: fieldHeaderIndex(table.headers, "name") >= 0 ? fieldHeaderIndex(table.headers, "name") : null,
    address: fieldHeaderIndex(table.headers, "address") >= 0 ? fieldHeaderIndex(table.headers, "address") : null,
    phone: fieldHeaderIndex(table.headers, "phone") >= 0 ? fieldHeaderIndex(table.headers, "phone") : null,
  };
}

function cellAt(row: string[], index: number | null) {
  return index == null ? "" : cleanCell(row[index] ?? "");
}

function csvSafeValue(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function sourceRowsToCsv(table: SourceTable, input: SourceConversionInput) {
  if (input.mapping.name == null) throw new BarberShopSourceError("店名に対応する列を選択してください。", "parse_failed");

  const sourcePrefectureIndex = fieldHeaderIndex(table.headers, "prefecture");
  const sourceMunicipalityIndex = fieldHeaderIndex(table.headers, "municipality");
  const prefectureFallback = cleanCell(input.prefecture, 20);
  const municipalityFallback = cleanCell(input.municipality, 80);
  const sourceName = cleanCell(input.sourceName, 240);
  const convertedRows: string[][] = [];
  const previewRows: BarberShopSourcePreviewRow[] = [];
  let excludedCount = 0;

  table.rows.slice(0, MAX_SOURCE_ROWS).forEach((row, index) => {
    const name = cellAt(row, input.mapping.name);
    const prefecture = cellAt(row, sourcePrefectureIndex >= 0 ? sourcePrefectureIndex : null) || prefectureFallback;
    const municipality = cellAt(row, sourceMunicipalityIndex >= 0 ? sourceMunicipalityIndex : null) || municipalityFallback;
    const address = cellAt(row, input.mapping.address);
    const phone = cellAt(row, input.mapping.phone);

    if (![name, prefecture, municipality, address, phone].some(Boolean)) {
      excludedCount += 1;
      return;
    }

    const validationErrors: string[] = [];
    if (!name) validationErrors.push("店名が空です。");
    if (!prefecture) validationErrors.push("都道府県が空です。");
    if (!municipality) validationErrors.push("市区町村が空です。");
    if (!sourceName) validationErrors.push("掲載元が空です。");

    const outputValues = [name, prefecture, municipality, address, phone, sourceName, "未認証"].map(csvSafeValue);
    convertedRows.push(outputValues);
    previewRows.push({
      rowNumber: index + 2,
      name: outputValues[0],
      prefecture: outputValues[1],
      municipality: outputValues[2],
      address: outputValues[3],
      phone: outputValues[4],
      validationErrors,
    });
  });

  if (convertedRows.length === 0) throw new BarberShopSourceError(AUTO_PARSE_FAILURE_MESSAGE, "parse_failed");

  const validCount = previewRows.filter((row) => row.validationErrors.length === 0).length;
  return {
    csv: `\uFEFF${createBarberShopCsv(convertedRows)}`,
    rows: previewRows,
    fetchedCount: table.rows.length,
    pageDisplayCount: table.pageDisplayCount,
    paginationDetected: table.paginationDetected,
    outputCount: convertedRows.length,
    excludedCount,
    validCount,
    blankCounts: {
      name: previewRows.filter((row) => !row.name).length,
      prefecture: previewRows.filter((row) => !row.prefecture).length,
      municipality: previewRows.filter((row) => !row.municipality).length,
      address: previewRows.filter((row) => !row.address).length,
      phone: previewRows.filter((row) => !row.phone).length,
      source: sourceName ? 0 : previewRows.length,
    },
    errorCount: previewRows.length - validCount,
  };
}

function cleanSourceInput(input: Omit<SourceConversionInput, "mapping">) {
  return {
    sourceUrl: input.sourceUrl.trim().slice(0, 2048),
    prefecture: cleanCell(input.prefecture, 20),
    municipality: cleanCell(input.municipality, 80),
    sourceName: cleanCell(input.sourceName, 240),
  };
}

function ensureMapping(mapping: SourceColumnMapping, headers: string[]) {
  for (const index of [mapping.name, mapping.address, mapping.phone]) {
    if (index != null && (!Number.isInteger(index) || index < 0 || index >= headers.length)) {
      throw new BarberShopSourceError(AUTO_PARSE_FAILURE_MESSAGE, "parse_failed");
    }
  }
  const excludedIndexes = new Set([
    fieldHeaderIndex(headers, "representative"),
    fieldHeaderIndex(headers, "postalCode"),
  ]);
  if ([mapping.name, mapping.address, mapping.phone].some((index) => index != null && excludedIndexes.has(index))) {
    throw new BarberShopSourceError("氏名・代表者名・開設者名・管理者名・郵便番号の列は出力対象にできません。", "parse_failed");
  }
}

export async function analyzeBarberShopSource(input: Omit<SourceConversionInput, "mapping">): Promise<BarberShopSourceAnalysis> {
  const cleaned = cleanSourceInput(input);
  if (!cleaned.sourceUrl) throw new BarberShopSourceError("URLの形式を確認してください。", "invalid_url");
  const response = await fetchSource(cleaned.sourceUrl);
  const table = await parseSource(response);

  return {
    ...cleaned,
    finalUrl: response.finalUrl,
    format: table.format,
    headers: table.headers,
    sampleRows: table.rows.slice(0, 10),
    autoMapping: autoSourceColumnMapping(table),
    pageDisplayCount: table.pageDisplayCount,
    paginationDetected: table.paginationDetected,
    excludedColumnIndexes: table.headers
      .map((_, index) => index)
      .filter((index) => fieldHeaderIndex(table.headers, "representative") === index || fieldHeaderIndex(table.headers, "postalCode") === index),
  };
}

export async function createBarberShopSourcePreview(input: SourceConversionInput): Promise<BarberShopSourcePreview> {
  const cleaned = cleanSourceInput(input);
  if (!cleaned.sourceUrl) throw new BarberShopSourceError("URLの形式を確認してください。", "invalid_url");
  const response = await fetchSource(cleaned.sourceUrl);
  const table = await parseSource(response);
  ensureMapping(input.mapping, table.headers);
  const transformed = sourceRowsToCsv(table, { ...cleaned, mapping: input.mapping });

  return {
    format: table.format,
    finalUrl: response.finalUrl,
    fileName: `barber-hub-official-source-${Date.now()}.csv`,
    csv: transformed.csv,
    rows: transformed.rows.slice(0, 20),
    fetchedCount: transformed.fetchedCount,
    pageDisplayCount: transformed.pageDisplayCount,
    paginationDetected: transformed.paginationDetected,
    outputCount: transformed.outputCount,
    validCount: transformed.validCount,
    blankCounts: transformed.blankCounts,
    excludedCount: transformed.excludedCount,
    errorCount: transformed.errorCount,
  };
}
