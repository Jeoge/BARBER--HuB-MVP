# Data and Database

この文書は、Supabase Database / Auth / Storageの設計方針をまとめます。migration適用手順の詳細は [SUPABASE_DEPLOYMENT.md](SUPABASE_DEPLOYMENT.md) を正とします。

## 基本方針

- Supabase Authでユーザーを識別する。
- RLSを前提にし、クライアントの条件分岐だけに頼らない。
- クライアントコードでは公開可能なanon / publishable keyのみを使う。
- `service_role` keyをクライアントへ入れない。
- 管理・審査・危険な更新は、RLS、RPC、サーバー側処理で制御する。
- 本番migrationとseedを分ける。

## 主なテーブル

実装やmigrationで確認できる主要テーブルは次の通りです。

| 領域 | テーブル |
| --- | --- |
| プロフィール | `profiles` |
| Snap | `snaps`, `snap_images`, `snap_reactions`, `snap_comments`, `snap_comment_likes`, `saved_snaps` |
| フォロー | `follows` |
| 記事 | `articles`, `article_images`, `article_reactions`, `article_comments` |
| 通知 | `notifications` |
| Back Room | `backroom_profiles`, `backroom_posts`, `backroom_comments` |
| Q&A | `qa_questions`, `qa_answers` |
| 求人 | `job_posts` |
| 事業承継 | `succession_posts`, `succession_post_private` |
| 広告 | `advertising_inquiries` |
| 問い合わせ | `support_inquiries` |
| 店舗ディレクトリ | `barber_shops`, `barber_shop_claims`, `barber_shop_import_batches`, `barber_shop_import_rows` |
| ニュース下書き | `news_drafts` |

## Storage

主なStorage bucket:

- `snap-images`
- `profile-images`
- `article-images`

方針:

- 画像以外を受け付けない。
- サイズ上限を設ける。
- 危険なファイル名をそのまま使わない。
- ユーザーごとのフォルダを使い、本人以外がアップロードできないようにする。
- public URLやNext/Imageで `undefined` や外部URL起因のクラッシュが起きないようにする。
- Snapの新規アップロードは圧縮後の `image/webp` または `image/jpeg` に限定する。
- 記事の新規アップロードも圧縮後の `image/webp` または `image/jpeg` に限定する。

## Snap画像

`snaps` には既存互換用の `image_url` / `image_path` が残ります。

複数画像は `snap_images` に保存します。

主な設計:

- 1つのSnapにつき `display_order` 0〜3の最大4枚。
- 同一Snap内で `display_order` は重複させない。
- `storage_path`, `public_url`, `width`, `height`, `byte_size`, `mime_type` を保持する。
- 新規投稿では1枚目を `snaps.image_url` / `snaps.image_path` にも保存し、既存表示との互換性を保つ。
- 読み取り時は `snap_images` があれば順序順に使い、なければ既存の `image_url` を1枚目として使う。
- 読み取り時は `storage_path` から現在のStorage URLを組み立てられる場合はそれを優先し、保存済み `public_url` は互換fallbackとして扱う。
- 新規Snap投稿では、UIでカテゴリーを選択させず、既存の安全なカテゴリー値「日常」をServer Action側で保存する。既存Snapのカテゴリー値は変更しない。
- 既存の1枚Snapは自動移行しない。

## 記事画像、YouTube URL、EDITOR'S PICK

`articles` には既存互換用の `image_url` / `image_path` が残ります。複数画像のメタデータは `article_images` に保存し、`articles.image_path` は代表画像互換として1枚目のStorage pathを保持します。

主な設計:

- 1記事につき画像は最大4枚。
- 複数画像は `article_images` に `display_order` 0〜3で保存し、同一記事内で `display_order` と `storage_path` は重複させない。
- 記事画像bucketは `article-images`。
- Storage pathは `userId/articleId/timestamp-index-random.ext` とし、ユーザー提供ファイル名を使わない。
- 許可MIMEは `image/webp` と `image/jpeg`。
- 1枚あたりのStorage上限は2MB。
- 1記事あたりの圧縮後画像合計はアプリ側で約4MB以内に制御する。
- `article-images` bucketはprivateにする。
- 新規投稿では `image_path` にStorage object pathを保存し、恒久的なStorage公開URLを `image_url` へ保存しない。
- 公開中かつ未削除の記事を表示するときだけ、サーバー側で30分程度の短時間signed URLを生成して表示用 `image_url` と `images[].url` として扱う。
- `image_path` がなく既存の `image_url` だけを持つ記事は、既存互換としてそのURLを表示に使える。
- 記事保存失敗、保存確認失敗、例外発生時は、今回アップロードしたStorage objectを削除する。
- `articles.youtube_url` は対象カテゴリの記事だけが持てる任意URL。アプリ側でYouTubeドメインと動画IDを検証し、直接動画アップロードや動画Storageは行わない。
- EDITOR'S PICK選定日時は `articles.editor_pick_at` に保存する。booleanではなく日時にすることで、最新選定順と将来の解除を扱えるようにする。
- 手動並べ替えUIはまだ実装しない。表示順は `editor_pick_at desc` を基本にする。

