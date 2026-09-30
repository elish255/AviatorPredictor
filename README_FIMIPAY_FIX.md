# FimiPay payment fix

The previous payment request was rejected because FimiPay explicitly reported
that these fields were missing:

- method
- account_number
- account_name

This version sends all three fields while keeping the existing package prices:
TSh 2,000 / 3,000 / 5,000.

Optional Vercel Production variables:
- FIMIPAY_METHOD=mpesa
- FIMIPAY_ACCOUNT_NAME=SmarkSoko

If FimiPay has a different exact method identifier enabled for your merchant
account, set FIMIPAY_METHOD to that identifier. Do not put API keys in source.
FIMIPAY_API_KEY remains a server-side Vercel environment variable.
