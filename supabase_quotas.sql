-- =====================================================================
-- M NEXT — Quotas (lots d'achat) : purchases grouped under a named quota,
-- with per-charger remaining quantity and gains tracked from POS sales and
-- delivered website orders.
-- Safe to re-run. Nothing is dropped or rewritten.
-- =====================================================================

-- 1) Quotas
create table if not exists public.quotas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  quota_date date not null default current_date,
  supplier_id uuid references public.suppliers(id) on delete set null,
  invoice_id uuid,                       -- purchase invoice created with the quota
  amount_paid numeric not null default 0,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quotas_date_idx on public.quotas (quota_date desc);

-- 2) Chargers inside a quota
create table if not exists public.quota_items (
  id uuid primary key default gen_random_uuid(),
  quota_id uuid not null references public.quotas(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity >= 0),
  sold_quantity integer not null default 0 check (sold_quantity >= 0),
  purchase_price numeric not null default 0,
  selling_price numeric not null default 0,
  created_at timestamptz not null default now(),
  constraint quota_items_sold_le_qty check (sold_quantity <= quantity)
);
create index if not exists quota_items_quota_idx on public.quota_items (quota_id);
create index if not exists quota_items_product_idx on public.quota_items (product_id);

-- 3) Every sale taken from a quota (POS or delivered website order)
create table if not exists public.quota_sales (
  id uuid primary key default gen_random_uuid(),
  quota_id uuid not null references public.quotas(id) on delete cascade,
  quota_item_id uuid not null references public.quota_items(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null default 0,
  purchase_price numeric not null default 0,
  total numeric generated always as (quantity * unit_price) stored,
  gain numeric generated always as (quantity * (unit_price - purchase_price)) stored,
  source text not null default 'pos',    -- pos | order
  invoice_ref text,                      -- invoices.id for POS sales
  order_ref text,                        -- orders.id for website orders
  client_name text,
  created_at timestamptz not null default now()
);
create index if not exists quota_sales_item_idx on public.quota_sales (quota_item_id, created_at desc);
create index if not exists quota_sales_quota_idx on public.quota_sales (quota_id);
create index if not exists quota_sales_order_idx on public.quota_sales (order_ref);

-- 4) Website order lines can be assigned to a quota when the order is confirmed
alter table public.order_items add column if not exists quota_item_id uuid references public.quota_items(id) on delete set null;

-- 5) Record a sale against a quota line (atomic: locks the line, checks the remaining quantity)
create or replace function public.record_quota_sale(
  p_quota_item_id uuid,
  p_quantity integer,
  p_unit_price numeric,
  p_source text default 'pos',
  p_invoice_ref text default null,
  p_order_ref text default null,
  p_client_name text default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  qi public.quota_items%rowtype;
  take integer;
begin
  select * into qi from public.quota_items where id = p_quota_item_id for update;
  if not found then return 0; end if;
  take := least(coalesce(p_quantity, 0), qi.quantity - qi.sold_quantity);
  if take <= 0 then return 0; end if;

  insert into public.quota_sales (quota_id, quota_item_id, product_id, quantity, unit_price, purchase_price, source, invoice_ref, order_ref, client_name)
  values (qi.quota_id, qi.id, qi.product_id, take, coalesce(p_unit_price, 0), qi.purchase_price, coalesce(p_source, 'pos'), p_invoice_ref, p_order_ref, p_client_name);

  update public.quota_items set sold_quantity = sold_quantity + take where id = qi.id;
  return take;
end $$;

-- 6) Apply the quota lines of a delivered order (idempotent: lines already recorded are skipped)
create or replace function public.apply_order_quotas(p_order_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n integer := 0;
  cname text;
begin
  select customer_name into cname from public.orders where id::text = p_order_id;
  for r in
    select oi.quota_item_id, oi.quantity, oi.price_per_unit
    from public.order_items oi
    where oi.order_id::text = p_order_id and oi.quota_item_id is not null
      and not exists (select 1 from public.quota_sales s where s.order_ref = p_order_id and s.quota_item_id = oi.quota_item_id)
  loop
    n := n + public.record_quota_sale(r.quota_item_id, r.quantity, r.price_per_unit, 'order', null, p_order_id, cname);
  end loop;
  return n;
end $$;

-- 7) Keep sold_quantity right when a sale row is removed by hand
create or replace function public.quota_sale_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.quota_items set sold_quantity = greatest(0, sold_quantity - old.quantity) where id = old.quota_item_id;
  return old;
end $$;
drop trigger if exists trg_quota_sale_deleted on public.quota_sales;
create trigger trg_quota_sale_deleted after delete on public.quota_sales
  for each row execute function public.quota_sale_deleted();

-- 8) Summary view used by the Quotas page
create or replace view public.quota_summary
with (security_invoker = true) as
select
  q.*,
  coalesce(i.total_qty, 0)     as total_quantity,
  coalesce(i.sold_qty, 0)      as sold_quantity,
  coalesce(i.total_qty, 0) - coalesce(i.sold_qty, 0) as remaining_quantity,
  coalesce(i.total_cost, 0)    as total_cost,
  coalesce(s.total_gain, 0)    as total_gain,
  coalesce(s.total_sales, 0)   as total_sales,
  coalesce(i.items_count, 0)   as items_count
from public.quotas q
left join (
  select quota_id, sum(quantity) total_qty, sum(sold_quantity) sold_qty, sum(quantity * purchase_price) total_cost, count(*) items_count
  from public.quota_items group by quota_id
) i on i.quota_id = q.id
left join (
  select quota_id, sum(gain) total_gain, sum(total) total_sales from public.quota_sales group by quota_id
) s on s.quota_id = q.id;

-- 9) Security — staff only (same policy style as stock_movements)
alter table public.quotas enable row level security;
alter table public.quota_items enable row level security;
alter table public.quota_sales enable row level security;
drop policy if exists "quotas_staff" on public.quotas;
create policy "quotas_staff" on public.quotas for all to authenticated using (true) with check (true);
drop policy if exists "quota_items_staff" on public.quota_items;
create policy "quota_items_staff" on public.quota_items for all to authenticated using (true) with check (true);
drop policy if exists "quota_sales_staff" on public.quota_sales;
create policy "quota_sales_staff" on public.quota_sales for all to authenticated using (true) with check (true);
revoke all on public.quotas, public.quota_items, public.quota_sales, public.quota_summary from anon;
grant select on public.quota_summary to authenticated;
revoke execute on function public.record_quota_sale(uuid, integer, numeric, text, text, text, text) from anon, public;
revoke execute on function public.apply_order_quotas(text) from anon, public;
grant execute on function public.record_quota_sale(uuid, integer, numeric, text, text, text, text) to authenticated;
grant execute on function public.apply_order_quotas(text) to authenticated;

notify pgrst, 'reload schema';
