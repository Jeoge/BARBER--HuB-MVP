import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const PARTNER_INQUIRY_STATUSES = ["new", "in_progress", "replied", "closed", "spam"] as const;
export type PartnerInquiryStatus = (typeof PARTNER_INQUIRY_STATUSES)[number];

export type PartnerInquiryListItem = {
  id: string;
  created_at: string;
  contact_name: string;
  organization_name: string | null;
  inquiry_type: string | null;
  status: PartnerInquiryStatus;
  email: string;
  message: string;
};

export type PartnerInquiry = PartnerInquiryListItem & {
  phone: string | null;
  website_url: string | null;
  admin_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user_id: string | null;
  source_page: string;
};

const LIST_SELECT = "id,created_at,contact_name,organization_name,inquiry_type,status,email,message";
const DETAIL_SELECT = `${LIST_SELECT},phone,website_url,admin_note,reviewed_at,reviewed_by,user_id,source_page`;

export async function listPartnerInquiriesForAdmin(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("partner_inquiries")
    .select(LIST_SELECT)
    .order("created_at", { ascending: false })
    .limit(200);

  return {
    inquiries: (data ?? []) as PartnerInquiryListItem[],
    error: error ? { code: error.code ?? "unknown" } : null,
  };
}

export async function getPartnerInquiryForAdmin(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase.from("partner_inquiries").select(DETAIL_SELECT).eq("id", id).maybeSingle();

  return {
    inquiry: (data ?? null) as PartnerInquiry | null,
    error: error ? { code: error.code ?? "unknown" } : null,
  };
}
