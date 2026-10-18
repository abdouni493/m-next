-- =====================================================================
-- M NEXT — additive schema for the admin catalogue + stock log
-- Safe to re-run. Nothing is dropped or rewritten.
-- =====================================================================

-- 1) Storefront fields on products (read by the shop, edited in Admin → Catalogue)
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists old_price numeric;
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists compatible_models text[] not null default '{}';
create unique index if not exists products_slug_key on public.products (slug) where slug is not null;

-- 2) Order timeline timestamps (filled by the admin when the status changes)
alter table public.orders add column if not exists confirmed_at timestamptz;
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;

-- 3) Stock movements: every change of products.quantity_on_hand is logged automatically
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  change integer not null,              -- +in / -out
  quantity_after integer not null,
  kind text not null default 'adjustment', -- in | out | adjustment
  user_id uuid default auth.uid(),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_product_idx on public.stock_movements (product_id, created_at desc);
create index if not exists stock_movements_created_idx on public.stock_movements (created_at desc);

create or replace function public.log_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare d integer;
begin
  -- quantity_on_hand (inventory screens) and quantity_actual (order finalisation) are both tracked
  d := coalesce(new.quantity_on_hand, 0) - coalesce(old.quantity_on_hand, 0);
  if d <> 0 then
    insert into public.stock_movements (product_id, change, quantity_after, kind, note)
    values (new.id, d, coalesce(new.quantity_on_hand, 0), case when d > 0 then 'in' else 'out' end, 'quantity_on_hand');
  end if;
  d := coalesce(new.quantity_actual, 0) - coalesce(old.quantity_actual, 0);
  if d <> 0 then
    insert into public.stock_movements (product_id, change, quantity_after, kind, note)
    values (new.id, d, coalesce(new.quantity_actual, 0), case when d > 0 then 'in' else 'out' end, 'quantity_actual');
  end if;
  return new;
end $$;

drop trigger if exists trg_log_stock_movement on public.products;
create trigger trg_log_stock_movement
  after update of quantity_on_hand, quantity_actual on public.products
  for each row execute function public.log_stock_movement();

alter table public.stock_movements enable row level security;
drop policy if exists "stock_movements_staff" on public.stock_movements;
create policy "stock_movements_staff" on public.stock_movements for all to authenticated using (true) with check (true);
revoke all on public.stock_movements from anon;
