-- =====================================================================
-- DANGER: deletes ALL images from the storage buckets. Cannot be undone.
-- Only image files and the image-URL columns are touched; products,
-- orders, clients, etc. stay as they are.
-- =====================================================================

begin;

-- 1) Remove every file in the image buckets (buckets themselves are kept).
--    Newer Supabase projects block direct deletes unless this flag is set.
--    If it is still refused, use Dashboard → Storage → bucket → "Empty bucket".
set local storage.allow_delete_query = 'true';
delete from storage.objects where bucket_id in ('chargers', 'website');

-- 2) Remove the rows that only point to those files
do $$
begin
  if to_regclass('public.product_images') is not null then
    delete from public.product_images;
  end if;
end $$;

-- 3) Clear image URL columns so the UI doesn't show broken images.
--    Each block is skipped if the table/column does not exist.
do $$
declare r record;
begin
  for r in
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and (table_name, column_name) in (
        ('products', 'primary_image'),
        ('website_settings', 'logo_url'),
        ('website_settings', 'logo_data'),
        ('website_settings', 'landing_page_image_url'),
        ('packages', 'image_url'),
        ('packages', 'storage_bucket_path'),
        ('marks', 'logo_url'),
        ('marks', 'logo_file_path'),
        ('offers', 'product_image'),
        ('special_offers', 'product_image')
      )
  loop
    execute format('update public.%I set %I = null', r.table_name, r.column_name);
  end loop;
end $$;

commit;
