# AviatorPredictor — Auth Permission Fix

This version fixes the Supabase `permission denied for table aviator_users` path
without deleting or dropping any database data.

## Vercel Production variables

Use:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (preferred for current Supabase projects), OR
- `SUPABASE_SERVICE_ROLE_KEY`

Do NOT put the publishable/anon key into either server variable.

## If `/api/health` still says permission denied

Run `SUPABASE_PERMISSION_FIX_SAFE.sql` once in Supabase SQL Editor. It only
grants the server role access; it does not drop tables or delete rows.

Then redeploy and open:
`/api/health`

A healthy response includes:
`ok: true`
`database: connected`
and `server_key_type` should be `supabase_secret` or `service_role_jwt`.
