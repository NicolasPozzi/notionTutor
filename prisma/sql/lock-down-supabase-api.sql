-- Lock down Supabase's auto-generated Data API (PostgREST) on the public schema.
--
-- The app only talks to Postgres through Prisma, connected as `postgres`, a role
-- that bypasses RLS. The `anon` and `authenticated` roles are only used by
-- Supabase's REST/GraphQL API, which NotionTutor doesn't use. Without this script
-- they had full privileges (incl. TRUNCATE) on every table with RLS disabled, so
-- anyone holding the project's public anon key could read or wipe the database.
--
-- Idempotent. Re-run after adding tables (`prisma db push` doesn't manage RLS):
--   psql "$DIRECT_URL" -f prisma/sql/lock-down-supabase-api.sql

begin;

-- 1. Enable RLS on every table in public. No policies = deny all for non-bypass roles.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- 2. Remove the API roles' privileges on existing objects…
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- 3. …and on objects created later by `postgres` (e.g. future prisma db push).
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

commit;
