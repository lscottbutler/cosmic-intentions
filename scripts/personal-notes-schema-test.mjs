import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
export const migrationSql = `-- User-selected titles share the existing private account/page note row.
-- Additive only: old note bodies, primary key, ownership policies and grants remain intact.
alter table public.player_personal_notes
  add column title text null
  constraint player_personal_notes_title_length check (char_length(title) <= 80);
comment on column public.player_personal_notes.title is
  'Member-selected private title; null preserves a pre-upgrade browser title until explicit Save. Maximum 80 characters.';
`;
if(process.argv[2]==='--write'){
  const target=process.argv[3];
  assert.match(target,/^supabase\/migrations\/\d+_player_personal_notes_title\.sql$/);
  assert.ok(fs.existsSync(target),'Generate the migration with Supabase CLI first.');
  fs.writeFileSync(target,migrationSql);
  console.log('Additive title migration saved.');
}else{
  const url=process.env.CI_NOTES_DATABASE_URL||'';
  assert.match(url,/^postgresql:\/\/[^@]+@(?:localhost|127\.0\.0\.1):5432\/ci_notes_test$/,'Isolated local fixture database required.');
  const sql=`
\set ON_ERROR_STOP on
create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,public to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
create table public.player_personal_notes(
 user_id uuid not null references auth.users(id) on delete cascade,
 page_id text not null check(char_length(page_id) between 1 and 80),
 body text not null default '', updated_at timestamptz not null default now(), primary key(user_id,page_id));
alter table public.player_personal_notes enable row level security;
grant select,insert,update,delete on public.player_personal_notes to authenticated;
create policy player_notes_member_read on public.player_personal_notes for select to authenticated using ((select auth.uid())=user_id);
create policy player_notes_member_insert on public.player_personal_notes for insert to authenticated with check ((select auth.uid())=user_id);
create policy player_notes_member_update on public.player_personal_notes for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy player_notes_member_delete on public.player_personal_notes for delete to authenticated using ((select auth.uid())=user_id);
insert into auth.users values('00000000-0000-4000-8000-000000000101'),('00000000-0000-4000-8000-000000000202');
insert into public.player_personal_notes(user_id,page_id,body) values('00000000-0000-4000-8000-000000000101','dashboard','Original body preserved');
${migrationSql}
do $$ begin
 if not exists(select 1 from public.player_personal_notes where body='Original body preserved' and title is null) then raise exception 'Migration changed an existing record'; end if;
end $$;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000101';
insert into public.player_personal_notes(user_id,page_id,title,body) values('00000000-0000-4000-8000-000000000101','dashboard','My chosen title','Saved body') on conflict(user_id,page_id) do update set title=excluded.title,body=excluded.body;
do $$ begin
 if not exists(select 1 from public.player_personal_notes where title='My chosen title' and body='Saved body') then raise exception 'Own save/read failed'; end if;
 begin
  update public.player_personal_notes set title=repeat('x',81);
  raise exception 'Long title accepted';
 exception when check_violation then null; end;
 begin
  update public.player_personal_notes set user_id='00000000-0000-4000-8000-000000000202';
  raise exception 'Ownership reassignment allowed';
 exception when insufficient_privilege then null; end;
end $$;
-- Existing clients that write only body do not erase the new title.
insert into public.player_personal_notes(user_id,page_id,body) values('00000000-0000-4000-8000-000000000101','dashboard','Legacy body update') on conflict(user_id,page_id) do update set body=excluded.body;
do $$ begin if not exists(select 1 from public.player_personal_notes where title='My chosen title' and body='Legacy body update') then raise exception 'Legacy client erased title'; end if; end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000202';
do $$ declare affected integer; begin
 if exists(select 1 from public.player_personal_notes) then raise exception 'Another account can read note'; end if;
 update public.player_personal_notes set title='Unauthorized';
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Another account can update note'; end if;
 begin
  insert into public.player_personal_notes(user_id,page_id,title,body) values('00000000-0000-4000-8000-000000000101','habits','Unauthorized','Unauthorized');
  raise exception 'Cross-account insert allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set role anon;
set request.jwt.claim.sub='';
do $$ begin
 begin
  perform * from public.player_personal_notes;
  raise exception 'Anonymous read allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: additive migration, private reads/writes, length check and legacy preservation' as verification;
`;
  const output=execFileSync('psql',[url,'-X','-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',stdio:['pipe','pipe','pipe']});
  assert.match(output,/PASS: additive migration/);
  console.log('PASS: isolated PostgreSQL migration, own-account Save/read, cross-account read/update/insert denial, anonymous denial, length limit, preserved existing body and legacy-client title.');
}
