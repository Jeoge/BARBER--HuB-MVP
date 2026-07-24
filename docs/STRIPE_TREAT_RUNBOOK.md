# Treat・有料記事・Stripe Connect 運用手順

## 現在のPreview検証構成と有効化条件

Treat・有料記事の統合テストは、次の隔離された組合せだけで行う。Production `main`、Production Supabase、Stripe Live modeには触れない。

| 対象 | Preview検証で使うもの | 禁止するもの |
| --- | --- | --- |
| Git / Vercel | `codex/feat/stripe-treat-paid-articles` のPreview deployment | `main`、Production deployment |
| Supabase | `treat-preview` branch（schemaはProduction由来、テストデータはここだけ） | Production branchへのmigration・テストデータ投入 |
| Stripe | BARBER HUB Stripe Sandboxの`sk_test_` | Live mode、`sk_live_` |

`treat-preview`には基盤migrationと`202607240001_treat_paid_articles.sql`、`202607240002_protect_purchased_paid_articles.sql`を適用済みである。実行前に対象project refとbranch名をDashboardで再確認し、Production branchを開いていないことを確認する。

Productionで有効化してよいのは、Production migrationとStripe Sandboxによるアプリ統合テストの記録、下記の返金・チャージバック方針を運営・会計・法務が承認した後だけである。未決定のまま`sk_live_`を設定しない。

## Vercel Previewの環境変数

すべてVercelの**Preview**かつGit branch **`codex/feat/stripe-treat-paid-articles`限定**で設定する。Productionの同名変数は変更・削除しない。

| 変数 | 値 / 取得元 | 公開範囲 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `treat-preview` branchのProject URL | Preview branch限定 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `treat-preview` branchのpublishable key | Preview branch限定 |
| `SUPABASE_SERVICE_ROLE_KEY` | `treat-preview` branchのservice role key | Preview branch限定・server only |
| `BARBER_HUB_MONETIZATION_ENABLED` | `true` | Preview branch限定 |
| `NEXT_PUBLIC_APP_URL` | 対象Previewのbranch固定HTTPS origin（末尾の`/`なし） | Preview branch限定 |
| `STRIPE_SECRET_KEY` | Stripe Sandboxの`sk_test_` | Preview branch限定・server only |
| `STRIPE_WEBHOOK_SECRET` | Platform scope endpointの署名secret | Preview branch限定・server only |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Connected account scope endpointの署名secret | Preview branch限定・server only |

VercelのSystem Environment Variablesは有効にし、`VERCEL_ENV=preview`を利用可能にする。アプリ側はPreviewでは`sk_test_`、Productionでは`sk_live_`だけを許可する。Secretsの値をチャット、Git、PR本文、端末ログへ貼らない。

Secretsをクライアント、Git、ログ、公開Artifactへ保存しない。Productionで`supabase db reset`は実行しない。

## 手数料・返金・チャージバック

- 販売価格・Treat額の15%をプラットフォーム手数料とし、残額をConnect destinationへ送る。
- 例: 300円では45円がBARBER HUBのapplication fee、255円が投稿者配分である。
- Treatと有料記事のCheckout Sessionでは`managed_payments: { enabled: false }`を明示する。Managed Paymentsを有効にしたままではConnect destination chargeの`application_fee_amount`を利用できないためであり、投稿者85%・BARBER HUB 15%の分配方式は変更しない。
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

## Stripe SandboxとPreviewアプリ統合テスト

Stripe Dashboard上の設定確認と、PreviewアプリのDB・通知・RLS確認は別の工程として記録する。以下は`treat-preview`とVercel Previewだけで実施し、テストデータは完了後にPreview branch内でのみ削除できる。

1. Platform scope endpointをPreviewの`/api/stripe/webhook`へ作成し、`checkout.session.completed`、`checkout.session.expired`、`charge.refunded`、`refund.created`、`refund.updated`、`refund.failed`、`charge.dispute.created`を購読する。署名secretを`STRIPE_WEBHOOK_SECRET`へ登録する。
2. Connected account scope endpointを同じPreview URLへ作成し、`account.updated`を購読する。こちらの別の署名secretを`STRIPE_CONNECT_WEBHOOK_SECRET`へ登録する。
3. Vercel Previewを再デプロイしてから、Stripeのテストイベント送信とWebhook deliveryの再送で署名検証・冪等処理を確認する。未対応イベントは200で受領しても購入完了にはしない。
4. 投稿者用のConnect Express accountをPreviewアプリから開始し、Sandboxのテストonboardingを完了する。`stripe_connected_accounts`の状態更新を確認する。
5. 投稿者と購入者を別のPreviewユーザーとして作成し、300円のコメント付きTreat、100円の有料記事購入、通知、重複購入防止、pending Checkout再利用を確認する。
6. Stripe Sandboxで一部返金・全額返金を行い、destination transfer reversal・application fee refundの金額を照合する。DBが一部返金を`partially_refunded`、全額返金だけを`refunded`として扱うこと、全額返金後だけ有料本文を拒否することを確認する。
7. publishable keyで未購入者の有料本文SELECTが拒否されること、購入者は読めることを確認する。RLS検証にservice role keyを使わない。

実行結果はPR本文に「実行済み」「未実施」「ブロック理由」を分け、Production migrationやLive Stripeを実施したように記載しない。

## DBと確認項目

- migrations: `202607240001_treat_paid_articles.sql`、`202607240002_protect_purchased_paid_articles.sql`
- `article_paid_sections`は投稿者と購入済み本人だけにRLSで公開する。購入実績（`completed`または`partially_refunded`）がある記事は、投稿者であっても有料本文の更新・削除をRLSとDB triggerで拒否する。記事の無料化・論理削除もDB triggerで拒否する。本文を管理画面・SQL・APIで無関係な利用者へ返さない。
- `content_treats`、`paid_article_purchases`、`stripe_connected_accounts`は本人またはserver-only service roleの範囲で扱う。
- Webhook受信が失敗した場合は、StripeイベントID、Checkout Session ID、PaymentIntent IDだけを照合し、カード情報やWebhook secretをログへ出さない。
