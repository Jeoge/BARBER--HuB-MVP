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
- Back Roomのスレッド・コメント画像は `backroom-images` private bucketへ保存し、最大1枚・圧縮後1枚2MB以内、JPEG / PNG / WebPだけを許可する。HEIC / HEIFはブラウザ変換に成功した場合だけ送信する。
- Back Room画像のDB RLSは既存のBack Room参加条件と親投稿・コメント所有者条件を維持し、他人のthread_id / comment_idや任意pathを登録できないようにする。Storage objectの直接SELECTは許可しない。
- `backroom_comments` のauthenticated INSERT / UPDATE RLSでは公開状態の本文を非空に制限し、DBの遅延constraint triggerでも本文または `backroom_comment_images` の存在を強制する。画像だけコメントは `create_backroom_image_comment` SECURITY DEFINER RPCで、auth.uid()、Back Room参加、親スレッド、comment path、画像メタデータ、Storage object存在を再検証して確定する。RPCはauthenticatedへ必要なEXECUTEだけを許可し、service role keyはクライアントへ渡さない。
- コメント画像はStorageへ先に一時保存し、DB側のRPCがコメント行と画像行を同一トランザクションで作成する。RPCまたは保存確認が失敗した場合は、今回のStorage objectをserver-only cleanupで削除し、DB側に公開可能な空コメントを残さない。cleanup失敗はpathを含む詳細を画面へ出さずサーバーログへ記録する。
- Back Roomの正式なスレッド削除は、UUID入力検証後にSupabase Authから本人IDを取得し、`backroom_posts.id`、`user_id`、`is_deleted = false`で所有を確認する。画面の本人限定表示に加え、Server Actionの再確認とowner-only DELETE RLSの両方で他人・未ログイン・管理者allowlistだけのユーザーによる削除を拒否する。
- 削除前にスレッド画像path、対象スレッドの全コメントID、全コメント画像pathを認証済みclientで取得し、`isSafeBackroomImageStoragePath`で親ID配下か検証する。取得または所属検証に失敗した場合はDBを削除せず、pathや秘密情報を画面へ出さない。
- 例外は画像テーブル未適用・schema cache未更新を示す`42P01`または`PGRST205`で、かつエラー内の対象名が`backroom_thread_images`または`backroom_comment_images`と正確に一致する場合だけとし、その画像pathを空配列として扱う。コメント0件ではコメント画像テーブルを問い合わせない。通信障害、認証失敗、不明なRLS、timeout、別テーブルやcode不一致のエラーではDB削除を中止する。
- DBは通常の認証済みclientで親`backroom_posts`を物理削除し、コメントと画像メタデータをcascade削除する。成功後にだけ、事前検証済みpathをservice roleのserver-only cleanupでprivate Storageから削除する。Storage削除失敗は詳細ログを残し、DB削除を巻き戻さず成功として扱う。service role keyはクライアントへ渡さない。記事とSnapの削除依頼フローには適用しない。
- 親行DELETEでは`id`、`user_id = auth.uid()`、`is_deleted = false`を再指定し、exact countが1件の場合だけ成功とする。owner-only DELETE RLSを維持し、service roleでDB削除を迂回しない。
- 画像テーブル・signed URL発行・個別画像読み込みの失敗では該当画像だけを非表示にし、本文・コメント・Back Room全体を壊さない。Storage pathは表示データへ含めない。
- 投稿本文のHTMLやscriptを実行させない。
- 記事のYouTube URLは対象カテゴリだけで受け付け、Server Action側でもYouTubeドメイン、https、動画ID、長さを検証する。検証済みURLが入力された場合だけ動画権利確認を必須にする。iframe埋め込み、自動再生、直接動画アップロード、動画Storageは行わない。
- 画像URLが `undefined` でも画面全体をクラッシュさせない。
- 外部URLを扱う場合はNext/Imageやドメイン設定との整合を確認する。

## エラー表示とログ

- ユーザー画面にSupabaseの詳細エラーや内部情報をそのまま出さない。
- console.logにメールアドレス、token、接続文字列、DBエラー詳細を出さない。
- PR確認時に不要なdebug logが残っていないか確認する。

## 公式一覧URLからのCSV作成

