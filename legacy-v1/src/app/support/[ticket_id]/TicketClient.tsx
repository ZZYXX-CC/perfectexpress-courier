'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { addTicketReply, type SupportTicket, type TicketReply } from '@/app/actions/tickets'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2, Clock, User, Ticket, MessageSquare } from 'lucide-react'

interface TicketClientProps {
    ticket: SupportTicket
    initialReplies: TicketReply[]
}

export default function TicketClient({ ticket, initialReplies }: TicketClientProps) {
    const [replies, setReplies] = useState<TicketReply[]>(initialReplies)
    const [newMessage, setNewMessage] = useState('')
    const [isPending, startTransition] = useTransition()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [replies])

    // Real-time subscription for new replies
    useEffect(() => {
        const channel = supabase
            .channel(`ticket-${ticket.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_replies',
                    filter: `ticket_id=eq.${ticket.id}`,
                },
                (payload) => {
                    const newReply = payload.new as TicketReply
                    setReplies(prev => {
                        if (prev.some(r => r.id === newReply.id)) return prev
                        return [...prev, newReply]
                    })
                    
                    if (newReply.sender_type === 'admin') {
                        toast.success('New reply from support!')
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, ticket.id])

    const handleSendReply = () => {
        if (!newMessage.trim()) return

        startTransition(async () => {
            const result = await addTicketReply({
                ticketId: ticket.id,
                message: newMessage,
                senderType: 'customer',
                senderName: ticket.name
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                setNewMessage('')
            }
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'resolved': return 'bg-green-100 text-green-700 border-green-200'
            case 'closed': return 'bg-slate-100 text-slate-700 border-slate-200'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700'
            case 'high': return 'bg-orange-100 text-orange-700'
            case 'normal': return 'bg-slate-100 text-slate-700'
            case 'low': return 'bg-slate-50 text-slate-500'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20">
                <div className="max-w-3xl mx-auto">
                    <Link href="/support" className="inline-flex items-center text-slate-500 hover:text-primary transition-colors mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Support
                    </Link>

                    {/* Ticket Header */}
                    <Card className="glass border-0 shadow-lg mb-6">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Ticket className="text-primary" size={20} />
                                        <span className="font-mono text-primary font-bold">{ticket.ticket_number}</span>
                                    </div>
                                    <CardTitle className="text-xl text-secondary">{ticket.subject}</CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                        {ticket.status.replace('_', ' ')}
                                    </Badge>
                                    <Badge variant="secondary" className={getPriorityColor(ticket.priority)}>
                                        {ticket.priority}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <User size={14} />
                                    {ticket.name}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={14} />
                                    Created {new Date(ticket.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Conversation */}
                    <Card className="glass border-0 shadow-lg">
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageSquare size={20} className="text-primary" />
                                Conversation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Messages */}
                            <div className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 space-y-4">
                                {replies.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
                                        <p>No messages yet</p>
                                    </div>
                                ) : (
                                    replies.map((reply) => (
                                        <div
                                            key={reply.id}
                                            className={`flex ${reply.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                                    reply.sender_type === 'customer'
                                                        ? 'bg-primary text-white rounded-br-md'
                                                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-medium ${
                                                        reply.sender_type === 'customer' ? 'text-white/80' : 'text-primary'
                                                    }`}>
                                                        {reply.sender_type === 'admin' ? 'Support Team' : reply.sender_name || 'You'}
                                                    </span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                                                <p className={`text-xs mt-2 ${
                                                    reply.sender_type === 'customer' ? 'text-white/60' : 'text-slate-400'
                                                }`}>
                                                    {new Date(reply.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Input */}
                            {ticket.status !== 'closed' && (
                                <div className="p-4 border-t bg-slate-50">
                                    <div className="flex gap-3">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your reply..."
                                            className="flex-1 min-h-[80px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                            disabled={isPending}
                                        />
                                    </div>
                                    <div className="flex justify-end mt-3">
                                        <Button onClick={handleSendReply} disabled={isPending || !newMessage.trim()}>
                                            {isPending ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="mr-2 h-4 w-4" />
                                            )}
                                            Send Reply
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {ticket.status === 'closed' && (
                                <div className="p-4 border-t bg-slate-100 text-center text-slate-500">
                                    <p>This ticket has been closed. Create a new ticket if you need further assistance.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
