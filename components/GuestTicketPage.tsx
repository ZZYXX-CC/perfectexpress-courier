import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { addGuestReply, getGuestTicketDetails, SupportTicket, TicketReply } from '../services/support';
import { useToast } from './ui/Toast';

const GuestTicketPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = searchParams.get('token') || '';
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadTicket = async () => {
    if (!id || !token) {
      setLoading(false);
      return;
    }

    try {
      const result = await getGuestTicketDetails(id, token);
      setTicket(result.ticket);
      setReplies(result.replies || []);
    } catch {
      setTicket(null);
      setReplies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  const handleSendReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !token || !replyText.trim()) return;

    setSending(true);
    try {
      await addGuestReply(id, token, replyText.trim());
      setReplyText('');
      toast.showSuccess('Reply Sent', 'Your message has been sent to support.');
      await loadTicket();
    } catch {
      toast.showError('Reply Failed', 'We could not send your reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-bgMain pt-32 pb-20 flex justify-center">
        <div className="animate-pulse text-xs font-mono text-red-600">LOADING SUPPORT THREAD...</div>
      </section>
    );
  }

  if (!ticket) {
    return (
      <section className="min-h-screen bg-bgMain pt-32 pb-20 px-6 text-center">
        <div className="max-w-lg mx-auto bg-bgSurface border border-borderColor p-8 rounded-sm">
          <Icon icon="solar:lock-keyhole-linear" width="40" className="text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-black heading-font uppercase text-textMain mb-2">Ticket Link Invalid</h1>
          <p className="text-sm text-textMuted mb-6">This private support link is missing, expired, or incorrect.</p>
          <button onClick={() => navigate('/support')} className="bg-red-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-sm">
            Contact Support
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-bgMain pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-red-500 font-bold uppercase mb-1">{ticket.ticket_number}</p>
            <h1 className="text-2xl md:text-3xl font-black heading-font uppercase tracking-tight text-textMain">{ticket.subject}</h1>
          </div>
          <span className={`shrink-0 text-[10px] uppercase tracking-wider px-3 py-1 rounded-sm font-black border ${ticket.status === 'open' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
            ticket.status === 'in_progress' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' :
              ticket.status === 'resolved' ? 'text-purple-500 bg-purple-500/10 border-purple-500/20' :
                'text-neutral-500 bg-neutral-500/10 border-neutral-500/20'
            }`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>

        <div className="bg-bgSurface border border-borderColor rounded-sm overflow-hidden h-[720px] flex flex-col">
          <div className="p-5 border-b border-borderColor bg-bgMain/40">
            <p className="text-[10px] text-textMuted uppercase tracking-widest font-bold">
              Private guest support thread. Keep this link safe to view replies and respond.
            </p>
          </div>

          <div className="flex-grow p-6 overflow-y-auto space-y-6 bg-bgMain custom-scrollbar relative">
            <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>
            {replies.map(reply => {
              const isAdminMsg = reply.sender_type === 'admin';
              return (
                <div key={reply.id} className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'} relative z-10`}>
                  <div className={`max-w-[78%] md:max-w-[62%] ${isAdminMsg ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`p-4 rounded-sm border ${isAdminMsg ? 'bg-red-600/10 border-red-600/30 text-right' : 'bg-bgSurface/40 border-borderColor text-left'}`}>
                      <p className="text-[13px] text-textMain whitespace-pre-wrap leading-relaxed font-medium">{reply.message}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-1 mt-2 ${isAdminMsg ? 'flex-row-reverse' : ''}`}>
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

          <div className="p-6 border-t border-borderColor bg-bgSurface/10">
            <form onSubmit={handleSendReply} className="relative">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply to support..."
                rows={3}
                className="w-full bg-bgMain border border-borderColor rounded-sm p-4 text-sm text-textMain focus:outline-none focus:border-red-600 resize-none pr-12"
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
      </div>
    </section>
  );
};

export default GuestTicketPage;
