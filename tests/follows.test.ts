import assert from "node:assert/strict";
import test from "node:test";
import { listFollowerProfiles } from "../lib/supabase/follows.ts";

type QueryResult = { data: unknown[] | null; error: { message: string } | null };

function queryBuilder(result: QueryResult, calls: string[]) {
  const builder = {
    select(columns: string) {
      calls.push(`select:${columns}`);
      return builder;
    },
    eq(column: string, value: string) {
      calls.push(`eq:${column}:${value}`);
      return builder;
    },
    order(column: string, options: { ascending: boolean }) {
      calls.push(`order:${column}:${options.ascending}`);
      return builder;
    },
    in(column: string, values: string[]) {
      calls.push(`in:${column}:${values.join(",")}`);
      return builder;
    },
    then<TResult1 = QueryResult, TResult2 = never>(
      onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };

  return builder;
}

test("follower profiles query the inverse relation and preserve follow order", async () => {
  const calls: string[] = [];
  const supabase = {
    from(table: string) {
      if (table === "follows") {
        return queryBuilder(
          {
            data: [{ follower_id: "new-follower" }, { follower_id: "old-follower" }],
            error: null,
          },
          calls
        );
      }

      return queryBuilder(
        {
          data: [{ id: "old-follower", display_name: "Old", job_type: null, salon_name: null, region: "福岡" }],
          error: null,
        },
        calls
      );
    },
  };

  const result = await listFollowerProfiles(supabase as never, "me");

  assert.deepEqual(result.error, null);
  assert.deepEqual(
    result.profiles.map((profile) => ({ id: profile.id, name: profile.display_name, region: profile.region })),
    [
      { id: "new-follower", name: null, region: null },
      { id: "old-follower", name: "Old", region: "福岡" },
    ]
  );
  assert.deepEqual(calls.slice(0, 3), ["select:follower_id, created_at", "eq:following_id:me", "order:created_at:false"]);
  assert.equal(calls[3], "select:id, display_name, job_type, salon_name, region");
  assert.equal(calls[4], "in:id:new-follower,old-follower");
});

test("follower profile lookup errors are distinguishable from an empty list", async () => {
  const calls: string[] = [];
  const supabase = {
    from(table: string) {
      return queryBuilder(
        table === "follows"
          ? { data: [{ follower_id: "follower" }], error: null }
          : { data: null, error: { message: "profiles unavailable" } },
        calls
      );
    },
  };

  const result = await listFollowerProfiles(supabase as never, "me");

  assert.equal(result.profiles.length, 0);
  assert.equal(result.error?.message, "profiles unavailable");
});

test("unexpected follower lookup failures return an error instead of throwing", async () => {
  const result = await listFollowerProfiles(
    {
      from() {
        throw new Error("temporary failure");
      },
    } as never,
    "me"
  );

  assert.equal(result.profiles.length, 0);
  assert.equal(result.error instanceof Error, true);
  assert.equal((result.error as Error).message, "temporary failure");
});
