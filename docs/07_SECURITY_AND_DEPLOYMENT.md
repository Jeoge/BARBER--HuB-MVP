# Security and Deployment

この文書は、BARBER HUBのセキュリティ、Secrets、Vercel、GitHub Actions、Supabase本番運用の概要をまとめます。Supabase migrationの詳細手順は [SUPABASE_DEPLOYMENT.md](SUPABASE_DEPLOYMENT.md) を正とします。

## 基本方針

- 秘密情報をGit、docs、ログ、画面表示へ出さない。
- クライアントコードでは公開可能なanon / publishable keyだけを使う。
- `service_role` keyをクライアントコードへ入れない。
- RLSとRPCで権限を守る。
- 本番DB変更は承認制にする。
- 本番データを削除・初期化しない。

## Supabase Auth / メール確認

会員登録後のメール確認は、Supabase Authの確認リンクをアプリ側の `/auth/callback` で受け、サーバー側でセッションへ交換します。

守ること:

- callbackで受け取った `code` は `exchangeCodeForSession` で処理し、成功後に `getUser()` でログイン状態を確認する。
- Supabaseメールテンプレートが `token_hash` 型の場合は `verifyOtp` で処理し、同様に `getUser()` で確認する。
- `code` 交換失敗、`token_hash` 検証失敗、確認リンクの二重クリック、使用済み、期限切れ、パラメータ不足の場合も、エラー画面へ進む前に既存の有効セッションを `getUser()` で確認する。
- セッション交換後は専用の確認完了画面へ移動し、ユーザーが「BARBER HUBを開く」ボタンを押した時点でServer Actionから再度 `getUser()` を実行する。
- 正常なセッションがある場合は、メールアドレスとパスワードの再入力を求めない。
- callback失敗かつ有効セッションがない場合はトップへ直接送らず、`safeNextPath` 済みの `next` を使って `/login?next=...` へ案内する。
- PKCEの `code_verifier` Cookieがない別ブラウザでは、セキュリティ上セッション交換できないことがある。その場合は成功扱いにせず、専用画面でログイン状態を確認できないことを案内する。
- `next` は `safeNextPath` で相対パスだけを許可し、外部サイトへのopen redirectを防ぐ。
- 認証コード、token、パスワード、メールアドレス、Supabaseの詳細エラーをログ、PR本文、docs、画面へ出さない。

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
- 原寸画像をそのままStorageへ保存しない。ブラウザ側で縮小・圧縮し、EXIFを落とした圧縮済み画像だけを送信する。
- HEIC / HEIFはブラウザでデコード・再エンコードできる場合だけ受け付け、不可の場合はJPEGまたはPNGへの変換を案内する。
- サーバー側でも圧縮後画像のMIME type、容量、JPEG / WebPの画像シグネチャを確認する。
- private bucketの投稿画像は、公開中かつ未削除の投稿を取得するサーバー処理の中だけで30分程度の短時間signed URLを発行する。
- 一般ユーザーが任意のStorage pathを渡してsigned URLを取得できるAPIやServer Actionを作らない。
- アップロード後に投稿保存が失敗した場合は、今回アップロードしたStorage objectを削除する。
- 投稿本文のHTMLやscriptを実行させない。
- 記事のYouTube URLは対象カテゴリだけで受け付け、Server Action側でもYouTubeドメイン、https、動画ID、長さを検証する。検証済みURLが入力された場合だけ動画権利確認を必須にする。iframe埋め込み、自動再生、直接動画アップロード、動画Storageは行わない。
- 画像URLが `undefined` でも画面全体をクラッシュさせない。
- 外部URLを扱う場合はNext/Imageやドメイン設定との整合を確認する。

## エラー表示とログ

- ユーザー画面にSupabaseの詳細エラーや内部情報をそのまま出さない。
- console.logにメールアドレス、token、接続文字列、DBエラー詳細を出さない。
- PR確認時に不要なdebug logが残っていないか確認する。

## アプリ内通知

