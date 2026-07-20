import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { createBarberShopCsv, parseDelimitedText } from "./csv";
import { createBarberShopImportPreview, type CreateImportPreviewResult } from "./importer";
import { cleanImportText } from "./normalization";
import { PREFECTURES } from "@/lib/japanAreas";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_SOURCE_REDIRECTS = 3;
const SOURCE_TIMEOUT_MS = 15_000;
const MAX_SOURCE_ROWS = 20_000;
const MAX_SOURCE_COLUMNS = 80;

const PDF_PARSE_FAILURE_MESSAGE = "このPDFは自動解析できませんでした。ファイルをダウンロードして手動で確認してください";

export type SourceFormat = "CSV" | "TSV" | "xlsx" | "HTML table" | "text PDF";

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
};

const SOURCE_HEADER_ALIASES = {
  name: ["店名", "店舗名", "屋号", "理容所名称", "理容所名", "施設名称", "施設名", "営業所名称", "営業所名", "事業所名"],
  prefecture: ["都道府県", "都道府県名", "県名"],
  municipality: ["市区町村", "市町村", "自治体", "所在地市区町村", "所在市区町村"],
  address: ["住所", "所在地", "施設所在地", "営業所在地", "所在地住所"],
  phone: ["電話", "電話番号", "連絡先", "電話番号等"],
  postalCode: ["郵便番号", "郵便番号〒", "〒"],
  representative: ["氏名", "氏名代表者名", "代表者名", "代表者", "設置者氏名"],
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
  return headers.findIndex((header) => aliases.some((alias) => headerMatches(header, alias)));
}

function recognizedHeaderCount(headers: string[]) {
  return (Object.keys(SOURCE_HEADER_ALIASES) as SourceField[]).filter((field) => fieldHeaderIndex(headers, field) >= 0).length;
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
    if (score === 0) continue;

    const candidate = { headers, rows: parsedRows.slice(headerIndex + 1), format: "HTML table" as const };
    if (!best || score > recognizedHeaderCount(best.headers) || candidate.rows.length > best.rows.length) best = candidate;
  }

  if (!best) throw new BarberShopSourceError("対応するHTML表を確認できませんでした。掲載ファイルのURLを直接指定してください。", "parse_failed");
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
  return { headers, rows, format: "text PDF" };
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
    if (recognizedHeaderCount(headers) === 0) throw new Error("unrecognized headers");
    return { headers, rows: rows.slice(headerIndex + 1), format: "xlsx" };
  } catch (error) {
    if (error instanceof BarberShopSourceError) throw error;
    throw new BarberShopSourceError("Excelファイルを表として解析できませんでした。ファイルをダウンロードして手動で確認してください。", "parse_failed");
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
  return parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
    || number === 0
    || number >= 0xe0000000;
}

function isPrivateIp(value: string) {
  const normalized = value.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(normalized) === 4) return isPrivateIpv4(normalized);
  if (isIP(normalized) !== 6) return true;
  if (normalized.startsWith("::ffff:")) return isPrivateIpv4(normalized.slice("::ffff:".length));
  return normalized === "::1"
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
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
      current = await assertSafeUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) {
      clearTimeout(timeout);
      throw new BarberShopSourceError("公式ページを取得できませんでした。URLと公開状態を確認してください。", "fetch_failed");
    }

    try {
      const bytes = await readResponseBody(response);
      const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
      return { bytes, contentType, finalUrl: current.toString(), fileName: new URL(current).pathname.split("/").pop() || "official-source" };
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

  if (type === "application/pdf" || /\.pdf$/i.test(fileName)) return parsePdf(response.bytes);
  if (type.includes("spreadsheet") || type === "application/vnd.ms-excel" || /\.xlsx$/i.test(fileName)) return parseXlsx(response.bytes);

  const isHtml = type === "text/html" || type === "application/xhtml+xml" || /\.html?$/i.test(fileName);
  if (isHtml) return parseHtmlTable(new TextDecoder("utf-8", { fatal: false }).decode(response.bytes));

  const textType = type.startsWith("text/") || type === "application/csv" || type === "application/octet-stream" || type === "";
  if (textType) {
    const decoded = decodeText(response.bytes);
    const delimiter = detectDelimiter(decoded.text, fileName, contentType);
    const rows = parseDelimitedText(stripBom(decoded.text), delimiter).map((row) => row.slice(0, MAX_SOURCE_COLUMNS).map((cell) => cleanCell(cell)));
    const headers = rows[0] ?? [];
    if (recognizedHeaderCount(headers) === 0) throw new BarberShopSourceError("CSV / TSVの見出しを確認できませんでした。", "parse_failed");
    return { headers, rows: rows.slice(1), format: delimiter === "\t" ? "TSV" : "CSV" };
  }

  throw new BarberShopSourceError("CSV、TSV、xlsx、HTML表、テキストPDF以外の形式には対応していません。", "unsupported");
}

