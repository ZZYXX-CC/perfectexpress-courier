import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { getTicketDetails, addReply, SupportTicket, TicketReply, updateTicketStatus } from '../../services/support';
import { supabase } from '../../services/supabase';

const TicketDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [replies, setReplies] = useState<TicketReply[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

    useEffect(() => {
        if (id) {
            loadData(id);
        }
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) setCurrentUserEmail(data.user.email);
        });
    }, [id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [replies]);

    const loadData = async (ticketId: string) => {
        try {
            const { ticket, replies } = await getTicketDetails(ticketId);
            setTicket(ticket);
            setReplies(replies);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !id || !ticket) return;

        setSending(true);
        try {
            // Determine sender type (Assuming this component is used by Users context predominantly, 
            // but could be shared. Logic handles 'admin' if role context was clearer, 
            // for now default to customer unless we check role props)
            const senderType = 'customer'; // Default for user dashboard

            await addReply(id, replyText, senderType, ticket.name); // Using ticket creator name as fallback or user name

            // If ticket was resolved/closed, re-open it? 
            // Often logic for support systems.
            if (ticket.status === 'resolved' || ticket.status === 'closed') {
                await updateTicketStatus(id, 'in_progress');
            }

            setReplyText('');
            await loadData(id); // Reload to show new message
        } catch (error) {
            console.error('Failed to send reply:', error);
        } finally {
            setSending(false);
        }
    };

    const handleCloseTicket = async () => {
        if (!id || !confirm("Are you sure you want to mark this ticket as resolved?")) return;
        try {
            await updateTicketStatus(id, 'resolved');
            loadData(id);
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="min-h-screen bg-bgMain pt-32 pb-20 flex justify-center"><div className="animate-pulse text-xs font-mono text-red-600">LOADING DATA...</div></div>;
    if (!ticket) return <div className="min-h-screen bg-bgMain pt-32 text-center">Ticket not found</div>;

    return (
        <div className="flex flex-col h-full bg-bgMain border border-borderColor rounded-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-borderColor bg-bgSurface/20 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <button onClick={() => navigate(-1)} className="text-textMuted hover:text-white transition-colors">
                            <Icon icon="solar:arrow-left-linear" />
                        </button>
                        <span className="font-mono text-xs text-red-500">{ticket.ticket_number}</span>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-white/5 rounded-sm text-textMuted">
                            {ticket.status.replace('_', ' ')}
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-textMain">{ticket.subject}</h2>
                </div>
                {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                    <button
                        onClick={handleCloseTicket}
                        className="text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-green-500 transition-colors border border-borderColor px-3 py-1.5 rounded-sm hover:border-green-500"
                    >
                        Mark Resolved
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-grow p-6 overflow-y-auto space-y-6 bg-bgMain max-h-[60vh]">
                {replies.map((reply) => {
                    const isMe = reply.sender_type === 'customer'; // Logic could be refined if admin views this
                    return (
                        <div key={reply.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div className={`p-4 rounded-sm border ${isMe ? 'bg-bgSurface/30 border-borderColor text-right' : 'bg-red-900/10 border-red-900/20'} mb-1`}>
                                    <p className="text-sm text-textMain whitespace-pre-wrap leading-relaxed">{reply.message}</p>
                                </div>
                                <span className="text-[9px] text-textMuted uppercase tracking-wider">
                                    {reply.sender_name || (isMe ? 'You' : 'Support')} • {new Date(reply.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <div className="p-6 border-t border-borderColor bg-bgSurface/10">
                <form onSubmit={handleSendReply} className="relative">
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={3}
                        className="w-full bg-bgMain border border-borderColor rounded-sm p-4 text-sm text-textMain focus:outline-none focus:border-red-600 resize-none pr-12"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={sending || !replyText.trim()}
                        className="absolute right-3 bottom-3 p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-sm transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-red-600"
                    >
                        <Icon icon="solar:plain-linear" className={sending ? 'animate-pulse' : ''} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TicketDetail;