- `/admin/barber-shops/import/source` は既存の管理者allowlistで保護し、未ログイン・非管理者には取得結果を返さない。
- URLはHTTPSだけを許可し、localhost、loopback、private、link-local、metadata endpoint、file、ftp、内部ネットワーク向けのDNS解決先を拒否する。
- DNS解決後のIPを検証し、リダイレクトは3回以内、タイムアウトは15秒、取得容量は8MB以内にする。MIME typeと拡張子の組み合わせも確認する。
- CSV / TSV / xlsx / HTML table / テキストPDFだけを対象にし、HTMLのscriptやOfficeマクロを実行しない。OCR、CAPTCHA、ログイン、JavaScript操作、複雑な複数ページクロールは行わない。
- HTMLはGETレスポンス内の店舗一覧テーブルだけを解析し、検索フォームへのPOST送信やブラウザ操作は行わない。ページネーションは検出して警告するが、次ページを取得せず1ページ分だけ処理する。
- 取得履歴・原本・変換結果はDBやStorageへ保存しない。生成CSVは管理者のブラウザへ渡すだけで、店舗登録は既存CSV取込画面で行う。
- CSVセルが `=`, `+`, `-`, `@` で始まる場合は、Excel等で式として実行されないよう安全化して出力する。
- 取得元の代表者名、開設者名、管理者名、郵便番号はCSVへ出力しない。service role keyはクライアントへ渡さない。

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
- `/news-review`, `/admin/barber-shops/import`, `/admin/barber-shops/claims` は、`BARBER_HUB_ADMIN_USER_IDS` または互換用の `NEWS_REVIEW_ADMIN_USER_IDS` に登録したSupabase user IDだけが開ける。
- 店舗管理申請の承認・却下RPC `review_barber_shop_claim` はservice_roleだけにEXECUTEを許可し、一般ユーザーの直接RPC呼び出しでは実行できない。
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

## PARTNERS問い合わせの安全対策

- `/partners/contact`は未ログインでも送信できるが、ブラウザから`partner_inquiries`へ直接INSERTさせず、Server Actionで入力検証後にserver-onlyのservice role clientから保存する。ログイン中の送信だけ`user_id`を補助的に保存し、送信者向け一覧は作らない。既存の`/partners`はメーカー・ディーラー情報等のページとして維持する。
- honeypot、必須・文字数・メール形式・改行・http/https URL・問い合わせ種別・プライバシーポリシー同意をServer ActionとDB制約の両方で検証する。Reactの通常表示だけでなく、管理画面でもユーザー入力をHTMLとして解釈しない。
- 同一メールアドレスについて短時間の連続送信をDB上の直近件数とserver-sideの短時間重複防止で制限する。IPアドレスは保存せず、外部CAPTCHAやメール通知サービスも追加しない。
- `partner_inquiries`はanon / authenticatedの権限をrevokeし、管理画面は既存の`BARBER_HUB_ADMIN_USER_IDS` / `NEWS_REVIEW_ADMIN_USER_IDS` allowlistで保護する。管理画面と送信完了状態はnoindexとする。
- ログには氏名、メール、電話、URL、本文を出さず、設定不足の件数、migration・DBエラーのコード、問い合わせIDなど必要最小限だけを出す。本番migrationは既存のProduction Environment承認フローで適用する。

### プロフィール画像のStorage cleanup

- プロフィール画像のcleanupでは、URL scheme、設定済みSupabase origin、bucket名`profile-images`、user folder、object pathのdecode結果を検証し、`user.id/`配下の本人所有objectだけを対象にする。他人、別bucket、外部URL、空path、`..`を含むpathは削除しない。
- 認証済み本人clientの既存Storage policyで削除し、`service_role` keyはserver-onlyとしてクライアントへ渡さない。将来admin clientを使う場合も、Auth本人確認・profile一致・bucket・user folderを再確認する。
- DB保存前の旧objectは削除しない。新規upload後にDB保存が失敗した場合は今回の新規objectだけを補償削除し、旧objectは維持する。旧objectの削除失敗ではDB保存を巻き戻さず、処理名・ユーザーID・件数・エラー概要だけをサーバーログへ残す。
