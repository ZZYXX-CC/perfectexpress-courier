import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../services/support';
import { supabase } from '../services/supabase';
import { getActiveUserId } from '../services/authGuard';

const SUPPORT_SUBJECTS = [
  'General Inquiry',
  'Tracking Support',
  'Shipment Update',
  'Billing Issue',
  'Technical Support'
];

const initialForm = {
  name: '',
  email: '',
  subject: 'General Inquiry',
  message: ''
};

const ChatBot: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [userId, setUserId] = useState<string | undefined>();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdTicket, setCreatedTicket] = useState<{ id: string; ticket_number: string } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserId(undefined);
        setLoadingProfile(false);
        return;
      }

      const activeId = await getActiveUserId();
      const targetId = activeId || user.id;
      setUserId(targetId);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', targetId)
        .single();

      setForm(prev => ({
        ...prev,
        name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || prev.name,
        email: profile?.email || user.email || prev.email
      }));
      setLoadingProfile(false);
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    panelRef.current.scrollTop = panelRef.current.scrollHeight;
  }, [isOpen, createdTicket, error]);

  const resetForNewTicket = () => {
    setCreatedTicket(null);
    setError('');
    setForm(prev => ({
      ...prev,
      subject: 'General Inquiry',
      message: ''
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!name || !email || !subject || !message) {
      setError('Please provide your name, email, subject, and message.');
      return;
    }

    setIsSubmitting(true);
    const result = await createTicket({
      name,
      email,
      subject,
      message,
      userId
    });
    setIsSubmitting(false);

    if (!result.success || !result.ticket) {
      setError(result.error || 'Failed to submit support request. Please try again.');
      return;
    }

    setCreatedTicket({
      id: result.ticket.id,
      ticket_number: result.ticket.ticket_number
    });
  };

  return (
    <div className="fixed bottom-8 right-8 z-[150]">
      {isOpen ? (
        <div className="bg-bgSurface w-80 md:w-[400px] h-[580px] rounded border border-borderColor shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="p-5 bg-bgMain flex justify-between items-center border-b border-borderColor">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-bgSurface flex items-center justify-center border border-borderColor">
                <iconify-icon icon="solar:headphones-round-linear" width="20" class="text-red-600"></iconify-icon>
              </div>
              <div>
                <span className="block font-extrabold text-[10px] tracking-widest uppercase text-textMain heading-font">Support Desk</span>
                <span className="block text-[8px] text-textMuted font-bold uppercase tracking-widest">Create a real support ticket</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-textMuted hover:text-textMain transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="22"></iconify-icon>
            </button>
          </div>

          <div ref={panelRef} className="flex-1 overflow-y-auto p-6 bg-bgMain/20">
            {createdTicket ? (
              <div className="h-full flex flex-col justify-center text-center">
                <div className="w-16 h-16 mx-auto bg-bgMain border border-borderColor rounded-full flex items-center justify-center text-green-500 mb-5">
                  <iconify-icon icon="solar:check-circle-linear" width="32"></iconify-icon>
                </div>
                <p className="metadata-label text-textMuted mb-2">Ticket Created</p>
                <h3 className="text-xl font-black heading-font uppercase text-textMain mb-2">{createdTicket.ticket_number}</h3>
                <p className="text-xs text-textMuted leading-relaxed mb-6">
                  Your message has been sent to support. We will reply by email, and signed-in users can track replies in the dashboard.
                </p>
                <div className="grid gap-3">
                  {userId && (
                    <button
                      onClick={() => navigate(`/dashboard/tickets/${createdTicket.id}`)}
                      className="w-full py-3 bg-red-600 text-white rounded-sm font-black uppercase tracking-[0.2em] text-[9px]"
                    >
                      View Ticket
                    </button>
                  )}
                  <button
                    onClick={resetForNewTicket}
                    className="w-full py-3 border border-borderColor text-textMuted hover:text-textMain rounded-sm font-black uppercase tracking-[0.2em] text-[9px]"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 border border-borderColor bg-bgMain rounded-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-textMain mb-2">
                    How support works
                  </p>
                  <p className="text-xs text-textMuted leading-relaxed">
                    This opens a support ticket with our team. Include your tracking number if your request is shipment-related.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <input
                    required
                    type="text"
                    placeholder="Full name"
                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 text-[10px] focus:outline-none focus:border-red-600 text-textMain font-bold tracking-widest uppercase"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    disabled={loadingProfile}
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email address"
                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 text-[10px] focus:outline-none focus:border-red-600 text-textMain font-bold tracking-widest uppercase"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    disabled={loadingProfile}
                  />
                  <select
                    required
                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 text-[10px] focus:outline-none focus:border-red-600 text-textMain font-bold tracking-widest uppercase"
                    value={form.subject}
                    onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                  >
                    {SUPPORT_SUBJECTS.map(subject => (
                      <option key={subject}>{subject}</option>
                    ))}
                  </select>
                  <textarea
                    required
                    rows={6}
                    placeholder="Message or tracking number..."
                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 text-[10px] focus:outline-none focus:border-red-600 text-textMain font-bold tracking-widest uppercase resize-none"
                    value={form.message}
                    onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/support')}
                    className="flex-1 py-3 border border-borderColor text-textMuted hover:text-textMain rounded-sm font-black uppercase tracking-[0.2em] text-[9px]"
                  >
                    Support Center
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || loadingProfile}
                    className="flex-1 py-3 bg-textMain hover:bg-red-600 hover:text-white text-bgMain rounded-sm font-black uppercase tracking-[0.2em] text-[9px] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Ticket'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-bgSurface hover:bg-bgMain rounded border border-borderColor shadow-2xl flex items-center justify-center text-red-600 transition-all hover:scale-105 active:scale-95 group"
          aria-label="Open support desk"
        >
          <iconify-icon icon="solar:headphones-round-linear" width="28" class="group-hover:scale-110 transition-transform"></iconify-icon>
        </button>
      )}
    </div>
  );
};

export default ChatBot;
