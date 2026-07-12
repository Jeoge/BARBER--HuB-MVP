# BARBER HUB Agent Guide

このリポジトリで作業するCodex / AIエージェントは、実装前に必ずこの短い運用ルールを確認してください。

## 最初に読む文書

- [docs/README.md](docs/README.md)
- [docs/00_PROJECT_BIBLE.md](docs/00_PROJECT_BIBLE.md)
- 作業対象に対応する分野別設計書

主な参照先:

- UI / デザイン: [docs/02_UI_AND_DESIGN.md](docs/02_UI_AND_DESIGN.md)
- 機能仕様: [docs/03_PRODUCT_AND_FEATURES.md](docs/03_PRODUCT_AND_FEATURES.md)
- DB / RLS / migration: [docs/04_DATA_AND_DATABASE.md](docs/04_DATA_AND_DATABASE.md)
- 本番Supabase migration: [docs/SUPABASE_DEPLOYMENT.md](docs/SUPABASE_DEPLOYMENT.md)
- セキュリティ / deploy: [docs/07_SECURITY_AND_DEPLOYMENT.md](docs/07_SECURITY_AND_DEPLOYMENT.md)
- 重要判断: [docs/09_DECISION_LOG.md](docs/09_DECISION_LOG.md)

## 作業原則

- Project Bibleに反する独自判断をしない。
- 不明点を推測して全面変更しない。
- 現在のトップ画面と既存UIを不用意に再設計しない。
- 関係のないリファクタリングを行わない。
- 既存機能、既存デザイン、既存データを壊さない。
- 実装済み、実装途中、決定済み未実装、検討中、保留を区別する。
- DB変更はmigrationとして追加する。
- 本番DBで `supabase db reset` を実行しない。
- migrationとseedを混同しない。
- Secretsやパスワードをコード・ログ・文書に書かない。
- 口コミ・星評価・店舗ランキングは実装しない。
- 広告、PR、Sponsored、協賛、Partnerは必ず明示する。
- 実装と設計書がずれた場合は、同じPRで関連docsも更新する。
- 完了前に `pnpm build` と既存チェックを実行する。
- ユーザーは原則としてPRをマージし、必要時にProductionを承認するだけの運用を目指す。

## 禁止事項

- mainへ直接commit / push / mergeしない。
- `service_role` keyをクライアントコードで使わない。
- 実在店舗、メーカー、学校、組合などの情報を無断で登録しない。
- 本番DBに通常seedやテストデータを自動投入しない。
- 公開GitHubリポジトリ、Git管理ファイル、公開可能なActions Artifactへバックアップファイルを保存しない。

詳細は [docs/README.md](docs/README.md) から各設計書を参照してください。

