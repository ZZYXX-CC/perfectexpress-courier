import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getActiveUserId } from '../services/authGuard';
import {
  ChatMessage,
  ChatSession,
  createChatSession,
  getChatMessages,
  getUserChatSessions,
  sendChatMessage
} from '../services/chatService';

const LiveChat: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('Customer');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const loadUserProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUserId(null);
      setUserEmail('');
      setUserName('Customer');
      return;
    }

    // Uses secure impersonation check (admin-only)
    const targetId = await getActiveUserId() || user.id;

    setUserId(targetId);

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', targetId)
      .single();

    if (targetId !== user.id && profile) {
      setUserEmail(profile.email || user.email || '');
      setUserName(profile.full_name || 'Customer');
    } else {
      setUserEmail(user.email || '');
      const resolvedName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer';
      setUserName(resolvedName);
    }
  }, []);

  const loadLatestSession = useCallback(async (uid: string) => {
    const sessions = await getUserChatSessions(uid);
    const active = sessions.find(s => s.status === 'active');
    setSession(active || sessions[0] || null);
  }, []);

  useEffect(() => {
    loadUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUserId(null);
        setUserEmail('');
        setUserName('Customer');
        setSession(null);
        setMessages([]);
        return;
      }
      loadUserProfile();
      loadLatestSession(session.user.id);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile, loadLatestSession]);

  useEffect(() => {
    if (!userId) return;
    loadLatestSession(userId);
  }, [userId, loadLatestSession]);

  useEffect(() => {
    if (!session?.id) {
      setMessages([]);
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadMessages = async () => {
      setLoading(true);
      const data = await getChatMessages(session.id);
      setMessages(data);
      setLoading(false);
    };

    loadMessages();

    channel = supabase
      .channel(`realtime_chat_messages_${session.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${session.id}` },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [session?.id]);

  const handleStartChat = async () => {
    if (!userId || !userEmail) return;
    setLoading(true);
    try {
      const created = await createChatSession({
        userId,
        userEmail,
        userName
      });
      setSession(created);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !session?.id) return;
    setIsTyping(true);
    const messageText = input;
    setInput('');

    try {
      await sendChatMessage({
        sessionId: session.id,
        senderType: 'customer',
        senderName: userName,
        message: messageText
      });
    } finally {
      setIsTyping(false);
    }
  };

  const renderUnauthed = () => (
    <div className="flex-1 p-6 space-y-6 bg-bgMain/20">
      <div className="p-5 border border-borderColor rounded-sm bg-bgMain">
        <p className="text-[11px] font-bold uppercase tracking-widest text-textMain mb-3">Live Chat Access</p>
        <p className="text-xs text-textMuted leading-relaxed">
          Live chat is reserved for authenticated customers. Please sign in or send a support email.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3 bg-textMain text-bgMain rounded-sm font-black uppercase tracking-[0.2em] text-[9px]"
        >
          Sign In to Chat
        </button>
        <button
          onClick={() => navigate('/support')}
          className="w-full py-3 border border-borderColor text-textMuted hover:text-textMain rounded-sm font-black uppercase tracking-[0.2em] text-[9px]"
        >
          Email Support
        </button>
      </div>
      <p className="text-[9px] text-textMuted uppercase tracking-[0.3em] text-center">
        Priority response available for signed-in accounts
      </p>
    </div>
  );

  const renderNoSession = () => (
    <div className="flex-1 p-6 space-y-6 bg-bgMain/20">
      <div className="p-5 border border-borderColor rounded-sm bg-bgMain">
        <p className="text-[11px] font-bold uppercase tracking-widest text-textMain mb-3">Start Live Chat</p>
        <p className="text-xs text-textMuted leading-relaxed">
          You are signed in as {userName}. Open a new chat session to reach support.
        </p>
      </div>
      <button
        onClick={handleStartChat}
        disabled={loading}
        className="w-full py-3 bg-red-600 text-white rounded-sm font-black uppercase tracking-[0.2em] text-[9px] disabled:opacity-50"
      >
        {loading ? 'Starting...' : 'Start Secure Chat'}
      </button>
      <button
        onClick={() => navigate('/support')}
        className="w-full py-3 border border-borderColor text-textMuted hover:text-textMain rounded-sm font-black uppercase tracking-[0.2em] text-[9px]"
      >
        Email Support Instead
      </button>
    </div>
  );

  return (
    <div className="fixed bottom-8 right-8 z-[150]">
      {isOpen ? (
        <div className="bg-bgSurface w-80 md:w-[380px] h-[560px] rounded border border-borderColor shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="p-5 bg-bgMain flex justify-between items-center border-b border-borderColor">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-bgSurface flex items-center justify-center border border-borderColor">
                <iconify-icon icon="solar:headphones-round-linear" width="20" class="text-red-600"></iconify-icon>
              </div>
              <div>
                <span className="block font-extrabold text-[10px] tracking-widest uppercase text-textMain heading-font">Live Support</span>
                <span className="block text-[8px] text-textMuted font-bold uppercase tracking-widest">
                  {session ? (session.status === 'closed' ? 'Session Closed' : 'Connected') : 'Auth Required'}
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-textMuted hover:text-textMain transition-colors">
              <iconify-icon icon="solar:close-circle-linear" width="22"></iconify-icon>
            </button>
          </div>

          {!userId ? (
            renderUnauthed()
          ) : !session ? (
            renderNoSession()
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 bg-bgMain/20">
                {loading ? (
                  <div className="text-[10px] uppercase tracking-[0.3em] text-textMuted text-center">
                    Loading Chat...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-4 border border-borderColor rounded-sm text-xs text-textMuted">
                    No messages yet. Send a message to start the conversation.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-4 py-3 rounded-sm text-xs font-medium leading-relaxed ${m.sender_type === 'customer'
                        ? 'bg-textMain text-bgMain shadow-lg'
                        : 'bg-bgMain text-textMain border border-borderColor'}`}>
                        {m.message}
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex justify-end">
                    <div className="bg-textMain text-bgMain px-4 py-2 rounded-sm text-[9px] uppercase tracking-widest">
                      Sending...
                    </div>
                  </div>
                )}
              </div>

              {session.status === 'closed' ? (
                <div className="p-5 border-t border-borderColor bg-bgMain text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-textMuted mb-3">Session Closed</p>
                  <button
                    onClick={handleStartChat}
                    className="w-full py-3 bg-red-600 text-white rounded-sm font-black uppercase tracking-[0.2em] text-[9px]"
                  >
                    Start New Session
                  </button>
                </div>
              ) : (
                <div className="p-5 border-t border-borderColor bg-bgMain">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Describe your issue..."
                      className="flex-1 bg-bgSurface/40 border border-borderColor rounded-sm px-4 py-3 text-[10px] focus:outline-none focus:border-textMuted text-textMain font-bold tracking-widest uppercase"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button onClick={handleSend} className="w-12 h-11 bg-red-600 hover:bg-red-700 text-white rounded-sm flex items-center justify-center transition-all">
                      <iconify-icon icon="solar:arrow-right-linear" width="18"></iconify-icon>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-bgSurface hover:bg-bgMain rounded border border-borderColor shadow-2xl flex items-center justify-center text-red-600 transition-all hover:scale-105 active:scale-95 group"
        >
          <iconify-icon icon="solar:headphones-round-linear" width="28" class="group-hover:scale-110 transition-transform"></iconify-icon>
        </button>
      )}
    </div>
  );
};

export default LiveChat;
