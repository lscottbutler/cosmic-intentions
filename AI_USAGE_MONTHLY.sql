-- ── AI_USAGE_MONTHLY.sql ─────────────────────────────────────────────────────
-- Per-user, per-CALENDAR-MONTH usage counter for paid AI features.
-- Backs the guard's `monthlyLimit` option (netlify/functions/_guard.js →
-- bump_ai_usage_monthly). Currently wired to cap "drilldown" at 100 / month.
--
-- HOW TO INSTALL (one time):
--   1) Open the Supabase SQL editor:
--      https://supabase.com/dashboard/project/wbqzwbubbeorcknevips/sql/new
--   2) Paste this whole file and click RUN.
-- Until it's installed the cap fails OPEN (never blocks anyone) — installing it
-- turns enforcement on. Safe to re-run: everything is IF NOT EXISTS / REPLACE.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) The counter table. One row per (user, action, month).
create table if not exists public.ai_usage_monthly (
  user_id uuid  not null,
  action  text  not null,               -- e.g. 'drilldown', 'videos'
  period  text  not null,               -- 'YYYY-MM' (calendar month, UTC)
  count   int   not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, action, period)
);

-- Locked down: only the SECURITY DEFINER function below ever touches it.
alter table public.ai_usage_monthly enable row level security;

-- 2) Atomic bump-and-check. Increments this user's count for this action in the
--    current month and returns TRUE while they are still at/under the limit.
--    SECURITY DEFINER so it can write past RLS; callable by anon/authenticated.
create or replace function public.bump_ai_usage_monthly(
  p_user  uuid,
  p_action text,
  p_limit int
) returns boolean
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_period text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_count  int;
begin
  insert into public.ai_usage_monthly (user_id, action, period, count, updated_at)
    values (p_user, p_action, v_period, 1, now())
  on conflict (user_id, action, period)
    do update set count = public.ai_usage_monthly.count + 1,
                  updated_at = now()
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

grant execute on function public.bump_ai_usage_monthly(uuid, text, int)
  to anon, authenticated;
