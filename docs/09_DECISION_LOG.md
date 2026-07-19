# Decision Log

BARBER HUBの重要な判断を記録します。新しい判断を追加するときは、[templates/DECISION_RECORD_TEMPLATE.md](templates/DECISION_RECORD_TEMPLATE.md) を使います。

## Project Bibleを正式な判断基準にする

- 日付: 2026年7月時点
- 状態: 決定
- 決定: BARBER HUBの仕様判断は、まず [00_PROJECT_BIBLE.md](00_PROJECT_BIBLE.md) を参照する。
- 理由: チャット履歴だけでは前提共有が難しくなったため。
- 影響範囲: docs、PR本文、実装判断、レビュー。
- 関連PR・文書: [README.md](README.md), [00_PROJECT_BIBLE.md](00_PROJECT_BIBLE.md)

## 店舗カードへ口コミを載せない

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 店舗カードや店舗詳細へ口コミを実装しない。
- 理由: BARBER HUBは一般客向け口コミサイトではなく、業界向けの中立的な情報基盤を目指すため。
- 影響範囲: 店舗カード、店舗詳細、DB設計、将来UI。
- 関連PR・文書: [00_PROJECT_BIBLE.md](00_PROJECT_BIBLE.md), [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md)

## 店舗に星評価・ランキングを導入しない

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 店舗の星評価、店舗ランキングを実装しない。
- 理由: 数字競争や誤認を避け、基本情報と認証を重視するため。
- 影響範囲: 店舗検索、店舗詳細、検索結果、将来の広告設計。
- 関連PR・文書: [00_PROJECT_BIBLE.md](00_PROJECT_BIBLE.md), [06_MONETIZATION_AND_PARTNERS.md](06_MONETIZATION_AND_PARTNERS.md)

## 店舗は運営が最低限情報を先行掲載できる

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 運営は最低限の公開店舗情報を先に掲載できる。
- 理由: Google Business Profile型に、検索できる基本情報を先に用意するため。
- 影響範囲: `barber_shops`, 店舗検索、店舗登録申請、運用。
- 関連PR・文書: [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [05_OPERATIONS_AND_GOVERNANCE.md](05_OPERATIONS_AND_GOVERNANCE.md)

## オーナーが後から認証申請する

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 店舗オーナーは、掲載済み店舗に対して後から認証申請できる。
- 理由: 店舗情報とユーザーアカウントを分離し、正当な管理者だけが情報を充実できるようにするため。
- 影響範囲: `barber_shop_claims`, 認証申請UI、RLS。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)

## 未認証店舗は写真・URLなしでよい

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 未認証店舗は、写真、URL、口コミなしでも掲載できる。
- 理由: 未確認素材の無断利用や誤認を避けつつ、検索できる基本情報を提供するため。
- 影響範囲: 店舗カード、店舗詳細、データ取込。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [06_MONETIZATION_AND_PARTNERS.md](06_MONETIZATION_AND_PARTNERS.md)

## トップには大量店舗一覧ではなく検索入口と掲載店舗数を出す

- 日付: 2026年7月時点
- 状態: 決定
- 決定: トップ画面では大量の店舗カードを並べず、掲載店舗数と検索入口を見せる。
- 理由: 既存トップ画面の見た目を壊さず、検索体験へ自然につなげるため。
- 影響範囲: トップページ、Store Directory導線、検索UI。
- 関連PR・文書: [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md), [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md)

