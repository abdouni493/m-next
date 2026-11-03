-- =====================================================================
-- Worker permissions: interfaces (sidebar) + button actions per worker
-- Run once in Supabase → SQL Editor.
-- Format stored: {"pos": ["add_client","checkout"], "sales": ["view","print"], ...}
-- An interface missing from the JSON is hidden for the worker.
-- NULL = default access (Dashboard, POS, Sales, Settings).
-- =====================================================================

-- 1) Columns
alter table public.users     add column if not exists permissions jsonb;
alter table public.employees add column if not exists permissions jsonb;
alter table public.employees add column if not exists user_id uuid;

-- 2) Link existing employees to their login account (by username)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'employees' and column_name = 'username') then
    update public.employees e
    set user_id = u.id
    from public.users u
    where e.user_id is null
      and e.username is not null
      and lower(u.username) = lower(e.username);
  end if;
end $$;

-- 3) Admin helper (same as supabase_security.sql, safe to re-run)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin', 'manager') and coalesce(u.is_active, true)
  );
$$;

-- 4) Admins/managers can update any user's profile (including permissions)
alter table public.users enable row level security;
drop policy if exists "users_admin_all" on public.users;
create policy "users_admin_all" on public.users
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Each user can still read his own row (needed to load his permissions at login)
drop policy if exists "users_self_read" on public.users;
create policy "users_self_read" on public.users
  for select to authenticated using (id = auth.uid());

-- 5) A worker can never change his own permissions
create or replace function public.protect_user_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.permissions is distinct from old.permissions
     and auth.uid() is not null
     and not public.is_admin() then
    new.permissions := old.permissions;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_user_permissions on public.users;
create trigger trg_protect_user_permissions
  before update on public.users
  for each row execute function public.protect_user_permissions();

-- 6) Refresh the PostgREST schema cache so the new columns are visible immediately
notify pgrst, 'reload schema';
