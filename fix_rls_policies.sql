-- 1. FIX PROFILES RLS
-- Admins need to see all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 2. FIX SHIPMENTS RLS
-- Admins need to manage everything
DROP POLICY IF EXISTS "Admins can view all shipments" ON public.shipments;
CREATE POLICY "Admins can view all shipments" ON public.shipments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update all shipments" ON public.shipments;
CREATE POLICY "Admins can update all shipments" ON public.shipments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 3. FIX SUPPORT TICKETS RLS
-- Replace problematic auth.users subqueries with auth.jwt()
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets" ON public.support_tickets
FOR SELECT USING (
  user_id = auth.uid() 
  OR 
  email = COALESCE(auth.jwt() ->> 'email', '')
);

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;
CREATE POLICY "Anyone can create tickets" ON public.support_tickets
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;
CREATE POLICY "Admins can update tickets" ON public.support_tickets
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 4. FIX TICKET REPLIES RLS
DROP POLICY IF EXISTS "View replies for accessible tickets" ON public.ticket_replies;
CREATE POLICY "View replies for accessible tickets" ON public.ticket_replies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_replies.ticket_id
    AND (
      t.user_id = auth.uid()
      OR t.email = COALESCE(auth.jwt() ->> 'email', '')
      OR EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    )
  )
);

DROP POLICY IF EXISTS "Anyone can create replies" ON public.ticket_replies;
CREATE POLICY "Anyone can create replies" ON public.ticket_replies
FOR INSERT WITH CHECK (true);