## 掲載店舗数は実際に公開検索可能な件数にする

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 掲載店舗数は、実際に公開検索可能な店舗だけを数える。
- 理由: 実数でない掲載数を出すと信頼を損なうため。
- 影響範囲: `get_public_barber_shop_count`, トップ表示、運用。
- 関連PR・文書: [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [05_OPERATIONS_AND_GOVERNANCE.md](05_OPERATIONS_AND_GOVERNANCE.md)

## 店舗検索はロゴ行右端からBottom Sheetを開く

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 店舗検索ボタンはロゴ行右側に置き、Bottom Sheetで検索を開く。
- 理由: トップ画面の第一印象を保ちながら、検索入口をすぐ見つけられるようにするため。
- 影響範囲: Header、Store Directory検索UI、レスポンシブ確認。
- 関連PR・文書: [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md)

## トップページ上部は黒ベースのブランドヘッダーにする

- 日付: 2026年7月19日
- 状態: 決定
- 決定: トップページ最上部だけは黒ベースのブランドヘッダーにし、中央に大きめのBARBER HUBロゴ、左上に「業界のオープンソース」を表示する。トップ上部右側の店舗検索ボタンは表示しない。
- 理由: トップの第一印象を引き締め、BARBER HUBロゴを主役にしながら、既存のカテゴリーチップ行とトップ各セクションは維持するため。
- 守ること: HUBは既存ピンクを使う。黒ヘッダー直下に既存カテゴリーチップ行を置き、3MIN NEWS、SNAP、EDITOR'S PICK、Directory機能、Bottom Navigation、FAB、他ページの共通ヘッダーは変更しない。
- 影響範囲: トップページ上部、Headerのトップ専用variant、BrandLogoのトップ専用表示。
- 関連PR・文書: [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md)

## 検索シートに「自分のお店を管理する」は重複表示しない

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 検索シート内に「自分のお店を管理する」導線を重複表示しない。
- 理由: 検索、登録申請、管理導線が混ざると操作が分かりにくくなるため。
- 影響範囲: Store Directory検索UI、店舗管理導線。
- 関連PR・文書: [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md), [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md)

## 管理機能はBARBER HUB内の管理者専用画面にする

- 日付: 2026年7月時点
- 状態: 決定・一部実装
- 決定: 店舗審査やCSV取込などの管理機能は、BARBER HUB内の非公開admin系領域で扱う。
- 理由: 一般ユーザーに管理入口を見せず、URL直打ちでも権限なしでは入れないようにするため。
- 影響範囲: 管理画面、権限、RLS、運用ログ。
- 関連PR・文書: [05_OPERATIONS_AND_GOVERNANCE.md](05_OPERATIONS_AND_GOVERNANCE.md)

## CSVは直接投入せずプレビュー、重複、エラー確認を挟む

- 日付: 2026年7月時点
- 状態: 決定済み・未実装
- 決定: CSV店舗取込では、プレビュー、重複確認、エラー確認、取込履歴、バッチ管理を挟む。
- 理由: 本番データへ誤登録や重複登録を起こさないため。
- 影響範囲: CSV取込管理、DB設計、運用。
- 関連PR・文書: [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [08_ROADMAP.md](08_ROADMAP.md)

## 福岡県理容所CSVは既存店舗テーブルへ管理者が手動取込する

- 日付: 2026年7月18日
- 状態: 決定
- 決定: 福岡県理容所CSVは `barber_shops` へ保存し、重複する店舗テーブルは作らない。CSVデータ本体はmigrationやseedに含めず、管理者専用の `/admin/barber-shops/import` でプレビュー、必須項目チェック、重複確認後に手動登録する。
- 理由: schema変更と大量データ投入を分け、誤投入、重複登録、本番seed混入を避けるため。
- 守ること: 住所と電話番号が空欄でも取込可能にする。電話番号はtextで保存し、先頭0を落とさない。完全一致重複は登録実行時にも再確認して二重登録しない。類似候補は自動登録対象から外せるようにし、管理者確認を挟む。
- 影響範囲: `barber_shops`, `barber_shop_import_batches`, `barber_shop_import_rows`, Barber Directory検索、管理者CSV取込画面、RLS。
- 関連PR・文書: [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)

## CSVの未認証店舗はunverifiedとして扱う

- 日付: 2026年7月18日
- 状態: 決定
- 決定: CSV取込店舗は、CSV列「認証状態」の値にかかわらず `verification_status = 'unverified'` として保存する。CSVから `verified`, `pending`, `rejected`, `suspended` などへ変更できない。既存の `unclaimed` は互換値として残し、公開UIではどちらも「未認証」と表示する。
- 理由: 公開資料から取り込む店舗を、認証済みまたは認証申請中のように誤認させないため。認証済みへの変更は、今後の運営による店舗認証申請の承認処理だけで行う。
- 守ること: 認証済みバッジは `verified` の店舗だけに表示する。CSV取込時の `owner_user_id` はNULLにする。CSVに未認証以外の値が入っている行はプレビューでエラーにして登録しない。CSV取込RPCは常に `unverified` を書き込む。`source_type = 'imported'`, `verification_status = 'verified'`, `owner_user_id is null` はDB制約で禁止する。一般ユーザーが `verification_status` や管理項目を直接変更できないよう、RLSと列権限を確認する。
- 影響範囲: `barber_shops.verification_status`, Barber Directory検索結果、店舗詳細、店舗管理申請。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)

## 久留米支部名簿は久留米市全店舗の根拠にしない

- 日付: 2026年7月18日
- 状態: 決定
- 決定: 「福岡県理容生活衛生同業組合 久留米支部組合員名簿」を掲載元にするデータは、久留米支部組合員名簿由来として扱い、「久留米市全店舗」などの断定表現には使わない。
- 理由: 組合員名簿は行政が保証する全理容所データではないため。
- 影響範囲: CSV取込、Barber Directory表示、PR本文、将来の掲載数説明。
- 関連PR・文書: [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)

## メーカー・学校・ディーラー等も将来基本掲載・認証方式を検討する

- 日付: 2026年7月時点
- 状態: 検討中
- 決定: メーカー、ディーラー、学校、組合なども将来の業界ディレクトリ対象として検討する。
- 理由: BARBER HUBを業界全体の情報基盤へ広げる可能性があるため。
- 影響範囲: 将来DB、検索UI、パートナー設計。
- 関連PR・文書: [08_ROADMAP.md](08_ROADMAP.md), [06_MONETIZATION_AND_PARTNERS.md](06_MONETIZATION_AND_PARTNERS.md)

## 投稿記事を運営選定のEDITOR'S PICKに掲載できる

- 日付: 2026年7月時点
- 状態: 決定
- 決定: EDITOR'S PICKは一般投稿者の自己選択ではなく、BARBER HUB運営が選んだ公開記事を `editor_pick_at` で管理してトップに掲載する。
- 理由: トップの編集枠としての性格を保ちながら、実投稿記事を運営判断で紹介できるようにするため。
- 影響範囲: `articles.editor_pick_at`, トップページ、記事投稿、マイページ記事管理、RLS、Server Action。
- 関連PR・文書: [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md), [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [05_OPERATIONS_AND_GOVERNANCE.md](05_OPERATIONS_AND_GOVERNANCE.md), [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md)

## 記事画像はarticle-images bucket、article_images、既存articles画像カラムを使う

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 記事画像は1記事最大4枚までとし、ブラウザ圧縮後のJPEG / WebPをprivateな `article-images` bucketへ保存する。複数画像メタデータは `article_images` に保存し、新規記事では互換用に1枚目のStorage pathを `articles.image_path` にも保存する。表示時は公開中・未削除記事だけサーバー側で30分程度の短時間signed URLを発行する。`image_path` がない既存記事は `articles.image_url` を互換表示に使える。
- 理由: 既存DBカラムと表示互換を守りつつ、記事本文の任意位置に複数写真を置けるようにし、非公開化・論理削除後に恒久公開URLで画像が残り続けるリスクを避けるため。
- 影響範囲: 記事投稿、`article_images`、Storage RLS、記事詳細、カテゴリー別一覧、マイページ、投稿者プロフィール、EDITOR'S PICK。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md)

## ローンチ時の記事回遊は実記事と短い空状態で成立させる

- 日付: 2026年7月19日
- 状態: 決定
- 決定: 経営、集客、AI、技術、道具の各メニューは投稿カテゴリーから自動表示し、固定記事、固定関連記事、関連Snap、固定広告を本番fallbackにしない。記事0件時は短い空状態、ホーム実記事レール `/#latest-articles` への新着記事導線、ほかのテーマチップだけで成立させる。
- 理由: ローンチ時に架空記事や関係のないSnapを関連記事のように見せず、実記事が増えるほど自然に回遊が充実する状態へするため。
- 守ること: 関連記事は現在の記事を除外し、同一メニューを優先して最大3件表示する。不足時だけ近接メニューまたは全体新着で補完し、補完時は「あわせて読む」にする。記事詳細および記事メニューには関連Snapを表示しない。
- 影響範囲: `/topics/[slug]`, `/articles/[id]`, トップの実記事導線、EDITOR'S PICK fallback。
- 関連PR・文書: [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md), [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md)

## 広告枠はcontent_adsで共通管理する

- 日付: 2026年7月19日
- 状態: 決定
- 決定: トップ、記事メニュー、記事詳細下部、Back Roomなどの広告枠は `content_ads` で共通管理し、掲載場所、対象メニュー、有効期間、有効状態、優先度で表示する。
- 理由: ページごとのハードコード広告やダミー広告を避け、将来の広告主、掲載場所、掲載期間変更に耐えられるようにするため。
- 守ること: PR、広告、Sponsoredのいずれかを明示する。広告がない場合は空枠や広告募集中カードを出さない。`image_path` がある広告画像はprivate `content-ad-images` bucketからサーバー側で30分程度のsigned URLを発行して表示し、`image_path` がない既存広告だけ `image_url` を互換表示に使う。anon / authenticatedは有効な広告だけSELECTでき、広告管理と広告画像のStorage操作はservice roleを使う管理者用サーバー処理に限定する。
- 影響範囲: `content_ads`, `ContentAdCard`, `/`, `/topics/[slug]`, `/articles/[id]`, RLS。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md)

## 基本修正は無料、告知・広告・露出を有料化する

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 基本情報の修正ではなく、対象者へ情報を届ける露出・告知力を主な有料価値にする。
- 理由: 情報基盤としての信頼性と、広告収益を両立するため。
- 影響範囲: パートナー、広告、公式認証、店舗ディレクトリ。
- 関連PR・文書: [06_MONETIZATION_AND_PARTNERS.md](06_MONETIZATION_AND_PARTNERS.md)

## Supabase migrationはGitHub ActionsとProduction承認経由にする

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 本番Supabase migrationはGitHub ActionsとGitHub `production` Environment承認を経由する。
- 理由: mainマージだけで即時本番DB変更される構成を避けるため。
- 影響範囲: GitHub Actions、Secrets、Supabase、運用。
- 関連PR・文書: [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md), [SUPABASE_DEPLOYMENT.md](SUPABASE_DEPLOYMENT.md)

## 本番seedはmigrationと分離する

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 通常seedやテストデータを本番migrationで自動投入しない。
- 理由: schema変更とデータ投入を混ぜると、本番データに意図しない変更が起きるため。
- 影響範囲: `supabase/seeds`, GitHub Actions, 本番運用。
- 関連PR・文書: [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md)

## Thanksは公開競争に使わない

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 自分の投稿へのThanks・いいねは加算対象外とし、Thanks数を公開競争の中心にしない。
- 理由: BARBER HUBはフォロワー数や数字競争より、経験共有と信頼を重視するため。
- 影響範囲: Snap、記事、マイページ、将来ランキング。
- 関連PR・文書: [01_BRAND_AND_VISION.md](01_BRAND_AND_VISION.md), [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md)

## トップページのCONTRIBUTIONとQ&Aは実データ導線を優先する

- 日付: 2026年7月17日
- 状態: 決定
- 決定: トップページのCONTRIBUTIONは「経験を未来に残そう」「繋がれば　もっと面白い」を使い、説明量とカード高さを抑える。Q&Aは `qa_questions` の実データを最大3件表示し、固定ダミーQ&Aや実データ0件時のダミーfallbackは表示しない。Q&A下の黒い自動スクロール記事カードは削除し、メーカー新商品セクションは維持する。
- 理由: 経験共有、Thanks、マイページ確認、バッジ、編集部セレクト、相談導線を短く伝え、不要なダミー情報や自動切り替え表示を減らすため。
- 影響範囲: トップページ、CONTRIBUTION、Q&A、EDITOR'S PICK fallback、メーカー新商品直前の表示。
- 関連PR・文書: [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md), [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md)

## Snapと記事の公開リアクション数を表示しない

- 日付: 2026年7月14日
- 状態: 決定
- 決定: Snapと記事の公開画面ではThanks・いいねの数を表示しない。反応数は投稿者本人だけがマイページで確認する。求人・開業承継は対象外とする。
- 理由: 数字競争を避けつつ、投稿者本人には改善や振り返りに必要な反応を返すため。
- 影響範囲: Snap、記事、マイページ、RLS、リアクションUI。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)

