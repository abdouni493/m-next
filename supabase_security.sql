-- =====================================================================
-- M NEXT — admin security hardening (run in Supabase SQL editor)
-- Safe to re-run. Review section 0 first.
--
-- Findings this fixes:
--  * public."users" (emails, phones, salaries) was readable with the public anon key
--  * internal tables (employees, payments, invoices, suppliers, cash register…)
--    must only be reachable by signed-in staff
--  * the public sign-up form created ADMIN accounts (removed from the app;
--    also disable sign-ups in Supabase: Authentication → Providers → Email →
--    turn OFF "Allow new users to sign up")
-- =====================================================================

-- 0) Look at existing policies first. Policies are OR'ed together: an old
--    "allow anon" policy keeps working even after the ones below are added,
--    so drop any anon/public policy on these tables that you don't need.
-- select tablename, policyname, roles, cmd from pg_policies where schemaname = 'public' order by 1, 2;

-- 1) Helper: is the current user staff (has a row in public.users)?
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and coalesce(u.is_active, true));
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'manager') and coalesce(u.is_active, true));
$$;

-- 2) users: staff can read; each user can update own profile; only admins manage roles
alter table public.users enable row level security;
drop policy if exists "users_staff_read" on public.users;
create policy "users_staff_read" on public.users for select to authenticated using (public.is_staff() or id = auth.uid());
drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.users where id = auth.uid()));
drop policy if exists "users_admin_all" on public.users;
create policy "users_admin_all" on public.users for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.users from anon;

-- 3) Internal tables: signed-in staff only, never anon
do $$
declare t text;
begin
  foreach t in array array[
    'employees', 'payments', 'invoices', 'invoice_items', 'purchase_invoices',
    'suppliers', 'customers', 'caisse_transactions', 'stores', 'shelvings'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists "staff_all" on public.%I', t);
      execute format('create policy "staff_all" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
      execute format('revoke all on public.%I from anon', t);
    end if;
  end loop;
end $$;

-- 4) Catalogue tables: public can READ (storefront), only staff can WRITE
do $$
declare t text;
begin
  foreach t in array array[
    'products', 'product_images', 'marks', 'connector_types', 'categories',
    'offers', 'special_offers', 'packages', 'package_items', 'website_settings',
    'delivery_agencies', 'delivery_agency_wilaya_prices'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists "public_read" on public.%I', t);
      execute format('create policy "public_read" on public.%I for select to anon, authenticated using (true)', t);
      execute format('drop policy if exists "staff_write" on public.%I', t);
      execute format('create policy "staff_write" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
    end if;
  end loop;
end $$;

-- 5) Orders: the storefront (anon) may only CREATE orders; staff manage them.
--    Note: the checkout inserts with "return=representation", so anon also needs
--    to read back the row it just created. We allow reading only very recent
--    pending orders (2 minutes) to keep that working without exposing history.
alter table public.orders enable row level security;
drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert" on public.orders for insert to anon, authenticated with check (status = 'pending');
drop policy if exists "orders_public_read_new" on public.orders;
create policy "orders_public_read_new" on public.orders for select to anon using (status = 'pending' and created_at > now() - interval '2 minutes');
drop policy if exists "orders_staff_all" on public.orders;
create policy "orders_staff_all" on public.orders for all to authenticated using (public.is_staff()) with check (public.is_staff());

alter table public.order_items enable row level security;
drop policy if exists "order_items_public_insert" on public.order_items;
create policy "order_items_public_insert" on public.order_items for insert to anon, authenticated
  with check (exists (select 1 from public.orders o where o.id = order_id and o.status = 'pending' and o.created_at > now() - interval '10 minutes'));
drop policy if exists "order_items_public_read_new" on public.order_items;
create policy "order_items_public_read_new" on public.order_items for select to anon
  using (exists (select 1 from public.orders o where o.id = order_id and o.status = 'pending' and o.created_at > now() - interval '2 minutes'));
drop policy if exists "order_items_staff_all" on public.order_items;
create policy "order_items_staff_all" on public.order_items for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- 6) Reviews: public can read approved ones and submit new (unapproved) ones
alter table public.client_testimonials enable row level security;
drop policy if exists "reviews_public_read" on public.client_testimonials;
create policy "reviews_public_read" on public.client_testimonials for select to anon, authenticated using (is_approved = true and is_active = true or public.is_staff());
drop policy if exists "reviews_public_insert" on public.client_testimonials;
create policy "reviews_public_insert" on public.client_testimonials for insert to anon, authenticated with check (coalesce(is_approved, false) = false);
drop policy if exists "reviews_staff_all" on public.client_testimonials;
create policy "reviews_staff_all" on public.client_testimonials for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- 7) Make sure YOUR account is an admin (replace the email), then verify:
-- update public.users set role = 'admin' where email = 'YOUR-EMAIL@example.com';
-- select id, email, role from public.users;
