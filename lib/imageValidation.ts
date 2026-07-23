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

export type SnapUploadMimeType = keyof typeof SNAP_UPLOAD_MIME_TYPES;

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

export function allowedBackroomUploadContentType(file: Pick<File, "name" | "type">) {
  const declaredType = file.type.trim().toLowerCase();

  if (declaredType) {
    return declaredType in BACKROOM_UPLOAD_MIME_TYPES ? (declaredType as BackroomUploadMimeType) : null;
  }

  const extension = extensionFromName(file.name);
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg" as const;
  if (extension === "png") return "image/png" as const;
  if (extension === "webp") return "image/webp" as const;
  return null;
}

export function backroomUploadFileExtension(contentType: BackroomUploadMimeType) {
  return BACKROOM_UPLOAD_MIME_TYPES[contentType];
}

function startsWithBytes(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export function hasExpectedBackroomImageSignature(bytes: Uint8Array, contentType: BackroomUploadMimeType) {
  if (contentType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/png") return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return bytes.length >= 16 && asciiBytes(bytes, 0, 4) === "RIFF" && asciiBytes(bytes, 8, 12) === "WEBP";
}

function asciiBytes(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

function readUint24LittleEndian(bytes: Uint8Array, offset: number) {
  return bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16);
}

function jpegDimensions(bytes: Uint8Array) {
  let offset = 2;

  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > bytes.length) break;

    const segmentLength = (bytes[offset] << 8) + bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break;

    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isStartOfFrame && segmentLength >= 7) {
      const height = (bytes[offset + 3] << 8) + bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) + bytes[offset + 6];
      return width > 0 && height > 0 ? { width, height } : null;
    }

    offset += segmentLength;
  }

  return null;
}

function webpDimensions(bytes: Uint8Array) {
  if (bytes.length < 30) return null;
  const chunkType = asciiBytes(bytes, 12, 16);

  if (chunkType === "VP8X") {
    return {
      width: readUint24LittleEndian(bytes, 24) + 1,
      height: readUint24LittleEndian(bytes, 27) + 1,
    };
  }

  if (chunkType === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  if (chunkType === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return {
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
    };
  }

  return null;
}

function pngDimensions(bytes: Uint8Array) {
  if (bytes.length < 24) return null;
  const width = bytes[16] * 0x1000000 + (bytes[17] << 16) + (bytes[18] << 8) + bytes[19];
  const height = bytes[20] * 0x1000000 + (bytes[21] << 16) + (bytes[22] << 8) + bytes[23];
  return width > 0 && height > 0 ? { width, height } : null;
}

export function backroomImageDimensions(bytes: Uint8Array, contentType: BackroomUploadMimeType) {
  if (contentType === "image/jpeg") return jpegDimensions(bytes);
  if (contentType === "image/png") return pngDimensions(bytes);
  return webpDimensions(bytes);
}

export const allowedCompressedUploadContentType = allowedSnapUploadContentType;
export const compressedUploadFileExtension = snapUploadFileExtension;
export type CompressedUploadMimeType = SnapUploadMimeType;

const BACKROOM_UPLOAD_MIME_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type BackroomUploadMimeType = keyof typeof BACKROOM_UPLOAD_MIME_TYPES;

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

export type BackroomImageSourceState = {
  displaySrc: string | null;
  fallbackSrc: string | null;
};

export function resolveBackroomImageSources(
  thumbnailSrc: string | null | undefined,
  fallbackSrc: string | null | undefined
): BackroomImageSourceState {
  const safeThumbnailSrc = safeDisplayImageSrc(thumbnailSrc);
  const safeFallbackSrc = safeDisplayImageSrc(fallbackSrc);

  return {
    displaySrc: safeThumbnailSrc ?? safeFallbackSrc,
    fallbackSrc: safeFallbackSrc,
  };
}

export function nextBackroomImageSourceAfterError(
  currentSrc: string | null | undefined,
  fallbackSrc: string | null | undefined,
  fallbackAttempted: boolean
) {
  const safeFallbackSrc = safeDisplayImageSrc(fallbackSrc);

  if (!fallbackAttempted && safeFallbackSrc && currentSrc !== safeFallbackSrc) {
    return {
      src: safeFallbackSrc,
      fallbackAttempted: true,
      exhausted: false,
    } as const;
  }

  return {
    src: null,
    fallbackAttempted: true,
    exhausted: true,
  } as const;
}