## 店舗ディレクトリのDB設計

主要テーブル:

- `barber_shops`
- `barber_shop_claims`

主要RPC / 関数:

- `get_public_barber_shop_count`
- `list_barber_shop_municipalities`
- `request_barber_shop_claim`
- `create_barber_shop_with_claim`
- `review_barber_shop_claim`
- `normalize_barber_shop_name`

主な設計:

- 公開店舗は `is_public = true`、`is_deleted = false` を前提に表示する。
- 論理削除を使い、物理削除を安易に使わない。
- 重複候補は `is_duplicate` / `duplicate_of` で扱う。
- `verification_status` は `unverified`, `unclaimed`, `pending`, `verified`, `rejected`, `suspended` を使う。CSV取込店舗はCSVの値にかかわらず必ず `unverified` として保存し、CSVから `verified` や `pending` などにはできない。既存の `unclaimed` は互換値として残す。
- CSV取込で必要な電話番号と掲載元は `barber_shops.phone`, `barber_shops.source` に保存する。市区町村は既存の `municipality` を使い、CSV列「市区町村」をここへ対応させる。
- 店舗管理申請の審査メモは `barber_shop_claims.review_note` に保存する。`reviewed_at`, `reviewed_by` と合わせて管理者確認履歴として扱う。
- 重複確認用に `normalized_name`, `normalized_address`, `normalized_phone` を使う。電話番号はtextとして保存し、先頭0を落とさない。
- 一般ユーザーの申請は即時verifiedにならない。
- 認証済みオーナーだけが自店舗の編集対象になる。
- 検索はページネーションを使い、全件取得にしない。

## RLSの原則

- `profiles`: 本人だけが作成・編集できる。
- `snaps`: 投稿者本人だけが投稿・更新・削除できる。
- `snap_reactions`: 通常SELECTは反応した本人の行だけ許可する。投稿者本人は個別user_idを含む行を読まず、`get_my_snap_reaction_counts` で自分のSnapが受け取った集計数だけ確認する。INSERT/DELETEは本人のみで、自分のSnapへのThanks・いいねはINSERTできない。
- `article_reactions`: 通常SELECTは反応した本人の行だけ許可する。投稿者本人は個別user_idや保存者を読まず、`get_my_article_reaction_counts` で自分の記事が受け取った集計数だけ確認する。自分の記事へのThanks・いいねは保存・集計対象にせず、自分の記事の保存は許可する。
- `snap_comments`: 公開中かつ削除されていないSnapのコメントだけをanon / authenticatedが閲覧できる。INSERTはauthenticatedだけで、投稿対象も公開中かつ未削除Snapに限定する。削除は本人のみ。
- `get_public_snap_comment_counts`: 公開中かつ未削除Snapの `snap_id` と `comment_count` だけをまとめて返す公開集計RPC。個別コメント、本文、user_idは返さない。
- `snap_comment_likes`: Snapコメントへのいいね。通常SELECTは押した本人の行だけ許可する。INSERT/DELETEは本人のみで、自分のコメント、非公開または削除済みSnapのコメントにはINSERTできない。
- `get_public_snap_comment_like_counts`: 指定された公開Snapコメントの `comment_id` と `like_count` だけを返す公開集計RPC。誰が押したか、user_id、created_atは返さない。
- `notifications`: アプリ内通知。recipient本人だけがSELECTでき、recipient本人だけが `read_at` を更新できる。クライアントから任意のINSERT/DELETEは許可しない。
- `list_my_notifications` / `get_unread_notification_count`: 本人の通知一覧と未読件数だけを返すRPC。削除済みまたは非公開になったSnap/記事に紐づく通知は返さない。
- `saved_snaps`: 本人だけが閲覧・作成・削除でき、削除済みまたは非公開Snapは保存対象にしない。
- `snap_images`: 公開中かつ未削除Snapに属する画像情報だけをanon / authenticatedが閲覧できる。投稿者本人は自分のSnap画像情報を閲覧・追加・更新・削除できる。
- `snap-images`: 本人フォルダだけアップロードできる。新規Snap画像は `image/webp` / `image/jpeg` の圧縮済みファイルに限定する。
- `articles`: 公開中かつ未削除の記事、または本人の記事だけを閲覧できる。本人によるINSERT / UPDATEでも `editor_pick_at` を直接設定・変更できないようにする。
- `article_images`: 公開中かつ未削除記事、または本人の記事に属する画像メタデータだけを閲覧できる。追加・更新・削除は本人の記事に限定し、Storage pathは `userId/articleId/` 配下だけを許可する。
- `article-images`: private bucket。本人フォルダだけアップロード、更新、削除できる。authenticatedは本人フォルダのobject行だけをSELECTできる。公開記事画像の表示は、DB上の公開中・未削除記事確認後にサーバー側で発行する30分程度の短時間signed URLで行う。新規記事画像は `image/webp` / `image/jpeg` の圧縮済みファイルに限定する。
- `barber_shops`: 公開情報は閲覧可能。一般ユーザーの直接INSERT / DELETEは許可しない。認証済みオーナーのUPDATEは、店舗名、検索用店舗名、都道府県、市区町村、住所、郵便番号、電話番号の列に限定する。
- `barber_shop_claims`: 申請者本人が自分の申請を確認・作成できる。
- `barber_shop_import_batches`, `barber_shop_import_rows`: RLSを有効化し、anon / authenticated向けpolicyは作らない。CSV取込は管理者allowlist確認後、サーバー側service role clientと専用RPCで実行する。
- CSV取込RPCは `barber_shops.verification_status` へ常に `unverified` を書き込む。`source_type = 'imported'`, `verification_status = 'verified'`, `owner_user_id is null` の組み合わせはDB制約で禁止する。
- 店舗管理申請の審査RPC `review_barber_shop_claim` はservice_roleだけにEXECUTEを許可し、一般ユーザーは直接呼べない。Server Action側でも `BARBER_HUB_ADMIN_USER_IDS` または互換allowlistで管理者判定する。
- 店舗管理申請の承認では、対象claimがpendingであること、対象店舗が別ユーザーのverified店舗でないことをDB側で再確認してから `owner_user_id` と `verification_status` を更新する。同じ `shop_id` のほかのpending申請は、同一ユーザーの重複分も含め、同一RPC内で `rejected` へ自動却下する。
- 店舗管理申請の却下では、対象claimだけをrejectedにし、対象店舗は削除しない。ほかにpending申請がなければ店舗の `verification_status` を `unverified` へ戻す。
- 管理者審査はクライアントから直接行わない。

