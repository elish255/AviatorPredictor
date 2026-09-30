# AviatorPredictor - Safe Auth Fix

This version fixes the Vercel authentication/API failure without dropping or altering database tables.

## Changes
- Uses Vercel `(req, res)` handlers for auth endpoints.
- Uses explicit `.js` ESM imports.
- Requires a server-side Supabase key instead of silently falling back to a publishable key.
- Supports `SUPABASE_URL` (or `VITE_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` (also accepts `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_KEY`).
- Adds a 10-second Supabase timeout so a broken connection cannot hang for 5 minutes.
- Returns the actual Supabase error message to the client/logs.
- Registration supports both the current UUID schema and the older schema where `full_name` is required, without changing the database.
- Adds GET `/api/health` for a safe database connectivity test. It does not expose keys.
- Keeps package prices at TSh 2,000 / 3,000 / 5,000.

## Vercel Production variables
Set these in the Production environment:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Do not paste the service-role key into the frontend or chat.
