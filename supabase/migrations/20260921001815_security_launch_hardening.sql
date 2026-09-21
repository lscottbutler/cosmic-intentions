-- Cosmic Intentions production security hardening.
-- Keeps existing user data intact while closing privilege-escalation paths.

-- Mark the verified owner account as the application administrator. RLS reads
-- app_metadata because users cannot edit it themselves.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin')
where lower(email) = lower('lscottbutler@gmail.com');

-- Global editorial content remains publicly readable, but only the owner may
-- create, change, or delete it.
drop policy if exists "auth write" on public.content_blocks;
drop policy if exists "authed write content" on public.content_blocks;
drop policy if exists "admin write content" on public.content_blocks;

create policy "admin write content"
on public.content_blocks
for all
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

-- Users may increment only their own score, and only by the small positive
-- values awarded by the application.
create or replace function public.increment_user_score(uid uuid, pts integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or uid <> (select auth.uid()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if pts < 1 or pts > 25 then
    raise exception 'invalid points' using errcode = '22023';
  end if;

  update public.user_scores
  set total_score = total_score + pts,
      updated_at = now()
  where user_id = uid;
end;
$$;

revoke all on function public.increment_user_score(uuid, integer) from public, anon;
grant execute on function public.increment_user_score(uuid, integer) to authenticated;

-- Daily counter used by paid AI functions. The supplied user must match the
-- authenticated JWT; callers cannot spend another member's allowance.
create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  period date not null,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, action, period)
);

alter table public.ai_usage_daily enable row level security;

create or replace function public.bump_ai_usage(
  p_user uuid,
  p_action text,
  p_limit integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if (select auth.uid()) is null or p_user <> (select auth.uid()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_action !~ '^[a-z0-9_-]{1,50}$' or p_limit < 1 or p_limit > 1000 then
    raise exception 'invalid quota request' using errcode = '22023';
  end if;

  insert into public.ai_usage_daily (user_id, action, period, count, updated_at)
  values (p_user, p_action, (now() at time zone 'utc')::date, 1, now())
  on conflict (user_id, action, period)
  do update set count = public.ai_usage_daily.count + 1,
                updated_at = now()
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.bump_ai_usage(uuid, text, integer) from public, anon;
grant execute on function public.bump_ai_usage(uuid, text, integer) to authenticated;

-- Preserve the existing monthly API signature while enforcing ownership.
create or replace function public.bump_ai_usage_monthly(
  p_user uuid,
  p_action text,
  p_limit integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_count integer;
begin
  if (select auth.uid()) is null or p_user <> (select auth.uid()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_action !~ '^[a-z0-9_-]{1,50}$' or p_limit < 1 or p_limit > 1000 then
    raise exception 'invalid quota request' using errcode = '22023';
  end if;

  insert into public.ai_usage_monthly (user_id, action, period, count, updated_at)
  values (p_user, p_action, v_period, 1, now())
  on conflict (user_id, action, period)
  do update set count = public.ai_usage_monthly.count + 1,
                updated_at = now()
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.bump_ai_usage_monthly(uuid, text, integer) from public, anon;
grant execute on function public.bump_ai_usage_monthly(uuid, text, integer) to authenticated;

-- This event-trigger helper is internal database plumbing, never a client API.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Index the foreign keys reported by the database advisor.
create index if not exists activity_log_user_id_idx on public.activity_log(user_id);
create index if not exists daily_log_roadmap_item_id_idx on public.daily_log(roadmap_item_id);
create index if not exists intentions_user_id_idx on public.intentions(user_id);
create index if not exists roadmap_items_content_id_idx on public.roadmap_items(content_id);
