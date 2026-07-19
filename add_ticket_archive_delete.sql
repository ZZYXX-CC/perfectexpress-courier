-- Support ticket archive + delete (admin) — run once in the Supabase SQL editor
-- for project jcnoftoyozkvndkqldfx. Safe to run more than once (idempotent).

-- 1) Soft-archive flag on tickets.
alter table public.support_tickets
  add column if not exists archived boolean not null default false;

-- 2) Cascade replies when a ticket is deleted, so deleting a ticket also
--    removes its messages at the DB level (the app also deletes replies first,
--    but this keeps the DB consistent regardless of caller).
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'ticket_replies_ticket_id_fkey'
      and table_name = 'ticket_replies'
  ) then
    alter table public.ticket_replies drop constraint ticket_replies_ticket_id_fkey;
  end if;
end $$;

alter table public.ticket_replies
  add constraint ticket_replies_ticket_id_fkey
  foreign key (ticket_id) references public.support_tickets(id) on delete cascade;

-- 3) RLS: let admins archive (update) and delete tickets + replies.
--    Assumes an admin is identified by profiles.role = 'admin' (as used
--    elsewhere in this app). Adjust the helper predicate if your admin flag
--    differs.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- support_tickets: admin update (covers archiving) + admin delete
drop policy if exists "admin_update_tickets" on public.support_tickets;
create policy "admin_update_tickets" on public.support_tickets
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_delete_tickets" on public.support_tickets;
create policy "admin_delete_tickets" on public.support_tickets
  for delete using (public.is_admin());

-- ticket_replies: admin delete (so a ticket's messages can be removed)
drop policy if exists "admin_delete_replies" on public.ticket_replies;
create policy "admin_delete_replies" on public.ticket_replies
  for delete using (public.is_admin());
