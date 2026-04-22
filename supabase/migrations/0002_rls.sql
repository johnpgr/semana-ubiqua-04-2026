-- Helper function to check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- ========== profiles ==========
alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (id = auth.uid() or is_admin());

create policy "profiles_insert_own" on profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- ========== credit_requests ==========
alter table credit_requests enable row level security;

create policy "credit_requests_select_own" on credit_requests
  for select using (user_id = auth.uid() or is_admin());

create policy "credit_requests_insert_own" on credit_requests
  for insert with check (user_id = auth.uid());

-- Updates are performed by service role (bypasses RLS) or admin
create policy "credit_requests_update_admin" on credit_requests
  for update using (is_admin());

-- ========== consents ==========
alter table consents enable row level security;

create policy "consents_select_own" on consents
  for select using (
    request_id in (select id from credit_requests where user_id = auth.uid())
    or is_admin()
  );

create policy "consents_insert_own" on consents
  for insert with check (
    request_id in (select id from credit_requests where user_id = auth.uid())
  );

-- ========== transactions ==========
alter table transactions enable row level security;

create policy "transactions_select_own" on transactions
  for select using (
    request_id in (select id from credit_requests where user_id = auth.uid())
    or is_admin()
  );

-- Only service role can insert/update (bypasses RLS by default)

-- ========== scores ==========
alter table scores enable row level security;

create policy "scores_select_own" on scores
  for select using (
    request_id in (select id from credit_requests where user_id = auth.uid())
    or is_admin()
  );

-- Only service role can insert/update (bypasses RLS by default)

-- ========== documents ==========
alter table documents enable row level security;

create policy "documents_select_own" on documents
  for select using (
    request_id in (select id from credit_requests where user_id = auth.uid())
    or is_admin()
  );

create policy "documents_insert_own" on documents
  for insert with check (
    request_id in (select id from credit_requests where user_id = auth.uid())
  );

-- ========== audit_logs ==========
alter table audit_logs enable row level security;

create policy "audit_logs_select_admin" on audit_logs
  for select using (is_admin());

-- Only service role can insert (bypasses RLS by default)