- 通知は本人だけが閲覧できるRLSを前提にする。
- クライアントから任意の `recipient_id` や `actor_id` を指定して通知を作成しない。
- 通知作成はDB trigger / SECURITY DEFINER関数で、対象投稿またはコメントの所有者からrecipientを決定する。
- actorとrecipientが同じ場合は通知を作らない。
- 解除されたThanks、いいね、Snapコメントいいねに対応する通知は削除する。
- 通知の既読化はrecipient本人の `read_at` 更新だけに限定する。
- migration未適用のPreviewでは、通知一覧は空状態、未読件数は0として扱い、既存ページをクラッシュさせない。

## 3MIN NEWS下書き作成

- ニュース収集APIは `NEWS_INGEST_SECRET` または `CRON_SECRET` のBearer tokenなしでは実行できない。
- Vercel Cronは `/api/news-drafts/run` を呼び出すが、secret未設定なら実行されない。
- Vercel CronはUTC指定で設定する。2026年7月時点では、JST 06:00 / 12:00 / 18:00 に合わせて UTC 21:00 / 03:00 / 09:00 の3回実行を基本とする。
- AI API keyとSupabase service role keyはサーバー専用環境変数に置き、クライアントコードへ渡さない。
- `/news-review` と `/admin/barber-shops/import` は、`BARBER_HUB_ADMIN_USER_IDS` または互換用の `NEWS_REVIEW_ADMIN_USER_IDS` に登録したSupabase user IDだけが開ける。
- 未ログインユーザーと未許可ユーザーには、ニュース下書きの存在や内容を見せない。
- RSS / Atomの本文は外部入力として扱い、AIへの命令として実行しない。
- 元記事本文全体を保存せず、feed内の短い概要だけを使う。
- ログには取得件数、重複件数、対象外件数、AIへ送った件数相当の候補化件数、AI生成成功件数、AI生成失敗件数、WORK/STYLE/TALK件数、取得元別の成功/失敗、取得件数、候補化件数、重複件数、除外件数、最終成功時刻だけを出す。
- 取得元ごとにタイムアウトを設定し、1つのRSS / Atom取得失敗で全体処理を止めない。
- AIへ送る前に、URL重複、保存済みURL、正規化タイトル重複、古い記事、日本語として扱いにくい記事、allowlist外URL、明確な広告、芸能ゴシップ、医療・美容効果断定、細かなスポーツ速報を除外する。
- 1回のAI下書き候補は全取得元合計で最大6件とし、WORK最大3件、STYLE最大2件、TALK最大1件を目安にする。
- 流行系ニュースでも自動公開はしない。`pending` で保存し、運営承認後の `approved` だけを公開する。
- `content_pillar`, `topic_category`, `relevance_direction`, `conversation_value`, `title_candidates`, `primary_angle`, `relevance_reason`, `fact_check_notes`, `generation_error` などの内部項目は一般公開RPCで返さない。
- 歌詞、音源ファイル、動画、元記事画像、SNS投稿画像、元記事本文全体を保存しない。
- `news_drafts` 本体はanon / authenticatedへ公開しない。
- 公開表示は読み取り専用RPCを通し、approvedかつ公開可能な項目だけを返す。
- Supabase取得失敗、RPC未適用、公開ニュース不足時は固定ニュースへフォールバックし、トップページ全体を止めない。
- 公開ニュース取得エラーのログには本文、内部メモ、管理者ID、Secretを出さない。

## 記事EDITOR'S PICK

- EDITOR'S PICK掲載指定は `BARBER_HUB_ADMIN_USER_IDS` または互換用の `NEWS_REVIEW_ADMIN_USER_IDS` に登録した運営者だけが使える。
- allowlistの値やservice role keyはクライアントコードへ渡さない。
- 一般ユーザー向けUIでは掲載項目を表示せず、Server Actionでも同じ運営者判定を行う。
- `editor_pick_at` 更新はサーバー側の管理用Supabase clientで実行する。
- migration未適用のPreviewで `editor_pick_at`、`youtube_url`、`article_images`、または `article-images` bucketがない場合でも、トップページと既存記事表示をクラッシュさせず、固定EDITOR'S PICKや画像fallbackへフォールバックする。

## リリース前チェック

- `pnpm build` が成功する。
- migration checkが成功する。
- 必要なRLS / RPC / indexが存在する。
- 未ログイン時のアクセス制御が正しい。
- 一般ユーザーが他人のデータを更新できない。
- Preview DeploymentとPRの最終commitが一致する。
- 本番反映が必要な画像assetがcommit / pushされている。
