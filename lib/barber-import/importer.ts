import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { BARBER_SHOP_CSV_HEADERS, missingCsvHeaders, parseBarberShopCsv } from "./csv";
import {
  cleanImportPhone,
  cleanImportText,
  normalizeCsvImportVerificationStatus,
  normalizeImportPhone,
  normalizeImportText,
} from "./normalization";
import { normalizeShopSearchText, type BarberShopVerificationStatus } from "@/lib/supabase/barber-shops";

export type BarberShopImportBatch = {
  id: string;
  file_name: string;
  status: "previewed" | "imported" | "failed";
  created_by: string | null;
  row_count: number;
  valid_row_count: number;
  duplicate_exact_count: number;
  duplicate_candidate_count: number;
  inserted_count: number;
  skipped_count: number;
  error_count: number;
  source_summary: string | null;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
  imported_at: string | null;
};

export type BarberShopImportRow = {
  id: string;
  batch_id: string;
  row_number: number;
  name: string;
  prefecture: string;
  municipality: string;
  address: string;
  phone: string | null;
  source: string | null;
  verification_status: BarberShopVerificationStatus;
  normalized_name: string;
  normalized_address: string;
  normalized_phone: string;
  validation_errors: string[];
  duplicate_type: "none" | "exact" | "candidate" | "file_exact";
  duplicate_shop_ids: string[];
  import_status: "pending" | "inserted" | "skipped" | "failed";
  imported_shop_id: string | null;
  import_error: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ExistingShopForDuplicate = {
  id: string;
  name: string;
  prefecture: string;
  municipality: string;
  address: string;
  phone: string | null;
  normalized_name: string;
  normalized_address: string | null;
  normalized_phone: string | null;
};

type PreparedImportRow = Omit<BarberShopImportRow, "id" | "batch_id" | "created_at" | "updated_at" | "imported_shop_id" | "import_error"> & {
  duplicateKey: string;
};

export type BarberShopImportPreview = {
  batch: BarberShopImportBatch;
  summary: BarberShopImportSummary;
  sampleRows: BarberShopImportRow[];
  issueRows: BarberShopImportRow[];
  resultRows: BarberShopImportRow[];
};

export type BarberShopImportCount = {
  label: string;
  count: number;
};

export type BarberShopImportBlankCount = BarberShopImportCount & {
  field: "店名" | "都道府県" | "市区町村" | "住所" | "電話番号" | "掲載元";
};

export type BarberShopImportSummary = {
  prefectureCounts: BarberShopImportCount[];
  municipalityCounts: BarberShopImportCount[];
  blankCounts: BarberShopImportBlankCount[];
  invalidPhoneCount: number;
  sameNameAddressCandidateCount: number;
};

export type CreateImportPreviewResult = {
  batchId: string | null;
  error: string | null;
  encoding?: "utf-8" | "shift_jis";
};

const EXISTING_SHOP_SELECT = `
  id,
  name,
  prefecture,
  municipality,
  address,
  phone,
  normalized_name,
  normalized_address,
  normalized_phone
`;

function duplicateKeyFor(row: Pick<PreparedImportRow, "normalized_name" | "prefecture" | "municipality" | "normalized_address" | "normalized_phone">) {
  return [row.normalized_name, row.prefecture, row.municipality, row.normalized_address, row.normalized_phone].join("\u001F");
}

function duplicateKeyForExisting(shop: ExistingShopForDuplicate) {
  return [
    shop.normalized_name,
    shop.prefecture,
    shop.municipality,
    shop.normalized_address ?? normalizeImportText(shop.address),
    shop.normalized_phone ?? normalizeImportPhone(shop.phone),
  ].join("\u001F");
}

function canUseExactDuplicateKey(
  row: Pick<PreparedImportRow, "normalized_address" | "normalized_phone">
) {
  return row.normalized_address.length > 0 || row.normalized_phone.length > 0;
}

function hasUnexpectedPhoneFormat(phone: string | null | undefined, normalizedPhone: string) {
  return Boolean(phone) && !/^0\d{9,10}$/.test(normalizedPhone);
}

const TOKYO_MUNICIPALITY_ALIASES = new Map([
  ["東村", "東村山市"],
  ["羽村", "羽村市"],
  ["武蔵村", "武蔵村山市"],
  ["西多摩郡瑞穂町", "瑞穂町"],
  ["西多摩郡日の出町", "日の出町"],
  ["西多摩郡奥多摩町", "奥多摩町"],
  ["西多摩郡檜原村", "檜原村"],
  ["八丈島八丈町", "八丈町"],
  ["三宅島三宅村", "三宅村"],
]);

function normalizeMunicipalityForPrefecture(prefecture: string, municipality: string) {
  if (prefecture !== "東京都") return municipality;
  return TOKYO_MUNICIPALITY_ALIASES.get(municipality) ?? municipality;
}

function deriveMunicipality(rawMunicipality: string, prefecture: string, address: string, source: string) {
  if (rawMunicipality) return normalizeMunicipalityForPrefecture(prefecture, rawMunicipality);

  const normalizedAddress = cleanImportText(address, 120);
  const normalizedSource = cleanImportText(source, 120);
  const fukuokaWards = ["東区", "博多区", "中央区", "南区", "西区", "城南区", "早良区"];
  const kitakyushuWards = ["門司区", "若松区", "戸畑区", "小倉北区", "小倉南区", "八幡東区", "八幡西区"];

  for (const ward of fukuokaWards) {
    if (
      normalizedAddress.startsWith(`福岡市${ward}`)
      || (normalizedSource.includes("福岡市") && normalizedAddress.startsWith(ward))
    ) {
      return `福岡市${ward}`;
    }
  }

  for (const ward of kitakyushuWards) {
    if (
      normalizedAddress.startsWith(`北九州市${ward}`)
      || (normalizedSource.includes("北九州市") && normalizedAddress.startsWith(ward))
    ) {
      return `北九州市${ward}`;
    }
  }

  return normalizeMunicipalityForPrefecture(prefecture, "");
}

function isDuplicateCandidate(row: PreparedImportRow, shop: ExistingShopForDuplicate) {
  if (row.prefecture !== shop.prefecture) return false;

  const existingAddress = shop.normalized_address ?? normalizeImportText(shop.address);
  const existingPhone = shop.normalized_phone ?? normalizeImportPhone(shop.phone);
  const nameMatches = row.normalized_name.length > 0 && row.normalized_name === shop.normalized_name;
  const addressMatches = row.normalized_address.length > 0 && row.normalized_address === existingAddress;
  const phoneMatches = row.normalized_phone.length > 0 && row.normalized_phone === existingPhone;
  const cityMatches = row.municipality.length > 0 && row.municipality === shop.municipality;

  return phoneMatches || (nameMatches && (addressMatches || cityMatches)) || (addressMatches && cityMatches);
}

function sourceSummary(rows: PreparedImportRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (!row.source) continue;
    counts.set(row.source, (counts.get(row.source) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([source, count]) => `${source}: ${count}件`)
    .join(" / ");
}

function countByLabel(rows: BarberShopImportRow[], getLabel: (row: BarberShopImportRow) => string) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const label = getLabel(row);
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"));
}

function createPreviewSummary(rows: BarberShopImportRow[]): BarberShopImportSummary {
  const sameNameAddressKeys = new Map<string, number>();

  for (const row of rows) {
    if (!row.normalized_name || !row.normalized_address) continue;
    const key = [row.normalized_name, row.prefecture, row.municipality, row.normalized_address].join("\u001F");
    sameNameAddressKeys.set(key, (sameNameAddressKeys.get(key) ?? 0) + 1);
  }

  const sameNameAddressCandidateCount = rows.filter((row) => {
    if (!row.normalized_name || !row.normalized_address) return false;
    const key = [row.normalized_name, row.prefecture, row.municipality, row.normalized_address].join("\u001F");
    return (sameNameAddressKeys.get(key) ?? 0) > 1;
  }).length;

  return {
    prefectureCounts: countByLabel(rows, (row) => row.prefecture),
    municipalityCounts: countByLabel(rows, (row) => row.municipality),
    blankCounts: [
      { field: "店名", label: "店名", count: rows.filter((row) => !row.name).length },
      { field: "都道府県", label: "都道府県", count: rows.filter((row) => !row.prefecture).length },
      { field: "市区町村", label: "市区町村", count: rows.filter((row) => !row.municipality).length },
      { field: "住所", label: "住所", count: rows.filter((row) => !row.address).length },
      { field: "電話番号", label: "電話番号", count: rows.filter((row) => !row.phone).length },
      { field: "掲載元", label: "掲載元", count: rows.filter((row) => !row.source).length },
    ],
    invalidPhoneCount: rows.filter((row) => hasUnexpectedPhoneFormat(row.phone, row.normalized_phone)).length,
    sameNameAddressCandidateCount,
  };
}

function rowValue(row: string[], index: Map<string, number>, header: string) {
  const position = index.get(header);
  if (position == null) return "";
  return row[position] ?? "";
}

function prepareRows(headers: string[], rows: string[][]) {
  const index = new Map(headers.map((header, position) => [header, position]));

  return rows.map((csvRow, rowIndex): PreparedImportRow => {
    const name = cleanImportText(rowValue(csvRow, index, "店名"), 160);
    const prefecture = cleanImportText(rowValue(csvRow, index, "都道府県"), 20);
    const address = cleanImportText(rowValue(csvRow, index, "住所"), 240);
    const phone = cleanImportPhone(rowValue(csvRow, index, "電話番号"));
    const source = cleanImportText(rowValue(csvRow, index, "掲載元"), 240);
    const municipality = deriveMunicipality(cleanImportText(rowValue(csvRow, index, "市区町村"), 80), prefecture, address, source);
    const statusResult = normalizeCsvImportVerificationStatus(rowValue(csvRow, index, "認証状態"));
    const normalizedName = normalizeShopSearchText(name);
    const normalizedPhone = normalizeImportPhone(phone);
    const validationErrors: string[] = [];

    if (!name) validationErrors.push("店名が空です。");
    if (!prefecture) validationErrors.push("都道府県が空です。");
    if (!municipality) validationErrors.push("市区町村が空です。");
    if (!source) validationErrors.push("掲載元が空です。");
    if (!normalizedName) validationErrors.push("店名を検索用に正規化できませんでした。");
    if (statusResult.error) validationErrors.push(statusResult.error);

    const prepared = {
      row_number: rowIndex + 2,
      name,
      prefecture,
      municipality,
      address,
      phone,
      source: source || null,
      verification_status: statusResult.status,
      normalized_name: normalizedName,
      normalized_address: normalizeImportText(address),
      normalized_phone: normalizedPhone,
      validation_errors: validationErrors,
      duplicate_type: "none" as const,
      duplicate_shop_ids: [],
      import_status: "pending" as const,
      duplicateKey: "",
    };

    prepared.duplicateKey = duplicateKeyFor(prepared);
    return prepared;
  });
}

async function fetchExistingShopsForPrefectures(supabase: SupabaseClient, prefectures: string[]) {
  const uniquePrefectures = Array.from(new Set(prefectures.filter(Boolean)));
  const shops: ExistingShopForDuplicate[] = [];

  if (uniquePrefectures.length === 0) return shops;

  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("barber_shops")
      .select(EXISTING_SHOP_SELECT)
      .in("prefecture", uniquePrefectures)
      .eq("is_deleted", false)
      .eq("is_duplicate", false)
      .order("created_at", { ascending: false })
      .range(from, from + 999)
      .returns<ExistingShopForDuplicate[]>();

    if (error) {
      throw new Error("既存店舗の重複確認に失敗しました。migration適用状況を確認してください。");
    }

    shops.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }

  return shops;
}