## Snapコメントいいね数は公開し、押したユーザー一覧は公開しない

- 日付: 2026年7月15日
- 状態: 決定
- 決定: Snapコメントへのいいねはコメント単位の小さな反応として実装し、公開画面にはコメントごとの件数と本人の押下状態だけを返す。誰が押したかの一覧は公開しない。
- 理由: コメントへの共感は会話を戻る理由にできる一方、Snap/記事本体の公開リアクション数を競争化しない方針を守るため。
- 影響範囲: `snap_comment_likes`, `get_public_snap_comment_like_counts`, Snapコメントシート、RLS。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)

## アプリ内通知はDB側で安全に作成する

- 日付: 2026年7月15日
- 状態: 決定
- 決定: アプリ内通知は `notifications` に保存し、DB trigger / SECURITY DEFINER関数で対象所有者からrecipientを決める。クライアントから任意通知を作成させない。
- 理由: actor/recipientのなりすましや他人通知の作成を避け、RLSで本人閲覧と既読更新だけを許可するため。
- 影響範囲: `notifications`, Snap/記事リアクション、Snap/記事コメント、Snapコメントいいね、Bottom Navigation未読バッジ。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md)

## Snap複数画像はブラウザ側で圧縮して保存する

- 日付: 2026年7月14日
- 状態: 決定
- 決定: Snapは最大4枚まで投稿できる。原寸画像をそのまま送信せず、ブラウザ側で縮小・圧縮し、圧縮後の1投稿合計をおおむね4MB以内にする。トップ・一覧では表示サイズに合った画像を遅延読み込みし、原寸画像を読み込まない。既存カードサイズと画像表示領域は維持する。
- 理由: スマートフォン原寸画像による通信量とSupabase Storage容量の増加を避けつつ、既存のSnap UIと1枚Snapの互換性を守るため。
- 影響範囲: Snap投稿、Snap表示、`snap_images`, `snap-images` Storage, RLS。
- 関連PR・文書: [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md), [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)

