# Supabase Deployment

BARBER HUBの本番Supabase migrationは、当面は完全自動ではなく、GitHubの`production` Environment承認を挟んで適用します。

## 通常の流れ

1. Codexが`supabase/migrations/`にmigration SQLを作ります。
2. CodexがPull Requestを作ります。
3. Pull Requestで`Supabase checks`が走ります。
4. オーナーがPull Requestを確認して`main`へマージします。
5. `Supabase production migration` workflowが起動し、`production` Environmentの承認待ちになります。
6. オーナーがGitHub上で`Review deployments`からApproveします。
7. GitHub Actionsが`supabase db push`で本番Supabaseへmigrationを適用します。
8. 適用後に公開APIのhealth checkを実行します。

## migrationを作る場所

migrationは必ずここに置きます。

```text
supabase/migrations/YYYYMMDDHHMM_description.sql
```

例:

```text
supabase/migrations/202607110001_add_example_table.sql
```

一度本番に適用したmigrationファイルは後から編集しません。GitとSupabaseのmigration履歴がズレるためです。修正が必要な場合は、新しいmigrationを追加します。

## seedとmigrationの違い

`supabase/migrations/`は本番schema変更用です。

`supabase/seeds/`や`supabase/seed.sql`は、ローカル開発・CI・検証データ用です。`Supabase production migration` workflowはseedを本番へ投入しません。`supabase db push --include-seed`も使いません。

店舗データなどの本番投入は、migrationとは別の手動workflowまたは将来の管理画面で扱います。mainへマージしただけで通常seedやテストデータが本番へ入る構成にはしません。

## Pull Requestで確認されること

`Supabase checks` workflowはPull Requestで次を確認します。

- migrationファイル名が`YYYYMMDDHHMM_description.sql`形式か
- migration timestampが重複していないか
- `DROP TABLE`
- `DROP COLUMN`
- `TRUNCATE`
- 条件なしの`DELETE`
- 条件なしの`UPDATE`
- `pnpm build`

以下は警告として表示します。警告が出たらPR本文で理由と影響を説明してください。

- `ALTER COLUMN TYPE`
- `SET NOT NULL`
- `DISABLE ROW LEVEL SECURITY`
- `DROP POLICY`

このチェックは最低限の自動ガードです。SQLの安全性を完全に証明するものではありません。危険なmigrationはPRレビューと本番Environment承認で止めます。

## mainマージ後に起きること

`main`へpushされ、かつ`supabase/migrations/**`に変更がある場合だけ、`Supabase production migration` workflowが起動します。

workflowは`environment: production`を使います。GitHub側の`Production` Environmentはこの`production`指定で解決されます。

現在のEnvironment設定:

- required reviewer: `Jeoge`
- deployment branch policy: `main`
- admins bypass: GitHub上は許可状態

承認前は本番Secretがjobへ渡らないため、PRや外部forkから本番DBへ接続できません。

## 本番workflowで実行すること

本番workflowはApprove後に次を実行します。

```sh
supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
supabase migration list --linked --password "$SUPABASE_DB_PASSWORD"
supabase db push --dry-run --yes --password "$SUPABASE_DB_PASSWORD"
supabase db push --yes --password "$SUPABASE_DB_PASSWORD"
supabase db push --dry-run --yes --password "$SUPABASE_DB_PASSWORD"
node scripts/verify-supabase-production-health.mjs
```

本番workflowで実行しないこと:

```sh
supabase db reset
supabase db push --include-seed
```

## 必要なGitHub Environment Secrets

値はチャットへ貼らず、GitHubのSecret画面へ直接入力してください。

`production` Environmentに登録するSecret:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PUBLISHABLE_KEY`

`SUPABASE_PUBLISHABLE_KEY`は公開可能キーですが、Actionsではログへ出さないためEnvironment Secretとして扱います。

`SUPABASE_DB_PASSWORD`は本番Postgresへ接続するために必要です。`SUPABASE_ACCESS_TOKEN`はSupabase Management API用、`SUPABASE_PROJECT_REF`は対象Project識別用であり、Postgres自体の認証にはなりません。

このworkflowでは、DBパスワードを次のCLIコマンドへ渡します。

- `supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"`
- `supabase migration list --linked --password "$SUPABASE_DB_PASSWORD"`
- `supabase db push --dry-run --yes --password "$SUPABASE_DB_PASSWORD"`
- `supabase db push --yes --password "$SUPABASE_DB_PASSWORD"`

