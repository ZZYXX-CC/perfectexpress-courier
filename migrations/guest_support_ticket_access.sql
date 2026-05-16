-- Guest support ticket access links.
-- Guests receive a private token link that lets them view and reply to their
-- own ticket without creating an account. The token is not exposed in admin UI.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS guest_access_token text;

CREATE UNIQUE INDEX IF NOT EXISTS support_tickets_guest_access_token_key
ON public.support_tickets (guest_access_token)
WHERE guest_access_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_support_ticket(
  p_ticket_number text,
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_user_id uuid DEFAULT NULL
)
RETURNS public.support_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ticket public.support_tickets;
  v_safe_user_id uuid;
  v_admin record;
BEGIN
  IF NULLIF(BTRIM(p_ticket_number), '') IS NULL THEN
    RAISE EXCEPTION 'Ticket number is required';
  END IF;

  IF NULLIF(BTRIM(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'Name is required';
  END IF;

  IF NULLIF(BTRIM(p_email), '') IS NULL THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF NULLIF(BTRIM(p_subject), '') IS NULL THEN
    RAISE EXCEPTION 'Subject is required';
  END IF;

  IF NULLIF(BTRIM(p_message), '') IS NULL THEN
    RAISE EXCEPTION 'Message is required';
  END IF;

  v_safe_user_id := CASE
    WHEN auth.uid() IS NOT NULL AND p_user_id = auth.uid() THEN p_user_id
    ELSE NULL
  END;

  INSERT INTO public.support_tickets (
    ticket_number,
    user_id,
    guest_access_token,
    name,
    email,
    subject,
    status,
    priority
  ) VALUES (
    BTRIM(p_ticket_number),
    v_safe_user_id,
    CASE WHEN v_safe_user_id IS NULL THEN encode(gen_random_bytes(32), 'hex') ELSE NULL END,
    BTRIM(p_name),
    LOWER(BTRIM(p_email)),
    BTRIM(p_subject),
    'open',
    'normal'
  )
  RETURNING * INTO v_ticket;

  INSERT INTO public.ticket_replies (
    ticket_id,
    sender_type,
    sender_name,
    message
  ) VALUES (
    v_ticket.id,
    'customer',
    BTRIM(p_name),
    BTRIM(p_message)
  );

  FOR v_admin IN
    SELECT id
    FROM public.profiles
    WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      link,
      is_read
    ) VALUES (
      v_admin.id,
      'system',
      'New Support Ticket',
      'A new ticket (' || v_ticket.ticket_number || ') has been created by ' || v_ticket.name || ': ' || v_ticket.subject,
      '/dashboard/tickets/' || v_ticket.id,
      false
    );
  END LOOP;

  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_guest_support_ticket(
  p_ticket_id uuid,
  p_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ticket public.support_tickets;
  v_replies jsonb;
BEGIN
  SELECT * INTO v_ticket
  FROM public.support_tickets
  WHERE id = p_ticket_id
    AND guest_access_token = p_token
    AND guest_access_token IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.created_at ASC), '[]'::jsonb)
  INTO v_replies
  FROM (
    SELECT id, ticket_id, sender_type, sender_name, message, created_at
    FROM public.ticket_replies
    WHERE ticket_id = p_ticket_id
  ) r;

  RETURN jsonb_build_object(
    'ticket', jsonb_build_object(
      'id', v_ticket.id,
      'ticket_number', v_ticket.ticket_number,
      'user_id', v_ticket.user_id,
      'name', v_ticket.name,
      'email', v_ticket.email,
      'subject', v_ticket.subject,
      'status', v_ticket.status,
      'priority', v_ticket.priority,
      'created_at', v_ticket.created_at,
      'updated_at', v_ticket.updated_at
    ),
    'replies', v_replies
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.add_guest_support_reply(
  p_ticket_id uuid,
  p_token text,
  p_message text
)
RETURNS public.ticket_replies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ticket public.support_tickets;
  v_reply public.ticket_replies;
  v_admin record;
BEGIN
  IF NULLIF(BTRIM(p_message), '') IS NULL THEN
    RAISE EXCEPTION 'Message is required';
  END IF;

  SELECT * INTO v_ticket
  FROM public.support_tickets
  WHERE id = p_ticket_id
    AND guest_access_token = p_token
    AND guest_access_token IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  INSERT INTO public.ticket_replies (
    ticket_id,
    sender_type,
    sender_name,
    message
  ) VALUES (
    v_ticket.id,
    'customer',
    v_ticket.name,
    BTRIM(p_message)
  )
  RETURNING * INTO v_reply;

  IF v_ticket.status IN ('resolved', 'closed') THEN
    UPDATE public.support_tickets
    SET status = 'in_progress', updated_at = now()
    WHERE id = v_ticket.id;
  ELSE
    UPDATE public.support_tickets
    SET updated_at = now()
    WHERE id = v_ticket.id;
  END IF;

  FOR v_admin IN
    SELECT id
    FROM public.profiles
    WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      link,
      is_read
    ) VALUES (
      v_admin.id,
      'ticket_reply',
      'Customer Response',
      v_ticket.name || ' replied to ticket ' || v_ticket.ticket_number || '.',
      '/dashboard/tickets/' || v_ticket.id,
      false
    );
  END LOOP;

  RETURN v_reply;
END;
$$;

REVOKE ALL ON FUNCTION public.create_support_ticket(text, text, text, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_guest_support_ticket(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_guest_support_reply(uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_support_ticket(text, text, text, text, text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_support_ticket(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_guest_support_reply(uuid, text, text) TO anon, authenticated;
