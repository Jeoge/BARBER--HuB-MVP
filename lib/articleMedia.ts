export const MAX_ARTICLE_IMAGE_COUNT = 4;
export const ARTICLE_IMAGE_MARKER_PATTERN = /\[\[article-image:([1-4])\]\]/g;
const ANY_ARTICLE_IMAGE_MARKER_PATTERN = /\[\[article-image:([^\]]+)\]\]/g;
const YOUTUBE_URL_MAX_LENGTH = 300;
const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function articleImageMarker(index: number) {
  return `[[article-image:${index + 1}]]`;
}

export function normalizeArticleImageMarkers(body: string, imageCount: number) {
  const maxIndex = Math.min(Math.max(imageCount, 0), MAX_ARTICLE_IMAGE_COUNT);

  return body.replace(ANY_ARTICLE_IMAGE_MARKER_PATTERN, (_match, rawIndex: string) => {
    const index = Number.parseInt(rawIndex, 10);
    return Number.isInteger(index) && index >= 1 && index <= maxIndex ? articleImageMarker(index - 1) : "";
  });
}

export function stripArticleImageMarkers(body: string) {
  return body.replace(ANY_ARTICLE_IMAGE_MARKER_PATTERN, "");
}

export function validArticleImageMarkerIndexes(body: string, imageCount: number) {
  const indexes = new Set<number>();
  const maxIndex = Math.min(Math.max(imageCount, 0), MAX_ARTICLE_IMAGE_COUNT);

  for (const match of body.matchAll(new RegExp(ARTICLE_IMAGE_MARKER_PATTERN.source, "g"))) {
    const index = Number.parseInt(match[1] ?? "", 10);
    if (Number.isInteger(index) && index >= 1 && index <= maxIndex) {
      indexes.add(index - 1);
    }
  }

  return indexes;
}

export function removeArticleImageMarkerReferences(body: string, removedIndex: number) {
  return body.replace(new RegExp(ARTICLE_IMAGE_MARKER_PATTERN.source, "g"), (_match, rawIndex: string) => {
    const index = Number.parseInt(rawIndex, 10) - 1;
    if (!Number.isInteger(index)) return "";
    if (index === removedIndex) return "";
    if (index > removedIndex) return articleImageMarker(index - 1);
    return articleImageMarker(index);
  });
}

export function shouldShowArticleVideoRightsConfirmation(youtubeSupported: boolean, youtubeInput: string) {
  return youtubeSupported && youtubeInput.trim().length > 0;
}

export function shouldRequireArticleVideoRightsConfirmation({
  youtubeSupported,
  youtubeInput,
  normalizedYoutubeUrl,
}: {
  youtubeSupported: boolean;
  youtubeInput: string;
  normalizedYoutubeUrl: string | null;
}) {
  return shouldShowArticleVideoRightsConfirmation(youtubeSupported, youtubeInput) && normalizedYoutubeUrl != null;
}

export function normalizeYoutubeUrl(value: string) {
  const candidate = value.trim();

  if (!candidate) return { url: null, error: null } as const;
  if (candidate.length > YOUTUBE_URL_MAX_LENGTH || /\s/.test(candidate)) {
    return { url: null, error: "YouTube URLは300文字以内のURLを1本だけ入力してください。" } as const;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { url: null, error: "YouTube URLの形式を確認してください。" } as const;
  }

  if (parsed.protocol !== "https:") {
    return { url: null, error: "YouTube URLはhttpsのURLを入力してください。" } as const;
  }

  const hostname = parsed.hostname.toLowerCase();
  let videoId: string | null = null;

  if (hostname === "youtu.be") {
    videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (hostname === "youtube.com" || hostname === "www.youtube.com" || hostname === "m.youtube.com") {
    if (parsed.pathname === "/watch") {
      videoId = parsed.searchParams.get("v");
    } else {
      const [, route, id] = parsed.pathname.split("/");
      if (route === "shorts") {
        videoId = id ?? null;
      }
    }
  } else {
    return { url: null, error: "YouTubeの動画URLだけ設定できます。" } as const;
  }

  const normalizedVideoId = videoId?.trim() ?? "";
  if (!YOUTUBE_VIDEO_ID_PATTERN.test(normalizedVideoId)) {
    return { url: null, error: "YouTube動画IDを確認してください。" } as const;
  }

  return { url: `https://www.youtube.com/watch?v=${normalizedVideoId}`, error: null } as const;
}