function classifyDuplicates(rows: PreparedImportRow[], existingShops: ExistingShopForDuplicate[]) {
  const seenInFile = new Map<string, PreparedImportRow>();
  const exactExisting = new Map<string, string[]>();

  for (const shop of existingShops) {
    const key = duplicateKeyForExisting(shop);
    const ids = exactExisting.get(key) ?? [];
    ids.push(shop.id);
    exactExisting.set(key, ids);
  }

  for (const row of rows) {
    if (row.validation_errors.length > 0) continue;

    const canUseExactKey = canUseExactDuplicateKey(row);

    if (canUseExactKey) {
      const firstSeen = seenInFile.get(row.duplicateKey);
      if (firstSeen) {
        row.duplicate_type = "file_exact";
        continue;
      }

      seenInFile.set(row.duplicateKey, row);

      const exactIds = exactExisting.get(row.duplicateKey);
      if (exactIds && exactIds.length > 0) {
        row.duplicate_type = "exact";
        row.duplicate_shop_ids = exactIds.slice(0, 5);
        continue;
      }
    }

    const candidates = existingShops.filter((shop) => isDuplicateCandidate(row, shop));
    if (candidates.length > 0) {
      row.duplicate_type = "candidate";
      row.duplicate_shop_ids = candidates.slice(0, 5).map((shop) => shop.id);
    }
  }
}

