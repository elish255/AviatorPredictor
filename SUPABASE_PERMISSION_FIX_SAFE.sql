-- SAFE Supabase permission patch for AviatorPredictor
-- This script does NOT DROP tables, delete rows, or change existing data.
-- Run it once in Supabase SQL Editor if the server key still receives
-- "permission denied for table aviator_users".
--
-- The API must still use SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY
-- in Vercel Production.

grant usage on schema public to service_role;

grant select, insert, update, delete on table
  public.aviator_users,
  public.aviator_sessions,
  public.aviator_payments,
  public.aviator_app_ids,
  public.aviator_submissions,
  public.aviator_site_settings
to service_role;

grant usage, select on all sequences in schema public to service_role;

-- Keep future tables/sequences created by the project accessible to the
-- server role as well.
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;

alter default privileges in schema public
  grant usage, select on sequences to service_role;