Supabase DashboardでDBパスワードを表示できず`Reset password`しか出ない場合は、既存パスワードを復元するのではなく、新しいDBパスワードへリセットして、その値をGitHub Environment Secretへ登録します。値はチャット、PR本文、ログへ貼らないでください。

Environment Variable:

- `SUPABASE_BACKUP_CONFIRMED_AT`

これは本番へ実際に`supabase db push --yes`する時だけ必須です。`workflow_dispatch`で`dry_run_only=true`を選んだ場合は不要です。

例:

```text
2026-07-10 private SQL export confirmed
```

この値が空の場合、実適用前に本番migration workflowは失敗します。形式だけの値や、実際には存在しないバックアップ確認日を入れないでください。

## 初回設定手順

値はチャットへ貼らず、GitHubとSupabaseの画面へ直接入力してください。

### 1. Supabase Access Tokenを作成

1. Supabase Dashboardを開きます。
2. 右上のアカウントメニューを開きます。
3. `Access Tokens`を開きます。
4. 新しいtokenを作成します。
5. 表示されたtokenをコピーします。
6. このtokenはチャットへ貼らず、次のGitHub Secretへ入力します。

Secret名:

```text
SUPABASE_ACCESS_TOKEN
```

### 2. Supabase Project Refを確認

1. Supabase DashboardでBARBER HUBの本番Projectを開きます。
2. Project Settingsを開きます。
3. GeneralまたはAPI設定でProject Refを確認します。
4. GitHub Secretへ入力します。

Secret名:

```text
SUPABASE_PROJECT_REF
```

### 3. Database Passwordを再設定して登録

1. Supabase Dashboardで本番Projectを開きます。
2. Database settingsを開きます。
3. `Reset password`から新しいDatabase passwordを設定します。
4. 新しいpasswordをGitHub Secretへ入力します。
5. 既存アプリがDB passwordを直接使っていないことを確認します。BARBER HUBのNext.js/Vercel接続は通常Supabase URLとpublishable keyを使うため、このリセットはアプリの公開API接続とは別です。

Secret名:

```text
SUPABASE_DB_PASSWORD
```

### 4. Publishable keyを登録

1. Supabase Dashboardで本番Projectを開きます。
2. API settingsを開きます。
3. Publishable keyまたはanon keyを確認します。
4. GitHub Secretへ入力します。

Secret名:

```text
SUPABASE_PUBLISHABLE_KEY
```

### 5. バックアップ方法を確認

最初の本番migration前に、Supabase Dashboardで本番DBのバックアップ状態を確認します。

BARBER HUBの現在のSupabaseはFREEプランです。FREEプランでは、自動の日次バックアップやPITRが常に使える前提にしないでください。

`SUPABASE_BACKUP_CONFIRMED_AT`は「実際に復旧に使えるバックアップ、エクスポート、またはアップグレード後のバックアップ機能を確認した」場合だけ登録します。形式だけの値は登録しません。

1. Supabase Dashboardで本番Projectを開きます。
2. `Database`を開きます。
3. `Backups`を開きます。
4. FREEプランで利用できるバックアップ/復旧方法を確認します。
5. 必要なら、Supabase CLIやDashboardから本番DBのprivate exportを取得します。
6. バックアップファイルは公開GitHubリポジトリ、Git管理ファイル、公開可能なActions Artifactへ保存しません。
7. 復旧に使える場所へ安全に保管できた場合だけ、確認した日付と方法をGitHub Environment Variableへ登録します。

Variable名:

```text
SUPABASE_BACKUP_CONFIRMED_AT
```

値の例:

```text
2026-07-10 private SQL export confirmed
```

### 6. GitHub Environment Secretsを登録

1. GitHubで`Jeoge/BARBER--HuB-MVP`を開きます。
2. `Settings`を開きます。
3. `Environments`を開きます。
4. `Production`を開きます。
5. `Environment secrets`へ上記4つのSecretを登録します。
6. 実際のバックアップ/エクスポート確認がある場合だけ、`Environment variables`へ`SUPABASE_BACKUP_CONFIRMED_AT`を登録します。

## Approve方法

