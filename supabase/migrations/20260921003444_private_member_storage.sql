-- Personal vision images and generated goal audio must never be public.
update storage.buckets
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'vision-images';

update storage.buckets
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['audio/mpeg']
where id = 'goal-audio';

-- Public editorial images are separated from private member media and remain
-- writable only by the application administrator.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-images',
  'content-images',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vision insert own" on storage.objects;
drop policy if exists "vision update own" on storage.objects;
drop policy if exists "vision select own" on storage.objects;
drop policy if exists "vision delete own" on storage.objects;

create policy "vision select own"
on storage.objects for select to authenticated
using (
  bucket_id = 'vision-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "vision insert own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'vision-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "vision update own"
on storage.objects for update to authenticated
using (
  bucket_id = 'vision-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'vision-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "vision delete own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'vision-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "goal audio select own" on storage.objects;
drop policy if exists "goal audio insert own" on storage.objects;
drop policy if exists "goal audio update own" on storage.objects;
drop policy if exists "goal audio delete own" on storage.objects;

create policy "goal audio select own"
on storage.objects for select to authenticated
using (
  bucket_id = 'goal-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "goal audio insert own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'goal-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "goal audio update own"
on storage.objects for update to authenticated
using (
  bucket_id = 'goal-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'goal-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "goal audio delete own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'goal-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "admin content images insert" on storage.objects;
drop policy if exists "admin content images update" on storage.objects;
drop policy if exists "admin content images delete" on storage.objects;

create policy "admin content images insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'content-images'
  and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy "admin content images update"
on storage.objects for update to authenticated
using (
  bucket_id = 'content-images'
  and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
  bucket_id = 'content-images'
  and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy "admin content images delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'content-images'
  and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
);
