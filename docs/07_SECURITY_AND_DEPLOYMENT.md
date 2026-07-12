# Security and Deployment

この文書は、BARBER HUBのセキュリティ、Secrets、Vercel、GitHub Actions、Supabase本番運用の概要をまとめます。Supabase migrationの詳細手順は [SUPABASE_DEPLOYMENT.md](SUPABASE_DEPLOYMENT.md) を正とします。

## 基本方針

- 秘密情報をGit、docs、ログ、画面表示へ出さない。
- クライアントコードでは公開可能なanon / publishable keyだけを使う。
- `service_role` keyをクライアントコードへ入れない。
- RLSとRPCで権限を守る。
- 本番DB変更は承認制にする。
- 本番データを削除・初期化しない。

## Secrets

Secretとして扱うもの:

- Supabase access token
- Supabase project ref
- Supabase DB URL
- DB passwordを含む接続文字列
- Vercelや外部サービスのtoken

守ること:

- `.env.local` をGitに含めない。
- Secret値をPR本文やdocsに書かない。
- Actionsログへ接続文字列やパスワードを出さない。
- `SUPABASE_DB_URL` のパスワード部分はURLエンコードする。
- チャットへSecretを貼らせない。

## Supabase本番migration

現在の方針:

1. Codexがmigrationを作成する。
2. Pull Requestで確認する。
3. ユーザーがmainへマージする。
4. GitHub Actionsが `production` Environmentの承認待ちになる。
5. ユーザーがGitHub上でApproveする。
6. 本番Supabaseへmigrationを適用する。

禁止:

- mainマージだけで即時に本番DB変更する完全自動運用。
- 本番で `supabase db reset` を実行すること。
- 通常seedやテストデータの自動投入。
- 既存データの削除や初期化。
- 危険SQLを含むmigrationを無確認で適用すること。

## GitHub Actions

確認すること:

- Supabase CLIは固定バージョンを使う。
- PRではmigration check、dry-run、buildを行う。
- 本番適用は `production` Environmentの承認を必要にする。
- `dry_run_only=true` では本番DBを変更しない。
- 実際に `supabase db push --yes` を行うときだけ、バックアップ確認を必須にする。
- GitHub ActionsではSession Pooler接続を使い、IPv6 direct connection前提にしない。

## バックアップ

Supabase FREEプランでは、自動日次バックアップやPITRを前提にしない。

守ること:

- 最初の本番適用前にバックアップ方法を確認する。
- 実バックアップがないのに形式だけの確認値を使わない。
- バックアップファイルを公開GitHub、Git管理ファイル、公開可能なActions Artifactへ保存しない。
- バックアップの保存先、権限、削除期限を運用で決める。

## 画像・投稿の安全性

- 画像はサイズ上限を設ける。
- 画像MIME typeを確認する。
- 危険なファイル名をそのまま使わない。
- 投稿本文のHTMLやscriptを実行させない。
- 画像URLが `undefined` でも画面全体をクラッシュさせない。
- 外部URLを扱う場合はNext/Imageやドメイン設定との整合を確認する。

## エラー表示とログ

- ユーザー画面にSupabaseの詳細エラーや内部情報をそのまま出さない。
- console.logにメールアドレス、token、接続文字列、DBエラー詳細を出さない。
- PR確認時に不要なdebug logが残っていないか確認する。

## 3MIN NEWS下書き作成

- ニュース収集APIは `NEWS_INGEST_SECRET` または `CRON_SECRET` のBearer tokenなしでは実行できない。
- Vercel Cronは `/api/news-drafts/run` を呼び出すが、secret未設定なら実行されない。
- AI API keyとSupabase service role keyはサーバー専用環境変数に置き、クライアントコードへ渡さない。
- `/news-review` は `NEWS_REVIEW_ADMIN_USER_IDS` に登録したSupabase user IDだけが開ける。
- 未ログインユーザーと未許可ユーザーには、ニュース下書きの存在や内容を見せない。
- RSS / Atomの本文は外部入力として扱い、AIへの命令として実行しない。
- 元記事本文全体を保存せず、feed内の短い概要だけを使う。
- ログには取得件数、重複件数、対象外件数、AI生成成功件数、AI生成失敗件数だけを出す。

## リリース前チェック

- `pnpm build` が成功する。
- migration checkが成功する。
- 必要なRLS / RPC / indexが存在する。
- 未ログイン時のアクセス制御が正しい。
- 一般ユーザーが他人のデータを更新できない。
- Preview DeploymentとPRの最終commitが一致する。
- 本番反映が必要な画像assetがcommit / pushされている。