async function insertImportRows(supabase: SupabaseClient, batchId: string, rows: PreparedImportRow[]) {
  const chunkSize = 500;

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize).map(({ duplicateKey: _duplicateKey, ...row }) => ({
      ...row,
      batch_id: batchId,
    }));
    const { error } = await supabase.from("barber_shop_import_rows").insert(chunk);

    if (error) {
      throw new Error("CSVプレビュー行の保存に失敗しました。");
    }
  }
}

async function fetchAllImportRowsForBatch(supabase: SupabaseClient, batchId: string) {
  const rows: BarberShopImportRow[] = [];

  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("barber_shop_import_rows")
      .select("*")
      .eq("batch_id", batchId)
      .order("row_number", { ascending: true })
      .range(from, from + 999)
      .returns<BarberShopImportRow[]>();

    if (error) {
      throw new Error("CSVプレビュー集計の取得に失敗しました。");
    }

    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }

  return rows;
}

export async function createBarberShopImportPreview(
  supabase: SupabaseClient,
  file: File,
  userId: string
): Promise<CreateImportPreviewResult> {
  if (file.size <= 0) {
    return { batchId: null, error: "CSVファイルが空です。" };
  }

  const parsed = parseBarberShopCsv(await file.arrayBuffer());
  const missing = missingCsvHeaders(parsed.headers);

  if (missing.length > 0) {
    return {
      batchId: null,
      error: `CSV列が不足しています: ${missing.join("、")}`,
      encoding: parsed.encoding,
    };
  }

  const rows = prepareRows(parsed.headers, parsed.rows);
  const existingShops = await fetchExistingShopsForPrefectures(
    supabase,
    rows.map((row) => row.prefecture)
  );

  classifyDuplicates(rows, existingShops);

  const rowCount = rows.length;
  const duplicateExactCount = rows.filter((row) => row.duplicate_type === "exact" || row.duplicate_type === "file_exact").length;
  const duplicateCandidateCount = rows.filter((row) => row.duplicate_type === "candidate").length;
  const errorCount = rows.filter((row) => row.validation_errors.length > 0).length;
  const validRowCount = rows.filter((row) => row.validation_errors.length === 0 && row.duplicate_type !== "exact" && row.duplicate_type !== "file_exact").length;

  const { data: batch, error: batchError } = await supabase
    .from("barber_shop_import_batches")
    .insert({
      file_name: cleanImportText(file.name || "uploaded.csv", 240) || "uploaded.csv",
      created_by: userId,
      row_count: rowCount,
      valid_row_count: validRowCount,
      duplicate_exact_count: duplicateExactCount,
      duplicate_candidate_count: duplicateCandidateCount,
      error_count: errorCount,
      source_summary: sourceSummary(rows) || null,
    })
    .select("id")
    .single<{ id: string }>();

  if (batchError || !batch) {
    return { batchId: null, error: "CSVプレビューを開始できませんでした。migration適用状況を確認してください。", encoding: parsed.encoding };
  }

  await insertImportRows(supabase, batch.id, rows);

  return { batchId: batch.id, error: null, encoding: parsed.encoding };
}

