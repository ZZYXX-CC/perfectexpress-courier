-- Harden support ticket RLS for guest submissions and signed-in customers.
-- Guest requests must insert user_id = null. Authenticated requests may insert
-- user_id = null or their own auth.uid(). Admin replies remain supported.

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.support_tickets TO anon, authenticated;
GRANT INSERT ON public.ticket_replies TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated or anonymous can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Guests and users can create support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Anonymous users can create guest support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated users can create own support tickets" ON public.support_tickets;

CREATE POLICY "Anonymous users can create guest support tickets"
ON public.support_tickets
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

CREATE POLICY "Authenticated users can create own support tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can create replies" ON public.ticket_replies;
DROP POLICY IF EXISTS "Authenticated users can create replies" ON public.ticket_replies;
DROP POLICY IF EXISTS "Guests and users can create customer replies" ON public.ticket_replies;
DROP POLICY IF EXISTS "Anonymous users can create guest customer replies" ON public.ticket_replies;
DROP POLICY IF EXISTS "Authenticated users can create accessible replies" ON public.ticket_replies;

CREATE POLICY "Anonymous users can create guest customer replies"
ON public.ticket_replies
FOR INSERT
TO anon
WITH CHECK (
  sender_type = 'customer'
  AND EXISTS (
    SELECT 1
    FROM public.support_tickets t
    WHERE t.id = ticket_replies.ticket_id
      AND t.user_id IS NULL
  )
);

CREATE POLICY "Authenticated users can create accessible replies"
ON public.ticket_replies
FOR INSERT
TO authenticated
WITH CHECK (
  (
    sender_type = 'customer'
    AND EXISTS (
      SELECT 1
      FROM public.support_tickets t
      WHERE t.id = ticket_replies.ticket_id
        AND (t.user_id IS NULL OR t.user_id = auth.uid() OR t.email = COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  OR
  (
    sender_type = 'admin'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
);
