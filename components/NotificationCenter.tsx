import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNotifications } from '../hooks/useNotifications';
import { Notification } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, shouldRing, markAsRead, markAllAsRead } = useNotifications();
    const panelRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

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

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-textMuted hover:text-red-600 transition-colors group"
            >
                <motion.div
                    animate={shouldRing ? {
                        rotate: [0, -20, 20, -20, 20, 0],
                        scale: [1, 1.2, 1.2, 1.2, 1.2, 1]
                    } : { rotate: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                    <Icon icon="solar:bell-bing-linear" width="24" height="24" />
                </motion.div>

                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white/20"></span>
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="glass-surface absolute right-0 mt-4 w-[calc(100vw-2rem)] sm:w-96 bg-bgSurface/95 backdrop-blur-[20px] rounded-sm shadow-2xl z-[1000] overflow-hidden transform"
                        style={{ maxWidth: 'min(384px, calc(100vw - 2rem))' }}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-borderColor flex justify-between items-center bg-white/5">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-textMain">Intelligence Center</h3>
                            <button
                                onClick={markAllAsRead}
                                className="text-[9px] font-bold uppercase tracking-widest text-red-600 hover:text-red-500 transition-colors"
                            >
                                Mark All as Read
                            </button>
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => {
                                            markAsRead(notif.id);
                                            setIsOpen(false);
                                            navigate('/notifications');
                                        }}
                                        className={`p-4 border-b border-borderColor/50 last:border-0 cursor-pointer transition-colors hover:bg-white/5 flex gap-4 ${!notif.is_read ? 'bg-red-600/5 border-l-2 border-l-red-600' : ''}`}
                                    >
                                        <div className={`mt-1 p-2 rounded-full h-fit ${!notif.is_read ? 'bg-red-600/20 text-red-600' : 'bg-bgMain text-textMuted'}`}>
                                            <Icon icon={getIcon(notif.type)} width="16" />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`text-xs font-bold ${!notif.is_read ? 'text-textMain' : 'text-textMuted'}`}>{notif.title}</p>
                                                <span className="text-[9px] text-textMuted font-mono uppercase">
                                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-textMuted leading-relaxed line-clamp-2">{notif.message}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <Icon icon="solar:ghost-linear" className="mx-auto mb-4 text-textMuted/20" width="48" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-textMuted">No new signals</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-white/5 border-t border-borderColor text-center">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/notifications');
                                }}
                                className="text-[9px] font-black uppercase tracking-widest text-textMuted hover:text-textMain transition-colors"
                            >
                                View All Signals
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
