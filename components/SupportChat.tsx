import React, { useState, useRef, useEffect } from 'react';
import { useSupportChat } from '../hooks/useSupportChat';
import { SupportTicket, TicketReply } from '../services/support';

// Shared live-support chat surface. Rendered compact inside the floating widget
// and full-height on the /support/chat page. The viewer here is always the
// customer/guest, so their messages sit on the right, support's on the left.
const SupportChat: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
    const {
        ready, user, ticket, messages, sending, needsGuestInfo, submitGuestInfo,
        send, isClosed, startNew, listChatHistory, loadConversation,
    } = useSupportChat();
    const [input, setInput] = useState('');
    const [gName, setGName] = useState('');
    const [gEmail, setGEmail] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // History browsing state — kept local so the live chat (and its Realtime
    // channel in the hook) is never disturbed while looking at past chats.
    const [view, setView] = useState<'chat' | 'list' | 'transcript'>('chat');
    const [history, setHistory] = useState<SupportTicket[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selected, setSelected] = useState<{ ticket: SupportTicket; replies: TicketReply[] } | null>(null);

    useEffect(() => {
        if (view === 'chat' && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, needsGuestInfo, view]);

    const handleSend = () => {
        if (!input.trim()) return;
        send(input);
        setInput('');
    };

    const openHistory = async () => {
        setView('list');
        setSelected(null);
        setHistoryLoading(true);
        try {
            setHistory(await listChatHistory());
        } finally {
            setHistoryLoading(false);
        }
    };

    const openConversation = async (t: SupportTicket) => {
        setHistoryLoading(true);
        try {
            const conv = await loadConversation(t.id);
            setSelected(conv);
            setView('transcript');
        } finally {
            setHistoryLoading(false);
        }
    };

    const backToChat = () => { setView('chat'); setSelected(null); };
    const backToList = () => { setView('list'); setSelected(null); };

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    const statusMeta = (s: SupportTicket['status']) =>
        s === 'open' || s === 'in_progress'
            ? { label: 'Active', cls: 'text-green-500' }
            : { label: s === 'resolved' ? 'Resolved' : 'Closed', cls: 'text-textMuted' };

    const bubble = (m: TicketReply) => {
        const isMine = m.sender_type === 'customer';
        return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-sm text-xs leading-relaxed border ${isMine
                    ? 'bg-textMain text-bgMain border-transparent'
                    : 'bg-bgSurface/40 text-textMain border-borderColor'}`}>
                    {!isMine && <div className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-1">Support</div>}
                    <p className="whitespace-pre-wrap break-words">{m.message}</p>
                </div>
            </div>
        );
    };

    if (!ready) {
        return <div className="flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-textMuted">Connecting…</div>;
    }

    // Guest gate — collect name + email so support can reply and notify them.
    if (needsGuestInfo) {
        return (
            <div className="flex-1 flex flex-col justify-center p-6 gap-4">
                <p className="text-xs text-textMuted leading-relaxed">
                    Tell us where to reach you — we'll email you when support replies, and you can keep chatting here.
                </p>
                <input
                    type="text" placeholder="Your name" value={gName} onChange={e => setGName(e.target.value)}
                    className="chat-input rounded-sm px-4 py-3 text-xs font-medium"
                />
                <input
                    type="email" placeholder="Your email" value={gEmail} onChange={e => setGEmail(e.target.value)}
                    className="chat-input rounded-sm px-4 py-3 text-xs font-medium"
                />
                <button
                    disabled={!gName.trim() || !gEmail.trim()}
                    onClick={() => submitGuestInfo(gName, gEmail)}
                    className="bg-textMain text-bgMain rounded-sm px-4 py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                >
                    Start Chat
                </button>
            </div>
        );
    }

    // Slim history navigation bar — signed-in users only (guests have no
    // server-side history). Lets you jump to past chats and back without
    // leaving the widget.
    const historyBar = user && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-borderColor/60 bg-bgMain/40 min-h-[38px]">
            {view === 'chat' && (
                <>
                    <span className="text-[9px] font-black uppercase tracking-widest text-textMuted">
                        {ticket && !isClosed ? 'Live chat' : 'Support'}
                    </span>
                    <button
                        onClick={openHistory}
                        title="View past conversations"
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-textMuted hover:text-textMain transition-colors"
                    >
                        <iconify-icon icon="solar:history-linear" width="15"></iconify-icon>
                        History
                    </button>
                </>
            )}
            {view === 'list' && (
                <button
                    onClick={backToChat}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-textMuted hover:text-textMain transition-colors"
                >
                    <iconify-icon icon="solar:arrow-left-linear" width="15"></iconify-icon>
                    Back to chat
                </button>
            )}
            {view === 'transcript' && (
                <>
                    <button
                        onClick={backToList}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-textMuted hover:text-textMain transition-colors"
                    >
                        <iconify-icon icon="solar:arrow-left-linear" width="15"></iconify-icon>
                        History
                    </button>
                    {selected && (
                        <span className={`text-[8px] font-black uppercase tracking-widest ${statusMeta(selected.ticket.status).cls}`}>
                            {statusMeta(selected.ticket.status).label}
                        </span>
                    )}
                </>
            )}
        </div>
    );

    // History list of past conversations.
    if (view === 'list') {
        return (
            <>
                {historyBar}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-bgMain/20">
                    {historyLoading ? (
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-textMuted text-center py-8">Loading…</p>
                    ) : history.length === 0 ? (
                        <p className="text-xs text-textMuted text-center py-8">No past conversations yet.</p>
                    ) : (
                        history.map((t) => {
                            const meta = statusMeta(t.status);
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => openConversation(t)}
                                    className="w-full text-left p-3 border border-borderColor rounded-sm bg-bgSurface/30 hover:border-textMuted transition-colors"
                                >
                                    <div className="flex justify-between items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-textMain truncate">{t.subject || 'Live chat'}</span>
                                        <span className={`text-[8px] font-black uppercase tracking-widest shrink-0 ${meta.cls}`}>{meta.label}</span>
                                    </div>
                                    <span className="text-[9px] text-textMuted">{fmtDate(t.created_at)}</span>
                                </button>
                            );
                        })
                    )}
                </div>
            </>
        );
    }

    // Read-only transcript of a selected past conversation.
    if (view === 'transcript' && selected) {
        return (
            <>
                {historyBar}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-bgMain/20">
                    <p className="text-[9px] font-black uppercase tracking-widest text-textMuted text-center pb-2">
                        {selected.ticket.subject || 'Live chat'} · {fmtDate(selected.ticket.created_at)}
                    </p>
                    {selected.replies.length === 0 ? (
                        <p className="text-xs text-textMuted text-center py-8">No messages in this conversation.</p>
                    ) : (
                        selected.replies.map(bubble)
                    )}
                </div>
                <div className="p-4 border-t border-borderColor bg-bgMain text-center">
                    <p className="text-[9px] text-textMuted uppercase tracking-widest">Read-only · this conversation is in your history</p>
                </div>
            </>
        );
    }

    // Active live chat (default) — unchanged behaviour: only the open/in-progress
    // conversation shows here.
    return (
        <>
            {historyBar}
            <div ref={scrollRef} className={`flex-1 overflow-y-auto p-5 space-y-4 bg-bgMain/20 ${compact ? '' : 'md:px-8'}`}>
                {messages.length === 0 && (
                    <p className="text-xs text-textMuted text-center py-8">
                        {user ? "Send a message and our support team will reply here." : "You're connected. Send your first message below."}
                    </p>
                )}
                {messages.map(bubble)}
            </div>

            {isClosed ? (
                <div className="p-5 border-t border-borderColor bg-bgMain text-center">
                    <p className="text-[10px] text-textMuted uppercase tracking-widest mb-3">This conversation was closed by support.</p>
                    <button onClick={startNew} className="text-[10px] font-black uppercase tracking-widest bg-red-600 text-white px-6 py-3 rounded-sm">
                        Start a New Chat
                    </button>
                </div>
            ) : (
                <div className="p-4 border-t border-borderColor bg-bgMain">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Type your message…"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            className="flex-1 chat-input rounded-sm px-4 py-3 text-xs font-medium"
                        />
                        <button
                            onClick={handleSend}
                            disabled={sending || !input.trim()}
                            className="w-12 h-11 bg-textMain hover:opacity-90 text-bgMain rounded-sm flex items-center justify-center transition-all disabled:opacity-40"
                        >
                            <iconify-icon icon="solar:arrow-right-linear" width="18"></iconify-icon>
                        </button>
                    </div>
                    {!user && (
                        <p className="text-[9px] text-textMuted/70 mt-2">Guest chat — we'll email replies to you. Sign in to keep your history.</p>
                    )}
                </div>
            )}
        </>
    );
};

export default SupportChat;
