'use client'

import { useState, useEffect, useTransition } from 'react'
import { getAllShipments, togglePaymentStatus, logShipmentEvent, updateShipment } from './actions'
import { createShipment, ShipmentFormData } from '@/app/actions/shipment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import Navbar from '@/components/layout/Navbar'
import {
    Search,
    RefreshCw,
    DollarSign,
    MapPin,
    Plus,
    FileText,
    Bell,
    Loader2,
    Package,
    Truck,
    CheckCircle,
    Clock,
    User,
    Mail,
    Eye,
    Trash2
} from 'lucide-react'
import Link from 'next/link'

type Shipment = {
    id: string
    tracking_number: string | null
    sender_info: any
    receiver_info: any
    parcel_details: any
    status: string | null
    payment_status: string | null
    current_location: string | null
    history: any[] | null
    created_at: string | null
    price?: number | null
}

const STATUS_OPTIONS = ['pending', 'accepted', 'in-transit', 'out-for-delivery', 'delivered', 'held']

export default function AdminPage() {
    const [shipments, setShipments] = useState<Shipment[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isPending, startTransition] = useTransition()
    const [isLoading, setIsLoading] = useState(true)

    // Log Event Dialog State
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
    const [logEventDialogOpen, setLogEventDialogOpen] = useState(false)
    const [eventStatus, setEventStatus] = useState('in-transit')
    const [eventLocation, setEventLocation] = useState('')
    const [eventNote, setEventNote] = useState('')
    const [eventMapLink, setEventMapLink] = useState('')
    const [notifyUser, setNotifyUser] = useState(false)

    // Create Shipment Dialog State
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [newShipment, setNewShipment] = useState<ShipmentFormData>({
        sender_name: '',
        sender_email: '',
        sender_address: '',
        receiver_name: '',
        receiver_email: '',
        receiver_address: '',
        parcel_description: '',
        parcel_weight: '',
    })

    // Location Update Dialog State
    // Location Update Dialog State
    const [locationDialogOpen, setLocationDialogOpen] = useState(false)
    const [newLocation, setNewLocation] = useState('')

    // Review/Pricing Dialog State
    const [pricingDialogOpen, setPricingDialogOpen] = useState(false)
    const [price, setPrice] = useState('')
    const [reviewShipmentId, setReviewShipmentId] = useState<string | null>(null)

    // Dispatch Dialog State
    const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false)
    const [originLocation, setOriginLocation] = useState('Lagos Logistics Center')

    // Payment Confirmation State
    const [confirmPaymentDialogOpen, setConfirmPaymentDialogOpen] = useState(false)

    // Shipment Details Modal State
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [detailsShipment, setDetailsShipment] = useState<Shipment | null>(null)

    const fetchShipments = async () => {
        setIsLoading(true)
        const data = await getAllShipments()
        setShipments(data as Shipment[])
        setIsLoading(false)
    }

    useEffect(() => {
        fetchShipments()
    }, [])

    const filteredShipments = shipments.filter(s =>
        s.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.receiver_info as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.sender_info as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Stats
    const stats = {
        total: shipments.length,
        delivered: shipments.filter(s => s.status === 'delivered').length,
        active: shipments.filter(s => ['in-transit', 'out-for-delivery', 'pending'].includes(s.status || '')).length,
        paid: shipments.filter(s => s.payment_status === 'paid').length
    }

    const handleTogglePayment = (shipment: Shipment) => {
        startTransition(async () => {
            const result = await togglePaymentStatus(shipment.id, shipment.payment_status || 'unpaid')
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Payment status updated')
                fetchShipments()
            }
        })
    }

    const handleLogEvent = () => {
        if (!selectedShipment) return
        startTransition(async () => {
            // Combine note and map link if provided
            let fullNote = eventNote
            if (eventMapLink) {
                fullNote = fullNote ? `${fullNote} | Map: ${eventMapLink}` : `Map: ${eventMapLink}`
            }
            const result = await logShipmentEvent(
                selectedShipment.id,
                { status: eventStatus, location: eventLocation, note: fullNote },
                notifyUser
            )
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Status updated${notifyUser ? ' & user notified' : ''}`)
                setLogEventDialogOpen(false)
                setEventLocation('')
                setEventNote('')
                setEventMapLink('')
                setNotifyUser(false)
                fetchShipments()
            }
        })
    }

    const handleUpdateLocation = () => {
        if (!selectedShipment || !newLocation) return
        startTransition(async () => {
            const result = await updateShipment(selectedShipment.id, { current_location: newLocation })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Location updated')
                setLocationDialogOpen(false)
                setNewLocation('')
                fetchShipments()
            }
        })
    }

    const handleApproveShipment = () => {
        if (!reviewShipmentId || !price) return
        startTransition(async () => {
            const result = await updateShipment(reviewShipmentId, {
                status: 'pending', // Keep as pending until paid, or move to another valid status like 'processing'
                payment_status: 'unpaid', // Ensure payment status is set
                price: parseFloat(price)
            })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Shipment approved and price set')
                setPricingDialogOpen(false)
                setPrice('')
                setReviewShipmentId(null)
                fetchShipments()
            }
        })
    }

    const handleCreateShipment = () => {
        startTransition(async () => {
            const result = await createShipment(newShipment)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Shipment created! ID: ${result.tracking_number}`)
                setCreateDialogOpen(false)
                setNewShipment({
                    sender_name: '',
                    sender_email: '',
                    sender_address: '',
                    receiver_name: '',
                    receiver_email: '',
                    receiver_address: '',
                    parcel_description: '',
                    parcel_weight: '',
                })
                fetchShipments()
            }
        })
    }

    const handleConfirmPayment = () => {
        if (!selectedShipment) return
        startTransition(async () => {
            // Update payment status to paid AND status to accepted
            const result = await updateShipment(selectedShipment.id, {
                payment_status: 'paid',
                status: 'accepted'
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Payment confirmed! Status: Accepted')
                setConfirmPaymentDialogOpen(false)
                fetchShipments()
            }
        })
    }

    const handleDispatch = () => {
        if (!selectedShipment || !originLocation) return
        startTransition(async () => {
            // 1. Update status to in-transit
            // 2. Set current location to origin
            // 3. Log the initial scan event
            const updateResult = await updateShipment(selectedShipment.id, {
                status: 'in-transit',
                current_location: originLocation
            })

            if (updateResult.error) {
                toast.error(updateResult.error)
                return
            }

            await logShipmentEvent(selectedShipment.id, {
                status: 'in-transit',
                location: originLocation,
                note: 'Shipment dispatched from origin facility'
            }, true)

            toast.success('Shipment dispatched successfully')
            setDispatchDialogOpen(false)
            fetchShipments()
        })
    }

    const renderSmartAction = (shipment: Shipment) => {
        // 1. Review Needed
        if (shipment.status === 'pending' && !shipment.price) {
            return (
                <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                    onClick={() => {
                        setReviewShipmentId(shipment.id)
                        setPricingDialogOpen(true)
                    }}
                >
                    Review & Quote
                </Button>
            )
        }

        // 2. Payment Confirmation Needed
        if (shipment.status === 'pending' && shipment.price && shipment.payment_status !== 'paid') {
            return (
                <Button
                    size="sm"
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-50 w-full"
                    onClick={() => {
                        setSelectedShipment(shipment)
                        setConfirmPaymentDialogOpen(true)
                    }}
                >
                    <DollarSign size={14} className="mr-1" />
                    Confirm Payment
                </Button>
            )
        }

        // 3. Ready to Dispatch (Accepted status)
        if (shipment.status === 'accepted') {
            return (
                <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    onClick={() => {
                        setSelectedShipment(shipment)
                        setDispatchDialogOpen(true)
                    }}
                >
                    <Truck size={14} className="mr-1" />
                    Dispatch
                </Button>
            )
        }

        // 4. In Transit -> Update Status
        if (shipment.status === 'in-transit' || shipment.status === 'out-for-delivery') {
            return (
                <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                        setSelectedShipment(shipment)
                        setEventStatus(shipment.status || 'in-transit')
                        setEventLocation(shipment.current_location || '')
                        setEventMapLink('')
                        setLogEventDialogOpen(true)
                    }}
                >
                    <FileText size={14} className="mr-1" />
                    Update Status
                </Button>
            )
        }

        // Default / Fallback
        return (
            <Button
                size="sm"
                variant="ghost"
                className="w-full text-slate-500"
                onClick={() => {
                    setSelectedShipment(shipment)
                    setEventStatus(shipment.status || 'in-transit')
                    setEventLocation(shipment.current_location || '')
                    setLogEventDialogOpen(true)
                }}
            >
                View / Edit
            </Button>
        )
    }

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'delivered': return 'border-green-500 text-green-600 bg-green-50'
            case 'in-transit': return 'border-blue-500 text-blue-600 bg-blue-50'
            case 'accepted': return 'border-purple-500 text-purple-600 bg-purple-50'
            case 'out-for-delivery': return 'border-yellow-500 text-yellow-600 bg-yellow-50'
            case 'held': return 'border-red-500 text-red-600 bg-red-50'
            default: return 'border-slate-500 text-slate-600 bg-slate-50'
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground relative">
            {/* Background Decorative */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">Admin Dashboard</h1>
                        <p className="text-slate-500">Manage deliveries, update statuses, and track shipments.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchShipments} disabled={isLoading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg shadow-primary/20">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Shipment
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Package className="text-primary" />
                                        Create New Shipment
                                    </DialogTitle>
                                    <DialogDescription>
                                        Fill in the details below to create a new shipment.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                    <div className="space-y-3">
                                        <h3 className="font-semibold border-b pb-2">Sender</h3>
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input value={newShipment.sender_name} onChange={(e) => setNewShipment(p => ({ ...p, sender_name: e.target.value }))} placeholder="Sender Name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={newShipment.sender_email} onChange={(e) => setNewShipment(p => ({ ...p, sender_email: e.target.value }))} placeholder="Sender Email" type="email" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Address</Label>
                                            <Input value={newShipment.sender_address} onChange={(e) => setNewShipment(p => ({ ...p, sender_address: e.target.value }))} placeholder="Sender Address" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="font-semibold border-b pb-2">Receiver</h3>
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input value={newShipment.receiver_name} onChange={(e) => setNewShipment(p => ({ ...p, receiver_name: e.target.value }))} placeholder="Receiver Name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={newShipment.receiver_email} onChange={(e) => setNewShipment(p => ({ ...p, receiver_email: e.target.value }))} placeholder="Receiver Email" type="email" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Address</Label>
                                            <Input value={newShipment.receiver_address} onChange={(e) => setNewShipment(p => ({ ...p, receiver_address: e.target.value }))} placeholder="Receiver Address" />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <h3 className="font-semibold border-b pb-2">Parcel</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Weight (kg)</Label>
                                                <Input value={newShipment.parcel_weight} onChange={(e) => setNewShipment(p => ({ ...p, parcel_weight: e.target.value }))} placeholder="e.g. 2.5" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Description</Label>
                                                <Input value={newShipment.parcel_description} onChange={(e) => setNewShipment(p => ({ ...p, parcel_description: e.target.value }))} placeholder="e.g. Electronics" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button onClick={handleCreateShipment} disabled={isPending}>
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                        Create
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="glass border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Total Shipments</CardTitle>
                            <Package className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-secondary">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Active Deliveries</CardTitle>
                            <Truck className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Delivered</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">{stats.delivered}</div>
                        </CardContent>
                    </Card>
                    <Card className="glass border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Paid Orders</CardTitle>
                            <DollarSign className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-secondary">{stats.paid}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Controls & Data Table */}
                <Card className="glass border-0 shadow-lg overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-secondary">All Shipments</CardTitle>
                                <CardDescription className="text-slate-500">
                                    {filteredShipments.length} shipments found
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by ID, sender, or receiver..."
                                    className="pl-9 w-full sm:w-[300px] bg-white border-slate-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[500px]">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-slate-100 hover:bg-slate-50">
                                        <TableHead className="text-slate-500 font-semibold">Tracking ID</TableHead>
                                        <TableHead className="text-slate-500 font-semibold">Sender / Receiver</TableHead>
                                        <TableHead className="text-slate-500 font-semibold">Status</TableHead>
                                        <TableHead className="text-slate-500 font-semibold">Payment</TableHead>
                                        <TableHead className="text-slate-500 font-semibold">Location</TableHead>
                                        <TableHead className="text-slate-500 font-semibold">Created</TableHead>
                                        <TableHead className="text-right text-slate-500 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-20">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredShipments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                                                No shipments found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredShipments.map((shipment) => (
                                            <TableRow key={shipment.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <TableCell>
                                                    <button
                                                        onClick={() => {
                                                            setDetailsShipment(shipment)
                                                            setDetailsModalOpen(true)
                                                        }}
                                                        className="font-mono font-bold text-primary hover:underline cursor-pointer"
                                                    >
                                                        {shipment.tracking_number}
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="font-medium text-secondary">{(shipment.sender_info as any)?.name || 'N/A'}</p>
                                                        <p className="text-slate-500">→ {(shipment.receiver_info as any)?.name || 'N/A'}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div
                                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => {
                                                            setSelectedShipment(shipment)
                                                            setEventStatus(shipment.status || 'in-transit')
                                                            setEventLocation(shipment.current_location || '')
                                                            setLogEventDialogOpen(true)
                                                        }}
                                                    >
                                                        <Badge variant="outline" className={`uppercase font-medium ${getStatusColor(shipment.status)}`}>
                                                            {shipment.status === 'pending' && shipment.price ? 'AWAITING PAYMENT' : shipment.status}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${shipment.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        <DollarSign size={12} className="mr-1" />
                                                        {shipment.payment_status}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => {
                                                        setSelectedShipment(shipment)
                                                        setNewLocation(shipment.current_location || '')
                                                        setLocationDialogOpen(true)
                                                    }}>
                                                        <span className="text-sm text-slate-500 truncate max-w-[150px] group-hover:text-primary transition-colors">
                                                            {shipment.current_location || '—'}
                                                        </span>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 group-hover:text-primary">
                                                            <MapPin size={14} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500">
                                                    {shipment.created_at ? new Date(shipment.created_at).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {renderSmartAction(shipment)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Log Event Dialog */}
                <Dialog open={logEventDialogOpen} onOpenChange={setLogEventDialogOpen}>
                    <DialogContent className="glass border-0 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-secondary">Log Shipment Event</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Record a new status update for shipment {selectedShipment?.tracking_number}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-slate-500">Status</Label>
                                <select
                                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={eventStatus}
                                    onChange={(e) => setEventStatus(e.target.value)}
                                >
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-500">Location</Label>
                                <Input
                                    placeholder="e.g. Lagos Distribution Center"
                                    value={eventLocation}
                                    onChange={(e) => setEventLocation(e.target.value)}
                                    className="bg-white/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-500">Note (Optional)</Label>
                                <Input
                                    placeholder="Add any relevant notes..."
                                    value={eventNote}
                                    onChange={(e) => setEventNote(e.target.value)}
                                    className="bg-white/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-500">Map Link (Optional)</Label>
                                <Input
                                    placeholder="Paste Google Maps or location URL..."
                                    value={eventMapLink}
                                    onChange={(e) => setEventMapLink(e.target.value)}
                                    className="bg-white/50"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="notifyUser"
                                    checked={notifyUser}
                                    onChange={(e) => setNotifyUser(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="notifyUser" className="flex items-center gap-2 cursor-pointer text-slate-600">
                                    <Bell size={16} className="text-primary" />
                                    Notify User (mock email)
                                </Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" className="border-slate-200">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleLogEvent} disabled={isPending || !eventLocation} className="bg-primary hover:bg-primary/90 text-white rounded-full">
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Log Event
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dispatch Dialog */}
                <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
                    <DialogContent className="glass border-0 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-secondary flex items-center gap-2">
                                <Truck className="text-primary" />
                                Dispatch Shipment
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Start the journey for shipment {selectedShipment?.tracking_number}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-sm text-primary font-medium">This action will:</p>
                                <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
                                    <li>Set status to <strong>In-Transit</strong></li>
                                    <li>Mark current location as Origin</li>
                                    <li>Notify the customer (Mock)</li>
                                </ul>
                            </div>
                            <div>
                                <Label className="text-slate-500">Origin Location</Label>
                                <Input
                                    className="mt-2 bg-white/50"
                                    placeholder="e.g. Lagos Logistics Center"
                                    value={originLocation}
                                    onChange={(e) => setOriginLocation(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" className="border-slate-200">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleDispatch} disabled={isPending || !originLocation} className="bg-primary hover:bg-primary/90 text-white rounded-full">
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Dispatch Now
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Confirm Payment Dialog */}
                <Dialog open={confirmPaymentDialogOpen} onOpenChange={setConfirmPaymentDialogOpen}>
                    <DialogContent className="glass border-0 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-secondary flex items-center gap-2">
                                <DollarSign className="text-green-600" />
                                Confirm Payment
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Verify payment for shipment {selectedShipment?.tracking_number}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-slate-500">Amount Due</span>
                                <span className="text-2xl font-bold text-secondary">${selectedShipment?.price?.toFixed(2)}</span>
                            </div>
                            <p className="text-slate-500 text-sm">
                                By confirming, the shipment status will move to <strong>Processing</strong> and become ready for dispatch.
                            </p>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" className="border-slate-200">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleConfirmPayment} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white rounded-full">
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Confirm Received
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Update Location Dialog */}
                <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                    <DialogContent className="glass border-0 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-secondary">Update Location</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Update the current location for {selectedShipment?.tracking_number}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label className="text-slate-500">Current Location</Label>
                            <Input
                                className="mt-2 bg-white/50"
                                placeholder="e.g. Abuja Sorting Facility"
                                value={newLocation}
                                onChange={(e) => setNewLocation(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" className="border-slate-200">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleUpdateLocation} disabled={isPending || !newLocation} className="bg-primary hover:bg-primary/90 text-white rounded-full">
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Update
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Pricing / Review Dialog */}
                <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
                    <DialogContent className="glass border-0 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-secondary">Review Shipment</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Set the price and approve this shipment request.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label className="text-slate-500">Shipping Cost ($)</Label>
                            <Input
                                type="number"
                                className="mt-2 bg-white/50"
                                placeholder="e.g. 50.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" className="border-slate-200">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleApproveShipment} disabled={isPending || !price} className="bg-primary hover:bg-primary/90 text-white rounded-full">
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Approve & Set Price
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Shipment Details Modal */}
                <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                    <DialogContent className="glass border-0 shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-secondary flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Shipment Details
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Tracking ID: <span className="font-mono font-bold text-primary">{detailsShipment?.tracking_number}</span>
                            </DialogDescription>
                        </DialogHeader>

                        {detailsShipment && (
                            <div className="space-y-6 py-4">
                                {/* Status & Payment */}
                                <div className="flex gap-4">
                                    <div className="flex-1 p-4 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400 uppercase font-medium">Status</p>
                                        <Badge variant="outline" className={`mt-1 uppercase font-medium ${getStatusColor(detailsShipment.status)}`}>
                                            {detailsShipment.status}
                                        </Badge>
                                    </div>
                                    <div className="flex-1 p-4 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400 uppercase font-medium">Payment</p>
                                        <Badge className={`mt-1 ${detailsShipment.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {detailsShipment.payment_status}
                                        </Badge>
                                    </div>
                                    <div className="flex-1 p-4 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400 uppercase font-medium">Price</p>
                                        <p className="mt-1 font-bold text-lg">${detailsShipment.price?.toFixed(2) || '—'}</p>
                                    </div>
                                </div>

                                {/* Sender Info */}
                                <div className="p-4 border border-slate-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-secondary flex items-center gap-2">
                                            <User size={16} /> Sender Information
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-primary"
                                            onClick={() => {
                                                const email = (detailsShipment.sender_info as any)?.email
                                                if (email) window.location.href = `mailto:${email}`
                                            }}
                                        >
                                            <Mail size={14} className="mr-1" /> Email
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-slate-400">Name</p>
                                            <p className="font-medium">{(detailsShipment.sender_info as any)?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Email</p>
                                            <p className="font-medium">{(detailsShipment.sender_info as any)?.email || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-slate-400">Address</p>
                                            <p className="font-medium">{(detailsShipment.sender_info as any)?.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Receiver Info */}
                                <div className="p-4 border border-slate-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-secondary flex items-center gap-2">
                                            <User size={16} /> Receiver Information
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-primary"
                                            onClick={() => {
                                                const email = (detailsShipment.receiver_info as any)?.email
                                                if (email) window.location.href = `mailto:${email}`
                                            }}
                                        >
                                            <Mail size={14} className="mr-1" /> Email
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-slate-400">Name</p>
                                            <p className="font-medium">{(detailsShipment.receiver_info as any)?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Email</p>
                                            <p className="font-medium">{(detailsShipment.receiver_info as any)?.email || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-slate-400">Address</p>
                                            <p className="font-medium">{(detailsShipment.receiver_info as any)?.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Parcel Details */}
                                <div className="p-4 border border-slate-200 rounded-lg">
                                    <h4 className="font-semibold text-secondary flex items-center gap-2 mb-3">
                                        <Package size={16} /> Parcel Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-slate-400">Description</p>
                                            <p className="font-medium">{(detailsShipment.parcel_details as any)?.description || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Weight</p>
                                            <p className="font-medium">{(detailsShipment.parcel_details as any)?.weight || 'N/A'} kg</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Current Location</p>
                                            <p className="font-medium">{detailsShipment.current_location || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Created</p>
                                            <p className="font-medium">{detailsShipment.created_at ? new Date(detailsShipment.created_at).toLocaleString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`/track/${detailsShipment.tracking_number}`, '_blank')}
                                    >
                                        <Eye size={14} className="mr-1" /> View Tracking
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setDetailsModalOpen(false)
                                            setSelectedShipment(detailsShipment)
                                            setEventStatus(detailsShipment.status || 'pending')
                                            setEventLocation(detailsShipment.current_location || '')
                                            setLogEventDialogOpen(true)
                                        }}
                                    >
                                        <FileText size={14} className="mr-1" /> Update Status
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={async () => {
                                            if (confirm('Are you sure you want to delete this shipment? This action cannot be undone.')) {
                                                toast.info('Delete functionality coming soon')
                                                // TODO: Implement delete action
                                            }
                                        }}
                                    >
                                        <Trash2 size={14} className="mr-1" /> Delete
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </main>
        </div >
    )
}
