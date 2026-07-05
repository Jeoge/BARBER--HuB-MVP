import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { SignupRequiredCard } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { backRoomRooms } from "@/lib/backRoom";
import { createClient } from "@/lib/supabase/server";

// Future: add a per-user rate limit for thread creation, such as one thread per few minutes,
// backed by account/session identity. MVP keeps the UI only.
export default async function BackRoomPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-4">
          <Link href="/backyard" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            Back Roomへ戻る
          </Link>
        </section>
        <SignupRequiredCard kind="backyard" />
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/backyard" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          Back Roomへ戻る
        </Link>
        <div className="mt-4 rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">THREAD</p>
          <h1 className="mt-1 text-[1.5rem] font-black leading-tight text-ink">スレッドを立てる</h1>
          <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">
            同業者に聞きたいこと、今日あったこと、営業後に話したいことを書いてください。
          </p>
        </div>
      </section>

      <section className="grid gap-4 px-4 pt-4">
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">タイトル</span>
          <input
            required
            className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
            placeholder="例：静音バリカンでおすすめありますか？"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">カテゴリ</span>
          <select required className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush">
            {backRoomRooms.map((room) => (
              <option key={room.id}>{room.label}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">本文</span>
          <textarea
            required
            rows={7}
            className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
            placeholder="相談、経験共有、雑談は歓迎です。個人名・店舗名を出した攻撃や晒しは禁止です。"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">ニックネーム表示</span>
          <input
            className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
            placeholder="例：営業後の理容師 / 40代オーナー"
          />
        </label>

        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-[0.78rem] font-medium leading-relaxed text-ink">
          タイトル・カテゴリ・本文は必須です。店名や本名を出さずに話せますが、個人攻撃や晒しは禁止です。
        </div>

        <button type="button" className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
          <Send aria-hidden="true" size={17} />
          投稿する
        </button>
      </section>
    </PageChrome>
  );
}
