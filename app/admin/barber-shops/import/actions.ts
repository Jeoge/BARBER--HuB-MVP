"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBarberHubAdmin } from "@/lib/admin/permissions";
import {
  createBarberShopImportPreview,
  executeBarberShopImportBatch,
} from "@/lib/barber-import/importer";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";

function redirectWithParams(params: Record<string, string | number | null | undefined>): never {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") searchParams.set(key, String(value));
  }

  redirect(`/admin/barber-shops/import?${searchParams.toString()}`);
  throw new Error("unreachable");
}

function cleanText(value: FormDataEntryValue | null, maxLength = 200) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function uploadBarberShopCsvAction(formData: FormData) {
  const user = await requireBarberHubAdmin();
  const config = getSupabaseAdminConfigStatus();

  if (!config.ready) {
    redirectWithParams({ error: "Supabase管理用の環境変数が未設定です。" });
  }

  const file = formData.get("csv");

  if (!(file instanceof File)) {
    redirectWithParams({ error: "CSVファイルを選択してください。" });
  }

  const csvFile = file as File;
  const expectedPrefecture = cleanText(formData.get("expectedPrefecture"), 20);
  let result: Awaited<ReturnType<typeof createBarberShopImportPreview>>;

  try {
    result = await createBarberShopImportPreview(createSupabaseAdminClient(), csvFile, user.id);
  } catch (error) {
    console.error("Barber shop CSV preview failed", {
      message: error instanceof Error ? error.message : String(error || ""),
    });
    redirectWithParams({ error: "CSVプレビューを作成できませんでした。migration適用状況とCSV形式を確認してください。" });
  }

  if (!result.batchId) {
    redirectWithParams({ error: result.error ?? "CSVプレビューを作成できませんでした。", encoding: result.encoding });
  }

  revalidatePath("/admin/barber-shops/import");
  redirectWithParams({ batch: result.batchId, uploaded: "1", encoding: result.encoding, expectedPrefecture });
}

export async function executeBarberShopCsvImportAction(formData: FormData) {
  const user = await requireBarberHubAdmin();
  const config = getSupabaseAdminConfigStatus();

  if (!config.ready) {
    redirectWithParams({ error: "Supabase管理用の環境変数が未設定です。" });
  }

  const batchId = cleanText(formData.get("batchId"), 80);
  const expectedPrefecture = cleanText(formData.get("expectedPrefecture"), 20);
  const includeCandidates = cleanText(formData.get("includeCandidates"), 10) === "yes";

  if (!batchId) {
    redirectWithParams({ error: "取込バッチを確認できませんでした。" });
  }

  const { result, error } = await executeBarberShopImportBatch(
    createSupabaseAdminClient(),
    batchId,
    user.id,
    includeCandidates
  );

  if (error || !result) {
    console.error("Barber shop CSV import execution failed", {
      batchId,
      message: error?.message ?? "missing result",
    });
    redirectWithParams({
      batch: batchId,
      expectedPrefecture,
      error: "CSV取込を実行できませんでした。重複状態とmigration適用状況を確認してください。",
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/barber-shops/import");
  redirectWithParams({
    batch: batchId,
    expectedPrefecture,
    imported: "1",
    inserted: result.inserted_count,
    skipped: result.skipped_count,
    failed: result.failed_count,
  });
}
