import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  if (!existsSync(".env.local")) return;

  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!match) continue;
    if (process.env[match[1]] != null) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function normalizeShopSearchText(value) {
  return value
    .normalize("NFKC")
    .replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function cleanLikeInput(value) {
  return value.replace(/[%_,()]/g, "");
}

function normalizeShopPhoneSearchText(value) {
  return value.normalize("NFKC").replace(/[^0-9]/g, "");
}

function publicShopQuery(supabase) {
  return supabase
    .from("barber_shops")
    .select("id", { count: "exact", head: true })
    .eq("is_public", true)
    .eq("is_deleted", false)
    .eq("is_duplicate", false)
    .eq("status", "public")
    .neq("verification_status", "suspended");
}

function publicShopRows(supabase) {
  return supabase
    .from("barber_shops")
    .select("id,name,prefecture,municipality,address,phone,verification_status,source_type,owner_user_id")
    .eq("is_public", true)
    .eq("is_deleted", false)
    .eq("is_duplicate", false)
    .eq("status", "public")
    .neq("verification_status", "suspended");
}

async function count(label, query) {
  const { count: value, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  return [label, value ?? 0];
}

async function search(supabase, rawTerm) {
  const term = rawTerm.trim();
  const normalizedQuery = cleanLikeInput(normalizeShopSearchText(term));
  const queryText = cleanLikeInput(term);
  const normalizedPhoneQuery = cleanLikeInput(normalizeShopPhoneSearchText(term));
  const filters = [
    normalizedQuery ? `normalized_name.ilike.%${normalizedQuery}%` : null,
    queryText ? `prefecture.ilike.%${queryText}%` : null,
    queryText ? `municipality.ilike.%${queryText}%` : null,
    queryText ? `address.ilike.%${queryText}%` : null,
    normalizedPhoneQuery ? `normalized_phone.ilike.%${normalizedPhoneQuery}%` : null,
  ].filter(Boolean);

  if (filters.length === 0) return [];

  const { data, error } = await publicShopRows(supabase)
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw new Error(`search ${rawTerm}: ${error.message}`);
  return data ?? [];
}

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !publishableKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, publishableKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const verifyPrefecture = process.env.BARBER_SHOP_VERIFY_PREFECTURE?.trim() || "福岡県";
const defaultSearchTerms = verifyPrefecture === "東京都"
  ? ["荒川区", "板橋区", "江戸川区", "羽村市", "府中市", "瑞穂町", "八丈町", "東京都"]
  : ["姪浜", "福岡市", "久留米市", " 姪浜 "];
const searchTerms = process.env.BARBER_SHOP_VERIFY_QUERIES
  ? process.env.BARBER_SHOP_VERIFY_QUERIES.split(",").map((term) => term.trim()).filter(Boolean)
  : defaultSearchTerms;

const counts = Object.fromEntries(await Promise.all([
  count("public_total", publicShopQuery(supabase)),
  count("target_prefecture_total", publicShopQuery(supabase).eq("prefecture", verifyPrefecture)),
  count("unverified_total", publicShopQuery(supabase).eq("verification_status", "unverified")),
  count("owner_null_total", publicShopQuery(supabase).is("owner_user_id", null)),
  count("imported_verified_total", publicShopQuery(supabase).eq("source_type", "imported").eq("verification_status", "verified")),
  count("imported_owner_total", publicShopQuery(supabase).eq("source_type", "imported").not("owner_user_id", "is", null)),
]));

console.log("Barber Directory public counts");
for (const [label, value] of Object.entries(counts)) {
  console.log(`- ${label}: ${value.toLocaleString("ja-JP")}`);
}

const { data: municipalities, error: municipalitiesError } = await supabase.rpc("list_barber_shop_municipalities", {
  shop_prefecture: verifyPrefecture,
});

if (municipalitiesError) throw new Error(`municipalities: ${municipalitiesError.message}`);

const municipalityRows = Array.isArray(municipalities) ? municipalities : [];
console.log(`- target_prefecture: ${verifyPrefecture}`);
console.log(`- municipality_options: ${municipalityRows.length.toLocaleString("ja-JP")}`);
const expectedMunicipalities = verifyPrefecture === "東京都"
  ? ["荒川区", "板橋区", "江戸川区", "羽村市", "府中市", "瑞穂町", "八丈町"]
  : ["福岡市", "北九州市", "久留米市"];
for (const city of expectedMunicipalities) {
  const found = municipalityRows.some((row) => row.municipality === city || row.municipality.startsWith(city));
  console.log(`- municipality_has_${city}: ${found ? "yes" : "no"}`);
}

const extraQuery = process.env.BARBER_SHOP_VERIFY_EXTRA_QUERY?.trim();
if (extraQuery) searchTerms.push(extraQuery);

const failedSearches = [];
for (const term of searchTerms) {
  const rows = await search(supabase, term);
  console.log(`- search "${term}": ${rows.length.toLocaleString("ja-JP")} result(s)`);
  for (const row of rows.slice(0, 3)) {
    console.log(`  - ${row.name} / ${row.prefecture}${row.municipality} / ${row.address || "住所未登録"}`);
  }
  if (rows.length === 0) failedSearches.push(term);
}

const errors = [];
if (counts.target_prefecture_total <= 0) errors.push(`${verifyPrefecture}の公開店舗が0件です。`);
if (counts.imported_verified_total !== 0) errors.push("importedかつverifiedの店舗があります。");
if (counts.imported_owner_total !== 0) errors.push("importedかつowner_user_idありの店舗があります。");
if (municipalityRows.length === 0) errors.push(`${verifyPrefecture}の市区町村候補が0件です。`);
if (failedSearches.length > 0) errors.push(`検索結果0件: ${failedSearches.join(", ")}`);

if (errors.length > 0) {
  console.error("Barber Directory verification failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Barber Directory verification passed.");
