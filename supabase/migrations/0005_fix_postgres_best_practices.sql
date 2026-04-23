-- ==========================================================
-- 0005: Fix Postgres best-practice issues
-- Issues addressed:
--   #1 auth.uid() per-row in RLS policies
--   #2 is_admin() has per-row auth.uid() inside
--   #3 Correlated subqueries in child-table RLS policies (denormalize user_id)
--   #4 Redundant profiles_cpf_idx index
--   #5 UUIDv4 PKs on high-write tables -> UUIDv7 (custom function)
--   #6 search_path too permissive in is_admin()
--   #7 Missing FORCE ROW LEVEL SECURITY
--   #8 Missing partial indexes for active statuses
--   #9 bigserial instead of identity on audit_logs
-- ==========================================================

-- ========== #5: Custom UUIDv7 generator (uses pgcrypto for gen_random_bytes) ==========
create or replace function public.uuid_v7()
returns uuid
language plpgsql
volatile
as $$
declare
  unix_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  raw bytea := gen_random_bytes(16);
begin
  raw := set_byte(raw, 0, ((unix_ms >> 40) & 255)::int);
  raw := set_byte(raw, 1, ((unix_ms >> 32) & 255)::int);
  raw := set_byte(raw, 2, ((unix_ms >> 24) & 255)::int);
  raw := set_byte(raw, 3, ((unix_ms >> 16) & 255)::int);
  raw := set_byte(raw, 4, ((unix_ms >> 8) & 255)::int);
  raw := set_byte(raw, 5, (unix_ms & 255)::int);
  raw := set_byte(raw, 6, (get_byte(raw, 6) & 15) | 112);
  raw := set_byte(raw, 8, (get_byte(raw, 8) & 63) | 128);
  return encode(raw, 'hex')::uuid;
end;
$$;

-- ========== #2 & #6: Fix is_admin() function ==========
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = (select auth.uid())
      and raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- ========== #3: Denormalize user_id onto child tables ==========

-- Add nullable user_id columns
alter table consents add column user_id uuid;
alter table transactions add column user_id uuid;
alter table scores add column user_id uuid;
alter table documents add column user_id uuid;

-- Backfill user_id from credit_requests
update consents c
set user_id = cr.user_id
from credit_requests cr
where c.request_id = cr.id;

update transactions t
set user_id = cr.user_id
from credit_requests cr
where t.request_id = cr.id;

update scores s
set user_id = cr.user_id
from credit_requests cr
where s.request_id = cr.id;

update documents d
set user_id = cr.user_id
from credit_requests cr
where d.request_id = cr.id;

-- Set NOT NULL and FK constraint after backfill
alter table consents
  alter column user_id set not null,
  add constraint consents_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;

alter table transactions
  alter column user_id set not null,
  add constraint transactions_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;

alter table scores
  alter column user_id set not null,
  add constraint scores_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;

alter table documents
  alter column user_id set not null,
  add constraint documents_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;

-- Index the new user_id columns
create index consents_user_id_idx on consents(user_id);
create index transactions_user_id_idx on transactions(user_id);
create index scores_user_id_idx on scores(user_id);
create index documents_user_id_idx on documents(user_id);

-- Trigger to auto-populate user_id from credit_requests on insert
create or replace function set_user_id_from_request()
returns trigger
language plpgsql
volatile
as $$
begin
  if new.user_id is null then
    select user_id into new.user_id
    from credit_requests
    where id = new.request_id;
  end if;
  return new;
end;
$$;

create trigger consents_set_user_id
  before insert on consents
  for each row
  execute function set_user_id_from_request();

create trigger transactions_set_user_id
  before insert on transactions
  for each row
  execute function set_user_id_from_request();

create trigger scores_set_user_id
  before insert on scores
  for each row
  execute function set_user_id_from_request();

create trigger documents_set_user_id
  before insert on documents
  for each row
  execute function set_user_id_from_request();

-- ========== #1, #3, #7: Rewrite all RLS policies ==========
-- Drop existing policies (including 0004 consent transition)
drop policy profiles_select_own on profiles;
drop policy profiles_insert_own on profiles;
drop policy profiles_update_own on profiles;
drop policy credit_requests_select_own on credit_requests;
drop policy credit_requests_insert_own on credit_requests;
drop policy credit_requests_update_admin on credit_requests;
drop policy credit_requests_update_status_consent on credit_requests;
drop policy consents_select_own on consents;
drop policy consents_insert_own on consents;
drop policy transactions_select_own on transactions;
drop policy scores_select_own on scores;
drop policy documents_select_own on documents;
drop policy documents_insert_own on documents;
drop policy audit_logs_select_admin on audit_logs;

-- Recreate policies using (select auth.uid()) pattern
create policy profiles_select_own on profiles
  for select using (id = (select auth.uid()) or (select is_admin()));

create policy profiles_insert_own on profiles
  for insert with check (id = (select auth.uid()));

create policy profiles_update_own on profiles
  for update using (id = (select auth.uid()) or (select is_admin()))
  with check (id = (select auth.uid()) or (select is_admin()));

create policy credit_requests_select_own on credit_requests
  for select using (user_id = (select auth.uid()) or (select is_admin()));

create policy credit_requests_insert_own on credit_requests
  for insert with check (user_id = (select auth.uid()));

create policy credit_requests_update_admin on credit_requests
  for update using ((select is_admin()));

create policy credit_requests_update_status_consent on credit_requests
  for update using (
    user_id = (select auth.uid())
    and status = 'awaiting_consent'
  )
  with check (
    user_id = (select auth.uid())
    and status = 'collecting_data'
  );

create policy consents_select_own on consents
  for select using (user_id = (select auth.uid()) or (select is_admin()));

create policy consents_insert_own on consents
  for insert with check (user_id = (select auth.uid()));

create policy transactions_select_own on transactions
  for select using (user_id = (select auth.uid()) or (select is_admin()));

create policy scores_select_own on scores
  for select using (user_id = (select auth.uid()) or (select is_admin()));

create policy documents_select_own on documents
  for select using (user_id = (select auth.uid()) or (select is_admin()));

create policy documents_insert_own on documents
  for insert with check (user_id = (select auth.uid()));

create policy audit_logs_select_admin on audit_logs
  for select using ((select is_admin()));

-- ========== #7: FORCE ROW LEVEL SECURITY on all tables ==========
alter table profiles force row level security;
alter table credit_requests force row level security;
alter table consents force row level security;
alter table transactions force row level security;
alter table scores force row level security;
alter table documents force row level security;
alter table audit_logs force row level security;

-- ========== #4: Drop redundant profiles_cpf_idx ==========
drop index profiles_cpf_idx;

-- ========== #8: Partial index for active credit requests ==========
create index credit_requests_active_idx
  on credit_requests(created_at desc)
  where status in ('awaiting_consent', 'collecting_data', 'scoring');

-- ========== #5: Update PK defaults to uuid_v7() ==========
alter table credit_requests
  alter column id set default public.uuid_v7();
alter table consents
  alter column id set default public.uuid_v7();
alter table transactions
  alter column id set default public.uuid_v7();
alter table scores
  alter column id set default public.uuid_v7();
alter table documents
  alter column id set default public.uuid_v7();

-- ========== #9: Convert audit_logs.id from bigserial to identity ==========
do $$
declare
  seq_name text;
begin
  select pg_get_serial_sequence('audit_logs', 'id') into seq_name;
  execute 'alter table audit_logs alter column id drop default';
  execute format('drop sequence if exists %s', seq_name);
  alter table audit_logs alter column id add generated always as identity;
end;
$$;
