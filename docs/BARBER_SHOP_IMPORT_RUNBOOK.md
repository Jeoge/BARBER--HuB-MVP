# Barber Directory CSV Import Runbook

店舗CSVは、migrationやseedではなく、管理者専用画面から手動で投入します。CSV取込機能は全国共通です。実データCSVはGitHubへ含めません。

## CSVの置き場所

- 実データCSVは運営者の管理するprivateな場所に保存します。
- リポジトリへ置く場合でも `imports/` または `data/imports/` 配下に一時配置し、Gitへ追加しません。
- 形式確認用の架空データだけを [docs/samples/barber_shops_import_sample.csv](samples/barber_shops_import_sample.csv) に置いています。

## 手動投入手順

1. 対象環境のBARBER HUBへ管理者アカウントでログインします。
2. `/admin/barber-shops/import` を開きます。
3. `CSV選択` で福岡県の統合済み店舗CSVを選びます。
4. `内容をプレビュー` を押します。
5. `CSV行数`、`正常件数`、`エラー`、`完全一致`、`重複候補` を確認します。
6. `取込前確認` で次を確認します。
   - 都道府県別件数
   - 福岡県CSV投入時は、想定都道府県以外の警告が0件であること
   - 市区町村別件数に想定外の値がないこと
   - 空欄件数
   - 電話番号形式不正件数
   - 同一店名・同一住所候補件数
7. `必須項目・重複確認` でエラー行と重複候補を確認します。
8. 初回投入では、重複候補を十分に確認できない場合はチェックを入れずに `登録を実行` を押します。
9. 完了表示の `登録`、`スキップ`、`失敗` 件数を控えます。
10. `pnpm run barber-shops:verify` で公開検索の読み取り確認を行います。

## 確認する検索

`pnpm run barber-shops:verify` は公開anon権限だけで次を確認します。

- 公開店舗総数
- 福岡県、福岡市、北九州市、久留米市の件数
- `unverified` 件数
- `owner_user_id is null` 件数
- `imported` かつ `verified` の件数が0件
- `imported` かつ `owner_user_id` ありの件数が0件
- `姪浜`、`福岡市`、`久留米市`、前後空白付き `姪浜` の検索結果
- 福岡県の市区町村候補

実在する店舗名の一部や住所の一部も確認したい場合は、次のように追加検索語を指定します。

```bash
BARBER_SHOP_VERIFY_EXTRA_QUERY=店舗名の一部 pnpm run barber-shops:verify
```

## 失敗時

- 管理画面が404になる場合は、ログイン中ユーザーIDが `BARBER_HUB_ADMIN_USER_IDS` または `NEWS_REVIEW_ADMIN_USER_IDS` に含まれているか確認します。
- 管理画面に環境変数不足が表示される場合は、対象環境のサーバー専用 `SUPABASE_SERVICE_ROLE_KEY` を確認します。
- プレビューでエラーが出る場合は、CSVヘッダー、文字コード、必須項目、認証状態、電話番号形式を確認します。都道府県が福岡県以外であることだけではエラーになりません。
- 登録実行で失敗する場合は、対象環境にCSV取込migrationが適用済みか確認します。
- 検索確認で0件になる場合は、投入した環境と画面を開いている環境のSupabase接続先が同じか確認します。