## Snap投稿カテゴリーは内部既定値にする

- 日付: 2026年7月17日
- 状態: 決定
- 決定: 新規Snap投稿画面ではカテゴリーをユーザーに選択させず、保存上必要な値として既存カテゴリーの「日常」をServer Action側で保存する。既存Snapのカテゴリー値は変更しない。
- 理由: Snap投稿を「今日の1コマ　なんでも」として軽く投稿できる導線にしつつ、既存DBや一覧表示との互換性を保つため。
- 影響範囲: `/post/snap`, Snap Server Action, Snap一覧・詳細のカテゴリー表示。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)

## プロフィール登録区分から重複選択肢を外す

- 日付: 2026年7月17日
- 状態: 決定
- 決定: プロフィール設定の通常選択肢から「理美容アシスタント」「サロンスタッフ」を外す。「アシスタント」は維持し、既存プロフィールに保存済みの対象2値は現在の登録値として保存互換を残す。
- 理由: 新規選択肢を整理しながら、既存ユーザーのプロフィール表示、保存、投稿権限を急に壊さないため。
- 影響範囲: プロフィール編集、登録区分の共通定義、投稿権限判定。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md)

## ニュースは自動下書きまでとし、公開は運営者の手動判断にする

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 3MIN NEWSは自動収集・自動下書き作成までを機械化し、公開は運営者が確認・修正・承認して判断する。
- 理由: 元記事の誤読、AIの推測、転載、医療・法律・税務・安全情報の断定を避けるため。
- 影響範囲: `news_drafts`, `/news-review`, ニュース収集API, 将来の3MIN NEWS公開連携。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md)

