# BARBER HUB Docs

このディレクトリは、BARBER HUBのProject Bibleと分野別設計書を管理する場所です。チャット履歴に依存せず、ChatGPT・Codex・開発者・PRレビュアーが同じ前提を参照できるようにします。

## 読む順番

1. [00_PROJECT_BIBLE.md](00_PROJECT_BIBLE.md)
2. 作業内容に関係する分野別設計書
3. 必要に応じて [09_DECISION_LOG.md](09_DECISION_LOG.md)
4. DB / migration作業では [SUPABASE_DEPLOYMENT.md](SUPABASE_DEPLOYMENT.md)

## 文書一覧

| 文書 | 役割 | 主な読者 | いつ更新するか |
| --- | --- | --- | --- |
| [00_PROJECT_BIBLE.md](00_PROJECT_BIBLE.md) | 最上位方針 | 全員 | サービス思想や絶対方針を変えるとき |
| [01_BRAND_AND_VISION.md](01_BRAND_AND_VISION.md) | ブランド、読者、トーン | UI/コピー/広告担当 | ブランド表現や読者像を変えるとき |
| [02_UI_AND_DESIGN.md](02_UI_AND_DESIGN.md) | UI原則、トップ画面、確認基準 | フロントエンド担当 | UI構造、画像、レスポンシブ方針を変えるとき |
| [03_PRODUCT_AND_FEATURES.md](03_PRODUCT_AND_FEATURES.md) | 実装済み機能、進行中機能、将来構想 | 機能実装担当 | 新機能追加、状態変更、仕様変更時 |
| [04_DATA_AND_DATABASE.md](04_DATA_AND_DATABASE.md) | Supabaseデータ構造、RLS、migration方針 | DB/バックエンド担当 | テーブル、RLS、RPC、Storageを変えるとき |
| [05_OPERATIONS_AND_GOVERNANCE.md](05_OPERATIONS_AND_GOVERNANCE.md) | 運営、審査、モデレーション | 運営/管理機能担当 | 審査や管理ルールを変えるとき |
| [06_MONETIZATION_AND_PARTNERS.md](06_MONETIZATION_AND_PARTNERS.md) | 協賛、広告、パートナー、収益化 | 広告/パートナー担当 | 広告商品や掲載ルールを変えるとき |
| [07_SECURITY_AND_DEPLOYMENT.md](07_SECURITY_AND_DEPLOYMENT.md) | セキュリティ、Secrets、Vercel、GitHub Actions | 開発/運用担当 | deploy、Secrets、migration運用を変えるとき |
| [08_ROADMAP.md](08_ROADMAP.md) | 優先順位、将来構想、保留事項 | 全員 | 優先順位や構想を見直すとき |
| [09_DECISION_LOG.md](09_DECISION_LOG.md) | 重要判断の記録 | 全員 | 重要な決定、保留、廃止が発生したとき |
| [templates/DECISION_RECORD_TEMPLATE.md](templates/DECISION_RECORD_TEMPLATE.md) | decision log追記用テンプレート | 全員 | テンプレート変更時 |
| [SUPABASE_DEPLOYMENT.md](SUPABASE_DEPLOYMENT.md) | 本番Supabase migration承認フローの詳細 | DB/運用担当 | workflow、Secrets、承認手順を変えるとき |

## 既存ドキュメント

- ルートの [README.md](../README.md) は開発セットアップの入口です。
- [SUPABASE_DEPLOYMENT.md](SUPABASE_DEPLOYMENT.md) は既存の本番migration運用文書です。このPRでは削除せず、Project Bible体系から参照します。
- [public/images/README.md](../public/images/README.md) は画像assetの配置ルールを扱います。

## 文書の役割分担

- [00_PROJECT_BIBLE.md](00_PROJECT_BIBLE.md) は最上位方針です。
- 詳細仕様は分野別文書に置きます。
- 実装変更時は関連文書も更新します。
- 新しい重要判断は [09_DECISION_LOG.md](09_DECISION_LOG.md) へ記録します。
- 秘密情報、個人情報、実際のパスワード、token、接続文字列は書きません。

## 判断の優先順位

1. ユーザーの最新指示
2. GitHubの最新Project Bible・設計書
3. mainへマージ済みの実装
4. Pull Requestに記録された決定
5. チャット上の提案や会話

チャットで話しただけの案は、設計書へ反映されるまでは正式決定ではありません。

