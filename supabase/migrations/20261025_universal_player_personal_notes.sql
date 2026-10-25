-- CI personal player notes: member-scoped, separate from public editorial ATBs.
create table if not exists public.player_personal_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  page_id text not null check (char_length(page_id) between 1 and 80),
  body text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, page_id)
);
alter table public.player_personal_notes enable row level security;
revoke all on public.player_personal_notes from anon;
grant select, insert, update, delete on public.player_personal_notes to authenticated;
create policy "player_notes_member_read" on public.player_personal_notes
 for select to authenticated using ((select auth.uid()) = user_id);
create policy "player_notes_member_insert" on public.player_personal_notes
 for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "player_notes_member_update" on public.player_personal_notes
 for update to authenticated using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
create policy "player_notes_member_delete" on public.player_personal_notes
 for delete to authenticated using ((select auth.uid()) = user_id);
