-- =====================================================================
-- 1) STORAGE BUCKETS + POLICIES  (safe to re-run)
--    The app uploads every image to the "chargers" bucket
--    (folders: <productId>/, marks/, logos/, landing/, packages/).
--    "website" is only used by legacy code; kept public-read too.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('chargers', 'chargers', true, 10485760,
   array['image/webp','image/jpeg','image/png','image/gif','image/avif','image/svg+xml','image/x-icon','image/vnd.microsoft.icon']),
  ('website',  'website',  true, 10485760,
   array['image/webp','image/jpeg','image/png','image/gif','image/avif','image/svg+xml','image/x-icon','image/vnd.microsoft.icon'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read
drop policy if exists "images_public_read" on storage.objects;
create policy "images_public_read"
  on storage.objects for select
  to public
  using (bucket_id in ('chargers', 'website'));

-- Authenticated upload
drop policy if exists "images_auth_insert" on storage.objects;
create policy "images_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('chargers', 'website'));

-- Authenticated update / delete (needed for "remove image" buttons)
drop policy if exists "images_auth_update" on storage.objects;
create policy "images_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('chargers', 'website'))
  with check (bucket_id in ('chargers', 'website'));

drop policy if exists "images_auth_delete" on storage.objects;
create policy "images_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('chargers', 'website'));

-- Check result:
-- select id, public, file_size_limit from storage.buckets;
-- select policyname, cmd, roles from pg_policies where schemaname = 'storage' and tablename = 'objects';
