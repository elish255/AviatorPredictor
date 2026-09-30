# Aviator Predictor — deployment

## Vercel
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## REQUIRED environment variables
In **Vercel → Project → Settings → Environment Variables**, add these for **Production** (and Preview if needed):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Then redeploy the latest commit.

The service-role key must stay server-side; do not put it in `VITE_*` variables or frontend code.

## Supabase
Run `AVIATOR_SUPABASE_SHARED_FIXED.sql` once if the database has not already been created with the UUID-based `aviator_users`, `aviator_sessions`, and `aviator_payments` tables.

Do not run the FIXED SQL blindly if you already have important Aviator data, because that file intentionally drops the three Aviator tables before recreating them.

## Authentication
Login and registration use:
- `/api/auth-login`
- `/api/auth-register`

Both now return the actual configuration/database error instead of a generic browser `Request failed`.
