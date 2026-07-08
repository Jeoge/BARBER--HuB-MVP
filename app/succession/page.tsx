import { PageChrome } from "@/components/PageChrome";
import { SuccessionListingsView } from "@/components/SuccessionListingsView";
import { listPublishedSuccessionPosts } from "@/lib/supabase/succession";
import { createClient } from "@/lib/supabase/server";

function successionListErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    const message = error.message.toLowerCase();

    if (message.includes("relation") && message.includes("succession")) {
      return "開業・承継情報の表示に必要なsuccession_postsテーブルが見つかりません。Supabase SQL Editorで最新migrationを実行してください。";
    }
  }

  return "開業・承継情報を読み込めませんでした。時間をおいて再読み込みしてください。";
}

export default async function SuccessionPage() {
  const supabase = await createClient();
  const { posts, error } = await listPublishedSuccessionPosts(supabase);

  return (
    <PageChrome>
      <SuccessionListingsView posts={error ? [] : posts} loadError={error ? successionListErrorMessage(error) : null} />
    </PageChrome>
  );
}