## approvedにした3MIN NEWSだけを公開する

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 3MIN NEWSは運営者がapprovedにした記事だけを公開し、取得失敗時や公開記事不足時は固定ニュースをフォールバック表示する。
- 理由: 自動収集やAI生成だけで公開される事故を避けつつ、既存トップページを壊さずに運用ニュースへ接続するため。
- 影響範囲: `news_drafts`, `list_public_news`, `get_public_news_by_id`, トップページ3MIN NEWS, `/news/[id]`
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md)

## トップページの3MIN NEWSは承認公開順で表示する

- 日付: 2026年7月19日
- 状態: 決定
- 決定: トップページの3MIN NEWSは、公開可能なニュースだけを対象に、管理者が承認して公開した日時である `reviewed_at` の降順で最大4件表示する。同一時刻でも順番が揺れないよう、`updated_at desc`, `created_at desc`, `id desc` をtie-breakerにする。
- 理由: 管理者が「承認して公開」したニュースが、重要度や分類バランスに押し出されず、公開操作順でトップへ確実に反映されるようにするため。
- 守ること: `risk_level`, WORK / STYLE / TALK分類、`content_pillar`, 重要度、カテゴリー別件数制限、元記事の公開日、収集日時、AI判定スコアはトップ4件の選定と並び順に使わない。公開条件は `status = 'approved'`, `reviewed_at is not null`, `generation_error is null`, `duplicate_of is null`, 必須公開項目、http/httpsの安全な `source_url`, `is_publishable_news_draft` の既存安全条件を維持する。
- 影響範囲: `news_drafts.reviewed_at`, `list_public_news`, トップページ3MIN NEWS, `/news-review`
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)

