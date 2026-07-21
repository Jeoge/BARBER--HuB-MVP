"use server";

import { requireBarberHubAdmin } from "@/lib/admin/permissions";
import {
  analyzeBarberShopSource,
  BarberShopSourceError,
  createBarberShopSourcePreview,
  type BarberShopSourceAnalysis,
  type BarberShopSourcePreview,
  type SourceColumnMapping,
} from "@/lib/barber-import/source";

export type OfficialSourceActionState = {
  analysis: BarberShopSourceAnalysis | null;
  preview: BarberShopSourcePreview | null;
  error: string | null;
};

export const initialOfficialSourceActionState: OfficialSourceActionState = {
  analysis: null,
  preview: null,
  error: null,
};

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

function safeDiagnosticUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "invalid-url";
  }
}

function mappingValue(value: FormDataEntryValue | null): number | null {
  const text = cleanText(value, 12);
  if (!text) return null;
  const parsed = Number.parseInt(text, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

export async function fetchBarberShopSourceAction(
  previousState: OfficialSourceActionState,
  formData: FormData
): Promise<OfficialSourceActionState> {
  await requireBarberHubAdmin();
  const sourceUrl = cleanText(formData.get("sourceUrl"));
  if (!sourceUrl) return { analysis: null, preview: null, error: "公式ページまたは掲載ファイルのURLを入力してください。" };
  const isCreate = cleanText(formData.get("mode"), 20) === "create";

  try {
    if (isCreate) {
      const mapping: SourceColumnMapping = {
        name: mappingValue(formData.get("nameColumn")),
        address: mappingValue(formData.get("addressColumn")),
        phone: mappingValue(formData.get("phoneColumn")),
      };

      return {
        analysis: previousState.analysis,
        preview: await createBarberShopSourcePreview({
          sourceUrl,
          prefecture: cleanText(formData.get("prefecture"), 20),
          municipality: cleanText(formData.get("municipality"), 80),
          sourceName: cleanText(formData.get("sourceName"), 240),
          mapping,
        }),
        error: null,
      };
    }

    return {
      analysis: await analyzeBarberShopSource({
        sourceUrl,
        prefecture: cleanText(formData.get("prefecture"), 20),
        municipality: cleanText(formData.get("municipality"), 80),
        sourceName: cleanText(formData.get("sourceName"), 240),
      }),
      preview: null,
      error: null,
    };
  } catch (error) {
    console.error("Barber shop official source preview failed", {
      code: error && typeof error === "object" && "code" in error ? error.code : "unknown",
      sourceUrl: safeDiagnosticUrl(sourceUrl),
    });
    return { analysis: isCreate ? previousState.analysis : null, preview: null, error: safeErrorMessage(error) };
  }
}
