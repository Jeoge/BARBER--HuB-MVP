import "server-only";

import { safeDisplayImageSrc } from "@/lib/imageValidation";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";
import type { ContentAd, ContentAdRecord } from "@/lib/supabase/content-ads";

const CONTENT_AD_IMAGE_BUCKET = "content-ad-images";
const CONTENT_AD_IMAGE_SIGNED_URL_EXPIRES_IN_SECONDS = 30 * 60;

function normalizedStoragePath(path: string | null | undefined) {
  const value = path?.trim();
  return value && value.length > 0 ? value : null;
}

export async function resolveContentAdImageUrl(ad: ContentAdRecord | null): Promise<ContentAd | null> {
  if (ad == null) return null;

  const { image_path: imagePathValue, ...displayAd } = ad;
  const imagePath = normalizedStoragePath(imagePathValue);

  if (imagePath == null) {
    return {
      ...displayAd,
      image_url: safeDisplayImageSrc(ad.image_url),
    };
  }

  const adminStatus = getSupabaseAdminConfigStatus();

  if (!adminStatus.ready) {
    console.error("Content ad signed image URL generation skipped because admin Supabase config is missing", {
      adId: ad.id,
      missingCount: adminStatus.missing.length,
    });

    return {
      ...displayAd,
      image_url: null,
    };
  }

  try {
    const adminSupabase = createSupabaseAdminClient();
    const { data, error } = await adminSupabase.storage
      .from(CONTENT_AD_IMAGE_BUCKET)
      .createSignedUrl(imagePath, CONTENT_AD_IMAGE_SIGNED_URL_EXPIRES_IN_SECONDS);

    if (error || !data?.signedUrl) {
      console.error("Content ad signed image URL generation failed", {
        adId: ad.id,
        message: error?.message ?? "No signed URL returned",
      });

      return {
        ...displayAd,
        image_url: null,
      };
    }

    return {
      ...displayAd,
      image_url: data.signedUrl,
    };
  } catch (error) {
    console.error("Content ad signed image URL generation threw", {
      adId: ad.id,
      message: error instanceof Error ? error.message : String(error || ""),
    });

    return {
      ...displayAd,
      image_url: null,
    };
  }
}
