import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath, pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"), "/mypage");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL(
      pathWithParams("/login", {
        error: "メール確認リンクの処理に失敗しました。もう一度ログインしてください。",
      }),
      requestUrl.origin
    )
  );
}
