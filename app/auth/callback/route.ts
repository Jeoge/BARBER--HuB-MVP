import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNextPath, pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

const supportedEmailOtpTypes = new Set<EmailOtpType>(["signup", "invite", "magiclink", "recovery", "email_change", "email"]);

function getEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value) return null;
  return supportedEmailOtpTypes.has(value as EmailOtpType) ? (value as EmailOtpType) : null;
}

async function hasVerifiedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return !error && Boolean(user);
}

function redirectToConfirmed(requestUrl: URL, next: string) {
  return NextResponse.redirect(
    new URL(
      pathWithParams("/auth/confirmed", {
        next,
      }),
      requestUrl.origin
    )
  );
}

function redirectToConfirmationError(requestUrl: URL, next: string) {
  return NextResponse.redirect(
    new URL(
      pathWithParams("/auth/confirmed", {
        status: "error",
        next,
      }),
      requestUrl.origin
    )
  );
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = getEmailOtpType(requestUrl.searchParams.get("type"));
  const next = safeNextPath(requestUrl.searchParams.get("next"), "/");
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && (await hasVerifiedUser(supabase))) {
      return redirectToConfirmed(requestUrl, next);
    }
  }

  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });

    if (!error && (await hasVerifiedUser(supabase))) {
      return redirectToConfirmed(requestUrl, next);
    }
  }

  return redirectToConfirmationError(requestUrl, next);
}
