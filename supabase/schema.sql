-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Shipments Table
create table if not exists public.shipments (
  id uuid primary key default uuid_generate_v4(),
  tracking_id text unique,
  sender_details jsonb not null default '{}'::jsonb,
  receiver_details jsonb not null default '{}'::jsonb,
  parcel_details jsonb not null default '{}'::jsonb,
  status text check (status in ('pending', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled')) default 'pending',
  payment_status text check (payment_status in ('unpaid', 'paid')) default 'unpaid',
  current_location text,
  history jsonb default '[]'::jsonb, -- Array of updates
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.shipments enable row level security;

-- Policies

-- Public Read (Ideally restricted, but for prototype we allow reading by ID via client query)
create policy "Allow public read"
  on public.shipments
  for select
  using (true);

-- Public Insert (Submission)
create policy "Allow public insert"
  on public.shipments
  for insert
  with check (true);

-- Admin Update (Authenticated)
create policy "Allow authenticated update"
  on public.shipments
  for update
  to authenticated
  using (true);

-- ID Generation Function
create or replace function generate_tracking_id() returns trigger as $$
begin
  if new.tracking_id is null then
    new.tracking_id := 'SWIFT-' || upper(substring(md5(random()::text) from 1 for 6));
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger
drop trigger if exists set_tracking_id on public.shipments;
create trigger set_tracking_id
  before insert on public.shipments
  for each row
  execute function generate_tracking_id();
