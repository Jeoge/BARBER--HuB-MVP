export const BACKROOM_IMAGE_BUCKET = "backroom-images";
export const BACKROOM_SOURCE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const BACKROOM_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const BACKROOM_IMAGE_MAX_COUNT = 1;

export type BackroomImageParentKind = "threads" | "comments";

export function backroomImageStoragePath(
  kind: BackroomImageParentKind,
  parentId: string,
  extension: "jpg" | "jpeg" | "png" | "webp",
  imageId: string
) {
  return `${kind}/${parentId}/${imageId}.${extension}`;
}

export function isSafeBackroomImageStoragePath(
  path: string | null | undefined,
  kind: BackroomImageParentKind,
  parentId: string
) {
  const value = path?.trim() ?? "";
  const escapedParentId = parentId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${kind}/${escapedParentId}/[0-9a-f-]{36}\\.(?:jpg|jpeg|png|webp)$`, "i").test(value);
}
