export const PROFILE_IMAGE_BUCKET = "profile-images";

const PROFILE_IMAGE_PUBLIC_PATH_PREFIX = `/storage/v1/object/public/${PROFILE_IMAGE_BUCKET}/`;

function safeSupabaseOrigin(supabaseUrl: string | undefined) {
  if (!supabaseUrl) return null;

  try {
    const url = new URL(supabaseUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

function hasSafeObjectPathSegments(objectPath: string) {
  if (!objectPath || objectPath.includes("\\") || objectPath.includes("\0")) return false;

  const segments = objectPath.split("/");
  return segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}

/**
 * Extracts a Storage object path only from BARBER HUB's configured public URL.
 * Returning null is intentional for external, malformed, legacy, or unsafe URLs.
 */
export function profileImageObjectPathFromPublicUrl(publicUrl: string | null | undefined, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if (!publicUrl || typeof publicUrl !== "string") return null;

  try {
    const rawPath = publicUrl.match(/^[a-z][a-z\d+.-]*:\/\/[^/]*(\/[^?#]*)?/i)?.[1] ?? "";
    if (/(^|\/)(?:\.|\.\.|%2e|%2e%2e)(?:\/|$)/i.test(rawPath)) return null;

    const url = new URL(publicUrl);
    const expectedOrigin = safeSupabaseOrigin(supabaseUrl);
    if (!expectedOrigin || url.origin !== expectedOrigin) return null;
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.pathname.startsWith(PROFILE_IMAGE_PUBLIC_PATH_PREFIX)) return null;

    const encodedObjectPath = url.pathname.slice(PROFILE_IMAGE_PUBLIC_PATH_PREFIX.length);
    if (!encodedObjectPath) return null;

    const objectPath = decodeURIComponent(encodedObjectPath);
    return hasSafeObjectPathSegments(objectPath) ? objectPath : null;
  } catch {
    return null;
  }
}

export function isOwnedProfileImagePath(objectPath: string | null | undefined, userId: string) {
  if (!objectPath || !userId || userId.includes("/") || userId.includes("\\")) return false;
  if (!hasSafeObjectPathSegments(objectPath)) return false;

  return objectPath.startsWith(`${userId}/`) && objectPath.slice(userId.length + 1).length > 0;
}

export function submittedProfileImage(value: FormDataEntryValue | null) {
  if (typeof File === "undefined" || !(value instanceof File) || value.size <= 0) return null;
  return value;
}

export type ProfileImageIntent =
  | { kind: "keep"; file: null }
  | { kind: "remove"; file: null }
  | { kind: "replace"; file: File };

export function resolveProfileImageIntent({
  libraryValue,
  cameraValue,
  remove,
}: {
  libraryValue: FormDataEntryValue | null;
  cameraValue: FormDataEntryValue | null;
  remove: boolean;
}) {
  const candidates = [submittedProfileImage(libraryValue), submittedProfileImage(cameraValue)].filter(
    (file): file is File => file !== null
  );

  if (candidates.length > 1) {
    return {
      intent: null,
      error: "写真の選択状態が競合しています。1枚だけ選び直してから保存してください。",
    } as const;
  }

  if (candidates.length === 1 && remove) {
    return {
      intent: null,
      error: "写真の選択と削除指定が同時に届きました。選び直してから保存してください。",
    } as const;
  }

  if (candidates.length === 1) return { intent: { kind: "replace", file: candidates[0] } satisfies ProfileImageIntent, error: null } as const;
  if (remove) return { intent: { kind: "remove", file: null } satisfies ProfileImageIntent, error: null } as const;
  return { intent: { kind: "keep", file: null } satisfies ProfileImageIntent, error: null } as const;
}
