-- Live Chat System Schema
-- Run this SQL in your Supabase SQL Editor

-- Chat Sessions Table
create table if not exists public.chat_sessions (
    id uuid primary key default uuid_generate_v4(),
    visitor_name text not null,
    visitor_email text not null,
    user_id uuid references auth.users(id) on delete set null,
    assigned_admin_id uuid references auth.users(id) on delete set null,
    status text default 'active' check (status in ('active', 'closed')),
    unread_count int default 0,
    last_message_at timestamptz default now(),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Chat Messages Table
create table if not exists public.chat_messages (
    id uuid primary key default uuid_generate_v4(),
    session_id uuid references public.chat_sessions(id) on delete cascade not null,
    sender_type text not null check (sender_type in ('visitor', 'admin')),
    sender_name text,
    message text not null,
    is_read boolean default false,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Chat Sessions Policies

-- Anyone can create a chat session (for visitors)
drop policy if exists "Anyone can create chat sessions" on public.chat_sessions;
create policy "Anyone can create chat sessions"
    on public.chat_sessions
    for insert
    with check (true);

-- Users can view their own sessions, admins can view all
drop policy if exists "View own or admin view all sessions" on public.chat_sessions;
create policy "View own or admin view all sessions"
    on public.chat_sessions
    for select
    using (
        user_id = auth.uid() 
        or visitor_email = (select email from auth.users where id = auth.uid())
        or exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
        or auth.uid() is null -- Allow anonymous read for session lookup
    );

-- Admins can update sessions
drop policy if exists "Admins can update sessions" on public.chat_sessions;
create policy "Admins can update sessions"
    on public.chat_sessions
    for update
    using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Chat Messages Policies

-- Anyone can create messages (visitors and admins)
drop policy if exists "Anyone can create messages" on public.chat_messages;
create policy "Anyone can create messages"
    on public.chat_messages
    for insert
    with check (true);

-- View messages for sessions you have access to
drop policy if exists "View messages for accessible sessions" on public.chat_messages;
create policy "View messages for accessible sessions"
    on public.chat_messages
    for select
    using (
        exists (
            select 1 from public.chat_sessions cs
            where cs.id = session_id
            and (
                cs.user_id = auth.uid()
                or exists (
                    select 1 from public.profiles 
                    where profiles.id = auth.uid() and profiles.role = 'admin'
                )
            )
        )
        or auth.uid() is null -- Allow anonymous read
    );

-- Admins can update messages (mark as read)
drop policy if exists "Admins can update messages" on public.chat_messages;
create policy "Admins can update messages"
    on public.chat_messages
    for update
    using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Function to update session's last_message_at and unread_count
create or replace function update_chat_session_on_message()
returns trigger as $$
begin
    update public.chat_sessions
    set 
        last_message_at = new.created_at,
        unread_count = case 
            when new.sender_type = 'visitor' then unread_count + 1 
            else unread_count 
        end,
        updated_at = now()
    where id = new.session_id;
    return new;
end;
$$ language plpgsql;

-- Trigger for updating session on new message
drop trigger if exists on_new_chat_message on public.chat_messages;
create trigger on_new_chat_message
    after insert on public.chat_messages
    for each row
    execute function update_chat_session_on_message();

-- Enable Realtime for chat tables
alter publication supabase_realtime add table chat_sessions;
alter publication supabase_realtime add table chat_messages;
