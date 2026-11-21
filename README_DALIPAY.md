# Dalipay collections

New payments use Dalipay. Package prices remain TZS 2,000 / 3,000 / 5,000 and are selected on the server, never trusted from the browser. The customer selects their actual mobile money network; do not infer it from a phone prefix (numbers can be ported).

## Configure before merging to production

In the Vercel project's **Environment Variables**, add these as **Secret** variables (no `VITE_` prefix):

- `DALIPAY_PUBLIC_KEY`
- `DALIPAY_SECRET_KEY`

Use a matching **production** key pair for Production. Use a separate **test** key pair for Preview/Development. Dalipay selects the environment from the keys; production keys initiate real mobile money prompts. Never paste keys in chat, source, PRs, or logs. Missing keys disable new checkout requests with a configuration error. Redeploy after setting variables.

The server uses `https://dalipay.co.tz/api/v1/collections`, with `X-Public-Key` and `X-Secret-Key` headers. It sends the local-format phone, explicit provider, server-priced amount, TZS currency, customer name and a unique external ID (30 characters). Keep the matching Dalipay account authorized for this business.

## Confirmation and migration

The existing signed-in polling flow checks the collection's UUID, amount, currency and status on Dalipay's server. Only a confirmed `success` unlocks the next package. `processing` stays pending; `failed` allows retry. No webhook endpoint or callback secret is required by this polling-based integration. Confirmation runs while the payment page is open; closing it stops polling, as in the previous integration. Durable background reconciliation would need a separate webhook/reconciliation change.

Dalipay collection UUIDs are stored in `aviator_payments.order_id` with a `dalipay_` prefix; no schema migration is required. Old unprefixed FimiPay orders continue using the existing FimiPay status API. Keep `FIMIPAY_API_KEY` and any existing status URL until old orders have settled. New orders never use that key.

## Verification

Build: `npm run build`.

Before enabling real collections, verify in Preview with Dalipay test keys: select each network, initiate checkout, confirm a successful status advances exactly once, and confirm a failed payment allows retry. Real USSD, live credentials and real fund settlement must be verified by the merchant; a build or mocked test does not prove them.

Official API reference: https://dalipay.co.tz/documentation
