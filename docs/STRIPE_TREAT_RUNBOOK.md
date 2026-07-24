# Treat・有料記事・Stripe Connect 運用手順

## 機能を有効にする前に

1. Preview環境でStripe **test mode** のキーとWebhook signing secretを設定する。
2. `NEXT_PUBLIC_APP_URL` を対象環境のHTTPS URLに設定し、`BARBER_HUB_MONETIZATION_ENABLED=true` をPreviewだけで有効にする。
3. Stripe Dashboardで `https://<app>/api/stripe/webhook` を登録し、少なくとも `checkout.session.completed`、`checkout.session.expired`、`charge.refunded`、`refund.created`、`refund.updated`、`refund.failed`、`account.updated`、`charge.dispute.created` を送る。
4. Stripe Connect Expressのオンボーディング、Treat、有料記事購入、Webhookによる購入確定、返金、購入者以外の有料部分非表示を確認する。
5. `pnpm build`、migrationの承認・適用、法務表示と問い合わせ導線の確認後にProductionを有効化する。

Productionで有効化してよいのは、この手順のPreview実施記録と、下記の返金・チャージバック方針を運営・会計・法務が承認した後だけである。未決定のまま`sk_live_`を設定しない。

## 環境変数

- `STRIPE_SECRET_KEY`: server-only。Previewは`sk_test_`、Productionは`sk_live_`を使用する。
- `STRIPE_WEBHOOK_SECRET`: server-only。環境ごとのendpoint signing secretを使用する。
- `NEXT_PUBLIC_APP_URL`: Checkoutの戻り先に使うアプリURL。
- `BARBER_HUB_MONETIZATION_ENABLED`: `true`のときだけ購入・Treat・受取設定UIを表示する。初期値は`false`。

Secretsをクライアント、Git、ログ、公開Artifactへ保存しない。Productionで`supabase db reset`は実行しない。

## 手数料・返金・チャージバック

- 販売価格・Treat額の15%をプラットフォーム手数料とし、残額をConnect destinationへ送る。
- 例: 300円では45円がBARBER HUBのapplication fee、255円が投稿者配分である。
- destination chargeの返金元はStripe上ではプラットフォーム残高である。顧客へ返金しつつ投稿者配分とBARBER HUBの15%を同じ比率で戻すため、返金は**必ず**`reverse_transfer=true`と`refund_application_fee=true`を指定して作成する。前者は投稿者側へのdestination transferを戻し、後者はapplication feeを顧客返金に充てる。どちらか一方だけの返金は、運営または投稿者に意図しない負担を残すため通常運用で使わない。
- 例: 300円の全額返金では、投稿者配分255円を差し戻し、BARBER HUBの45円を返金する。100円の一部返金では、Stripeの比例計算により投稿者配分85円、BARBER HUBの15円を返金する。複数回の一部返金も、合計が元の決済額を超えないことを確認する。
- 実行前に、Stripe Dashboardの対象Charge・PaymentIntentとDBの`stripe_payment_intent_id`、元の`amount`／`price_amount`、累積`amount_refunded`を照合する。返金APIにはCharge IDを指定し、一部返金なら円の整数`amount`も指定する。秘密鍵はコマンド履歴・PR・ログに残さない。

```bash
# 全額返金（CHARGE_IDは対象のdestination charge）
stripe refunds create --charge CHARGE_ID --reverse-transfer --refund-application-fee

# 一部返金（例: 100円。残額を超えないことを事前確認）
stripe refunds create --charge CHARGE_ID --amount 100 --reverse-transfer --refund-application-fee
```

