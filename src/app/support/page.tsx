'use client'

import { useState, useEffect, useTransition } from 'react'
import { createTicket, getUserTickets, type SupportTicket } from '@/app/actions/tickets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { Ticket, Plus, Clock, CheckCircle, Loader2, ArrowRight, HelpCircle, MessageSquare } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog'

export default function SupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    
    // Form state
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')

    const loadTickets = async () => {
        setIsLoading(true)
        const data = await getUserTickets()
        setTickets(data)
        setIsLoading(false)
    }

    useEffect(() => {
        loadTickets()
    }, [])

    const handleCreateTicket = () => {
        if (!name || !email || !subject || !message) {
            toast.error('Please fill in all fields')
            return
        }

        startTransition(async () => {
            const result = await createTicket({ name, email, subject, message, priority })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Ticket created! ID: ${result.ticket?.ticket_number}`)
                setCreateDialogOpen(false)
                setName('')
                setEmail('')
                setSubject('')
                setMessage('')
                setPriority('normal')
                loadTickets()
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
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-secondary">Support Center</h1>
                            <p className="text-slate-500">Get help with your shipments and account</p>
                        </div>
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Ticket
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Ticket className="text-primary" />
                                        Create Support Ticket
                                    </DialogTitle>
                                    <DialogDescription>
                                        Describe your issue and our team will respond as soon as possible.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Your Name</Label>
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Brief description of your issue"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Priority</Label>
                                        <select
                                            id="priority"
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as any)}
                                            className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                                        >
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <textarea
                                            id="message"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Please describe your issue in detail..."
                                            className="w-full min-h-[120px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm resize-none"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button onClick={handleCreateTicket} disabled={isPending}>
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                        Create Ticket
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Quick Help Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card className="glass border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCreateDialogOpen(true)}>
                            <CardContent className="pt-6 text-center">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                                    <HelpCircle className="text-primary" size={24} />
                                </div>
                                <h3 className="font-semibold text-secondary mb-1">Need Help?</h3>
                                <p className="text-sm text-slate-500">Create a support ticket</p>
                            </CardContent>
                        </Card>
                        <Card className="glass border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <Link href="/#services">
                                <CardContent className="pt-6 text-center">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                                        <MessageSquare className="text-blue-600" size={24} />
                                    </div>
                                    <h3 className="font-semibold text-secondary mb-1">FAQs</h3>
                                    <p className="text-sm text-slate-500">Find quick answers</p>
                                </CardContent>
                            </Link>
                        </Card>
                        <Card className="glass border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <Link href="/">
                                <CardContent className="pt-6 text-center">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="text-green-600" size={24} />
                                    </div>
                                    <h3 className="font-semibold text-secondary mb-1">Track Package</h3>
                                    <p className="text-sm text-slate-500">Check shipment status</p>
                                </CardContent>
                            </Link>
                        </Card>
                    </div>

                    {/* Tickets List */}
                    <Card className="glass border-0 shadow-lg">
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="flex items-center gap-2">
                                <Ticket className="text-primary" size={20} />
                                My Tickets
                            </CardTitle>
                            <CardDescription>
                                {tickets.length === 0 ? 'No tickets yet' : `${tickets.length} ticket(s)`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="py-20 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="py-20 text-center">
                                    <Ticket size={48} className="mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-500 mb-4">You haven't created any support tickets yet</p>
                                    <Button onClick={() => setCreateDialogOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Your First Ticket
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {tickets.map((ticket) => (
                                        <Link 
                                            key={ticket.id} 
                                            href={`/support/${ticket.id}`}
                                            className="block p-4 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono text-sm text-primary font-medium">
                                                            {ticket.ticket_number}
                                                        </span>
                                                        <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                                            {ticket.status.replace('_', ' ')}
                                                        </Badge>
                                                        <Badge variant="secondary" className={getPriorityColor(ticket.priority)}>
                                                            {ticket.priority}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="font-medium text-secondary truncate">{ticket.subject}</h3>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {new Date(ticket.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ArrowRight className="text-slate-400 flex-shrink-0" size={20} />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
