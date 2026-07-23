import assert from "node:assert/strict";
import test from "node:test";
import {
  isOwnedProfileImagePath,
  profileImageObjectPathFromPublicUrl,
  resolveProfileImageIntent,
  submittedProfileImage,
} from "../lib/profileImages.ts";

const SUPABASE_URL = "https://barber-hub.example.supabase.co";
const USER_ID = "11111111-1111-1111-1111-111111111111";

function imageFile(name = "avatar.jpg", contents = "image") {
  return new File([contents], name, { type: "image/jpeg" });
}

test("profile public URL is converted only for the configured profile-images bucket", () => {
  assert.equal(
    profileImageObjectPathFromPublicUrl(
      `${SUPABASE_URL}/storage/v1/object/public/profile-images/${USER_ID}/avatar-1.jpg`,
      SUPABASE_URL
    ),
    `${USER_ID}/avatar-1.jpg`
  );
  assert.equal(
    profileImageObjectPathFromPublicUrl(
      `${SUPABASE_URL}/storage/v1/object/public/profile-images/${USER_ID}/avatar%20one.jpg?cache=1`,
      SUPABASE_URL
    ),
    `${USER_ID}/avatar one.jpg`
  );
});

test("external URLs, other buckets, and malformed paths cannot become cleanup paths", () => {
  assert.equal(profileImageObjectPathFromPublicUrl(`https://other.example/${USER_ID}/avatar.jpg`, SUPABASE_URL), null);
  assert.equal(
    profileImageObjectPathFromPublicUrl(`${SUPABASE_URL}/storage/v1/object/public/other-bucket/${USER_ID}/avatar.jpg`, SUPABASE_URL),
    null
  );
  assert.equal(
    profileImageObjectPathFromPublicUrl(`${SUPABASE_URL}/storage/v1/object/public/profile-images/${USER_ID}/%E0%A4%A`, SUPABASE_URL),
    null
  );
  assert.equal(
    profileImageObjectPathFromPublicUrl(`${SUPABASE_URL}/storage/v1/object/public/profile-images/${USER_ID}/../other.jpg`, SUPABASE_URL),
    null
  );
});

test("only a non-empty object inside the authenticated user's folder is owned", () => {
  assert.equal(isOwnedProfileImagePath(`${USER_ID}/avatar.jpg`, USER_ID), true);
  assert.equal(isOwnedProfileImagePath(`${USER_ID}/nested/cover.jpg`, USER_ID), true);
  assert.equal(isOwnedProfileImagePath(`${USER_ID}/../other-user/avatar.jpg`, USER_ID), false);
  assert.equal(isOwnedProfileImagePath(`${USER_ID}/`, USER_ID), false);
  assert.equal(isOwnedProfileImagePath(`22222222-2222-2222-2222-222222222222/avatar.jpg`, USER_ID), false);
});

test("zero-byte files are ignored and a non-empty image is a candidate", () => {
  assert.equal(submittedProfileImage(new File([], "empty.jpg", { type: "image/jpeg" })), null);
  const file = imageFile();
  assert.equal(submittedProfileImage(file), file);
});

test("library and camera candidates cannot be submitted together", () => {
  const libraryFile = imageFile("library.jpg");
  const cameraFile = imageFile("camera.jpg");
  const result = resolveProfileImageIntent({ libraryValue: libraryFile, cameraValue: cameraFile, remove: false });

  assert.equal(result.intent, null);
  assert.match(result.error ?? "", /競合/);
});

test("a removal flag cannot be combined with a selected image", () => {
  const result = resolveProfileImageIntent({ libraryValue: imageFile(), cameraValue: null, remove: true });

  assert.equal(result.intent, null);
  assert.match(result.error ?? "", /削除指定/);
});

test("image intent distinguishes keep, remove, and replace", () => {
  assert.equal(resolveProfileImageIntent({ libraryValue: null, cameraValue: null, remove: false }).intent?.kind, "keep");
  assert.equal(resolveProfileImageIntent({ libraryValue: null, cameraValue: null, remove: true }).intent?.kind, "remove");
  assert.equal(resolveProfileImageIntent({ libraryValue: imageFile(), cameraValue: null, remove: false }).intent?.kind, "replace");
});
