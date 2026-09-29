# Aviator Predictor — React + TypeScript + Vercel + Supabase

This version uses a Vite/React TypeScript frontend and Vercel TypeScript API functions. The old PHP pages are not required.

## User flow

1. START NOW → JISAJILI
2. Registration asks only for the Tanzania phone number. The phone is stored uniquely in `aviator_users`.
3. The user chooses a betting site.
4. The app shows **CONNECTING TO YOUR SITE**, then opens Dashboard.
5. NEXT ODDS opens the first unpaid package for the current cycle.
6. A payment order is created and the user waits for confirmation.
7. The next package opens automatically only after the payment API reports top-level `status=success` and `data.payment_status=SUCCESS`.
8. Cancelled/rejected payments return the user to Dashboard. The next NEXT ODDS starts the same unpaid package again.
9. Package 1 → Package 2 → Package 3 → Dashboard.
10. After Package 3 succeeds, the cycle resets: the next NEXT ODDS starts Package 1 again.
11. If the user leaves and later logs in with the same registered phone, the saved package progress is restored from Supabase.
12. If a payment was actually completed but status confirmation failed because of a network/provider problem, the control panel can mark that specific payment successful. The waiting screen will detect the database change and automatically continue to the next package.

## Shared Supabase database

This Supabase project is shared with other projects. Run the included `SCHEMA_AVIATOR_SHARED.sql` in **Supabase → SQL Editor**.

The schema is namespaced and uses only: `aviator_users`, `aviator_payments`, `aviator_app_ids`, and `aviator_submissions`. It does not create or modify generic `users` or `payments` tables.

The schema contains safe `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migrations for `cycle_no` and `last_login_at`, so it can also be run after the earlier Aviator schema.

## Vercel Environment Variables

Set these in Vercel Project Settings → Environment Variables:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

FIMIPAY_API_KEY=YOUR_SECRET_KEY
FIMIPAY_BUYER_EMAIL=customer@example.com
FIMIPAY_CURRENCY=TZS
FIMIPAY_CREATE_PAYMENT_URL=https://fimipay.com/api/v1/payment/create_order
FIMIPAY_ORDER_STATUS_URL=https://fimipay.com/api/v1/payment/order_status
FIMIPAY_TIMEOUT=60

ADMIN_ACCESS_KEY=USE_A_LONG_RANDOM_SECRET
```

Do not add DB_HOST, DB_USER, DB_PASSWORD or DB_NAME.

## Private control panel

The payment control panel is intentionally not linked from the public UI. It is available at `/control` and requires `ADMIN_ACCESS_KEY`. It can mark a pending payment as successful. No public user navigation points to it.

## Provider visibility

The payment provider name is kept in server-side configuration/API code only. It is not rendered in the public React UI, payment screen, waiting screen, or public navigation.

## Build

```bash
npm install
npm run build
```

Vercel uses the included `vercel.json`, builds `dist`, and serves the `/api/*` TypeScript functions.
