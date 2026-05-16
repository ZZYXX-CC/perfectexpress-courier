-- Allow public support form submissions while preserving ownership checks.
-- Required for guests who are not signed in and therefore submit tickets with user_id = null.

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.support_tickets TO anon, authenticated;
GRANT INSERT ON public.ticket_replies TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated or anonymous can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Guests and users can create support tickets" ON public.support_tickets;
CREATE POLICY "Guests and users can create support tickets" ON public.support_tickets
FOR INSERT
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Anyone can create replies" ON public.ticket_replies;
DROP POLICY IF EXISTS "Authenticated users can create replies" ON public.ticket_replies;
DROP POLICY IF EXISTS "Guests and users can create customer replies" ON public.ticket_replies;
CREATE POLICY "Guests and users can create customer replies" ON public.ticket_replies
FOR INSERT
WITH CHECK (
  sender_type = 'customer'
  AND EXISTS (
    SELECT 1
    FROM public.support_tickets t
    WHERE t.id = ticket_replies.ticket_id
      AND (
        t.user_id IS NULL
        OR t.user_id = auth.uid()
        OR t.email = COALESCE(auth.jwt() ->> 'email', '')
      )
  )
);
