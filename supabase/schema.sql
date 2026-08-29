-- ============================================================
-- Blue Wave — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- SHIPMENTS ----------
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique not null,
  status text not null default 'pending',
  status_reason text,
  shipping_method text not null default 'air', -- 'air' | 'land' | 'sea'
  package_description text,
  package_image_url text,
  weight_kg numeric,
  origin text,
  destination text,
  current_location text,
  sender_name text,
  sender_address text,
  sender_phone text,
  sender_email text,
  receiver_name text,
  receiver_address text,
  receiver_phone text,
  receiver_email text,
  estimated_delivery date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- CHECKPOINTS (tracking history / live indicator) ----------
create table if not exists public.shipment_checkpoints (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  location text not null,
  status text not null,
  note text,
  position_percent numeric default 0, -- 0-100, drives the live progress indicator
  checkpoint_time timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_checkpoints_shipment_id on public.shipment_checkpoints (shipment_id);
create index if not exists idx_shipments_tracking_code on public.shipments (tracking_code);

-- ---------- auto-update updated_at ----------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_shipments_updated_at on public.shipments;
create trigger trg_shipments_updated_at
before update on public.shipments
for each row execute function public.set_updated_at();

-- ---------- ROW LEVEL SECURITY ----------
alter table public.shipments enable row level security;
alter table public.shipment_checkpoints enable row level security;

drop policy if exists "Public can view shipments" on public.shipments;
create policy "Public can view shipments"
on public.shipments for select
to anon, authenticated
using (true);

drop policy if exists "Public can view checkpoints" on public.shipment_checkpoints;
create policy "Public can view checkpoints"
on public.shipment_checkpoints for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert shipments" on public.shipments;
create policy "Admins can insert shipments"
on public.shipments for insert
to authenticated
with check (true);

drop policy if exists "Admins can update shipments" on public.shipments;
create policy "Admins can update shipments"
on public.shipments for update
to authenticated
using (true) with check (true);

drop policy if exists "Admins can delete shipments" on public.shipments;
create policy "Admins can delete shipments"
on public.shipments for delete
to authenticated
using (true);

drop policy if exists "Admins can insert checkpoints" on public.shipment_checkpoints;
create policy "Admins can insert checkpoints"
on public.shipment_checkpoints for insert
to authenticated
with check (true);

drop policy if exists "Admins can update checkpoints" on public.shipment_checkpoints;
create policy "Admins can update checkpoints"
on public.shipment_checkpoints for update
to authenticated
using (true) with check (true);

drop policy if exists "Admins can delete checkpoints" on public.shipment_checkpoints;
create policy "Admins can delete checkpoints"
on public.shipment_checkpoints for delete
to authenticated
using (true);

-- ---------- STORAGE (package photos) ----------
insert into storage.buckets (id, name, public)
values ('package-images', 'package-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read package images" on storage.objects;
create policy "Public read package images"
on storage.objects for select
to public
using (bucket_id = 'package-images');

drop policy if exists "Admins upload package images" on storage.objects;
create policy "Admins upload package images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'package-images');

drop policy if exists "Admins update package images" on storage.objects;
create policy "Admins update package images"
on storage.objects for update
to authenticated
using (bucket_id = 'package-images');

drop policy if exists "Admins delete package images" on storage.objects;
create policy "Admins delete package images"
on storage.objects for delete
to authenticated
using (bucket_id = 'package-images');

-- ============================================================
-- After running this, create your admin login in:
-- Supabase Dashboard → Authentication → Users → Add user
-- (email + password). There is no public sign-up page in the app —
-- only people you create in that dashboard can log in to /admin.
-- ============================================================
