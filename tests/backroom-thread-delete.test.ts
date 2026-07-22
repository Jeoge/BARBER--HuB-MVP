import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deletedExactlyOneBackroomPost,
  isMissingBackroomImageTableError,
  listAllBackroomCommentImagePaths,
} from "../lib/backroomThreadDelete.ts";

test("42P01 for backroom_thread_images is treated as a missing image table", () => {
  assert.equal(
    isMissingBackroomImageTableError(
      { code: "42P01", message: 'relation "public.backroom_thread_images" does not exist' },
      "backroom_thread_images"
    ),
    true
  );
});

test("PGRST205 for backroom_comment_images is treated as a missing image table", () => {
  assert.equal(
    isMissingBackroomImageTableError(
      { code: "PGRST205", message: "Could not find the table 'public.backroom_comment_images' in the schema cache" },
      "backroom_comment_images"
    ),
    true
  );
});

test("a missing-table message without a missing-relation code is not ignored", () => {
  for (const code of ["PGRST301", "42501", "57014"]) {
    assert.equal(
      isMissingBackroomImageTableError(
        { code, message: "Could not find the table 'public.backroom_thread_images' in the schema cache" },
        "backroom_thread_images"
      ),
      false
    );
  }
});

test("a missing-relation code for a different table is not ignored", () => {
  assert.equal(
    isMissingBackroomImageTableError(
      { code: "42P01", message: 'relation "public.backroom_posts" does not exist' },
      "backroom_thread_images"
    ),
    false
  );
});

test("a longer table name does not match the protected image table", () => {
  assert.equal(
    isMissingBackroomImageTableError(
      { code: "42P01", message: 'relation "public.backroom_thread_images_archive" does not exist' },
      "backroom_thread_images"
    ),
    false
  );
});

test("zero comments skip the backroom_comment_images query", async () => {
  let queryCount = 0;
  const supabase = {
    from() {
      queryCount += 1;
      throw new Error("backroom_comment_images must not be queried");
    },
  } as unknown as SupabaseClient;

  const result = await listAllBackroomCommentImagePaths(supabase, []);

  assert.deepEqual(result, { rows: [], error: null });
  assert.equal(queryCount, 0);
});

test("DELETE succeeds only when exact count is one", () => {
  assert.equal(deletedExactlyOneBackroomPost(1), true);
  assert.equal(deletedExactlyOneBackroomPost(0), false);
  assert.equal(deletedExactlyOneBackroomPost(2), false);
  assert.equal(deletedExactlyOneBackroomPost(null), false);
});
