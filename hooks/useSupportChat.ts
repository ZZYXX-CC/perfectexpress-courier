import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import {
    createTicket, getOpenChatTicket, getTicketDetails, addReply,
    getGuestTicket, addGuestReply, getUserChatTickets, SupportTicket, TicketReply,
} from '../services/support';

const GUEST_KEY = 'pec_chat_guest';

interface GuestSession { ticketId: string; token: string; name: string; email: string; }

// Powers the live support chat for both the floating widget and the /support/chat
// page. Logged-in users resume their open chat ticket and receive replies via
// Realtime; guests provide name+email (so support can reply/notify them), get a
// guest ticket persisted per-browser, and receive replies via polling.
export function useSupportChat() {
    const [ready, setReady] = useState(false);
    const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<TicketReply[]>([]);
    const [sending, setSending] = useState(false);
    const [needsGuestInfo, setNeedsGuestInfo] = useState(false);
    const guestRef = useRef<GuestSession | null>(null);

    const addMessage = useCallback((m: TicketReply) => {
        setMessages(prev => (prev.some(x => x.id === m.id) ? prev : [...prev, m]));
    }, []);

    // Initialise: identify the viewer and load any resumable conversation.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data: { user: u } } = await supabase.auth.getUser();
            if (cancelled) return;
            if (u) {
                const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', u.id).single();
                setUser({ id: u.id, email: u.email || '', name: profile?.full_name || u.email || 'You' });
                const open = await getOpenChatTicket(u.id);
                if (open && !cancelled) {
                    setTicket(open);
                    const d = await getTicketDetails(open.id);
                    if (!cancelled) setMessages(d.replies);
                }
            } else {
                const saved = localStorage.getItem(GUEST_KEY);
                if (saved) {
                    try {
                        const g: GuestSession = JSON.parse(saved);
                        guestRef.current = g;
                        const d = await getGuestTicket(g.ticketId, g.token);
                        if (!cancelled) { setTicket(d.ticket); setMessages(d.replies); }
                    } catch {
                        localStorage.removeItem(GUEST_KEY);
                        if (!cancelled) setNeedsGuestInfo(true);
                    }
                } else if (!cancelled) {
                    setNeedsGuestInfo(true);
                }
            }
            if (!cancelled) setReady(true);
        })();
        return () => { cancelled = true; };
    }, []);

    const isClosed = ticket?.status === 'resolved' || ticket?.status === 'closed';

    // Realtime for logged-in users.
    useEffect(() => {
        if (!user || !ticket) return;
        const ch = supabase
            .channel(`chat-${ticket.id}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'ticket_replies', filter: `ticket_id=eq.${ticket.id}` },
                (payload) => addMessage(payload.new as TicketReply))
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [user, ticket?.id, addMessage]);

    // Polling for guests (Realtime needs RLS/auth they don't have).
    useEffect(() => {
        if (user || !ticket || !guestRef.current) return;
        const iv = setInterval(async () => {
            try {
                const d = await getGuestTicket(guestRef.current!.ticketId, guestRef.current!.token);
                setTicket(d.ticket);
                setMessages(d.replies);
            } catch { /* transient */ }
        }, 4000);
        return () => clearInterval(iv);
    }, [user, ticket?.id]);

    const submitGuestInfo = useCallback((name: string, email: string) => {
        guestRef.current = { ticketId: '', token: '', name: name.trim(), email: email.trim() };
        setNeedsGuestInfo(false);
    }, []);

    const send = useCallback(async (text: string) => {
        const body = text.trim();
        if (!body || sending) return;
        setSending(true);
        try {
            if (user) {
                if (!ticket || isClosed) {
                    const res = await createTicket({ name: user.name, email: user.email, subject: 'Live chat', message: body, userId: user.id, channel: 'chat' });
                    if (res.success && res.ticket) {
                        setTicket(res.ticket);
                        const d = await getTicketDetails(res.ticket.id);
                        setMessages(d.replies);
                    }
                } else {
                    const reply = await addReply(ticket.id, body, 'customer', user.name);
                    addMessage(reply);
                }
            } else {
                const g = guestRef.current;
                if (!g) { setNeedsGuestInfo(true); return; }
                if (!ticket || isClosed || !g.ticketId) {
                    const res = await createTicket({ name: g.name, email: g.email, subject: 'Live chat', message: body, channel: 'chat' });
                    if (res.success && res.ticket) {
                        const session: GuestSession = { ticketId: res.ticket.id, token: res.ticket.guest_access_token || '', name: g.name, email: g.email };
                        guestRef.current = session;
                        localStorage.setItem(GUEST_KEY, JSON.stringify(session));
                        setTicket(res.ticket);
                        const d = await getGuestTicket(session.ticketId, session.token);
                        setMessages(d.replies);
                    }
                } else {
                    const reply = await addGuestReply(g.ticketId, g.token, body);
                    addMessage(reply);
                }
            }
        } catch (e) {
            console.error('[SupportChat] send failed:', e);
        } finally {
            setSending(false);
        }
    }, [user, ticket, isClosed, sending, addMessage]);

    // History (signed-in users only): list past chat conversations and load a
    // single transcript read-only. Kept separate from the active-chat state so
    // browsing history never touches the live ticket or its Realtime channel.
    const listChatHistory = useCallback(async (): Promise<SupportTicket[]> => {
        if (!user) return [];
        return getUserChatTickets(user.id);
    }, [user]);

    const loadConversation = useCallback(
        async (ticketId: string): Promise<{ ticket: SupportTicket; replies: TicketReply[] }> => {
            const d = await getTicketDetails(ticketId);
            return { ticket: d.ticket as SupportTicket, replies: d.replies };
        },
        [],
    );

    // Start a fresh conversation after support closed the previous one.
    const startNew = useCallback(() => {
        setMessages([]);
        setTicket(null);
        if (!user) {
            localStorage.removeItem(GUEST_KEY);
            guestRef.current = null;
            setNeedsGuestInfo(true);
        }
    }, [user]);

    return { ready, user, ticket, messages, sending, needsGuestInfo, submitGuestInfo, send, isClosed, startNew, listChatHistory, loadConversation };
}
