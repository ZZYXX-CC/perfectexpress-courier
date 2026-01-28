-- Support Ticket System Schema
-- Run this SQL in your Supabase SQL Editor

-- Support Tickets Table
create table if not exists public.support_tickets (
    id uuid primary key default uuid_generate_v4(),
    ticket_number text unique,
    user_id uuid references auth.users(id) on delete set null,
    name text not null,
    email text not null,
    subject text not null,
    status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
    priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Ticket Replies Table
create table if not exists public.ticket_replies (
    id uuid primary key default uuid_generate_v4(),
    ticket_id uuid references public.support_tickets(id) on delete cascade not null,
    sender_type text not null check (sender_type in ('customer', 'admin')),
    sender_name text,
    message text not null,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.support_tickets enable row level security;
alter table public.ticket_replies enable row level security;

-- Ticket Number Generation Function
create or replace function generate_ticket_number() returns trigger as $$
begin
    if new.ticket_number is null then
        new.ticket_number := 'TKT-' || upper(substring(md5(random()::text) from 1 for 8));
    end if;
    return new;
end;
$$ language plpgsql;

-- Trigger for Ticket Number
drop trigger if exists set_ticket_number on public.support_tickets;
create trigger set_ticket_number
    before insert on public.support_tickets
    for each row
    execute function generate_ticket_number();

-- Support Tickets Policies

-- Anyone can create tickets
drop policy if exists "Anyone can create tickets" on public.support_tickets;
create policy "Anyone can create tickets"
    on public.support_tickets
    for insert
    with check (true);

-- Users can view their own tickets (by user_id or email), admins can view all
drop policy if exists "View own or admin view all tickets" on public.support_tickets;
create policy "View own or admin view all tickets"
    on public.support_tickets
    for select
    using (
        user_id = auth.uid()
        or email = (select email from auth.users where id = auth.uid())
        or exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Admins can update tickets
drop policy if exists "Admins can update tickets" on public.support_tickets;
create policy "Admins can update tickets"
    on public.support_tickets
    for update
    using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Users can also update their own tickets (for replies)
drop policy if exists "Users can update own tickets" on public.support_tickets;
create policy "Users can update own tickets"
    on public.support_tickets
    for update
    using (
        user_id = auth.uid()
        or email = (select email from auth.users where id = auth.uid())
    );

-- Ticket Replies Policies

-- Anyone can create replies (customers and admins)
drop policy if exists "Anyone can create replies" on public.ticket_replies;
create policy "Anyone can create replies"
    on public.ticket_replies
    for insert
    with check (true);

-- View replies for tickets you have access to
drop policy if exists "View replies for accessible tickets" on public.ticket_replies;
create policy "View replies for accessible tickets"
    on public.ticket_replies
    for select
    using (
        exists (
            select 1 from public.support_tickets t
            where t.id = ticket_id
            and (
                t.user_id = auth.uid()
                or t.email = (select email from auth.users where id = auth.uid())
                or exists (
                    select 1 from public.profiles 
                    where profiles.id = auth.uid() and profiles.role = 'admin'
                )
            )
        )
    );

-- Function to update ticket's updated_at on new reply
create or replace function update_ticket_on_reply()
returns trigger as $$
begin
    update public.support_tickets
    set updated_at = now()
    where id = new.ticket_id;
    return new;
end;
$$ language plpgsql;

-- Trigger for updating ticket on new reply
drop trigger if exists on_new_ticket_reply on public.ticket_replies;
create trigger on_new_ticket_reply
    after insert on public.ticket_replies
    for each row
    execute function update_ticket_on_reply();

-- Enable Realtime for ticket tables
alter publication supabase_realtime add table support_tickets;
alter publication supabase_realtime add table ticket_replies;
