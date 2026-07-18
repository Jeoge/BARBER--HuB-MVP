import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAccountTypeLabel } from "@/lib/accountTypes";
import type { BarberShop, BarberShopClaim } from "@/lib/supabase/barber-shops";

type PendingClaimRow = BarberShopClaim & {
  review_note: string | null;
};

type ClaimShopRow = Pick<
  BarberShop,
  "id" | "name" | "prefecture" | "municipality" | "address" | "phone" | "source" | "verification_status" | "owner_user_id"
>;

type ClaimProfileRow = {
  id: string;
  display_name: string | null;
  job_type: string | null;
};

export type AdminBarberShopClaim = {
  id: string;
  shopId: string;
  applicantUserId: string;
  createdAt: string | null;
  status: PendingClaimRow["status"];
  relationText: string | null;
  message: string | null;
  reviewNote: string | null;
  shop: ClaimShopRow | null;
  applicantDisplayName: string;
  applicantEmail: string;
  applicantJobTypeLabel: string;
};

const pendingClaimSelect = `
  id,
  shop_id,
  user_id,
  status,
  relation_text,
  message,
  review_note,
  created_at,
  updated_at
`;

const claimShopSelect = `
  id,
  name,
  prefecture,
  municipality,
  address,
  phone,
  source,
  verification_status,
  owner_user_id
`;

function fallbackDisplayName(userId: string) {
  return `プロフィール未設定 (${userId.slice(0, 8)})`;
}

async function listApplicantEmails(adminSupabase: SupabaseClient, userIds: string[]) {
  const entries = await Promise.all(
    userIds.map(async (userId) => {
      const { data, error } = await adminSupabase.auth.admin.getUserById(userId);
      return [userId, error ? null : (data.user?.email ?? null)] as const;
    })
  );

  return new Map(entries);
}

export async function listPendingBarberShopClaimsForAdmin(adminSupabase: SupabaseClient) {
  const { data: claimRows, error: claimsError } = await adminSupabase
    .from("barber_shop_claims")
    .select(pendingClaimSelect)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<PendingClaimRow[]>();

  const claims = claimRows ?? [];

  if (claimsError || claims.length === 0) {
    return {
      claims: [] as AdminBarberShopClaim[],
      error: claimsError,
    };
  }

  const shopIds = Array.from(new Set(claims.map((claim) => claim.shop_id)));
  const userIds = Array.from(new Set(claims.map((claim) => claim.user_id)));

  const [shopsResult, profilesResult, emailByUserId] = await Promise.all([
    adminSupabase.from("barber_shops").select(claimShopSelect).in("id", shopIds).returns<ClaimShopRow[]>(),
    adminSupabase.from("profiles").select("id, display_name, job_type").in("id", userIds).returns<ClaimProfileRow[]>(),
    listApplicantEmails(adminSupabase, userIds),
  ]);

  if (shopsResult.error || profilesResult.error) {
    return {
      claims: [] as AdminBarberShopClaim[],
      error: shopsResult.error ?? profilesResult.error,
    };
  }

  const shopById = new Map((shopsResult.data ?? []).map((shop) => [shop.id, shop]));
  const profileById = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));

  return {
    claims: claims.map((claim) => {
      const profile = profileById.get(claim.user_id) ?? null;

      return {
        id: claim.id,
        shopId: claim.shop_id,
        applicantUserId: claim.user_id,
        createdAt: claim.created_at,
        status: claim.status,
        relationText: claim.relation_text,
        message: claim.message,
        reviewNote: claim.review_note,
        shop: shopById.get(claim.shop_id) ?? null,
        applicantDisplayName: profile?.display_name?.trim() || fallbackDisplayName(claim.user_id),
        applicantEmail: emailByUserId.get(claim.user_id) ?? "メール未取得",
        applicantJobTypeLabel: getAccountTypeLabel(profile?.job_type ?? null),
      };
    }),
    error: null,
  };
}