1. migration PRを`main`へマージします。
2. GitHubの`Actions`を開きます。
3. `Supabase production migration`を開きます。
4. `Review deployments`を押します。
5. `Production`にチェックします。
6. `Approve and deploy`を押します。

Approveしなければ本番migrationは実行されません。

## workflow再実行

失敗した場合:

1. GitHubの`Actions`を開きます。
2. 該当する`Supabase production migration` runを開きます。
3. エラーログを確認します。
4. Secret不足、migration履歴ズレ、SQLエラーを修正します。
5. `Re-run jobs`を押します。

手動確認だけしたい場合:

1. `Actions`を開きます。
2. `Supabase production migration`を選びます。
3. `Run workflow`を押します。
4. `dry_run_only`を`true`にします。
5. 実行します。

`dry_run_only=true`では本番migrationを適用しません。

`dry_run_only=true`で確認できること:

- Secretsが有効か
- Supabase projectへlinkできるか
- remote migration history
- 未適用migration
- migration履歴のズレ
- `supabase db push --dry-run`

`dry_run_only=true`では`SUPABASE_BACKUP_CONFIRMED_AT`は不要です。

`dry_run_only=false`または`main`マージ後の本番適用では、`SUPABASE_BACKUP_CONFIRMED_AT`が空の場合に`supabase db push --yes`前でworkflowが失敗します。

## 手動適用済みmigrationとの履歴整合

Supabase SQL Editorで手動適用したmigrationは、schemaは存在していても`supabase_migrations.schema_migrations`に履歴が無い場合があります。

Supabase CLIの`db push`は、ローカルの`supabase/migrations`とremoteの`supabase_migrations.schema_migrations`を比較します。履歴が無いと、既に手動適用済みのSQLを再実行しようとして失敗することがあります。

確認手順:

1. Environment Secretsを設定します。
2. `Supabase production migration`を`workflow_dispatch`で起動します。
3. `dry_run_only=true`にします。
4. `supabase migration list --linked`の結果を確認します。
5. 手動適用済みのmigrationがremote未適用として出た場合、先に本番DBで対象テーブル・関数・RLSが本当に存在することを確認します。
6. 確認できたmigrationだけ、Supabase CLIの公式手順で履歴をrepairします。

例:

```sh
supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
supabase migration repair 202607100001 --status applied --password "$SUPABASE_DB_PASSWORD"
```

`migration repair`はSQLを実行せず、migration履歴だけを修正します。実体確認なしに`applied`へしないでください。

店舗ディレクトリmigrationの場合、少なくとも次を確認してからrepairします。

- `barber_shops`
- `barber_shop_claims`
- `get_public_barber_shop_count`
- `list_barber_shop_municipalities`

## 失敗時に見る場所

- GitHub Actionsの該当run
- `Check Supabase migration files`
- `Show remote migration status`
- `Dry-run pending migrations`
- `Apply production migrations`
- `Run production health check`

GitHub Actions Summaryにも、seedを適用しないこと、`db reset`を使わないこと、dry-runかどうかが表示されます。

## 緊急停止

本番migrationを止めたい場合:

1. `Review deployments`でApproveしない。
2. Actions runを`Cancel workflow`する。
3. 必要なら`Settings > Environments > Production`でSecretを一時削除する。
4. 必要なら`.github/workflows/supabase-production-migrate.yml`を無効化するPRを作る。

本番DBを戻す目的で`supabase db reset`を使ってはいけません。復旧が必要な場合はSupabaseのBackups/PITRを確認します。

## 禁止事項

- `.env.local`をGitへcommitしない
- service role keyをクライアントコードへ書かない
- DB passwordやaccess tokenをログへ出さない
- Secretの値をPR本文やチャットへ貼らない
- 本番で`supabase db reset`を実行しない
- 本番へ通常seedを自動投入しない
- 実体確認なしで`migration repair --status applied`を実行しない
- 実際のバックアップが無いのに`SUPABASE_BACKUP_CONFIRMED_AT`へ形式だけの値を入れない
- バックアップファイルを公開GitHubリポジトリ、Git管理ファイル、公開可能なActions Artifactへ保存しない

## 公式ドキュメント

- Supabase database migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Supabase CLI `db push`: https://supabase.com/docs/reference/cli/supabase-db-push
- Supabase CLI `migration repair`: https://supabase.com/docs/reference/cli/supabase-migration-repair
