import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const NotificationPage: React.FC = () => {
    const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
    const navigate = useNavigate();

    const getIcon = (type: string) => {
        switch (type) {
            case 'shipment_update': return 'solar:delivery-linear';
            case 'ticket_reply': return 'solar:chat-line-linear';
            case 'chat_message': return 'solar:chat-round-dots-linear';
            case 'payment_update': return 'solar:wallet-linear';
            case 'system': return 'solar:settings-linear';
            default: return 'solar:bell-linear';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'shipment_update': return 'Logistic Update';
            case 'ticket_reply': return 'Support Signal';
            case 'chat_message': return 'Live Chat';
            case 'payment_update': return 'Payment Update';
            case 'system': return 'System Event';
            default: return 'Notification';
        }
    };

    return (
        <section className="pt-32 pb-24 bg-bgMain min-h-screen">
            <div className="container mx-auto px-6 max-w-4xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-borderColor pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                            <span className="metadata-label text-textMuted uppercase tracking-[0.2em] text-[9px]">Communication Stream</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold heading-font uppercase tracking-tighter text-textMain">
                            Intelligence <span className="text-red-600">Center</span>
                        </h1>
                    </div>
                    <div className="mt-6 md:mt-0 flex gap-4">
                        <button
                            onClick={() => unreadCount > 0 && markAllAsRead()}
                            className="bg-bgSurface border border-borderColor px-6 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest text-textMain hover:border-red-600 transition-all active:scale-95 disabled:opacity-50"
                            disabled={unreadCount === 0}
                        >
                            Mark All As Read
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="p-20 text-center animate-pulse">
                            <Icon icon="solar:refresh-linear" width="40" className="mx-auto mb-4 text-textMuted animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-textMuted">Syncing Intelligence Stream...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="bg-bgSurface/20 border border-borderColor rounded-sm p-20 text-center">
                            <Icon icon="solar:ghost-linear" className="mx-auto mb-6 text-textMuted/10" width="80" />
                            <h3 className="text-xl font-bold uppercase text-textMain mb-2">No active signals</h3>
                            <p className="text-xs text-textMuted font-medium italic">Your intelligence stream is currently clear.</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="mt-8 text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-white transition-colors"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    ) : (
                        notifications.map((notif, index) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => {
                                    markAsRead(notif.id);
                                    if (notif.link) navigate(notif.link);
                                }}
                                className={`group bg-bgSurface/40 border p-6 rounded-sm cursor-pointer transition-all hover:border-red-600/50 flex flex-col md:flex-row gap-6 relative overflow-hidden ${!notif.is_read ? 'border-red-600/30' : 'border-borderColor'}`}
                            >
                                {/* Unread Indicator */}
                                {!notif.is_read && (
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
                                )}

                                <div className={`w-12 h-12 rounded-sm flex items-center justify-center shrink-0 border ${!notif.is_read ? 'bg-red-600/10 border-red-600/20 text-red-600' : 'bg-bgSurface border-borderColor text-textMuted'}`}>
                                    <Icon icon={getIcon(notif.type)} width="24" />
                                </div>

                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-600 mb-1 block">{getTypeLabel(notif.type)}</span>
                                            <h3 className={`text-sm font-bold uppercase tracking-tight ${!notif.is_read ? 'text-textMain' : 'text-textMuted'}`}>{notif.title}</h3>
                                        </div>
                                        <span className="text-[10px] font-mono text-textMuted uppercase whitespace-nowrap">
                                            {new Date(notif.created_at).toLocaleDateString()} — {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={`text-[11px] leading-relaxed max-w-2xl ${!notif.is_read ? 'text-textMain font-medium' : 'text-textMuted'}`}>
                                        {notif.message}
                                    </p>
                                </div>

                                <div className="md:flex items-center hidden">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Icon icon="solar:arrow-right-linear" width="20" className="text-red-600" />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default NotificationPage;
