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
    Clock
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

const STATUS_OPTIONS = ['pending', 'in-transit', 'out-for-delivery', 'delivered', 'held']

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
            const result = await logShipmentEvent(
                selectedShipment.id,
                { status: eventStatus, location: eventLocation, note: eventNote },
                notifyUser
            )
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Event logged${notifyUser ? ' & user notified (mock)' : ''}`)
                setLogEventDialogOpen(false)
                setEventLocation('')
                setEventNote('')
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

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'delivered': return 'border-green-500 text-green-600 bg-green-50'
            case 'in-transit': return 'border-blue-500 text-blue-600 bg-blue-50'
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
                                                    <Link href={`/track/${shipment.tracking_number}`} className="font-mono font-bold text-primary hover:underline">
                                                        {shipment.tracking_number}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="font-medium text-secondary">{(shipment.sender_info as any)?.name || 'N/A'}</p>
                                                        <p className="text-slate-500">→ {(shipment.receiver_info as any)?.name || 'N/A'}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {shipment.status === 'pending' && !shipment.price ? (
                                                        <Button
                                                            size="sm"
                                                            className="bg-orange-500 hover:bg-orange-600 text-white border-0"
                                                            onClick={() => {
                                                                setReviewShipmentId(shipment.id)
                                                                setPricingDialogOpen(true)
                                                            }}
                                                        >
                                                            Review
                                                        </Button>
                                                    ) : (
                                                        <Badge variant="outline" className={`uppercase font-medium ${getStatusColor(shipment.status)}`}>
                                                            {shipment.status === 'pending' && shipment.price ? 'AWAITING PAYMENT' : shipment.status}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleTogglePayment(shipment)}
                                                        className={shipment.payment_status === 'paid' ? 'text-green-600 hover:text-green-700' : 'text-yellow-600 hover:text-yellow-700'}
                                                        disabled={isPending}
                                                    >
                                                        <DollarSign size={16} className="mr-1" />
                                                        {shipment.payment_status}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-slate-500 truncate max-w-[150px]">
                                                            {shipment.current_location || '—'}
                                                        </span>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={() => {
                                                            setSelectedShipment(shipment)
                                                            setNewLocation(shipment.current_location || '')
                                                            setLocationDialogOpen(true)
                                                        }}>
                                                            <MapPin size={14} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500">
                                                    {shipment.created_at ? new Date(shipment.created_at).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" className="border-slate-200" onClick={() => {
                                                        setSelectedShipment(shipment)
                                                        setEventStatus(shipment.status || 'in-transit')
                                                        setEventLocation(shipment.current_location || '')
                                                        setLogEventDialogOpen(true)
                                                    }}>
                                                        <FileText size={14} className="mr-1" />
                                                        Log Event
                                                    </Button>
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
            </main>
        </div >
    )
}
