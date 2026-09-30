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


## Full Name + phone login fix
The registration page now asks for **Full Name** and **phone number**. Login continues to use the **phone number only**. The payment request sends the registered user's full name as FimiPay `account_name`; if a user record has no name, the server falls back to `FIMIPAY_ACCOUNT_NAME`, whose default is `SmarkSoko`.

Before deploying/testing a new registration, run `ADD_FULL_NAME_TO_AVIATOR_USERS.sql` once in Supabase SQL Editor. This migration only adds the `full_name` column and does not delete existing users or payment data.
