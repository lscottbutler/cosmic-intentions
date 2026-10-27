-- User-selected titles share the existing private account/page note row.
-- Additive only: old note bodies, primary key, ownership policies and grants remain intact.
alter table public.player_personal_notes
  add column title text null
  constraint player_personal_notes_title_length check (char_length(title) <= 80);
comment on column public.player_personal_notes.title is
  'Member-selected private title; null preserves a pre-upgrade browser title until explicit Save. Maximum 80 characters.';
