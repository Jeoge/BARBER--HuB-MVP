"use server";

import { redirect } from "next/navigation";
import { requireBarberHubAdmin } from "@/lib/admin/permissions";
import { BarberShopSourceError, createBarberShopImportPreviewFromSource, type SourceFormat } from "@/lib/barber-import/source";
import { createBarberShopCsv } from "@/lib/barber-import/csv";
import { getBarberShopImportRowsForExport } from "@/lib/barber-import/importer";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";

function redirectWithParams(params: Record<string, string | number | null | undefined>): never {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") searchParams.set(key, String(value));
  }

  redirect(`/admin/barber-shops/import/source?${searchParams.toString()}`);
  throw new Error("unreachable");
}

function cleanText(value: FormDataEntryValue | null, maxLength = 2048) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function safeErrorMessage(error: unknown) {
  if (error instanceof BarberShopSourceError) {
    return error.message;
  }
  return "公式一覧を取得・解析できませんでした。URLと対応形式を確認してください。";
}

export async function fetchBarberShopSourceAction(formData: FormData) {
  const user = await requireBarberHubAdmin();
  const config = getSupabaseAdminConfigStatus();

  if (!config.ready) redirectWithParams({ error: "Supabase管理用の環境変数が未設定です。" });

  const sourceUrl = cleanText(formData.get("sourceUrl"));
  if (!sourceUrl) redirectWithParams({ error: "公式ページまたは掲載ファイルのURLを入力してください。" });

  let result: Awaited<ReturnType<typeof createBarberShopImportPreviewFromSource>>;
  try {
    result = await createBarberShopImportPreviewFromSource(createSupabaseAdminClient(), sourceUrl, user.id);
  } catch (error) {
    console.error("Barber shop official source preview failed", {
      code: error && typeof error === "object" && "code" in error ? error.code : "unknown",
    });
    redirectWithParams({ error: safeErrorMessage(error) });
  }

  if (!result.batchId) redirectWithParams({ error: result.error ?? "公式一覧を取得・解析できませんでした。" });
  redirectWithParams({ batch: result.batchId, format: result.format as SourceFormat | undefined, fetched: "1" });
}

export async function downloadBarberShopSourceCsvAction(batchId: string) {
  await requireBarberHubAdmin();
  const config = getSupabaseAdminConfigStatus();
  if (!config.ready || !batchId || batchId.length > 80) return { csv: null, fileName: null };

  const rows = await getBarberShopImportRowsForExport(createSupabaseAdminClient(), batchId);
  if (!rows.length) return { csv: null, fileName: null };

  const csv = createBarberShopCsv(rows.map((row) => [
    row.name,
    row.prefecture,
    row.municipality,
    row.address,
    row.phone ?? "",
    row.source ?? "",
    "未認証",
  ]));

  return {
    csv: `\uFEFF${csv}`,
    fileName: `barber-hub-official-source-${batchId.slice(0, 8)}.csv`,
  };
}
