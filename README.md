# Aviator Predictor — Vercel + Supabase

## Deploy
1. Run `supabase.sql` in the same Supabase project used by the other applications. The table names are prefixed `aviator_` so they do not collide.
2. Push this folder to GitHub and import it into Vercel.
3. Add the variables in `.env.example` to Vercel Production/Preview as needed.
4. Redeploy.

The browser never receives the server secret key. There is no database host/user configuration.

## Flow
Start Now → Jisajili → Login → Betting Site → Connecting → Dashboard → Next odd → current unpaid package → waiting until SUCCESS → next package. Package 3 success returns to Dashboard and starts a new cycle at Package 1.

A cancelled payment returns to Dashboard. A failed/pending payment remains on the payment screen. The private `/control` page can mark a payment successful when a real payment succeeded but the status callback/poll did not confirm it.
