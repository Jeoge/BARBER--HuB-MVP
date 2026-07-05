"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { signUpAction } from "./actions";

type SignupFormProps = {
  next: string;
  error?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function SubmitButton({ disabledByValidation }: { disabledByValidation: boolean }) {
  const { pending } = useFormStatus();
  const disabled = pending || disabledByValidation;

  return (
    <button
      type="submit"
      disabled={disabled}
      className={
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] text-sm font-black transition " +
        (disabled ? "cursor-not-allowed bg-neutral-200 text-mute" : "bg-blush text-white")
      }
    >
      <Sparkles aria-hidden="true" size={17} />
      {pending ? "登録中..." : "登録する"}
    </button>
  );
}

export function SignupForm({ next, error }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const validationMessages = useMemo(() => {
    const messages: string[] = [];

    if (emailTouched && email.trim().length === 0) {
      messages.push("メールアドレスを入力してください");
    } else if (emailTouched && !isValidEmail(email.trim())) {
      messages.push("メールアドレスの形式を確認してください");
    }

    if (passwordTouched && password.length === 0) {
      messages.push("パスワードを入力してください");
    } else if (passwordTouched && password.length < 6) {
      messages.push("パスワードは6文字以上で入力してください");
    }

    return messages;
  }, [email, emailTouched, password, passwordTouched]);

  const disabledByValidation = !isValidEmail(email.trim()) || password.length < 6;

  return (
    <form action={signUpAction} className="grid gap-4">
      <input type="hidden" name="next" value={next} />

      {error ? (
        <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
          {error}
        </div>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">メールアドレス</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onBlur={() => setEmailTouched(true)}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailTouched(true);
          }}
          className="h-12 rounded-[8px] border border-line bg-white px-3 text-base font-bold text-ink outline-none focus:border-blush"
          placeholder="example@barberhub.jp"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-ink">パスワード</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onBlur={() => setPasswordTouched(true)}
          onChange={(event) => {
            setPassword(event.target.value);
            setPasswordTouched(true);
          }}
          className="h-12 rounded-[8px] border border-line bg-white px-3 text-base font-bold text-ink outline-none focus:border-blush"
          placeholder="6文字以上"
        />
      </label>

      {validationMessages.length > 0 ? (
        <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
          {validationMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}

      <SubmitButton disabledByValidation={disabledByValidation} />

      <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-[8px] border border-line bg-white text-sm font-black text-ink">
        ログインはこちら
      </Link>
    </form>
  );
}