## migration運用

- migrationは `supabase/migrations` に追加する。
- 適用済みmigrationを編集しない。
- 危険なSQLを含む場合は自動停止または明示確認にする。
- 本番で `supabase db reset` を実行しない。
- `DROP TABLE`、`DROP COLUMN`、`TRUNCATE`、条件なしDELETEなどは特に危険として扱う。
- 本番migrationはGitHub `production` Environmentの承認後に適用する。
- FREEプランでは自動日次バックアップを前提にしない。
- バックアップファイルを公開GitHub、Git管理、公開可能なActions Artifactへ保存しない。

## CSV取込設計

CSV取込管理は `/admin/barber-shops/import` の非公開管理画面で扱います。直接本番テーブルへ投入するだけの画面にはしません。

必要な考え方:

- 取込前プレビューを行う。
- 重複候補を確認できるようにする。
- エラー行を確認できるようにする。
- 取込履歴を残す。
- 取込バッチ単位で管理できるようにする。
- 既存店舗の上書き、重複統合、閉店扱いを明示的に分ける。
- 本番seedやmigrationと混同しない。

今回の実装範囲:

- CSV列「店名」「都道府県」「市区町村」「住所」「電話番号」「掲載元」「認証状態」を受け付ける。
- CSV取込機能は全国共通とし、特定の都道府県以外であることだけを理由に登録不可にはしない。福岡県CSV投入時は、都道府県別件数と想定外都道府県の警告表示で混入を確認する。
- 「市区町村」は既存の `barber_shops.municipality` へ保存する。
- 「市区町村」が空欄でも、掲載元が福岡市または北九州市で、住所が既知の区名から始まる場合だけ `福岡市西区` のように市区町村を補完する。それ以外の推測補完はしない。
- 「未認証」は `verification_status = 'unverified'` として保存し、`owner_user_id` はNULLのままにする。
- CSVの「認証状態」に「認証済み」「verified」「申請中」「pending」「却下」「rejected」「停止中」「suspended」など未認証以外の値が入っていてもDBへ反映しない。安全のため、該当行はプレビューでエラーにして登録しない。
- `verified` への変更は、今後の運営による店舗認証申請の承認処理だけで行う。
- 住所と電話番号が空欄でも取込可能にする。店名、都道府県、市区町村、掲載元は必須とする。
- 電話番号が入力されている場合は、正規化後に先頭0を含む10桁または11桁の数字であることを確認し、不正な形式はプレビューでエラーにして登録しない。
- プレビューでは、総行数、正常件数、エラー件数、完全一致重複、重複候補、都道府県別件数、想定外都道府県件数、市区町村別件数、空欄件数、電話番号形式不正件数、同一店名・同一住所候補を確認できるようにする。
- 完全一致重複は、正規化した店名、都道府県、市区町村、住所、電話番号で判定し、登録実行時にも再確認して二重登録しない。
- 類似候補は、電話番号一致、同一都道府県内の店名+住所、市区町村+住所などで候補表示する。候補行は管理者が確認してチェックした場合だけ登録対象に含める。
- CSVの文字コードはUTF-8を基本とし、ヘッダー判定でShift_JISも試す。
- 福岡県理容生活衛生同業組合 久留米支部組合員名簿を掲載元にする行は、久留米市の全理容所を保証する行政データとは扱わない。

