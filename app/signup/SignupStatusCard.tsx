import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export type SignupStatus = "check-email" | "maybe-registered";

export function normalizeSignupStatus(value: string | null | undefined): SignupStatus {
  return value === "maybe-registered" ? "maybe-registered" : "check-email";
}

export function SignupStatusCard({ status = "check-email" }: { status?: SignupStatus }) {
  const isMaybeRegistered = status === "maybe-registered";

  return (
    <div className="rounded-[10px] border border-blush/20 bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.04)]">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-blushSoft text-blush">
        {isMaybeRegistered ? <AlertCircle aria-hidden="true" size={22} /> : <CheckCircle2 aria-hidden="true" size={22} />}
      </div>
      <h2 className="mt-4 text-xl font-black leading-tight text-ink">
        {isMaybeRegistered ? "すでに登録済みの可能性があります。" : "会員登録を受け付けました。"}
      </h2>
      {isMaybeRegistered ? (
        <div className="mt-3 grid gap-2 text-sm font-medium leading-relaxed text-mute">
          <p>ログインをお試しください。</p>
          <p>確認メールが未確認の場合は、メール内のリンクをご確認ください。</p>
          <p>メールが届かない場合は、迷惑メールフォルダをご確認ください。</p>
        </div>
      ) : (
        <div className="mt-3 grid gap-2 text-sm font-medium leading-relaxed text-mute">
          <p>確認メールを送信しました。</p>
          <p>メール内のリンクを押してからログインしてください。</p>
          <p>メールが届かない場合は、迷惑メールフォルダをご確認ください。</p>
        </div>
      )}
      <Link href="/login" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
        ログインページへ進む
      </Link>
      {isMaybeRegistered ? (
        <Link href="/signup" className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-[8px] border border-line bg-white text-sm font-black text-ink">
          別のメールアドレスで登録する
        </Link>
      ) : null}
    </div>
  );
}
