-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Profiles Table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text default 'user',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Profiles Policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" 
  on profiles for select using ( true );

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" 
  on profiles for update using ( auth.uid() = id );

-- Create Shipments Table
create table if not exists public.shipments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id), -- Link to Auth User
  tracking_number text unique, -- Renamed from tracking_id to match App Code
  sender_info jsonb not null default '{}'::jsonb, -- sender_details -> sender_info (checking App Code usage)
  receiver_info jsonb not null default '{}'::jsonb, -- receiver_details -> receiver_info
  parcel_details jsonb not null default '{}'::jsonb,
  status text check (status in ('pending', 'quoted', 'confirmed', 'in-transit', 'out-for-delivery', 'delivered', 'held', 'cancelled')) default 'pending',
  payment_status text check (payment_status in ('unpaid', 'paid')) default 'unpaid',
  current_location text,
  history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS for Shipments
alter table public.shipments enable row level security;

-- Shipments Policies
drop policy if exists "Public read by tracking number" on public.shipments;
create policy "Public read by tracking number"
  on public.shipments
  for select
  using (true); 

drop policy if exists "Users can see their own shipments" on public.shipments;
create policy "Users can see their own shipments"
  on public.shipments
  for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can see all shipments" on public.shipments;
create policy "Admins can see all shipments"
  on public.shipments
  for select
  using ( 
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Public/Users can create shipments" on public.shipments;
create policy "Public/Users can create shipments"
  on public.shipments
  for insert
  with check (true);

drop policy if exists "Admins can update shipments" on public.shipments;
create policy "Admins can update shipments"
  on public.shipments
  for update
  using ( 
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- ID Generation Function
create or replace function generate_tracking_number() returns trigger as $$
begin
  if new.tracking_number is null then
    new.tracking_number := 'PFX-' || upper(substring(md5(random()::text) from 1 for 8)); 
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger for Tracking Number
drop trigger if exists set_tracking_number on public.shipments;
create trigger set_tracking_number
  before insert on public.shipments
  for each row
  execute function generate_tracking_number();


-- Auto-create Profile on Signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for New User
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
