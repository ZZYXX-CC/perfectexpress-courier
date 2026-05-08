import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { notificationService, Notification } from '../services/notificationService';
import { getActiveUserId } from '../services/authGuard';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [shouldRing, setShouldRing] = useState(false);

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        const { data, error } = await notificationService.fetchNotifications();
        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadNotifications();

        const fetchUserAndSubscribe = async () => {
            const activeUserId = await getActiveUserId();

            if (!activeUserId) return;

            // Subscribe to real-time notifications for the active user context
            const channel = supabase
                .channel(`realtime_notifications_${activeUserId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${activeUserId}`
                    },
                    async (payload) => {
                        const newNotification = payload.new as Notification;

                        const currentActiveUserId = await getActiveUserId();

                        if (newNotification.user_id === currentActiveUserId) {
                            setNotifications(prev => [newNotification, ...prev]);
                            setUnreadCount(prev => prev + 1);
                            setShouldRing(true);
                            setTimeout(() => setShouldRing(false), 2000);

                            try {
                                const audio = new Audio('/notification-pop.mp3');
                                audio.volume = 0.2;
                                audio.play().catch(() => { });
                            } catch (e) { }
                        }
                    }
                )
                .subscribe();

            return channel; // Return the channel to be able to remove it later
        };

        let activeChannel: ReturnType<typeof supabase.channel> | null = null;
        fetchUserAndSubscribe().then(channel => {
            activeChannel = channel;
        });

        return () => {
            if (activeChannel) {
                supabase.removeChannel(activeChannel);
            }
            // Alternatively, if you want to remove all channels created by this hook:
            // supabase.removeAllChannels();
        };
    }, [loadNotifications]);

    const markAsRead = async (id: string) => {
        const { error } = await notificationService.markAsRead(id);
        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = async () => {
        const { error } = await notificationService.markAllAsRead();
        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        shouldRing,
        markAsRead,
        markAllAsRead,
        refresh: loadNotifications
    };
};
