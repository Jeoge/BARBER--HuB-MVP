import assert from "node:assert/strict";
import test from "node:test";
import {
  BACKROOM_IMAGE_MAX_BYTES,
  BACKROOM_SOURCE_IMAGE_MAX_BYTES,
  backroomImageStoragePath,
  isSafeBackroomImageStoragePath,
} from "../lib/backroomImages.ts";
import { allowedBackroomUploadContentType, hasExpectedBackroomImageSignature } from "../lib/imageValidation.ts";

test("Back Room source images are limited to 10MB and compressed uploads to 2MB", () => {
  assert.equal(BACKROOM_SOURCE_IMAGE_MAX_BYTES, 10 * 1024 * 1024);
  assert.equal(BACKROOM_IMAGE_MAX_BYTES, 2 * 1024 * 1024);
});

test("Back Room upload validation does not trust a filename extension", () => {
  assert.equal(allowedBackroomUploadContentType({ name: "photo.jpg", type: "text/html" }), null);
  assert.equal(hasExpectedBackroomImageSignature(new TextEncoder().encode("<html>"), "image/jpeg"), false);
});

test("Back Room image paths stay inside their parent folder", () => {
  const path = backroomImageStoragePath("threads", "11111111-1111-4111-8111-111111111111", "webp", "22222222-2222-4222-8222-222222222222");

  assert.equal(isSafeBackroomImageStoragePath(path, "threads", "11111111-1111-4111-8111-111111111111"), true);
  assert.equal(isSafeBackroomImageStoragePath(path, "threads", "33333333-3333-4333-8333-333333333333"), false);
});