## 3MIN NEWSの最終タイトルは運営者が選択・修正する

- 日付: 2026年7月14日
- 状態: 決定
- 決定: 3MIN NEWSは仕事・本人・会話の3視点でタイトル候補を生成し、最終タイトルは運営者が選択・修正する。トップページの表示数は4件を維持する。
- 理由: AIが原題を短くするだけのタイトルに寄らないようにしつつ、自動公開せず運営者の編集判断を残すため。
- 影響範囲: `news_drafts`, `/news-review`, 3MIN NEWS AI下書き生成, トップページ3MIN NEWS
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)

## 3MIN NEWSは公式RSSを少数追加し下書き段階で厳選する

- 日付: 2026年7月15日
- 状態: 決定
- 決定: 3MIN NEWSの取得元は、既存の厚生労働省に加え、IPA重要なセキュリティ情報、金融庁新着情報、総務省新着情報を有効化する。CronはJST 06:00 / 12:00 / 18:00 を基本にUTC 21:00 / 03:00 / 09:00で実行し、1回の下書き候補は最大6件に抑える。
- 理由: 健康・労働だけに偏らず、店舗経営、デジタル/セキュリティ、制度変化を理容師向けに拾えるようにするため。ただし、取得元を増やしすぎず、候補作成段階で低関連・重複・類似話題を強く除外する。
- 影響範囲: `lib/news-drafts/sources.ts`, `lib/news-drafts/ingest.ts`, `vercel.json`, `/api/news-drafts/run`, トップページ3MIN NEWS
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [05_OPERATIONS_AND_GOVERNANCE.md](05_OPERATIONS_AND_GOVERNANCE.md), [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md)

