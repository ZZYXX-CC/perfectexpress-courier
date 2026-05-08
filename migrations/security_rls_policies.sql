-- ============================================================
-- SECURITY FIX: Comprehensive RLS policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. NOTIFICATIONS — Enable RLS + user-scoped policies
-- ============================================================
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

-- Users can only update (mark as read) their own notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

-- Any authenticated user can insert notifications (needed for cross-user notifications)
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can view all notifications (for debugging)
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- ============================================================
-- 2. CHAT_SESSIONS — Enable RLS + scoped policies
-- ============================================================
ALTER TABLE IF EXISTS public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own chat sessions
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
FOR SELECT USING (user_id = auth.uid());

-- Admins can view all chat sessions
DROP POLICY IF EXISTS "Admins can view all chat sessions" ON public.chat_sessions;
CREATE POLICY "Admins can view all chat sessions" ON public.chat_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Users can create their own chat sessions
DROP POLICY IF EXISTS "Users can create own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can create own chat sessions" ON public.chat_sessions
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users and admins can update their own chat sessions
DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update all chat sessions" ON public.chat_sessions;
CREATE POLICY "Admins can update all chat sessions" ON public.chat_sessions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- ============================================================
-- 3. CHAT_MESSAGES — Enable RLS + scoped policies
-- ============================================================
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages from their own sessions
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()
  )
);

-- Admins can view all chat messages
DROP POLICY IF EXISTS "Admins can view all chat messages" ON public.chat_messages;
CREATE POLICY "Admins can view all chat messages" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Authenticated users can send chat messages
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;
CREATE POLICY "Authenticated users can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 4. USER_INVITES — Enable RLS + admin-only
-- ============================================================
ALTER TABLE IF EXISTS public.user_invites ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invites
DROP POLICY IF EXISTS "Admins can manage invites" ON public.user_invites;
CREATE POLICY "Admins can manage invites" ON public.user_invites
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- ============================================================
-- 5. FIX TICKET_REPLIES INSERT — prevent sender_type spoofing
-- ============================================================
DROP POLICY IF EXISTS "Anyone can create replies" ON public.ticket_replies;
CREATE POLICY "Authenticated users can create replies" ON public.ticket_replies
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    -- Customers can only insert as 'customer'
    sender_type = 'customer'
    OR
    -- Only admins can insert as 'admin'
    (sender_type = 'admin' AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    ))
  )
);

-- ============================================================
-- 6. FIX SUPPORT_TICKETS INSERT — prevent user_id spoofing
-- ============================================================
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;
CREATE POLICY "Authenticated or anonymous can create tickets" ON public.support_tickets
FOR INSERT WITH CHECK (
  -- user_id must be null (anonymous) or match the caller
  user_id IS NULL OR user_id = auth.uid()
);

-- ============================================================
-- 7. PROFILES UPDATE — only admins can change roles
-- ============================================================
-- Users can update their own profile (but not role)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  -- Prevent users from escalating their own role
  AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
);

-- Admins can update any profile including role
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
