# Treat・有料記事・Stripe Connect 運用手順

## 機能を有効にする前に

1. Preview環境でStripe **test mode** のキーとWebhook signing secretを設定する。
2. `NEXT_PUBLIC_APP_URL` を対象環境のHTTPS URLに設定し、`BARBER_HUB_MONETIZATION_ENABLED=true` をPreviewだけで有効にする。
3. Stripe Dashboardで `https://<app>/api/stripe/webhook` を登録し、少なくとも `checkout.session.completed`、`checkout.session.expired`、`charge.refunded`、`account.updated` を送る。
4. Stripe Connect Expressのオンボーディング、Treat、有料記事購入、Webhookによる購入確定、返金、購入者以外の有料部分非表示を確認する。
5. `pnpm build`、migrationの承認・適用、法務表示と問い合わせ導線の確認後にProductionを有効化する。

## 環境変数

- `STRIPE_SECRET_KEY`: server-only。Previewは`sk_test_`、Productionは`sk_live_`を使用する。
- `STRIPE_WEBHOOK_SECRET`: server-only。環境ごとのendpoint signing secretを使用する。
- `NEXT_PUBLIC_APP_URL`: Checkoutの戻り先に使うアプリURL。
- `BARBER_HUB_MONETIZATION_ENABLED`: `true`のときだけ購入・Treat・受取設定UIを表示する。初期値は`false`。

Secretsをクライアント、Git、ログ、公開Artifactへ保存しない。Productionで`supabase db reset`は実行しない。

## 手数料・返金

- 販売価格・Treat額の15%をプラットフォーム手数料とし、残額をConnect destinationへ送る。
- 例: 300円では45円がプラットフォーム手数料、255円が投稿者配分。Stripe手数料、返金、チャージバックの負担・会計処理は運営がStripe契約条件と顧問へ確認する。
- 二重決済、閲覧不可、法令上の返金は、Stripe Dashboardの対象決済とDBの`stripe_payment_intent_id`を照合して対応する。Webhookの再送は`stripe_webhook_events`で冪等に処理する。

## DBと確認項目

- migration: `202607240001_treat_paid_articles.sql`
- `article_paid_sections`は投稿者と購入済み本人だけにRLSで公開する。本文を管理画面・SQL・APIで無関係な利用者へ返さない。
- `content_treats`、`paid_article_purchases`、`stripe_connected_accounts`は本人またはserver-only service roleの範囲で扱う。
- Webhook受信が失敗した場合は、StripeイベントID、Checkout Session ID、PaymentIntent IDだけを照合し、カード情報やWebhook secretをログへ出さない。
