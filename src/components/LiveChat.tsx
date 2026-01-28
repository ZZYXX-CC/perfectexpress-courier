'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { createChatSession, sendChatMessage, getChatMessages } from '@/app/actions/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { MessageCircle, X, Send, Loader2, Minimize2 } from 'lucide-react'

type ChatMessage = {
    id: string
    session_id: string
    sender_type: 'visitor' | 'admin'
    sender_name: string | null
    message: string
    is_read: boolean
    created_at: string
}

export default function LiveChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSending, setIsSending] = useState(false)
    
    // Registration form
    const [visitorName, setVisitorName] = useState('')
    const [visitorEmail, setVisitorEmail] = useState('')
    const [isRegistered, setIsRegistered] = useState(false)
    
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const loadMessages = async (sid: string) => {
        setIsLoading(true)
        const msgs = await getChatMessages(sid)
        setMessages(msgs)
        setIsLoading(false)
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Load existing session from localStorage
    useEffect(() => {
        const savedSession = localStorage.getItem('chatSessionId')
        const savedName = localStorage.getItem('chatVisitorName')
        const savedEmail = localStorage.getItem('chatVisitorEmail')
        
        if (savedSession && savedName && savedEmail) {
            setSessionId(savedSession)
            setVisitorName(savedName)
            setVisitorEmail(savedEmail)
            setIsRegistered(true)
            loadMessages(savedSession)
        }
    }, [])

    // Real-time subscription for messages
    useEffect(() => {
        if (!sessionId) return

        const channel = supabase
            .channel(`chat-${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    const newMsg = payload.new as ChatMessage
                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.some(m => m.id === newMsg.id)) return prev
                        return [...prev, newMsg]
                    })
                    
                    // Show notification for admin messages
                    if (newMsg.sender_type === 'admin' && !isOpen) {
                        toast.info('New message from support!', {
                            action: {
                                label: 'View',
                                onClick: () => {
                                    setIsOpen(true)
                                    setIsMinimized(false)
                                }
                            }
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [sessionId, supabase, isOpen])

    const handleStartChat = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!visitorName.trim() || !visitorEmail.trim()) {
            toast.error('Please enter your name and email')
            return
        }

        setIsLoading(true)
        const result = await createChatSession(visitorName, visitorEmail)
        
        if (result.error) {
            toast.error(result.error)
            setIsLoading(false)
            return
        }

        if (result.session) {
            setSessionId(result.session.id)
            setIsRegistered(true)
            
            // Save to localStorage
            localStorage.setItem('chatSessionId', result.session.id)
            localStorage.setItem('chatVisitorName', visitorName)
            localStorage.setItem('chatVisitorEmail', visitorEmail)
            
            toast.success('Chat started! An agent will be with you shortly.')
        }
        setIsLoading(false)
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!newMessage.trim() || !sessionId) return

        setIsSending(true)
        const result = await sendChatMessage(sessionId, newMessage, 'visitor', visitorName)
        
        if (result.error) {
            toast.error(result.error)
        } else {
            setNewMessage('')
        }
        setIsSending(false)
    }

    const handleEndChat = () => {
        localStorage.removeItem('chatSessionId')
        localStorage.removeItem('chatVisitorName')
        localStorage.removeItem('chatVisitorEmail')
        setSessionId(null)
        setIsRegistered(false)
        setMessages([])
        setVisitorName('')
        setVisitorEmail('')
        setIsOpen(false)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center z-50"
            >
                <MessageCircle size={24} />
                {messages.some(m => m.sender_type === 'admin' && !m.is_read) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
                )}
            </button>
        )
    }

    return (
        <div className={`fixed bottom-6 right-6 z-50 transition-all ${isMinimized ? 'w-72' : 'w-80 sm:w-96'}`}>
            <Card className="shadow-2xl border-0 overflow-hidden">
                {/* Header */}
                <CardHeader className="bg-primary text-white p-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle size={20} />
                        <CardTitle className="text-base font-semibold">Live Support</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <Minimize2 size={16} />
                        </button>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </CardHeader>

                {!isMinimized && (
                    <CardContent className="p-0">
                        {!isRegistered ? (
                            // Registration Form
                            <form onSubmit={handleStartChat} className="p-4 space-y-4">
                                <p className="text-sm text-slate-600">
                                    Please provide your details to start chatting with our support team.
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="chat-name">Full Name</Label>
                                    <Input
                                        id="chat-name"
                                        value={visitorName}
                                        onChange={(e) => setVisitorName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="chat-email">Email</Label>
                                    <Input
                                        id="chat-email"
                                        type="email"
                                        value={visitorEmail}
                                        onChange={(e) => setVisitorEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Start Chat'
                                    )}
                                </Button>
                            </form>
                        ) : (
                            // Chat Interface
                            <>
                                {/* Messages */}
                                <div className="h-80 overflow-y-auto p-4 space-y-3 bg-slate-50">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
                                            <MessageCircle size={32} className="mb-2 opacity-50" />
                                            <p>No messages yet</p>
                                            <p>Send a message to start the conversation</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.sender_type === 'visitor' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                                        msg.sender_type === 'visitor'
                                                            ? 'bg-primary text-white rounded-br-md'
                                                            : 'bg-white text-slate-800 shadow-sm border rounded-bl-md'
                                                    }`}
                                                >
                                                    {msg.sender_type === 'admin' && (
                                                        <p className="text-xs text-primary font-medium mb-1">
                                                            {msg.sender_name || 'Support'}
                                                        </p>
                                                    )}
                                                    <p className="text-sm">{msg.message}</p>
                                                    <p className={`text-xs mt-1 ${
                                                        msg.sender_type === 'visitor' ? 'text-white/70' : 'text-slate-400'
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
                                <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1"
                                        disabled={isSending}
                                    />
                                    <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                                        {isSending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                    </Button>
                                </form>

                                {/* End Chat */}
                                <div className="p-2 border-t bg-slate-50">
                                    <button
                                        onClick={handleEndChat}
                                        className="w-full text-xs text-slate-500 hover:text-red-500 transition-colors"
                                    >
                                        End Chat Session
                                    </button>
                                </div>
                            </>
                        )}
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
