import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { getTicketDetails, addReply, SupportTicket, TicketReply, updateTicketStatus } from '../../services/support';
import { supabase } from '../../services/supabase';
import { useToast } from '../ui/Toast';

const TicketDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [replies, setReplies] = useState<TicketReply[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [currentUser, setCurrentUser] = useState<{ id: string, email: string, role: string } | null>(null);

    useEffect(() => {
        if (id) {
            loadData(id);
        }

        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                setCurrentUser({ id: user.id, email: user.email || '', role: profile?.role || 'client' });
            }
        };
        fetchUser();
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
        if (!replyText.trim() || !id || !ticket || !currentUser) return;

        setSending(true);
        try {
            // detailed logic to handle "View As" mode
            const impersonatedId = localStorage.getItem('impersonated_user_id');
            // If impersonating, we are ACTING as the customer
            const isImpersonating = !!impersonatedId;

            const senderType = (currentUser.role === 'admin' && !isImpersonating) ? 'admin' : 'customer';
            const senderName = (currentUser.role === 'admin' && !isImpersonating) ? 'Support Agent' : ticket.name;

            await addReply(id, replyText, senderType, senderName);

            // If user replies to a resolved/closed ticket, re-open it
            if (senderType === 'customer' && (ticket.status === 'resolved' || ticket.status === 'closed')) {
                await updateTicketStatus(id, 'in_progress');
            }

            setReplyText('');
            toast.showSuccess('Reply Sent', 'Your message has been transmitted.');
            await loadData(id);
        } catch (error) {
            console.error('Failed to send reply:', error);
            toast.showError('Transmission Error', 'Failed to send reply.');
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async (newStatus: SupportTicket['status']) => {
        if (!id) return;
        try {
            await updateTicketStatus(id, newStatus);
            toast.showSuccess('Ticket Updated', `Status changed to ${newStatus}`);
            loadData(id);
        } catch (e) {
            console.error(e);
            toast.showError('Update Failed', 'Failed to update ticket status.');
        }
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
                        <div className="flex gap-2">
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm font-black border ${ticket.status === 'open' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                                ticket.status === 'in_progress' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' :
                                    ticket.status === 'resolved' ? 'text-purple-500 bg-purple-500/10 border-purple-500/20' :
                                        'text-neutral-500 bg-neutral-500/10 border-neutral-500/20'
                                }`}>
                                {ticket.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-textMain">{ticket.subject}</h2>
                </div>

                <div className="flex gap-2">
                    {currentUser?.role === 'admin' ? (
                        <select
                            value={ticket.status}
                            onChange={(e) => handleUpdateStatus(e.target.value as any)}
                            className="bg-bgMain border border-borderColor text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm outline-none focus:border-red-600"
                        >
                            <option value="open">OPEN</option>
                            <option value="in_progress">IN PROGRESS</option>
                            <option value="resolved">RESOLVED</option>
                            <option value="closed">CLOSED</option>
                        </select>
                    ) : (
                        ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                            <button
                                onClick={() => handleUpdateStatus('resolved')}
                                className="text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-green-500 transition-colors border border-borderColor px-3 py-1.5 rounded-sm hover:border-green-500"
                            >
                                Mark Resolved
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow p-6 overflow-y-auto space-y-6 bg-bgMain custom-scrollbar relative">
                {/* Visual Grid for contrast */}
                <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>

                {replies.map((reply) => {
                    const impersonatedId = localStorage.getItem('impersonated_user_id');
                    const isAdminMsg = reply.sender_type === 'admin';

                    // Viewer-relative alignment (WhatsApp-style): the current viewer's
                    // own messages sit on the right, everyone else's on the left — so the
                    // layout mirrors per person instead of being fixed. An admin in
                    // "View As" (impersonation) mode is effectively the customer.
                    const viewerIsAdmin = currentUser?.role === 'admin' && !impersonatedId;
                    const isMine = viewerIsAdmin
                        ? reply.sender_type === 'admin'
                        : reply.sender_type === 'customer';
                    const isRightAligned = isMine;

                    return (
                        <div key={reply.id} className={`flex ${isRightAligned ? 'justify-end' : 'justify-start'} relative z-10`}>
                            <div className={`max-w-[75%] md:max-w-[60%] ${isRightAligned ? 'items-end' : 'items-start'} flex flex-col group`}>
                                <div className={`p-4 rounded-sm border transition-all duration-300 ${isAdminMsg
                                    ? 'bg-red-600/10 border-red-600/30 shadow-[0_0_20px_rgba(220,38,38,0.05)]'
                                    : 'bg-bgSurface/40 border-borderColor backdrop-blur-md'
                                    } text-left mb-2 group-hover:border-red-600/50`}>
                                    <p className="text-[13px] text-textMain whitespace-pre-wrap leading-relaxed font-medium">{reply.message}</p>
                                </div>
                                <div className={`flex items-center gap-2 px-1 ${isRightAligned ? 'flex-row-reverse' : ''}`}>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isAdminMsg ? 'text-red-600' : 'text-textMuted'}`}>
                                        {isAdminMsg ? 'SUPPORT AGENT' : (reply.sender_name || ticket.name)}
                                    </span>
                                    <span className="text-[9px] text-textMuted/50 font-mono">
                                        {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
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
