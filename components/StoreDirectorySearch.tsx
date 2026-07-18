"use client";

import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  PlusCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PREFECTURES } from "@/lib/japanAreas";
import {
  BARBER_SHOP_PAGE_SIZE,
  barberShopSelect,
  listBarberShopMunicipalities,
  normalizeShopSearchText,
  shopAddressLabel,
  shopAreaLabel,
  shopPhoneLabel,
  shopVerificationLabel,
  type BarberShop,
  type BarberShopMunicipality,
} from "@/lib/supabase/barber-shops";
import { createClient } from "@/lib/supabase/client";

type StoreDirectoryView = "menu" | "name" | "area" | "verified";

type StoreDirectoryContextValue = {
  openStoreDirectory: (view?: StoreDirectoryView) => void;
};

const StoreDirectoryContext = createContext<StoreDirectoryContextValue | null>(null);

function useStoreDirectory() {
  const context = useContext(StoreDirectoryContext);

  if (context == null) {
    throw new Error("StoreDirectoryProvider is missing.");
  }

  return context;
}

function cleanLikeInput(value: string) {
  return value.replace(/[%_,()]/g, "");
}

function loginHref(next: string, message: string) {
  return `/login?next=${encodeURIComponent(next)}&message=${encodeURIComponent(message)}`;
}

function signupHref(next: string) {
  return `/signup?next=${encodeURIComponent(next)}`;
}

function StoreResultCard({ shop }: { shop: BarberShop }) {
  const verified = shop.verification_status === "verified";

  return (
    <Link
      href={`/stores/${shop.id}`}
      className="flex min-h-[5.75rem] items-center justify-between gap-3 rounded-[8px] border border-line bg-white px-3 py-2.5 text-left shadow-[0_6px_16px_rgba(17,17,17,0.025)]"
    >
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm font-black leading-snug text-ink">{shop.name}</span>
        <span className="mt-1 line-clamp-1 text-xs font-semibold text-mute">{shopAreaLabel(shop)}</span>
        <span className="mt-0.5 line-clamp-1 text-xs font-medium text-mute">{shopAddressLabel(shop)}</span>
        <span className="mt-0.5 line-clamp-1 text-xs font-semibold text-ink/70">{shopPhoneLabel(shop.phone)}</span>
        <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-line bg-neutral-50 px-2 py-0.5 text-[0.62rem] font-semibold text-ink/72">
          {verified ? <BadgeCheck aria-hidden="true" size={12} className="text-blush" /> : null}
          {shopVerificationLabel(shop.verification_status)}
        </span>
      </span>
      <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-mute" />
    </Link>
  );
}

function ResultList({
  results,
  loading,
  error,
  hasMore,
  onRetry,
  onLoadMore,
  emptyAction,
}: {
  results: BarberShop[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onRetry: () => void;
  onLoadMore: () => void;
  emptyAction: ReactNode;
}) {
  if (error) {
    return (
      <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
        <p className="text-sm font-black text-ink">店舗情報を取得できませんでした。</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-mute">時間をおいて、もう一度お試しください。</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink"
        >
          <RotateCcw aria-hidden="true" size={14} />
          再試行
        </button>
      </div>
    );
  }

  if (loading && results.length === 0) {
    return (
      <div className="grid gap-2.5" aria-label="店舗情報を読み込み中">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-[5.75rem] animate-pulse rounded-[8px] border border-line bg-neutral-50" />
        ))}
      </div>
    );
  }

  if (!loading && results.length === 0) {
    return (
      <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
        <p className="text-sm font-black text-ink">該当する店舗が見つかりませんでした</p>
        <div className="mt-3">{emptyAction}</div>
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      {results.map((shop) => (
        <StoreResultCard key={shop.id} shop={shop} />
      ))}
      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-ink disabled:opacity-60"
        >
          {loading ? "読み込み中..." : "さらに読み込む"}
        </button>
      ) : null}
    </div>
  );
}

