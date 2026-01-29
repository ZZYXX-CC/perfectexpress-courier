'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getActiveChatSessions, getChatMessages, sendChatMessage, closeChatSession, markMessagesAsRead } from '@/app/actions/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import AdminTabs from '@/components/AdminTabs'
import { MessageCircle, Send, Loader2, User, X, Clock, Mail, RefreshCw, Wifi } from 'lucide-react'

type ChatSession = {
    id: string
    visitor_name: string
    visitor_email: string
    status: 'active' | 'closed'
    unread_count: number
    last_message_at: string
    created_at: string
}

type ChatMessage = {
    id: string
    session_id: string
    sender_type: 'visitor' | 'admin'
    sender_name: string | null
    message: string
    is_read: boolean
    created_at: string
}

export default function AdminChatPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Load sessions
    const loadSessions = useCallback(async () => {
        const data = await getActiveChatSessions()
        setSessions(data)
        setIsLoading(false)
    }, [])

    useEffect(() => {
        loadSessions()
    }, [loadSessions])

    // Real-time subscription for sessions
    useEffect(() => {
        const channel = supabase
            .channel('admin-chat-sessions')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_sessions',
                },
                () => {
                    loadSessions()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, loadSessions])

    // Real-time subscription for messages when session is selected
    useEffect(() => {
        if (!selectedSession) return

        const channel = supabase
            .channel(`admin-chat-${selectedSession.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `session_id=eq.${selectedSession.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as ChatMessage
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev
                        return [...prev, newMsg]
                    })
                    
                    if (newMsg.sender_type === 'visitor') {
                        toast.info(`New message from ${selectedSession.visitor_name}`)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, selectedSession])

    const handleSelectSession = async (session: ChatSession) => {
        setSelectedSession(session)
        setIsLoading(true)
        const msgs = await getChatMessages(session.id)
        setMessages(msgs)
        setIsLoading(false)
        
        // Mark messages as read
        if (session.unread_count > 0) {
            await markMessagesAsRead(session.id)
            loadSessions()
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!newMessage.trim() || !selectedSession) return

        setIsSending(true)
        const result = await sendChatMessage(selectedSession.id, newMessage, 'admin', 'Support Team')
        
        if (result.error) {
            toast.error(result.error)
        } else {
            setNewMessage('')
        }
        setIsSending(false)
    }

    const handleCloseChat = async () => {
        if (!selectedSession) return
        
        const result = await closeChatSession(selectedSession.id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Chat closed')
            setSelectedSession(null)
            setMessages([])
            loadSessions()
        }
    }

    const activeSessions = sessions.filter(s => s.status === 'active')
    const closedSessions = sessions.filter(s => s.status === 'closed')

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-secondary">Admin Dashboard</h1>
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                <Wifi size={12} className="animate-pulse" />
                                Live
                            </span>
                        </div>
                        <p className="text-slate-500">Manage customer conversations in real-time</p>
                    </div>
                    <Button variant="outline" onClick={loadSessions}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                {/* Navigation Tabs */}
                <AdminTabs />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
                    {/* Sessions List */}
                    <Card className="glass border-0 shadow-lg overflow-hidden">
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageCircle size={20} className="text-primary" />
                                Conversations
                                {activeSessions.length > 0 && (
                                    <Badge className="bg-primary">{activeSessions.length}</Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="h-[calc(100%-60px)]">
                            <div className="p-2">
                                {activeSessions.length === 0 && closedSessions.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <MessageCircle size={40} className="mx-auto mb-3 opacity-50" />
                                        <p>No conversations yet</p>
                                    </div>
                                ) : (
                                    <>
                                        {activeSessions.map((session) => (
                                            <button
                                                key={session.id}
                                                onClick={() => handleSelectSession(session)}
                                                className={`w-full p-3 rounded-lg text-left mb-2 transition-colors ${
                                                    selectedSession?.id === session.id
                                                        ? 'bg-primary/10 border border-primary/20'
                                                        : 'hover:bg-slate-100'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-secondary">{session.visitor_name}</span>
                                                    {session.unread_count > 0 && (
                                                        <Badge className="bg-red-500 text-xs">{session.unread_count}</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Mail size={12} />
                                                    <span className="truncate">{session.visitor_email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                    <Clock size={12} />
                                                    <span>{new Date(session.last_message_at).toLocaleString()}</span>
                                                </div>
                                            </button>
                                        ))}
                                        
                                        {closedSessions.length > 0 && (
                                            <div className="mt-4 pt-4 border-t">
                                                <p className="text-xs text-slate-400 mb-2 px-2">Closed</p>
                                                {closedSessions.slice(0, 5).map((session) => (
                                                    <button
                                                        key={session.id}
                                                        onClick={() => handleSelectSession(session)}
                                                        className="w-full p-3 rounded-lg text-left mb-2 hover:bg-slate-100 opacity-60"
                                                    >
                                                        <span className="font-medium text-secondary text-sm">{session.visitor_name}</span>
                                                        <p className="text-xs text-slate-500 truncate">{session.visitor_email}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    </Card>

                    {/* Chat Area */}
                    <Card className="lg:col-span-2 glass border-0 shadow-lg overflow-hidden flex flex-col">
                        {selectedSession ? (
                            <>
                                {/* Chat Header */}
                                <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="text-primary" size={20} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{selectedSession.visitor_name}</CardTitle>
                                            <p className="text-sm text-slate-500">{selectedSession.visitor_email}</p>
                                        </div>
                                    </div>
                                    {selectedSession.status === 'active' && (
                                        <Button variant="outline" size="sm" onClick={handleCloseChat} className="text-red-500 border-red-200 hover:bg-red-50">
                                            <X size={16} className="mr-1" />
                                            Close Chat
                                        </Button>
                                    )}
                                </CardHeader>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                            <MessageCircle size={40} className="mb-2 opacity-50" />
                                            <p>No messages in this conversation</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                                        msg.sender_type === 'admin'
                                                            ? 'bg-primary text-white rounded-br-md'
                                                            : 'bg-white text-slate-800 shadow-sm border rounded-bl-md'
                                                    }`}
                                                >
                                                    <p className="text-sm">{msg.message}</p>
                                                    <p className={`text-xs mt-1 ${
                                                        msg.sender_type === 'admin' ? 'text-white/70' : 'text-slate-400'
                                                    }`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                {selectedSession.status === 'active' && (
                                    <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex gap-3">
                                        <Input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your reply..."
                                            className="flex-1"
                                            disabled={isSending}
                                        />
                                        <Button type="submit" disabled={isSending || !newMessage.trim()}>
                                            {isSending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Send size={18} className="mr-2" />
                                                    Send
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <MessageCircle size={60} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-lg">Select a conversation</p>
                                    <p className="text-sm">Choose a chat from the list to start responding</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    )
}
