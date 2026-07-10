import type { SupabaseClient } from "@supabase/supabase-js";

export type BarberShopVerificationStatus = "unclaimed" | "pending" | "verified" | "rejected" | "suspended";

export type BarberShop = {
  id: string;
  name: string;
  normalized_name: string;
  prefecture: string;
  municipality: string;
  address: string;
  postal_code: string | null;
  status: string;
  verification_status: BarberShopVerificationStatus;
  owner_user_id: string | null;
  created_by: string | null;
  source_type: string;
  is_public: boolean;
  is_deleted: boolean;
  is_duplicate: boolean;
  duplicate_of: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type BarberShopClaim = {
  id: string;
  shop_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "canceled";
  relation_text: string | null;
  message: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type BarberShopMunicipality = {
  municipality: string;
  shop_count: number;
};

export const BARBER_SHOP_PAGE_SIZE = 20;

export const barberShopSelect = `
  id,
  name,
  normalized_name,
  prefecture,
  municipality,
  address,
  postal_code,
  status,
  verification_status,
  owner_user_id,
  created_by,
  source_type,
  is_public,
  is_deleted,
  is_duplicate,
  duplicate_of,
  created_at,
  updated_at
`;

export function normalizeShopSearchText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

export function shopAreaLabel(shop: Pick<BarberShop, "prefecture" | "municipality">) {
  return [shop.prefecture, shop.municipality].filter(Boolean).join("");
}

export function shopAddressLabel(shop: Pick<BarberShop, "prefecture" | "municipality" | "address">) {
  const area = shopAreaLabel(shop);
  if (!shop.address || shop.address === area) return area;
  return shop.address;
}

export function shopVerificationLabel(status: BarberShopVerificationStatus | string | null | undefined) {
  if (status === "verified") return "認証済み";
  if (status === "pending") return "認証申請中";
  if (status === "rejected") return "未認証店舗";
  if (status === "suspended") return "停止中";
  return "未認証店舗";
}

function publicShopQuery(supabase: SupabaseClient) {
  return supabase
    .from("barber_shops")
    .select(barberShopSelect)
    .eq("is_public", true)
    .eq("is_deleted", false)
    .eq("is_duplicate", false)
    .eq("status", "public")
    .neq("verification_status", "suspended");
}

export async function getPublicBarberShopCount(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("get_public_barber_shop_count");

  return {
    count: typeof data === "number" ? data : null,
    error,
  };
}

export async function getPublicBarberShop(supabase: SupabaseClient, id: string) {
  const { data, error } = await publicShopQuery(supabase)
    .eq("id", id)
    .maybeSingle<BarberShop>();

  return {
    shop: data,
    error,
  };
}

export async function listOwnedVerifiedBarberShops(supabase: SupabaseClient, userId: string, limit = 20) {
  const { data, error } = await supabase
    .from("barber_shops")
    .select(barberShopSelect)
    .eq("owner_user_id", userId)
    .eq("verification_status", "verified")
    .eq("is_deleted", false)
    .eq("is_duplicate", false)
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<BarberShop[]>();

  return {
    shops: data ?? [],
    error,
  };
}

export async function getOwnedVerifiedBarberShop(supabase: SupabaseClient, userId: string, id: string) {
  const { data, error } = await supabase
    .from("barber_shops")
    .select(barberShopSelect)
    .eq("id", id)
    .eq("owner_user_id", userId)
    .eq("verification_status", "verified")
    .eq("is_deleted", false)
    .eq("is_duplicate", false)
    .maybeSingle<BarberShop>();

  return {
    shop: data,
    error,
  };
}

export async function getMyBarberShopClaim(supabase: SupabaseClient, userId: string, shopId: string) {
  const { data, error } = await supabase
    .from("barber_shop_claims")
    .select("id, shop_id, user_id, status, relation_text, message, created_at, updated_at")
    .eq("shop_id", shopId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<BarberShopClaim>();

  return {
    claim: data,
    error,
  };
}

export async function listBarberShopMunicipalities(supabase: SupabaseClient, prefecture: string) {
  const { data, error } = await supabase
    .rpc("list_barber_shop_municipalities", { shop_prefecture: prefecture })
    .returns<BarberShopMunicipality[]>();

  return {
    municipalities: Array.isArray(data) ? data : [],
    error,
  };
}
