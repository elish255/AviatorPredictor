# FimiPay Create Payment fix

Updated `api/payment-create.ts` to match the supplied FimiPay Create Payment documentation exactly for Tanzania mobile:

- `buyer_name`
- `buyer_phone`
- `amount` (major TZS units: 2000 / 3000 / 5000)
- `currency: TZS`
- `payment_method: mobile`

Removed the unsupported create-payment fields `method`, `account_number`, and `account_name` that were causing the provider to validate the request as payout details.

The user's registration full name is used as `buyer_name`. If an old account has no `full_name`, the fallback is `FIMIPAY_ACCOUNT_NAME` or `SmarkSoko`.

No package prices were changed.
