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

## 要確認

- 管理者権限モデル。
- 店舗データのCSV取込方式。
- 店舗情報の修正・閉店・重複統合の運用画面。
- Back Roomや投稿系の管理者モデレーションRLS。
