import { requireBarberHubAdmin } from "@/lib/admin/permissions";
import { getBarberShopImportPreview } from "@/lib/barber-import/importer";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";
import { OfficialSourceScreen } from "../source-screen";

export const dynamic = "force-dynamic";

type OfficialSourcePageProps = {
  searchParams: Promise<{
    batch?: string;
    format?: string;
    fetched?: string;
    error?: string;
  }>;
};

export default async function OfficialSourcePage({ searchParams }: OfficialSourcePageProps) {
  await requireBarberHubAdmin();
  const params = await searchParams;
  const config = getSupabaseAdminConfigStatus();

  if (!config.ready) {
    return <OfficialSourceScreen preview={null} error="Supabase管理用の環境変数が未設定です。" />;
  }

  const preview = params.batch ? await getBarberShopImportPreview(createSupabaseAdminClient(), params.batch) : null;
  const error = params.error ?? (params.batch && !preview ? "取得結果を確認できませんでした。" : undefined);
  return <OfficialSourceScreen preview={preview} format={params.format} error={error} />;
}
