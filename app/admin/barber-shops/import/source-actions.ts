"use server";

import { requireBarberHubAdmin } from "@/lib/admin/permissions";
import { BarberShopSourceError, createBarberShopSourcePreview, type BarberShopSourcePreview } from "@/lib/barber-import/source";

export type OfficialSourceActionState = {
  preview: BarberShopSourcePreview | null;
  error: string | null;
};

export const initialOfficialSourceActionState: OfficialSourceActionState = {
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

export async function fetchBarberShopSourceAction(
  _previousState: OfficialSourceActionState,
  formData: FormData
): Promise<OfficialSourceActionState> {
  await requireBarberHubAdmin();
  const sourceUrl = cleanText(formData.get("sourceUrl"));
  if (!sourceUrl) return { preview: null, error: "公式ページまたは掲載ファイルのURLを入力してください。" };

  try {
    return { preview: await createBarberShopSourcePreview(sourceUrl), error: null };
  } catch (error) {
    console.error("Barber shop official source preview failed", {
      code: error && typeof error === "object" && "code" in error ? error.code : "unknown",
    });
    return { preview: null, error: safeErrorMessage(error) };
  }
}
