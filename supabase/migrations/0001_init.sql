-- ========== extensões ==========
create extension if not exists "pgcrypto"; -- gen_random_uuid

-- ========== enums ==========
create type mock_profile as enum (
  'motorista_consistente',
  'perfil_forte',
  'autonomo_irregular',
  'fluxo_instavel',
  'historico_insuficiente'
);

create type request_status as enum (
  'awaiting_consent',
  'collecting_data',
  'scoring',
  'decided'
);

create type credit_decision as enum (
  'approved',
  'approved_reduced',
  'further_review',
  'denied'
);

create type consent_scope as enum ('salary', 'investments', 'cards');

create type transaction_kind as enum ('credit', 'debit');

create type transaction_source as enum (
  'open_finance_mock',
  'uploaded_document'
);

-- ========== tabelas ==========
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  cpf text not null unique,
  mock_profile mock_profile not null,
  created_at timestamptz not null default now()
);

create index profiles_cpf_idx on profiles(cpf);

create table credit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references profiles(id) on delete cascade,
  requested_amount numeric(12,2) not null check (requested_amount > 0),
  status request_status not null default 'awaiting_consent',
  decision credit_decision,
  approved_amount numeric(12,2),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index credit_requests_user_idx on credit_requests(user_id);
create index credit_requests_status_time on credit_requests(status, created_at desc);

create table consents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references credit_requests(id) on delete cascade,
  scopes consent_scope[] not null,
  granted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text
);

create index consents_request_idx on consents(request_id);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references credit_requests(id) on delete cascade,
  occurred_at timestamptz not null,
  amount numeric(12,2) not null,
  kind transaction_kind not null,
  category text not null,
  description text not null,
  source transaction_source not null
);

create index transactions_request_date_idx
  on transactions(request_id, occurred_at desc);

create table scores (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references credit_requests(id) on delete cascade,
  value integer not null check (value between 0 and 1000),
  regularity integer not null,
  capacity integer not null,
  stability integer not null,
  behavior integer not null,
  data_quality integer not null,
  reasons text[] not null,
  suggested_limit numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create unique index scores_request_unique on scores(request_id);

create table documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references credit_requests(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  uploaded_at timestamptz not null default now()
);

create index documents_request_idx on documents(request_id);

create table audit_logs (
  id bigserial primary key,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on audit_logs(entity_type, entity_id);
create index audit_logs_time_idx on audit_logs(created_at desc);
