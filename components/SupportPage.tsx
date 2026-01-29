import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createTicket, getUserTickets, SupportTicket } from '../services/support';
import { supabase } from '../services/supabase';

const SupportPage: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '', subject: 'General Inquiry' });
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User Tickets State
  const [user, setUser] = useState<any>(null);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        setFormState(prev => ({
          ...prev,
          email: user.email || '',
          name: user.user_metadata?.full_name || ''
        }));
        loadUserTickets(user.id);
      }
    });
  }, []);

  const loadUserTickets = async (userId: string) => {
    try {
      const tickets = await getUserTickets(userId);
      setMyTickets(tickets);
    } catch (err) {
      console.error("Failed to load tickets", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await createTicket({
      name: formState.name,
      email: formState.email,
      subject: formState.subject,
      message: formState.message,
      userId: user?.id
    });

    setIsLoading(false);

    if (result.success) {
      setIsSent(true);
      if (user) loadUserTickets(user.id); // Refresh list
    } else {
      setError(result.error || "Failed to create ticket. Please try again.");
    }
  };

  return (
    <section className="pt-32 pb-24 bg-bgMain min-h-screen">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-bgSurface border border-borderColor rounded-full">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-textMuted">Live Support: Active</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold heading-font uppercase tracking-tighter text-textMain mb-4">
            Communication <span className="text-red-600">Center</span>
          </h1>
          <p className="text-textMuted max-w-xl mx-auto text-sm font-medium">
            Direct lines to our operational support teams. Priority is given to tracking inquiries and account management.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Contact Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-bgSurface p-8 rounded-sm border border-borderColor">
              <iconify-icon icon="solar:phone-calling-linear" width="32" class="text-red-600 mb-6"></iconify-icon>
              <h3 className="text-sm font-black uppercase tracking-widest text-textMain mb-2">Priority Voice</h3>
              <p className="text-2xl font-bold text-textMain heading-font mb-1">+1 (888) 990-2244</p>
              <p className="text-[10px] text-textMuted uppercase tracking-wider">Mon-Fri // 08:00 - 20:00 EST</p>
            </div>

            <div className="bg-bgSurface p-8 rounded-sm border border-borderColor">
              <iconify-icon icon="solar:letter-linear" width="32" class="text-red-600 mb-6"></iconify-icon>
              <h3 className="text-sm font-black uppercase tracking-widest text-textMain mb-2">Digital Support</h3>
              <p className="text-lg font-bold text-textMain mb-1">support@perfectexpress.com</p>
              <p className="text-[10px] text-textMuted uppercase tracking-wider">Avg Response: 45 Mins</p>
            </div>

            {/* My Tickets Section (Logged In) */}
            {user && (
              <div className="bg-bgSurface p-8 rounded-sm border border-borderColor">
                <h3 className="text-sm font-black uppercase tracking-widest text-textMain mb-4">My Tickets</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {myTickets.length === 0 ? (
                    <p className="text-xs text-textMuted">No active tickets.</p>
                  ) : (
                    myTickets.map(t => (
                      <div key={t.id} className="p-3 bg-bgMain rounded-sm border border-borderColor">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-red-500">{t.ticket_number}</span>
                          <span className="text-[9px] uppercase tracking-wider text-textMuted">{t.status}</span>
                        </div>
                        <p className="text-xs font-bold text-textMain truncate">{t.subject}</p>
                        <p className="text-[10px] text-textMuted mt-1">{new Date(t.created_at).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-bgSurface/20 border border-borderColor p-10 rounded-sm"
          >
            {isSent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-bgMain border border-borderColor rounded-full flex items-center justify-center text-green-500 mb-6">
                  <iconify-icon icon="solar:check-circle-linear" width="40"></iconify-icon>
                </div>
                <h3 className="text-2xl font-black heading-font uppercase text-textMain mb-2">Transmission Received</h3>
                <p className="text-textMuted text-sm font-medium">Our team is reviewing your message.</p>
                <button
                  onClick={() => { setIsSent(false); setFormState(prev => ({ ...prev, message: '', subject: 'General Inquiry' })); }}
                  className="mt-8 text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-500"
                >
                  Create New Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Identification</label>
                    <input
                      required
                      type="text"
                      placeholder="FULL NAME"
                      className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-4 focus:border-red-600 outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain"
                      value={formState.name}
                      onChange={e => setFormState({ ...formState, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Return Address</label>
                    <input
                      required
                      type="email"
                      placeholder="EMAIL@DOMAIN.COM"
                      className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-4 focus:border-red-600 outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain"
                      value={formState.email}
                      onChange={e => setFormState({ ...formState, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Subject</label>
                  <select
                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-4 focus:border-red-600 outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain"
                    value={formState.subject}
                    onChange={e => setFormState({ ...formState, subject: e.target.value })}
                  >
                    <option>General Inquiry</option>
                    <option>Lost Package</option>
                    <option>Billing Issue</option>
                    <option>Technical Support</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Inquiry Details</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="ENTER YOUR MESSAGE OR TRACKING NUMBER..."
                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-4 focus:border-red-600 outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain resize-none"
                    value={formState.message}
                    onChange={e => setFormState({ ...formState, message: e.target.value })}
                  ></textarea>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-[9px] text-textMuted font-medium italic">
                    * All communications are recorded for quality assurance.
                  </p>
                  <button
                    disabled={isLoading}
                    className="px-10 py-4 bg-textMain text-bgMain hover:bg-red-600 hover:text-white rounded-sm font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? 'Transmitting...' : 'Transmit Message'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SupportPage;