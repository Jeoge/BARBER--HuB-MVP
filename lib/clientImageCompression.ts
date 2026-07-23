export type CompressedClientImage = {
  id: string;
  sourceFile: File;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  byteSize: number;
  mimeType: string;
};

export type ClientImageCompressionOptions = {
  index?: number;
  totalCount?: number;
  fileNamePrefix?: string;
  targetBytes?: number;
  hardBytes?: number;
  longEdgeSteps?: readonly number[];
  preserveAlpha?: boolean;
};

type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
};

const DEFAULT_LONG_EDGE_STEPS = [1600, 1400, 1200, 1000, 800] as const;
const DEFAULT_TARGET_BYTES = 900 * 1024;
const DEFAULT_HARD_BYTES = 2 * 1024 * 1024;
const QUALITIES = [0.84, 0.76, 0.68, 0.6, 0.52, 0.44] as const;

export function makeClientImageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isHeicLikeImage(file: File) {
  return file.type === "image/heic" || file.type === "image/heif" || /\.(heic|heif)$/i.test(file.name);
}

export function fileSizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export async function waitForPaint() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: "image/webp" | "image/jpeg" | "image/png", quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function loadImageSource(file: File): Promise<LoadedImage> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Fall back to HTMLImageElement decoding below.
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.decoding = "async";
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("decode failed"));
    };
    image.src = objectUrl;
  });
}

function makeCompressedFile(blob: Blob, index: number, prefix: string) {
  const extension = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";

  return new File([blob], `${prefix}-${index + 1}.${extension}`, {
    type: blob.type,
    lastModified: Date.now(),
  });
}

function compressedImage(
  sourceFile: File,
  blob: Blob,
  width: number,
  height: number,
  index: number,
  prefix: string
): CompressedClientImage {
  return {
    id: makeClientImageId(),
    sourceFile,
    file: makeCompressedFile(blob, index, prefix),
    previewUrl: URL.createObjectURL(blob),
    width,
    height,
    byteSize: blob.size,
    mimeType: blob.type,
  };
}

export async function compressClientImage(
  file: File,
  {
    index = 0,
    totalCount = 1,
    fileNamePrefix = "image",
    targetBytes = DEFAULT_TARGET_BYTES,
    hardBytes = DEFAULT_HARD_BYTES,
    longEdgeSteps = DEFAULT_LONG_EDGE_STEPS,
    preserveAlpha = false,
  }: ClientImageCompressionOptions = {}
): Promise<CompressedClientImage> {
  const decoded = await loadImageSource(file);

  try {
    if (decoded.width <= 0 || decoded.height <= 0) {
      throw new Error("invalid dimensions");
    }

    const sourceLongEdge = Math.max(decoded.width, decoded.height);
    const initialLongEdge = Math.min(sourceLongEdge, longEdgeSteps[0] ?? sourceLongEdge);
    const targetLongEdges = [
      initialLongEdge,
      ...longEdgeSteps.slice(1).filter((longEdge) => longEdge < initialLongEdge),
    ];
    const perImageTargetBytes = Math.min(targetBytes, Math.floor(hardBytes / Math.max(totalCount, 1)));
    const perImageHardBytes = Math.floor(hardBytes / Math.max(totalCount, 1));
    let best: { blob: Blob; width: number; height: number } | null = null;
    let webpSupported = false;

    for (const targetLongEdge of targetLongEdges) {
      const scale = targetLongEdge / sourceLongEdge;
      const width = Math.max(1, Math.round(decoded.width * scale));
      const height = Math.max(1, Math.round(decoded.height * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { alpha: preserveAlpha });

      if (context == null) {
        throw new Error("canvas unavailable");
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(decoded.source, 0, 0, width, height);

      for (const quality of QUALITIES) {
        const webp = await canvasToBlob(canvas, "image/webp", quality);

        if (webp?.type === "image/webp") {
          webpSupported = true;

          if (best == null || webp.size < best.blob.size) {
            best = { blob: webp, width, height };
          }

          if (webp.size <= perImageTargetBytes) {
            return compressedImage(file, webp, width, height, index, fileNamePrefix);
          }
        }
      }

      if (!preserveAlpha && (!webpSupported || (best != null && best.blob.size > perImageHardBytes))) {
        for (const quality of QUALITIES) {
          const jpeg = await canvasToBlob(canvas, "image/jpeg", quality);

          if (jpeg?.type === "image/jpeg") {
            if (best == null || jpeg.size < best.blob.size) {
              best = { blob: jpeg, width, height };
            }

            if (jpeg.size <= perImageTargetBytes) {
              return compressedImage(file, jpeg, width, height, index, fileNamePrefix);
            }
          }
        }
      } else if (preserveAlpha && !webpSupported) {
        const png = await canvasToBlob(canvas, "image/png", 1);

        if (png?.type === "image/png" && (best == null || png.size < best.blob.size)) {
          best = { blob: png, width, height };
        }

        if (png?.type === "image/png" && png.size <= perImageTargetBytes) {
          return compressedImage(file, png, width, height, index, fileNamePrefix);
        }
      }
    }

    if (best != null && best.blob.size <= perImageHardBytes) {
      return compressedImage(file, best.blob, best.width, best.height, index, fileNamePrefix);
    }
  } finally {
    decoded.close?.();
  }

  throw new Error("compression failed");
}
