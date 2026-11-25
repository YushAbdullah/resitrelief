-- Resit Relief database (Supabase / Postgres). Run once in the Supabase SQL editor.
-- Every table has row-level security so each signed-in person only sees their own data.

create extension if not exists pgcrypto;

-- ---------- Profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  kids boolean not null default false,
  parents boolean not null default false,
  income numeric(12,2) not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read"   on public.profiles for select using (id = auth.uid());
create policy "own profile write"  on public.profiles for insert with check (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid()));

-- ---------- Receipts ----------
create table if not exists public.receipts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  merchant text not null,
  receipt_date date not null,
  amount numeric(12,2) not null check (amount >= 0),
  relief text,                 -- relief id from relief_rules (e.g. 'lifestyle'), 'none' = not claimable
  sub text,                    -- sub-limit id (e.g. 'dental')
  status text not null default 'review' check (status in ('claimable','review','rejected')),
  platform text,               -- Shopee, TikTok Shop, Lazada, Shein, JomPAY ...
  source text,                 -- camera | upload | paste | email | myinvois | manual
  raw_text text,               -- OCR or email text, kept as evidence
  notes text,
  is_einvoice boolean not null default false,
  einvoice_uuid text,
  proof_path text,             -- path in the private 'proofs' storage bucket
  proof_name text,
  proof_type text,
  email_message_id text,       -- de-duplicates forwarded emails
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists receipts_user_date on public.receipts (user_id, receipt_date desc);
create unique index if not exists receipts_user_email on public.receipts (user_id, email_message_id) where email_message_id is not null;
alter table public.receipts enable row level security;
create policy "own receipts" on public.receipts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists receipts_touch on public.receipts;
create trigger receipts_touch before update on public.receipts for each row execute function public.touch_updated_at();

-- Monthly spending view used by the Spending table and exports.
create or replace view public.monthly_spending with (security_invoker = true) as
select user_id,
       date_trunc('month', receipt_date)::date as month,
       sum(amount) as total,
       sum(amount) filter (where status = 'claimable' and relief <> 'none') as claimable,
       sum(amount) filter (where platform = 'Shopee') as shopee,
       sum(amount) filter (where platform = 'TikTok Shop') as tiktok,
       sum(amount) filter (where platform = 'Lazada') as lazada,
       sum(amount) filter (where platform = 'Shein') as shein,
       count(*) as receipts,
       count(*) filter (where proof_path is not null) as with_proof
from public.receipts group by 1, 2;

-- ---------- Proof files ----------
insert into storage.buckets (id, name, public) values ('proofs', 'proofs', false) on conflict (id) do nothing;
create policy "own proofs read"   on storage.objects for select using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own proofs write"  on storage.objects for insert with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own proofs update" on storage.objects for update using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own proofs delete" on storage.objects for delete using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Relief rules (LHDN policy updates) ----------
-- One active row per YA. When LHDN changes a relief, an admin inserts a new version and flips
-- is_active. Every user's app picks it up on next open, with no new release.
create table if not exists public.relief_rules (
  id bigint generated always as identity primary key,
  ya int not null,
  version int not null,
  rules jsonb not null,        -- same shape as reliefs.js entries
  note text,                   -- "What changed", shown to users
  source_url text,             -- LHDN / gazette link
  is_active boolean not null default false,
  published_at timestamptz not null default now(),
  unique (ya, version)
);
create unique index if not exists relief_rules_one_active on public.relief_rules (ya) where is_active;
alter table public.relief_rules enable row level security;
create policy "anyone reads rules" on public.relief_rules for select using (true);
create policy "admins write rules" on public.relief_rules for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Pages watched for policy changes by the policy-watch function.
create table if not exists public.policy_watch (
  url text primary key,
  label text,
  last_hash text,
  last_checked timestamptz,
  changed_at timestamptz,
  needs_review boolean not null default false
);
alter table public.policy_watch enable row level security;
create policy "admins read watch" on public.policy_watch for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
-- Check these URLs are still LHDN's current relief pages before going live.
insert into public.policy_watch (url, label) values
  ('https://www.hasil.gov.my/en/individual/individual-life-cycle/income-declaration/tax-reliefs/', 'LHDN tax reliefs page'),
  ('https://www.hasil.gov.my/en/individual/individual-life-cycle/income-declaration/tax-rebate/', 'LHDN tax rebate page')
on conflict do nothing;

-- ---------- Email forwarding addresses ----------
create table if not exists public.inbound_addresses (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null unique default ('r-' || encode(gen_random_bytes(6), 'hex')),
  created_at timestamptz not null default now()
);
alter table public.inbound_addresses enable row level security;
create policy "own address" on public.inbound_addresses for select using (user_id = auth.uid());

-- New sign-ups get a profile and a forwarding address automatically.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.inbound_addresses (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
