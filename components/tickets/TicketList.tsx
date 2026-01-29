import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { SupportTicket, getUserTickets } from '../../services/support';
import { User } from '../../types';

interface TicketListProps {
    user: User;
}

const statusColors: Record<string, string> = {
    'open': 'text-green-500 bg-green-500/10 border-green-500/20',
    'in_progress': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    'resolved': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    'closed': 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20',
};

const TicketList: React.FC<TicketListProps> = ({ user }) => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            // In a real app we'd need the actual UUID from supabase auth user object, 
            // which might differ from our 'User' type if not perfectly synced.
            // Assuming user passed here has the correct ID or we fetch it.
            // For now, we'll try to use the ID if present or rely on current session in service if revised.
            // But getUserTickets takes an ID. 
            // Let's assume the parent passes the correct context or we get it here.
            try {
                // We need the actual Supabase User ID. 
                // Ideally passed in `user` or separate prop. 
                // If `user.id` is not available in our simplified type, we might need to fetch session.
                // For this implementation, let's assume `user` prop has a mapped ID or we fetch session.
                // Wait, `User` type has `name`, `email`, `role`. No ID?
                // Let's fetch session here to be safe.
                const { supabase } = await import('../../services/supabase');
                const { data: { user: sbUser } } = await supabase.auth.getUser();

                if (sbUser) {
                    const data = await getUserTickets(sbUser.id);
                    setTickets(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    if (loading) return <div className="p-8 text-center text-textMuted text-xs font-mono animate-pulse">LOADING TICKETS...</div>;

    return (
        <div className="bg-bgSurface/20 border border-borderColor rounded-sm overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-borderColor flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-textMain">My Support Tickets</h3>
                <button
                    onClick={() => navigate('/support')}
                    className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-white transition-colors"
                >
                    + New Ticket
                </button>
            </div>

            {tickets.length === 0 ? (
                <div className="p-12 text-center">
                    <Icon icon="solar:ticket-linear" className="w-12 h-12 text-textMuted mx-auto mb-4 opacity-50" />
                    <p className="text-textMuted text-sm">No support tickets found.</p>
                </div>
            ) : (
                <div className="divide-y divide-borderColor">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            onClick={() => navigate(`/dashboard/tickets/${ticket.id}`)}
                            className="p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-mono text-xs text-red-500 group-hover:text-red-400 transition-colors">
                                    {ticket.ticket_number}
                                </span>
                                <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${statusColors[ticket.status] || 'text-slate-500'}`}>
                                    {ticket.status.replace('_', ' ')}
                                </span>
                            </div>
                            <h4 className="text-sm font-bold text-textMain mb-1">{ticket.subject}</h4>
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] text-textMuted uppercase tracking-wider">
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                </span>
                                <Icon icon="solar:arrow-right-linear" className="text-textMuted opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-300" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TicketList;