function prefectureFromAddress(address: string) {
  const normalized = address.replace(/^〒?\d{3}-?\d{4}/, "").replace(/[\s\u3000]/g, "");
  return PREFECTURES.find((prefecture) => normalized.startsWith(prefecture)) ?? "";
}

function municipalityFromAddress(address: string, prefecture: string) {
  const normalized = address.replace(/^〒?\d{3}-?\d{4}/, "").replace(/[\s\u3000]/g, "").replace(new RegExp(`^${prefecture}`), "");
  return normalized.match(/^(.+?市.+?区|.+?郡.+?[町村]|.+?市|.+?区|.+?町|.+?村)/)?.[1] ?? "";
}

function valueAt(row: string[], headers: string[], field: SourceField) {
  const index = fieldHeaderIndex(headers, field);
  return index >= 0 ? cleanCell(row[index] ?? "") : "";
}

function normalizeSourcePhone(value: string) {
  const normalized = value.normalize("NFKC").replace(/[^0-9]/g, "");
  return normalized.length === 9 ? `0${normalized}` : value;
}

function sourceRowsToCsv(table: SourceTable, sourceUrl: string) {
  const rows = table.rows.slice(0, MAX_SOURCE_ROWS).map((row) => {
    const rawAddress = valueAt(row, table.headers, "address");
    const prefecture = valueAt(row, table.headers, "prefecture") || prefectureFromAddress(rawAddress);
    const municipality = valueAt(row, table.headers, "municipality") || municipalityFromAddress(rawAddress, prefecture);
    const phone = normalizeSourcePhone(valueAt(row, table.headers, "phone"));
    return [
      valueAt(row, table.headers, "name"),
      prefecture,
      municipality,
      rawAddress,
      phone,
      sourceUrl,
      "未認証",
    ];
  });

  if (rows.length === 0) throw new BarberShopSourceError("一覧データの行を確認できませんでした。", "parse_failed");
  return createBarberShopCsv(rows);
}

export async function createBarberShopImportPreviewFromSource(
  supabase: SupabaseClient,
  sourceUrl: string,
  userId: string
): Promise<CreateImportPreviewResult & { format?: SourceFormat; finalUrl?: string }> {
  if (!sourceUrl || sourceUrl.length > 2048) return { batchId: null, error: "URLの形式を確認してください。" };
  const response = await fetchSource(sourceUrl);
  const table = await parseSource(response);
  const csv = sourceRowsToCsv(table, response.finalUrl);
  const file = new File([`\uFEFF${csv}`], `official-source-${Date.now()}.csv`, { type: "text/csv" });
  const result = await createBarberShopImportPreview(supabase, file, userId);
  return { ...result, format: table.format, finalUrl: response.finalUrl };
}

export function pdfParseFailureMessage() {
  return PDF_PARSE_FAILURE_MESSAGE;
}
