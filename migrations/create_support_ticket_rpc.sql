-- Create public-safe support tickets without direct browser inserts into RLS tables.
-- This function validates input, safely assigns user ownership only when the
-- caller is authenticated as that user, inserts the first customer reply, and
-- returns the created ticket row.

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
    name,
    email,
    subject,
    status,
    priority
  ) VALUES (
    BTRIM(p_ticket_number),
    v_safe_user_id,
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

  RETURN v_ticket;
END;
$$;

REVOKE ALL ON FUNCTION public.create_support_ticket(text, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_support_ticket(text, text, text, text, text, uuid) TO anon, authenticated;