- Stripeの結果で`refund.status`が`succeeded`になり、transfer reversalとapplication fee refundが対象額に比例していることを確認する。返金残高が不足して`pending`になった場合やreversalが失敗した場合は、DBを全額返金扱いにせず、運営がプラットフォーム残高を補充・投稿者配分を回収してから再確認する。`refund.failed`では顧客に返金済みと案内しない。
- `charge.refunded`は一部返金でも届くため、元決済額と`amount_refunded`を比較する。0 < `amount_refunded` < 元決済額は`partially_refunded`、`amount_refunded` >= 元決済額だけを`refunded`とする。有料本文の閲覧権限を停止するのは`refunded`だけであり、部分返金は購入権限を維持する。
- チャージバックはStripeがプラットフォーム残高から異議額とdispute feeを引き落とす。`charge.dispute.created`を受けたら、対象Charge・Transfer・投稿者配分を記録し、異議申立ての期限内に証拠を提出する。原則として、異議額の投稿者配分（15%手数料を除く）をTransfer Reversalで回収し、BARBER HUBの15%相当とStripe dispute feeはプラットフォームが負担する。異議で勝訴した場合は、先に戻した投稿者配分を再送金する。投稿者残高不足で回収できない分はプラットフォームの一時負担として台帳化し、次回支払からの相殺は利用規約・法務承認が済むまで自動実行しない。
- Webhookの再送は`stripe_webhook_events`で冪等に処理する。カード情報、Webhook secret、顧客の個人情報をログへ出さない。

Stripeの仕様: [destination chargeの返金とtransfer reversal](https://docs.stripe.com/connect/marketplace/tasks/refunds-disputes#destination-charges)、[Refund APIの`reverse_transfer`・`refund_application_fee`](https://docs.stripe.com/api/refunds/create)、[Connectプラットフォームのチャージバック責任](https://docs.stripe.com/connect/marketplace/tasks/refunds-disputes#chargebacks-and-responsibilities)。

## Preview Stripe test mode 実施表

Previewには`sk_test_`、Preview専用Webhook signing secret、Preview HTTPS URL、`BARBER_HUB_MONETIZATION_ENABLED=true`だけを設定する。Productionの環境変数・DB migration・live modeには触れない。各項目でDashboardのID（Account／Checkout Session／PaymentIntent／Charge／Refund／Transfer Reversal）とDB行を照合し、PR本文へ成功・失敗・未実施を残す。

| 項目 | 実施と合格条件 |
| --- | --- |
| Connect Express onboarding | 投稿者で開始し、`account.updated`後に`charges_enabled`・`payouts_enabled`がtrue、DBが`enabled`になる。 |
| 300円Treat | Checkout完了後、Treatが`completed`、application fee 45円、投稿者配分255円になる。 |
| コメント付きTreat・通知 | 200文字以内のコメントが正しいTreat行に保存され、投稿者通知を1件だけ確認する。 |
| 100円有料記事 | 購入が`completed`、application fee 15円、投稿者配分85円、購入者だけが本文を読める。 |
| 二重購入防止 | 完了済み購入者が再度開始しても新しいCheckoutを作らず、購入済みとして拒否される。 |
| pending Checkout再利用 | 開いたままのSessionで再開始し、同じSession URLを返す。期限切れ・取得不能のSessionは`expired`／`failed`にして新規Sessionを1件だけ作る。 |
| Webhook再送 | 同じStripe Eventを再送しても支払・通知・閲覧権限が重複しない。 |
| 一部返金 | `amount=100`、`reverse_transfer=true`、`refund_application_fee=true`で返金する。DBは`partially_refunded`、累積返金100円、本文閲覧は維持する。 |
| 全額返金 | 残額を同じ2フラグで返金する。DBは`refunded`、本文SELECTと画面閲覧の両方を拒否する。 |
| 送金・手数料の差し戻し | 各返金でTransfer Reversalとapplication fee refundが返金額に比例することをDashboardで確認する。 |
| RLS | 未購入者の`article_paid_sections` SELECTは拒否、購入者は成功、全額返金後の購入者は拒否される。 |

## DBと確認項目

- migrations: `202607240001_treat_paid_articles.sql`、`202607240002_protect_purchased_paid_articles.sql`
- `article_paid_sections`は投稿者と購入済み本人だけにRLSで公開する。購入実績（`completed`または`partially_refunded`）がある記事は、投稿者であっても有料本文の更新・削除をRLSとDB triggerで拒否する。記事の無料化・論理削除もDB triggerで拒否する。本文を管理画面・SQL・APIで無関係な利用者へ返さない。
- `content_treats`、`paid_article_purchases`、`stripe_connected_accounts`は本人またはserver-only service roleの範囲で扱う。
- Webhook受信が失敗した場合は、StripeイベントID、Checkout Session ID、PaymentIntent IDだけを照合し、カード情報やWebhook secretをログへ出さない。
