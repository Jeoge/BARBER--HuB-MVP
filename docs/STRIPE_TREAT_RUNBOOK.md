# Treat・有料記事・Stripe Connect 運用手順

## 現在の環境構成と有効化条件

BARBER HUBは現在、Supabase Productionプロジェクトを1つだけ運用している。Preview用Supabase Project／Branchは作成しない。したがって、Treat・有料記事用migrationをProduction Supabaseへ適用しない間は、Vercel Previewから決済レコード、通知、購入権限を作成・更新してはならない。

この状態では、Vercel Previewの`BARBER_HUB_MONETIZATION_ENABLED`は**必ず`false`**に保つ。PreviewへProductionの`SUPABASE_SERVICE_ROLE_KEY`を渡さず、Stripe Sandboxのイベントを`/api/stripe/webhook`へ実送しない。migration未適用のDBでは、`content_treats`、`paid_article_purchases`、`stripe_connected_accounts`、`stripe_webhook_events`と関連RPCが存在しないためである。

1. Stripe Sandbox内で、Connect Marketplace、Express account、destination charge、返金パラメータをStripe Dashboard上で確認する。
2. Vercel Previewでは既存UIを`BARBER_HUB_MONETIZATION_ENABLED=false`のまま確認する。Snap・記事は既存「いいね」を表示し、Treatは表示しない。
3. `pnpm build`、migration check、コード上の金額・返金・pending処理のテストを実行する。
4. Treat・有料記事・通知・Webhook・RLSの実アプリ統合テストは、Production migrationを承認・適用した後に、Stripe Sandboxのまま承認済みの手順で実施する。Stripe live modeを先行して有効化しない。

Productionで有効化してよいのは、Production migrationとStripe Sandboxによるアプリ統合テストの記録、下記の返金・チャージバック方針を運営・会計・法務が承認した後だけである。未決定のまま`sk_live_`を設定しない。

## Vercel Previewの環境変数

- Previewは既存の`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`だけで既存画面を表示する。これらは現在のProduction Supabaseの公開接続情報であり、決済テスト用の書込み権限を与えるものではない。
- `BARBER_HUB_MONETIZATION_ENABLED=false`をPreviewに明示する。`true`へ変更しない。
- `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、`SUPABASE_SERVICE_ROLE_KEY`は、migration未適用の単一Production Supabase構成ではPreviewへ登録しない。特にProductionの`SUPABASE_SERVICE_ROLE_KEY`をPreviewへ複製しない。
- `NEXT_PUBLIC_APP_URL`は、決済を有効にする段階までPreviewへ登録不要である。将来有効化する場合だけ、対象環境のHTTPS originを設定する。
- VercelのSystem Environment Variablesは有効にし、`VERCEL_ENV=preview`を利用可能にする。アプリ側はPreviewでは`sk_test_`、Productionでは`sk_live_`だけを許可する。

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

## Stripe Sandbox確認とアプリ統合テストの区別

Production Supabase migrationを適用しない現在は、次のStripe Sandbox確認だけを行う。Stripe Dashboard上の確認は、BARBER HUBアプリのDB・通知・RLSを検証したことにはならない。

| 項目 | 現在可能な確認 |
| --- | --- |
| Connect Marketplace / Express account | Stripe Sandbox上で作成・状態を確認する。アプリの`stripe_connected_accounts`更新は未確認。 |
| destination charge / application fee | Stripe Sandbox上で15%の設定・返金フラグ・比例差し戻しの仕様を確認する。アプリのTreat／有料記事レコードは作成しない。 |
| 返金 | `reverse_transfer=true`と`refund_application_fee=true`のStripe Sandbox上の挙動を確認する。アプリDBの`partially_refunded`／`refunded`更新は未確認。 |
| Webhook | Endpoint URLと購読イベントは将来の統合テスト用に記録するが、migration未適用の間は送信・再送しない。 |

次の項目は、現構成では**未実施かつ実施不可**である。Production migrationを適用しない限り、Vercel Previewで有効化しない。

- 300円Treat、コメント付きTreat、投稿者通知
- 100円有料記事、二重購入防止、pending Checkout再利用
- Webhook再送に伴うDB更新
- アプリ上の一部返金・全額返金・Transfer Reversal照合
- 未購入者SELECT拒否、購入者閲覧、全額返金後の閲覧拒否

## DBと確認項目

- migrations: `202607240001_treat_paid_articles.sql`、`202607240002_protect_purchased_paid_articles.sql`
- `article_paid_sections`は投稿者と購入済み本人だけにRLSで公開する。購入実績（`completed`または`partially_refunded`）がある記事は、投稿者であっても有料本文の更新・削除をRLSとDB triggerで拒否する。記事の無料化・論理削除もDB triggerで拒否する。本文を管理画面・SQL・APIで無関係な利用者へ返さない。
- `content_treats`、`paid_article_purchases`、`stripe_connected_accounts`は本人またはserver-only service roleの範囲で扱う。
- Webhook受信が失敗した場合は、StripeイベントID、Checkout Session ID、PaymentIntent IDだけを照合し、カード情報やWebhook secretをログへ出さない。
