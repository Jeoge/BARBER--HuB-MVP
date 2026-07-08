import { JobListingsView } from "@/components/JobListingsView";
import { PageChrome } from "@/components/PageChrome";
import { listPublishedJobPosts } from "@/lib/supabase/jobs";
import { createClient } from "@/lib/supabase/server";

function jobListErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    const message = error.message.toLowerCase();

    if (message.includes("relation") && message.includes("job_posts")) {
      return "求人表示に必要なjob_postsテーブルが見つかりません。Supabase SQL Editorで最新migrationを実行してください。";
    }
  }

  return "求人データを読み込めませんでした。時間をおいて再読み込みしてください。";
}

export default async function JobsPage() {
  const supabase = await createClient();
  const { jobs, error } = await listPublishedJobPosts(supabase);

  return (
    <PageChrome>
      <JobListingsView jobs={error ? [] : jobs} loadError={error ? jobListErrorMessage(error) : null} />
    </PageChrome>
  );
}
