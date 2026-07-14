const ALLOWED_IMAGE_MIME_TYPES = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type AllowedImageMimeType = keyof typeof ALLOWED_IMAGE_MIME_TYPES;

const EXTENSION_TO_MIME_TYPE: Record<string, AllowedImageMimeType> = {
  avif: "image/avif",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const SNAP_SOURCE_MIME_TYPES = {
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const SNAP_SOURCE_EXTENSION_TO_MIME_TYPE: Record<string, keyof typeof SNAP_SOURCE_MIME_TYPES> = {
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const SNAP_UPLOAD_MIME_TYPES = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

type SnapUploadMimeType = keyof typeof SNAP_UPLOAD_MIME_TYPES;

function extensionFromName(fileName: string) {
  const filePart = fileName.split(/[/\\]/).pop() || "";
  const extension = filePart.includes(".") ? filePart.split(".").pop() : "";

  return extension?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "";
}

export function allowedImageContentType(file: Pick<File, "name" | "type">) {
  const declaredType = file.type.trim().toLowerCase();

  if (declaredType) {
    return declaredType in ALLOWED_IMAGE_MIME_TYPES ? (declaredType as AllowedImageMimeType) : null;
  }

  const extension = extensionFromName(file.name);
  return EXTENSION_TO_MIME_TYPE[extension] ?? null;
}

export function isAllowedImageFile(file: Pick<File, "name" | "type">) {
  return allowedImageContentType(file) != null;
}

export function allowedSnapSourceContentType(file: Pick<File, "name" | "type">) {
  const declaredType = file.type.trim().toLowerCase();

  if (declaredType) {
    return declaredType in SNAP_SOURCE_MIME_TYPES ? (declaredType as keyof typeof SNAP_SOURCE_MIME_TYPES) : null;
  }

  const extension = extensionFromName(file.name);
  return SNAP_SOURCE_EXTENSION_TO_MIME_TYPE[extension] ?? null;
}

export function isAllowedSnapSourceImageFile(file: Pick<File, "name" | "type">) {
  return allowedSnapSourceContentType(file) != null;
}

export function allowedSnapUploadContentType(file: Pick<File, "name" | "type">) {
  const declaredType = file.type.trim().toLowerCase();

  if (declaredType) {
    return declaredType in SNAP_UPLOAD_MIME_TYPES ? (declaredType as SnapUploadMimeType) : null;
  }

  const extension = extensionFromName(file.name);
  const contentType = extension === "jpg" || extension === "jpeg" ? "image/jpeg" : extension === "webp" ? "image/webp" : null;

  return contentType;
}

export function snapUploadFileExtension(contentType: SnapUploadMimeType) {
  return SNAP_UPLOAD_MIME_TYPES[contentType];
}

export function safeUploadFileName(fileName: string, contentType: AllowedImageMimeType, fallbackBase: string) {
  const filePart = fileName.split(/[/\\]/).pop() || "";
  const baseName = filePart.replace(/\.[^.]+$/, "");
  const normalizedBase = baseName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/\.+/g, ".")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .toLowerCase();
  const safeBase = normalizedBase || fallbackBase;
  const extension = ALLOWED_IMAGE_MIME_TYPES[contentType];

  return `${safeBase.slice(0, 72)}.${extension}`.slice(0, 90);
}

export function safeDisplayImageSrc(src: string | null | undefined) {
  const candidate = src?.trim();

  if (!candidate || candidate === "undefined" || candidate === "null") return null;

  if (candidate.startsWith("/") && !candidate.startsWith("//")) {
    return candidate;
  }

  try {
    const url = new URL(candidate);

    if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "blob:") {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}
