import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-white/96 backdrop-blur">
      <div className="mx-auto flex h-[3rem] max-w-[430px] items-center px-4">
        <Link href="/" aria-label="ホームへ戻る">
          <BrandLogo />
        </Link>
      </div>
    </header>
  );
}
