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
| Snap | `snaps`, `snap_reactions`, `snap_comments`, `saved_snaps` |
| フォロー | `follows` |
| 記事 | `articles`, `article_reactions`, `article_comments` |
| Back Room | `backroom_profiles`, `backroom_posts`, `backroom_comments` |
| Q&A | `qa_questions`, `qa_answers` |
| 求人 | `job_posts` |
| 事業承継 | `succession_posts`, `succession_post_private` |
| 広告 | `advertising_inquiries` |
| 問い合わせ | `support_inquiries` |
| 店舗ディレクトリ | `barber_shops`, `barber_shop_claims` |
| ニュース下書き | `news_drafts` |

## Storage

主なStorage bucket:

- `snap-images`
- `profile-images`

方針:

- 画像以外を受け付けない。
- サイズ上限を設ける。
- 危険なファイル名をそのまま使わない。
- ユーザーごとのフォルダを使い、本人以外がアップロードできないようにする。
- public URLやNext/Imageで `undefined` や外部URL起因のクラッシュが起きないようにする。

## 店舗ディレクトリのDB設計

主要テーブル:

- `barber_shops`
- `barber_shop_claims`

主要RPC / 関数:

- `get_public_barber_shop_count`
- `list_barber_shop_municipalities`
- `request_barber_shop_claim`
- `create_barber_shop_with_claim`
- `normalize_barber_shop_name`

主な設計:

- 公開店舗は `is_public = true`、`is_deleted = false` を前提に表示する。
- 論理削除を使い、物理削除を安易に使わない。
- 重複候補は `is_duplicate` / `duplicate_of` で扱う。
- `verification_status` は `unclaimed`, `pending`, `verified`, `rejected`, `suspended` を使う。
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
- `saved_snaps`: 本人だけが閲覧・作成・削除でき、削除済みまたは非公開Snapは保存対象にしない。
- `snap-images`: 本人フォルダだけアップロードできる。
- `barber_shops`: 公開情報は閲覧可能。編集は認証済みオーナーに限定する。
- `barber_shop_claims`: 申請者本人が自分の申請を確認・作成できる。
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

CSV取込管理は決定済み・未実装です。実装するときは、直接本番テーブルへ投入するだけの画面にしません。

必要な考え方:

- 取込前プレビューを行う。
- 重複候補を確認できるようにする。
- エラー行を確認できるようにする。
- 取込履歴を残す。
- 取込バッチ単位で管理できるようにする。
- 既存店舗の上書き、重複統合、閉店扱いを明示的に分ける。
- 本番seedやmigrationと混同しない。

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
- 既存下書きで `title_candidates` と `primary_angle` がnullでも、現在の `draft_title` を編集・公開できる。
- `pending`, `rejected`, 生成エラーあり、重複候補、不完全な下書きは公開しない。
- 一般ユーザー向けRLS policyは作らず、anon / authenticatedから閲覧・作成・更新・削除できない。
- 収集、AI生成、確認画面のDB操作はサーバー専用のservice role clientで行う。
- 一般ユーザー向け表示は、読み取り専用RPC `list_public_news` と `get_public_news_by_id` で公開可能な項目だけを返す。
- 公開RPCは `id`, `draft_title`, `draft_summary`, `draft_body`, `morning_tip`, `conversation_tip`, `category`, `source_name`, `source_url`, `reviewed_at` だけを返す。
- `title_candidates`, `primary_angle`, `source_excerpt`, `relevance_reason`, `fact_check_notes`, `generation_error`, `reviewed_by`, `duplicate_key`, `duplicate_of` などの内部情報は公開RPCで返さない。

## 要確認

- 管理者権限モデル。
- 店舗データのCSV取込方式。
- 店舗情報の修正・閉店・重複統合の運用画面。
- Back Roomや投稿系の管理者モデレーションRLS。
