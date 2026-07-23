import assert from "node:assert/strict";
import test from "node:test";
import { nextBackroomImageSourceAfterError, resolveBackroomImageSources } from "../lib/imageValidation.ts";

test("Back Room image display prefers a valid thumbnail", () => {
  const sources = resolveBackroomImageSources("https://example.com/thumb.webp", "https://example.com/full.webp");

  assert.deepEqual(sources, {
    displaySrc: "https://example.com/thumb.webp",
    fallbackSrc: "https://example.com/full.webp",
  });
});

test("Back Room image display falls back when the thumbnail URL is empty or invalid", () => {
  assert.equal(resolveBackroomImageSources(null, "https://example.com/full.webp").displaySrc, "https://example.com/full.webp");
  assert.equal(resolveBackroomImageSources("javascript:alert(1)", "https://example.com/full.webp").displaySrc, "https://example.com/full.webp");
  assert.equal(resolveBackroomImageSources("https://example.com/thumb.webp", null).fallbackSrc, null);
});

test("Back Room image read failure switches to the compressed image once", () => {
  const fallback = nextBackroomImageSourceAfterError(
    "https://example.com/thumb.webp",
    "https://example.com/full.webp",
    false
  );

  assert.deepEqual(fallback, {
    src: "https://example.com/full.webp",
    fallbackAttempted: true,
    exhausted: false,
  });

  const exhausted = nextBackroomImageSourceAfterError(fallback.src, "https://example.com/full.webp", fallback.fallbackAttempted);
  assert.deepEqual(exhausted, {
    src: null,
    fallbackAttempted: true,
    exhausted: true,
  });
});

test("Back Room image fallback does not loop when both sources fail or are identical", () => {
  assert.equal(nextBackroomImageSourceAfterError("https://example.com/full.webp", "https://example.com/full.webp", false).src, null);
  assert.equal(nextBackroomImageSourceAfterError(null, "https://example.com/full.webp", true).src, null);
});