function NotFoundAction({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (isLoggedIn) {
    return (
      <Link href="/stores/new" className="inline-flex h-10 w-full items-center justify-center rounded-[8px] bg-ink px-3 text-xs font-black text-white">
        店舗が見つからない方
      </Link>
    );
  }

  return (
    <div className="grid gap-2">
      <Link href={loginHref("/stores/new", "店舗登録にはログインしてください。")} className="inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-3 text-xs font-black text-white">
        ログインして店舗登録へ
      </Link>
      <Link href={signupHref("/stores/new")} className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">
        会員登録へ
      </Link>
    </div>
  );
}

function StoreDirectorySheet({
  open,
  view,
  setView,
  onClose,
}: {
  open: boolean;
  view: StoreDirectoryView;
  setView: (view: StoreDirectoryView) => void;
  onClose: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nameQuery, setNameQuery] = useState("");
  const [namePrefecture, setNamePrefecture] = useState("");
  const [nameMunicipality, setNameMunicipality] = useState("");
  const [areaPrefecture, setAreaPrefecture] = useState("");
  const [areaMunicipality, setAreaMunicipality] = useState("");
  const [municipalities, setMunicipalities] = useState<BarberShopMunicipality[]>([]);
  const [municipalityError, setMunicipalityError] = useState(false);
  const [results, setResults] = useState<BarberShop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setIsLoggedIn(data.user != null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setIsLoggedIn(session?.user != null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    window.history.pushState({ ...(window.history.state ?? {}), barberHubStoreDirectory: true }, "", window.location.href);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    function handlePopState() {
      onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;
    setResults([]);
    setError(null);
    setHasMore(false);
  }, [open, view]);

  useEffect(() => {
    if (!open || view !== "area" || !areaPrefecture) {
      setMunicipalities([]);
      setMunicipalityError(false);
      return;
    }

    let active = true;
    setMunicipalityError(false);

    listBarberShopMunicipalities(supabase, areaPrefecture).then(({ municipalities: items, error: listError }) => {
      if (!active) return;
      setMunicipalities(items);
      setMunicipalityError(Boolean(listError));
    });

    return () => {
      active = false;
    };
  }, [areaPrefecture, open, supabase, view]);

  async function fetchResults(offset = 0, append = false) {
    const normalizedName = normalizeShopSearchText(nameQuery);
    const queryText = cleanLikeInput(nameQuery.trim());

    if (view === "name" && normalizedName.length === 0) {
      setResults([]);
      setError(null);
      setHasMore(false);
      return;
    }

    if (view === "area" && (!areaPrefecture || !areaMunicipality)) {
      setResults([]);
      setError(null);
      setHasMore(false);
      return;
    }

    setLoading(true);
    setError(null);

    let request = supabase
      .from("barber_shops")
      .select(barberShopSelect)
      .eq("is_public", true)
      .eq("is_deleted", false)
      .eq("is_duplicate", false)
      .eq("status", "public")
      .neq("verification_status", "suspended")
      .order("created_at", { ascending: false })
      .range(offset, offset + BARBER_SHOP_PAGE_SIZE - 1);

    if (view === "name") {
      const normalizedQuery = cleanLikeInput(normalizedName);
      request = request.or(
        [
          `normalized_name.ilike.%${normalizedQuery}%`,
          `municipality.ilike.%${queryText}%`,
          `address.ilike.%${queryText}%`,
        ].join(",")
      );
      if (namePrefecture) request = request.eq("prefecture", namePrefecture);
      if (nameMunicipality.trim()) request = request.ilike("municipality", `%${cleanLikeInput(nameMunicipality.trim())}%`);
    }

    if (view === "area") {
      request = request.eq("prefecture", areaPrefecture).eq("municipality", areaMunicipality);
    }

    if (view === "verified") {
      request = request.eq("verification_status", "verified");
    }

    const { data, error: searchError } = await request.returns<BarberShop[]>();

    setLoading(false);

    if (searchError) {
      setError(searchError.message);
      setHasMore(false);
      if (!append) setResults([]);
      return;
    }

    const nextResults = data ?? [];
    setResults((current) => (append ? [...current, ...nextResults] : nextResults));
    setHasMore(nextResults.length === BARBER_SHOP_PAGE_SIZE);
  }

  useEffect(() => {
    if (!open) return;

    if (view === "name") {
      const timer = window.setTimeout(() => {
        void fetchResults(0, false);
      }, 380);
      return () => window.clearTimeout(timer);
    }

    if (view === "area" && areaPrefecture && areaMunicipality) {
      const timer = window.setTimeout(() => {
        void fetchResults(0, false);
      }, 220);
      return () => window.clearTimeout(timer);
    }

    if (view === "verified") {
      void fetchResults(0, false);
    }
  }, [areaMunicipality, areaPrefecture, nameMunicipality, namePrefecture, nameQuery, open, view]);

  function loadMore() {
    void fetchResults(results.length, true);
  }

  function retry() {
    void fetchResults(0, false);
  }

  function selectView(nextView: StoreDirectoryView) {
    setView(nextView);
  }

  if (!open) return null;

  const title = view === "name" ? "店舗を検索" : view === "area" ? "地域から探す" : view === "verified" ? "認証済み店舗" : "店舗を検索";
  const showBack = view !== "menu";

  return (
    <div className="fixed inset-0 z-[80]" role="presentation" onClick={onClose}>
      <div className="absolute inset-0 bg-black/32" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[430px] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:bottom-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="store-directory-title"
          className="max-h-[86vh] overflow-hidden rounded-t-[14px] border border-line bg-white shadow-[0_24px_70px_rgba(17,17,17,0.24)] sm:rounded-[14px]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              {showBack ? (
                <button
                  type="button"
                  onClick={() => selectView("menu")}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-ink"
                  aria-label="店舗検索メニューへ戻る"
                >
                  <ChevronLeft aria-hidden="true" size={18} />
                </button>
              ) : null}
              <div className="min-w-0">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-blush">BARBER DIRECTORY</p>
                <h2 id="store-directory-title" className="truncate text-base font-black text-ink">
                  {title}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-ink"
              aria-label="店舗検索を閉じる"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          <div className="max-h-[calc(86vh-4.25rem)] overflow-y-auto overscroll-contain px-4 py-4">
            {view === "menu" ? (
              <div className="grid gap-2.5">
                <button type="button" onClick={() => selectView("name")} className="flex min-h-14 items-center gap-3 rounded-[8px] border border-line bg-white px-3 py-2.5 text-left">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
                    <Search aria-hidden="true" size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-ink">店名・住所から探す</span>
                    <span className="mt-0.5 block text-xs font-semibold text-mute">店名、市区町村、住所で検索</span>
                  </span>
                  <ChevronRight aria-hidden="true" size={18} className="ml-auto shrink-0 text-mute" />
                </button>
                <button type="button" onClick={() => selectView("area")} className="flex min-h-14 items-center gap-3 rounded-[8px] border border-line bg-white px-3 py-2.5 text-left">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-50 text-ink">
                    <MapPin aria-hidden="true" size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-ink">地域から探す</span>
                    <span className="mt-0.5 block text-xs font-semibold text-mute">都道府県、市区町村の順に選択</span>
                  </span>
                  <ChevronRight aria-hidden="true" size={18} className="ml-auto shrink-0 text-mute" />
                </button>
                <button type="button" onClick={() => selectView("verified")} className="flex min-h-14 items-center gap-3 rounded-[8px] border border-line bg-white px-3 py-2.5 text-left">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-50 text-ink">
                    <ShieldCheck aria-hidden="true" size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-ink">認証済み店舗</span>
                    <span className="mt-0.5 block text-xs font-semibold text-mute">オーナー確認済みのみ</span>
                  </span>
                  <ChevronRight aria-hidden="true" size={18} className="ml-auto shrink-0 text-mute" />
                </button>
                <Link href={isLoggedIn ? "/stores/new" : loginHref("/stores/new", "店舗登録にはログインしてください。")} className="flex min-h-14 items-center gap-3 rounded-[8px] border border-line bg-white px-3 py-2.5 text-left">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-50 text-ink">
                    <PlusCircle aria-hidden="true" size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-ink">店舗が見つからない方</span>
                    <span className="mt-0.5 block text-xs font-semibold text-mute">{isLoggedIn ? "店舗登録申請へ進む" : "ログイン後に登録申請"}</span>
                  </span>
                  <ChevronRight aria-hidden="true" size={18} className="ml-auto shrink-0 text-mute" />
                </Link>
              </div>
            ) : null}

            {view === "name" ? (
              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-ink">店名・市区町村・住所</span>
                  <input
                    value={nameQuery}
                    onChange={(event) => setNameQuery(event.target.value)}
                    className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
                    placeholder="例：姪浜 / 久留米市 / 理容キモト"
                    autoFocus
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-2">
                    <span className="text-xs font-black text-ink">都道府県</span>
                    <select
                      value={namePrefecture}
                      onChange={(event) => setNamePrefecture(event.target.value)}
                      className="h-11 rounded-[8px] border border-line bg-white px-2 text-xs font-semibold text-ink outline-none focus:border-blush"
                    >
                      <option value="">指定なし</option>
                      {PREFECTURES.map((prefecture) => (
                        <option key={prefecture} value={prefecture}>
                          {prefecture}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-black text-ink">市区町村</span>
                    <input
                      value={nameMunicipality}
                      onChange={(event) => setNameMunicipality(event.target.value)}
                      className="h-11 rounded-[8px] border border-line bg-white px-2 text-xs font-semibold text-ink outline-none focus:border-blush"
                      placeholder="例：福岡市"
                    />
                  </label>
                </div>
                {normalizeShopSearchText(nameQuery).length === 0 ? (
                  <p className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
                    店名、市区町村、住所を入力すると候補を表示します。空文字で全店舗は取得しません。
                  </p>
                ) : (
                  <ResultList
                    results={results}
                    loading={loading}
                    error={error}
                    hasMore={hasMore}
                    onRetry={retry}
                    onLoadMore={loadMore}
                    emptyAction={<NotFoundAction isLoggedIn={isLoggedIn} />}
                  />
                )}
              </div>
            ) : null}

            {view === "area" ? (
              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-ink">都道府県</span>
                  <select
                    value={areaPrefecture}
                    onChange={(event) => {
                      setAreaPrefecture(event.target.value);
                      setAreaMunicipality("");
                    }}
                    className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
                  >
                    <option value="">選択してください</option>
                    {PREFECTURES.map((prefecture) => (
                      <option key={prefecture} value={prefecture}>
                        {prefecture}
                      </option>
                    ))}
                  </select>
                </label>
                {areaPrefecture ? (
                  <div className="grid gap-2">
                    <span className="text-sm font-black text-ink">市区町村</span>
                    {municipalityError ? (
                      <p className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
                        市区町村を取得できませんでした。時間をおいて再度お試しください。
                      </p>
                    ) : municipalities.length === 0 ? (
                      <p className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
                        この都道府県の店舗はまだ登録されていません。
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {municipalities.map((item) => (
                          <button
                            key={item.municipality}
                            type="button"
                            onClick={() => setAreaMunicipality(item.municipality)}
                            className={
                              "rounded-full border px-3 py-2 text-xs font-semibold " +
                              (areaMunicipality === item.municipality ? "border-blush/25 bg-blushSoft text-ink" : "border-line bg-white text-ink/76")
                            }
                          >
                            {item.municipality}
                            <span className="ml-1 text-mute">{item.shop_count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
                {areaPrefecture && areaMunicipality ? (
                  <ResultList
                    results={results}
                    loading={loading}
                    error={error}
                    hasMore={hasMore}
                    onRetry={retry}
                    onLoadMore={loadMore}
                    emptyAction={<NotFoundAction isLoggedIn={isLoggedIn} />}
                  />
                ) : null}
              </div>
            ) : null}

            {view === "verified" ? (
              <ResultList
                results={results}
                loading={loading}
                error={error}
                hasMore={hasMore}
                onRetry={retry}
                onLoadMore={loadMore}
                emptyAction={<NotFoundAction isLoggedIn={isLoggedIn} />}
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export function StoreDirectoryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<StoreDirectoryView>("menu");

  const openStoreDirectory = useCallback((nextView: StoreDirectoryView = "menu") => {
    setView(nextView);
    setOpen(true);
  }, []);

  const closeStoreDirectory = useCallback(() => {
    if (typeof window !== "undefined" && window.history.state?.barberHubStoreDirectory) {
      window.history.back();
    }
    setOpen(false);
  }, []);

  return (
    <StoreDirectoryContext.Provider value={{ openStoreDirectory }}>
      {children}
      <StoreDirectorySheet open={open} view={view} setView={setView} onClose={closeStoreDirectory} />
    </StoreDirectoryContext.Provider>
  );
}

export function StoreSearchHeaderButton() {
  const { openStoreDirectory } = useStoreDirectory();

  return (
    <button
      type="button"
      onClick={() => openStoreDirectory("menu")}
      className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-line bg-white px-2.5 text-[0.7rem] font-black text-ink shadow-[0_6px_16px_rgba(17,17,17,0.035)]"
      aria-label="店舗検索を開く"
    >
      <Search aria-hidden="true" size={14} className="text-blush" />
      <span>店舗検索</span>
    </button>
  );
}

export function StoreDirectoryStatsCard({ count }: { count: number | null }) {
  const { openStoreDirectory } = useStoreDirectory();
  const countLabel = count == null ? null : count.toLocaleString("ja-JP");

  return (
    <section className="px-4 pt-5">
      <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">BARBER DIRECTORY</p>
            <h2 className="mt-1 text-base font-black text-ink">掲載店舗数</h2>
            <p className="mt-1 text-xs font-medium leading-relaxed text-mute">
              理容店舗を業界データベースとして探せます。
            </p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-50 text-ink">
            <Store aria-hidden="true" size={18} />
          </span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-2xl font-black leading-none text-ink">
            {countLabel ? (
              <>
                {countLabel}
                <span className="ml-1 text-sm">店舗</span>
              </>
            ) : (
              <span className="text-sm font-bold text-mute">確認中</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => openStoreDirectory("menu")}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-[8px] bg-ink px-3 text-xs font-black text-white"
          >
            あなたのお店を検索する
          </button>
        </div>
      </div>
    </section>
  );
}
