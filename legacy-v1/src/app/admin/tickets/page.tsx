'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getAllTickets, getTicketReplies, addTicketReply, updateTicketStatus, updateTicketPriority, type SupportTicket, type TicketReply } from '@/app/actions/tickets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import AdminTabs from '@/components/AdminTabs'
import { Ticket, Send, Loader2, Clock, User, Mail, RefreshCw, Search, Wifi, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react'

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
    const [replies, setReplies] = useState<TicketReply[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [replies])

    const loadTickets = useCallback(async () => {
        const data = await getAllTickets()
        setTickets(data)
        setIsLoading(false)
    }, [])

    useEffect(() => {
        loadTickets()
    }, [loadTickets])

    // Real-time subscription for tickets
    useEffect(() => {
        const channel = supabase
            .channel('admin-tickets')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'support_tickets',
                },
                () => {
                    loadTickets()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, loadTickets])

    // Real-time subscription for replies when ticket is selected
    useEffect(() => {
        if (!selectedTicket) return

        const channel = supabase
            .channel(`admin-ticket-${selectedTicket.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_replies',
                    filter: `ticket_id=eq.${selectedTicket.id}`,
                },
                (payload) => {
                    const newReply = payload.new as TicketReply
                    setReplies(prev => {
                        if (prev.some(r => r.id === newReply.id)) return prev
                        return [...prev, newReply]
                    })
                    
                    if (newReply.sender_type === 'customer') {
                        toast.info('New reply from customer')
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, selectedTicket])

    const handleSelectTicket = async (ticket: SupportTicket) => {
        setSelectedTicket(ticket)
        setIsLoading(true)
        const data = await getTicketReplies(ticket.id)
        setReplies(data)
        setIsLoading(false)
    }

    const handleSendReply = () => {
        if (!newMessage.trim() || !selectedTicket) return

        startTransition(async () => {
            const result = await addTicketReply({
                ticketId: selectedTicket.id,
                message: newMessage,
                senderType: 'admin',
                senderName: 'Support Team'
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                setNewMessage('')
                toast.success('Reply sent and customer notified')
            }
        })
    }

    const handleStatusChange = (status: SupportTicket['status']) => {
        if (!selectedTicket) return

        startTransition(async () => {
            const result = await updateTicketStatus(selectedTicket.id, status)
            if (result.error) {
                toast.error(result.error)
            } else {
                setSelectedTicket({ ...selectedTicket, status })
                toast.success('Status updated')
            }
        })
    }

    const handlePriorityChange = (priority: SupportTicket['priority']) => {
        if (!selectedTicket) return

        startTransition(async () => {
            const result = await updateTicketPriority(selectedTicket.id, priority)
            if (result.error) {
                toast.error(result.error)
            } else {
                setSelectedTicket({ ...selectedTicket, priority })
                toast.success('Priority updated')
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

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length
    }

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
                        <p className="text-slate-500">Manage customer support requests</p>
                    </div>
                    <Button variant="outline" onClick={loadTickets}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                {/* Navigation Tabs */}
                <AdminTabs />

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="glass border-0 shadow-lg">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Total</p>
                                    <p className="text-2xl font-bold text-secondary">{stats.total}</p>
                                </div>
                                <Ticket className="text-slate-400" size={24} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-0 shadow-lg">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Open</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                                </div>
                                <AlertCircle className="text-blue-400" size={24} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-0 shadow-lg">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">In Progress</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                                </div>
                                <Clock className="text-yellow-400" size={24} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-0 shadow-lg">
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Resolved</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                                </div>
                                <CheckCircle className="text-green-400" size={24} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-400px)]">
                    {/* Tickets List */}
                    <Card className="glass border-0 shadow-lg overflow-hidden">
                        <CardHeader className="border-b bg-slate-50/50 space-y-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Ticket size={20} className="text-primary" />
                                Tickets
                            </CardTitle>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search..."
                                        className="pl-8 h-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                                >
                                    <option value="all">All</option>
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </CardHeader>
                        <ScrollArea className="h-[calc(100%-120px)]">
                            <div className="p-2">
                                {filteredTickets.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <Ticket size={40} className="mx-auto mb-3 opacity-50" />
                                        <p>No tickets found</p>
                                    </div>
                                ) : (
                                    filteredTickets.map((ticket) => (
                                        <button
                                            key={ticket.id}
                                            onClick={() => handleSelectTicket(ticket)}
                                            className={`w-full p-3 rounded-lg text-left mb-2 transition-colors ${
                                                selectedTicket?.id === ticket.id
                                                    ? 'bg-primary/10 border border-primary/20'
                                                    : 'hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-mono text-xs text-primary">{ticket.ticket_number}</span>
                                                <Badge variant="outline" className={`text-xs ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <p className="font-medium text-secondary text-sm truncate">{ticket.subject}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <User size={10} />
                                                <span className="truncate">{ticket.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-slate-400">
                                                    {new Date(ticket.updated_at).toLocaleDateString()}
                                                </span>
                                                <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </Badge>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </Card>

                    {/* Ticket Detail & Conversation */}
                    <Card className="lg:col-span-2 glass border-0 shadow-lg overflow-hidden flex flex-col">
                        {selectedTicket ? (
                            <>
                                {/* Header */}
                                <CardHeader className="border-b bg-slate-50/50">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-primary font-bold">{selectedTicket.ticket_number}</span>
                                            </div>
                                            <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <User size={14} />
                                                    {selectedTicket.name}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Mail size={14} />
                                                    {selectedTicket.email}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <select
                                                value={selectedTicket.status}
                                                onChange={(e) => handleStatusChange(e.target.value as any)}
                                                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm"
                                            >
                                                <option value="open">Open</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                            <select
                                                value={selectedTicket.priority}
                                                onChange={(e) => handlePriorityChange(e.target.value as any)}
                                                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm"
                                            >
                                                <option value="low">Low</option>
                                                <option value="normal">Normal</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                        </div>
                                    ) : replies.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                            <MessageSquare size={40} className="mb-2 opacity-50" />
                                            <p>No messages yet</p>
                                        </div>
                                    ) : (
                                        replies.map((reply) => (
                                            <div
                                                key={reply.id}
                                                className={`flex ${reply.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                                        reply.sender_type === 'admin'
                                                            ? 'bg-primary text-white rounded-br-md'
                                                            : 'bg-white text-slate-800 shadow-sm border rounded-bl-md'
                                                    }`}
                                                >
                                                    <p className={`text-xs font-medium mb-1 ${
                                                        reply.sender_type === 'admin' ? 'text-white/80' : 'text-primary'
                                                    }`}>
                                                        {reply.sender_name || (reply.sender_type === 'admin' ? 'Support' : 'Customer')}
                                                    </p>
                                                    <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                                                    <p className={`text-xs mt-1 ${
                                                        reply.sender_type === 'admin' ? 'text-white/60' : 'text-slate-400'
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
                                {selectedTicket.status !== 'closed' && (
                                    <div className="p-4 border-t bg-white">
                                        <div className="flex gap-3">
                                            <Input
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Type your reply..."
                                                className="flex-1"
                                                disabled={isPending}
                                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                                            />
                                            <Button onClick={handleSendReply} disabled={isPending || !newMessage.trim()}>
                                                {isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Send size={18} className="mr-2" />
                                                        Send
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">Customer will be notified by email</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <Ticket size={60} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-lg">Select a ticket</p>
                                    <p className="text-sm">Choose a ticket from the list to view details</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    )
}