export async function getBarberShopImportPreview(supabase: SupabaseClient, batchId: string): Promise<BarberShopImportPreview | null> {
  const { data: batch, error: batchError } = await supabase
    .from("barber_shop_import_batches")
    .select("*")
    .eq("id", batchId)
    .maybeSingle<BarberShopImportBatch>();

  if (batchError || !batch) return null;

  const [{ data: sampleRows }, { data: duplicateRows }, { data: validationRows }, { data: resultRows }, allRows] = await Promise.all([
    supabase
      .from("barber_shop_import_rows")
      .select("*")
      .eq("batch_id", batchId)
      .order("row_number", { ascending: true })
      .limit(50)
      .returns<BarberShopImportRow[]>(),
    supabase
      .from("barber_shop_import_rows")
      .select("*")
      .eq("batch_id", batchId)
      .neq("duplicate_type", "none")
      .order("row_number", { ascending: true })
      .limit(80)
      .returns<BarberShopImportRow[]>(),
    supabase
      .from("barber_shop_import_rows")
      .select("*")
      .eq("batch_id", batchId)
      .not("validation_errors", "eq", "{}")
      .order("row_number", { ascending: true })
      .limit(80)
      .returns<BarberShopImportRow[]>(),
    supabase
      .from("barber_shop_import_rows")
      .select("*")
      .eq("batch_id", batchId)
      .neq("import_status", "pending")
      .order("row_number", { ascending: true })
      .limit(80)
      .returns<BarberShopImportRow[]>(),
    fetchAllImportRowsForBatch(supabase, batchId),
  ]);

  const issueRowMap = new Map<string, BarberShopImportRow>();
  for (const row of [...(validationRows ?? []), ...(duplicateRows ?? [])]) {
    issueRowMap.set(row.id, row);
  }

  return {
    batch,
    summary: createPreviewSummary(allRows),
    sampleRows: sampleRows ?? [],
    issueRows: Array.from(issueRowMap.values()).sort((a, b) => a.row_number - b.row_number).slice(0, 80),
    resultRows: resultRows ?? [],
  };
}

export async function executeBarberShopImportBatch(
  supabase: SupabaseClient,
  batchId: string,
  userId: string,
  includeCandidateRows: boolean
) {
  const { data, error } = await supabase
    .rpc("execute_barber_shop_import_batch", {
      target_batch_id: batchId,
      actor_id: userId,
      include_candidate_rows: includeCandidateRows,
    })
    .single<{ inserted_count: number; skipped_count: number; failed_count: number }>();

  return { result: data, error };
}

export function expectedHeaderLabel() {
  return BARBER_SHOP_CSV_HEADERS.join(" / ");
}
