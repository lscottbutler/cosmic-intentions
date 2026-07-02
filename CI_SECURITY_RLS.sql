-- ============================================================
-- COSMIC INTENTIONS — SECURITY LOCKDOWN (Supabase RLS)
-- Run in: https://supabase.com/dashboard/project/wbqzwbubbeorcknevips/sql/new
-- Date: 2026-07-02
--
-- WHY: A live probe with the PUBLIC anon key (the key embedded in the
-- browser JS — anyone can read it) found that `user_scores` returns rows
-- to anonymous visitors, leaking user IDs, display names, and scores.
-- Every other user table (profiles, intentions, user_content,
-- roadmap_items, activity_log) is already locked. `waitlist` emails are
-- already private. This script closes the one hole + hardens content_blocks,
-- WITHOUT touching the tables that already work.
-- ============================================================

-- ── 1. FIX: user_scores (the leak) ──────────────────────────
-- Keep the leaderboard working (logged-in users can read scores) but stop
-- anonymous visitors from reading anything. Only the owner can write.
alter table public.user_scores enable row level security;

-- Remove any permissive/anon read policies that may exist (safe if absent).
drop policy if exists "public read scores"        on public.user_scores;
drop policy if exists "anon read"                 on public.user_scores;
drop policy if exists "Enable read access for all" on public.user_scores;
drop policy if exists "authed can read scores"    on public.user_scores;
drop policy if exists "owner writes score"        on public.user_scores;
drop policy if exists "owner updates score"       on public.user_scores;

-- Logged-in users can read scores (needed for ranking/leaderboard counts).
create policy "authed can read scores" on public.user_scores
  for select to authenticated using (true);

-- Users can only create/update THEIR OWN score row.
create policy "owner writes score" on public.user_scores
  for insert to authenticated with check (auth.uid() = user_id);
create policy "owner updates score" on public.user_scores
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 2. HARDEN: content_blocks (public CMS content) ─────────
-- Anyone may READ site content (that's the point). Only logged-in users may
-- write — prevents an anonymous visitor from defacing site copy.
-- TIP: to lock writes to ONLY you, replace `to authenticated ... with check (true)`
--      with `with check (auth.uid() = 'YOUR-ADMIN-UUID')`.
alter table public.content_blocks enable row level security;
drop policy if exists "public read content"  on public.content_blocks;
drop policy if exists "authed write content" on public.content_blocks;
create policy "public read content" on public.content_blocks
  for select to anon, authenticated using (true);
create policy "authed write content" on public.content_blocks
  for all to authenticated using (true) with check (true);

-- ── 3. VERIFY (run this after the above; every table should be rowsecurity = true) ──
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles','intentions','user_content','roadmap_items',
                    'activity_log','user_scores','content_blocks','waitlist')
order by tablename;

-- ── 4. LIST POLICIES (optional sanity check) ────────────────
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
