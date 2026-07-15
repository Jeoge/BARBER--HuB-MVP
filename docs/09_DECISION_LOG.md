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

## 検索シートに「自分のお店を管理する」は重複表示しない

- 日付: 2026年7月時点
- 状態: 決定
- 決定: 検索シート内に「自分のお店を管理する」導線を重複表示しない。
- 理由: 検索、登録申請、管理導線が混ざると操作が分かりにくくなるため。
- 影響範囲: Store Directory検索UI、店舗管理導線。
- 関連PR・文書: [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md), [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md)

## 管理機能はBARBER HUB内の管理者専用画面にする

- 日付: 2026年7月時点
- 状態: 決定済み・未実装
- 決定: 店舗審査やCSV取込などの管理機能は、将来BARBER HUB内の非公開admin系領域で扱う。
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

## メーカー・学校・ディーラー等も将来基本掲載・認証方式を検討する

- 日付: 2026年7月時点
- 状態: 検討中
- 決定: メーカー、ディーラー、学校、組合なども将来の業界ディレクトリ対象として検討する。
- 理由: BARBER HUBを業界全体の情報基盤へ広げる可能性があるため。
- 影響範囲: 将来DB、検索UI、パートナー設計。
- 関連PR・文書: [08_ROADMAP.md](08_ROADMAP.md), [06_MONETIZATION_AND_PARTNERS.md](06_MONETIZATION_AND_PARTNERS.md)

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

## 3MIN NEWSの最終タイトルは運営者が選択・修正する

- 日付: 2026年7月14日
- 状態: 決定
- 決定: 3MIN NEWSは仕事・本人・会話の3視点でタイトル候補を生成し、最終タイトルは運営者が選択・修正する。トップページの表示数は4件を維持する。
- 理由: AIが原題を短くするだけのタイトルに寄らないようにしつつ、自動公開せず運営者の編集判断を残すため。
- 影響範囲: `news_drafts`, `/news-review`, 3MIN NEWS AI下書き生成, トップページ3MIN NEWS
- 関連PR・文書: [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md), [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md)