## 3MIN NEWSをWORK / STYLE / TALKへ拡張する

- 日付: 2026年7月17日
- 状態: 決定
- 決定: 3MIN NEWSは経営・制度・業界ニュースを廃止せず、若い男性理容師が毎日見たくなる入口として、仕事・提案・会話に使えるWORK / STYLE / TALK相当の内部分類へ拡張する。STYLEはメンズファッション、メンズヘア・ヘアケア、頭皮ケア、メンズスキンケア、香水、身だしなみを扱い、TALKは音楽・BGM、映画・ドラマ、エンタメ、主要スポーツ、若い男性の生活トレンドを扱う。
- 理由: BARBER HUBを理容師が毎朝最初に開く場所へ近づけるには、専門的な業界情報だけでなく、施術提案、店販、接客中の自然な会話に使える短い情報が必要なため。
- 守ること: 自動公開しない。`pending` 保存、運営確認、タイトル選択・修正、`approved` 公開の流れを維持する。芸能ゴシップ、私生活暴露、SNS炎上だけの記事、容姿・年齢の揶揄、スポーツ速報の大量取得、医療・美容効果の断定、歌詞・音源・画像・動画・元記事本文の転載はしない。
- 影響範囲: `news_drafts.content_pillar`, `topic_category`, `relevance_direction`, `conversation_value`, `lib/news-drafts/sources.ts`, `lib/news-drafts/ingest.ts`, `/news-review`, `list_public_news`, 固定fallback。
- 関連PR・文書: [01_BRAND_AND_VISION.md](01_BRAND_AND_VISION.md), [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [05_OPERATIONS_AND_GOVERNANCE.md](05_OPERATIONS_AND_GOVERNANCE.md), [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md)

## 3MIN NEWSのNEW表示は公開日時から12時間だけにする

- 日付: 2026年7月15日
- 状態: 決定
- 決定: トップページの3MIN NEWSでは、運営承認で公開状態になった `reviewed_at` から12時間以内の公開ニュースだけ、既存の新聞アイコン上に小さく `NEW` を表示する。
- 理由: 元記事の配信日時ではなくBARBER HUBで公開された新しさを示し、カード外寸や4件表示を変えずに閲覧者へ新着感を伝えるため。
- 影響範囲: `components/LiveEditorialCover.tsx`, `lib/news-drafts/public-news.ts`, `news_drafts.reviewed_at`
- 関連PR・文書: [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md), [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)

## Back Roomは専用の青〜シアン〜ミントテーマを使う

- 日付: 2026年7月16日
- 状態: 決定
- 決定: Back Room内のヒーロー、選択中カテゴリ、ロゴ、FAB、投稿導線は、青〜シアン〜ミント系グラデーションを専用テーマとして使う。未選択カテゴリとスレッドカード本文は白ベースと可読性を維持する。
- 理由: 会員限定の特別感を保ちながら、若い層にも入りやすい透明感と爽やかさを出すため。既存の全体ブランドや他セクションのピンクアクセントは維持する。
- 影響範囲: `/backroom`, `/backroom/[id]`, `/backroom/setup`, `/backroom/rules`, `/post/backroom`, Back Room表示時のHeader/FAB。
- 関連PR・文書: [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md)

## 会員登録後のメール確認は専用完了画面を挟む

- 日付: 2026年7月17日
- 状態: 決定
- 決定: 新規会員登録後は、確認メール送信済み画面を表示し、メール確認リンクのcallbackでSupabaseの確認コードをセッションへ交換した後、専用のメール確認完了画面を表示する。利用者は「BARBER HUBを開く」ボタンを1回押し、その時点でServer Actionがログイン状態を再確認してからトップ画面または安全な `next` へ移動する。
- 理由: 正しいメールアドレス・パスワードでも再ログインを何度も求められる体験を避け、メールアプリ内ブラウザと通常ブラウザのCookie差異も画面上で分かるようにするため。
- 守ること: 確認リンクが使用済み、期限切れ、二重クリック、またはパラメータ不足で処理できない場合も、エラー表示前に既存の有効セッションを確認する。正常なセッションがある場合はメールアドレス・パスワードを再入力させない。callback失敗かつ有効セッションがない場合は成功時と同じ「BARBER HUBを開く」文言やトップへの直接遷移を使わず、`/login?next=...` へ案内する。成功ボタンはpending表示とdisabledで二重送信を防ぐ。`next` は相対パスだけ許可する。認証コード、token、メールアドレス、パスワード、Supabase詳細エラーはログや画面へ出さない。
- 影響範囲: `signUpAction`, `/auth/callback`, `/auth/confirmed`, `/signup/complete`, Supabase SSR Cookie処理。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [05_OPERATIONS_AND_GOVERNANCE.md](05_OPERATIONS_AND_GOVERNANCE.md), [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md)

## 会員登録後は個人アカウントとして始め、店舗機能は後から追加する

- 日付: 2026年7月18日
- 状態: 決定
- 決定: 会員登録時点では全員が個人アカウントとして始まり、Snap、記事、Back Room、Q&Aの利用に店舗登録を必須にしない。求人、事業承継、居抜き、備品売却、店舗情報管理などの店舗機能が必要なユーザーだけ、マイページからサロン機能を追加する。
- 理由: プロフィール上の職種や立場と、店舗管理権限を混同させず、気軽に参加できる導線を優先するため。
- 守ること: 会員登録時に個人会員かサロン会員かを選ばせない。プロフィールで「サロンオーナー」等を選んだだけでは店舗管理権限や求人掲載権限を与えない。店舗と個人アカウントが正式に紐づき、`barber_shops.verification_status = 'verified'` になった場合だけ店舗機能を利用可能にする。申請中店舗は「確認中」と表示し、認証済み店舗として扱わない。
- 影響範囲: 会員登録、プロフィール設定、マイページ、店舗検索、店舗管理申請、求人掲載、開業・承継掲載。
- 関連PR・文書: [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md), [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)

## 店舗管理申請は管理者が審査してから店舗機能を有効化する

- 日付: 2026年7月18日
- 状態: 決定
- 決定: 店舗管理申請は `/admin/barber-shops/claims` の非公開管理画面で確認し、管理者が承認した場合だけ `barber_shops.owner_user_id` を申請者ID、`verification_status` を `verified` に更新する。承認時は同じ `shop_id` のほかのpending申請を、同一ユーザーの重複分も含めて自動的に `rejected` にし、却下時は店舗自体を削除せず、申請を `rejected` にする。
- 理由: プロフィール区分や申請送信だけで店舗管理権限を付与せず、正当な管理者確認を挟むため。
- 守ること: 対象claimがpendingであることをDB側で再確認する。店舗が別ユーザーのverified店舗であれば承認しない。競合するpending申請の自動却下は、店舗のowner更新と同じRPC・同じトランザクションで行う。審査RPCはservice_roleだけにEXECUTEを許可し、Server Action側でも管理者allowlistを確認する。`reviewed_at`, `reviewed_by`, `review_note` を保存する。
- 影響範囲: `barber_shop_claims`, `barber_shops.owner_user_id`, `barber_shops.verification_status`, `/admin/barber-shops/claims`, マイページのサロン機能表示。
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md), [05_OPERATIONS_AND_GOVERNANCE.md](05_OPERATIONS_AND_GOVERNANCE.md), [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md)