## seed運用

- 通常seedやテストデータを本番へ自動投入しない。
- 店舗データ投入はmigrationとは別の手動workflowまたは手動手順に分ける。
- idempotentな検証用seedを使う場合でも、本番投入の目的、件数、削除方法をPR本文に書く。

## ニュース下書き設計

`news_drafts` は、3MIN NEWS自動下書き作成の非公開キューです。

主な設計:

- RSS / Atomなどに含まれるタイトル、URL、公開日時、短い概要だけを保存する。
- 元記事本文全体は保存しない。
- `source_url` を一意にして、同じURLの重複登録を防ぐ。
- `duplicate_key` と `duplicate_of` で、タイトル違いの重複候補を扱えるようにする。
- `status` は `pending`, `approved`, `rejected` を使う。
- `approved` だけを公開候補にする。
- `title_candidates` は内部編集用のJSONとして、`work`, `personal`, `conversation` の3視点タイトル候補を保存できる。既存下書きではnullでもよい。
- `primary_angle` はAIおすすめ候補として `work`, `personal`, `conversation` のいずれかを保存できる。既存下書きではnullでもよい。
- `content_pillar` は内部編集用として `work`, `style`, `talk` のいずれかを保存する。既存下書きは `work` として互換扱いにする。
- `topic_category` は `mens_fashion`, `mens_hair`, `haircare_scalp`, `mens_grooming`, `music_bgm`, `entertainment`, `sports` などの詳細トピックを保存する。
- `relevance_direction` は `direct`, `proposal`, `conversation` のいずれかを保存し、理容師との関連が仕事・提案・会話のどれかを確認できるようにする。
- `conversation_value` は、接客中の会話、提案、店内体験づくりにどう使えるかを運営確認用に保存する。
- 既存下書きで `title_candidates` と `primary_angle` がnullでも、現在の `draft_title` を編集・公開できる。
- `pending`, `rejected`, 生成エラーあり、重複候補、不完全な下書きは公開しない。
- 一般ユーザー向けRLS policyは作らず、anon / authenticatedから閲覧・作成・更新・削除できない。
- 収集、AI生成、確認画面のDB操作はサーバー専用のservice role clientで行う。
- 一般ユーザー向け表示は、読み取り専用RPC `list_public_news` と `get_public_news_by_id` で公開可能な項目だけを返す。
- 公開RPCは `id`, `draft_title`, `draft_summary`, `draft_body`, `morning_tip`, `conversation_tip`, `category`, `source_name`, `source_url`, `reviewed_at` だけを返す。
- `content_pillar`, `topic_category`, `relevance_direction`, `conversation_value`, `title_candidates`, `primary_angle`, `source_excerpt`, `relevance_reason`, `fact_check_notes`, `generation_error`, `reviewed_by`, `duplicate_key`, `duplicate_of` などの内部情報は公開RPCで返さない。
- `list_public_news` は公開成功直後の最新ニュースを候補に含めたうえで、`risk_level = high` を `reviewed_at` より優先し、内部の `content_pillar` を使って残りのWORK/STYLE/TALKの偏りを抑えるが、分類値やrisk値自体は一般ユーザーへ返さない。
- 2026年7月時点では、トップページの `NEW` 表示は運営承認で公開状態になった時刻として `reviewed_at` を使う。公開後12時間以内の判定に新規DBカラムは追加しない。
- 取得元の `sourceGroup`, `contentPillar`, `topicHint`, `priority`, `maxCandidatesPerRun`, `allowedSourceHosts` はコード上の収集設定として扱い、現時点ではDBテーブル化しない。

## 要確認

- 管理者権限モデル。
- 店舗情報の修正・閉店・重複統合の運用画面。
- Back Roomや投稿系の管理者モデレーションRLS。
