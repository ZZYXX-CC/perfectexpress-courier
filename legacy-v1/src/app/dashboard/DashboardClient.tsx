'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { Package, Truck, CheckCircle, Clock, Plus, Eye, MapPin, Calendar, DollarSign, CreditCard, User, Mail, Wifi } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useRealtimeShipments } from '@/hooks/useRealtimeShipments'

type Shipment = {
    id: string
    tracking_number: string | null
    sender_info: any
    receiver_info: any
    parcel_details: any
    status: string | null
    payment_status: string | null
    current_location: string | null
    history: any
    created_at: string | null
    price?: number | null
    user_id?: string | null
}

export default function DashboardClient({ user, profile, shipments: initialShipments }: { user: any, profile: any, shipments: Shipment[] }) {
    const [shipments, setShipments] = useState<Shipment[]>(initialShipments)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [detailsShipment, setDetailsShipment] = useState<Shipment | null>(null)

    // Real-time update handlers - only for this user's shipments
    const handleRealtimeInsert = useCallback((newShipment: Shipment) => {
        if (newShipment.user_id === user.id) {
            setShipments(prev => [newShipment, ...prev])
        }
    }, [user.id])

    const handleRealtimeUpdate = useCallback((updatedShipment: Shipment) => {
        setShipments(prev => prev.map(s => 
            s.id === updatedShipment.id ? updatedShipment : s
        ))
        // Update details modal if open
        if (detailsShipment?.id === updatedShipment.id) {
            setDetailsShipment(updatedShipment)
        }
    }, [detailsShipment?.id])

    // Subscribe to real-time updates for this user's shipments
    useRealtimeShipments({
        onInsert: handleRealtimeInsert,
        onUpdate: handleRealtimeUpdate,
        showToasts: true,
        filter: { column: 'user_id', value: user.id }
    })

    const stats = useMemo(() => ({
        total: shipments.length,
        delivered: shipments.filter(s => s.status === 'delivered').length,
        active: shipments.filter(s => ['in-transit', 'out-for-delivery', 'pending', 'accepted'].includes(s.status || '')).length,
    }), [shipments])

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'delivered': return 'border-green-500 text-green-600 bg-green-50'
            case 'in-transit': return 'border-blue-500 text-blue-600 bg-blue-50'
            case 'out-for-delivery': return 'border-yellow-500 text-yellow-600 bg-yellow-50'
            case 'held': return 'border-red-500 text-red-600 bg-red-50'
            case 'accepted': return 'border-purple-500 text-purple-600 bg-purple-50'
            default: return 'border-slate-500 text-slate-600 bg-slate-50'
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-secondary">
                                Welcome, {profile?.full_name || user.email}
                            </h1>
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                <Wifi size={12} className="animate-pulse" />
                                Live
                            </span>
                        </div>
                        <p className="text-slate-500">Manage and track your shipments</p>
                    </div>
                    <Link href="/ship">
                        <Button className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" />
                            New Shipment
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
                            <CardTitle className="text-sm font-medium text-slate-500">Active</CardTitle>
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
                </div>

                {/* Shipments Table */}
                <Card className="glass border-0 shadow-lg overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                        <CardTitle className="text-secondary">Your Shipments</CardTitle>
                        <CardDescription className="text-slate-500">
                            {shipments.length === 0 ? 'No shipments yet' : `${shipments.length} shipment(s)`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {shipments.length === 0 ? (
                            <div className="py-20 text-center">
                                <Package className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 mb-4">You haven't created any shipments yet</p>
                                <Link href="/ship">
                                    <Button>Create Your First Shipment</Button>
                                </Link>
                            </div>
                        ) : (
                            <ScrollArea className="h-[400px]">
                                {/* Mobile/Tablet View: Cards */}
                                <div className="lg:hidden space-y-4 p-4">
                                    {shipments.map((shipment) => (
                                        <div key={shipment.id} className="bg-white rounded-lg border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Tracking Number</p>
                                                    <button
                                                        onClick={() => {
                                                            setDetailsShipment(shipment)
                                                            setDetailsModalOpen(true)
                                                        }}
                                                        className="font-mono font-bold text-primary hover:underline text-sm"
                                                    >
                                                        {shipment.tracking_number}
                                                    </button>
                                                </div>
                                                <Badge variant="outline" className={`uppercase font-medium text-xs ${getStatusColor(shipment.status)}`}>
                                                    {shipment.status}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Recipient</p>
                                                    <p className="text-sm font-medium text-secondary truncate">
                                                        {shipment.receiver_info?.name || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Date</p>
                                                    <p className="text-sm font-medium text-secondary">
                                                        {shipment.created_at ? new Date(shipment.created_at).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-slate-50 flex justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full sm:w-auto"
                                                    onClick={() => {
                                                        setDetailsShipment(shipment)
                                                        setDetailsModalOpen(true)
                                                    }}
                                                >
                                                    <Eye size={14} className="mr-2" />
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View: Table */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow className="border-slate-100">
                                                <TableHead className="text-slate-500 font-semibold min-w-[120px]">Tracking ID</TableHead>
                                                <TableHead className="text-slate-500 font-semibold min-w-[150px]">Recipient</TableHead>
                                                <TableHead className="text-slate-500 font-semibold min-w-[120px]">Status</TableHead>
                                                <TableHead className="text-slate-500 font-semibold min-w-[120px]">Date</TableHead>
                                                <TableHead className="text-right text-slate-500 font-semibold min-w-[100px]">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {shipments.map((shipment) => (
                                                <TableRow key={shipment.id} className="border-slate-100 hover:bg-slate-50/50">
                                                    <TableCell>
                                                        <button
                                                            onClick={() => {
                                                                setDetailsShipment(shipment)
                                                                setDetailsModalOpen(true)
                                                            }}
                                                            className="font-mono font-bold text-primary hover:underline whitespace-nowrap"
                                                        >
                                                            {shipment.tracking_number}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="text-secondary whitespace-nowrap">
                                                        {shipment.receiver_info?.name || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`uppercase font-medium whitespace-nowrap ${getStatusColor(shipment.status)}`}>
                                                            {shipment.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 whitespace-nowrap">
                                                        {shipment.created_at ? new Date(shipment.created_at).toLocaleDateString() : 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-slate-200"
                                                            onClick={() => {
                                                                setDetailsShipment(shipment)
                                                                setDetailsModalOpen(true)
                                                            }}
                                                        >
                                                            <Eye size={14} className="mr-1" />
                                                            Details
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

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
                                {/* Status & Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock size={12} /> Status</p>
                                        <Badge className={`${getStatusColor(detailsShipment.status)}`}>
                                            {detailsShipment.status}
                                        </Badge>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Created</p>
                                        <p className="font-medium text-secondary text-sm">
                                            {new Date(detailsShipment.created_at as string).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Price & Payment */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><DollarSign size={12} /> Price</p>
                                        <p className="font-bold text-lg text-secondary">
                                            {detailsShipment.price ? `$${detailsShipment.price.toFixed(2)}` : 'Pending Quote'}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><CreditCard size={12} /> Payment</p>
                                        <Badge variant={detailsShipment.payment_status === 'paid' ? 'default' : 'secondary'} className={detailsShipment.payment_status === 'paid' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                            {detailsShipment.payment_status || 'Unpaid'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Map / Location */}
                                {detailsShipment.current_location && (
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-xs text-blue-500 font-semibold mb-2 flex items-center gap-1">
                                            <MapPin size={14} /> Current Location
                                        </p>
                                        <p className="text-secondary font-medium">{detailsShipment.current_location}</p>
                                    </div>
                                )}

                                {/* Addresses */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                                            <User size={14} className="text-slate-400" /> Sender
                                        </h4>
                                        <div className="text-sm space-y-1">
                                            <p className="font-medium text-secondary">{detailsShipment.sender_info?.name}</p>
                                            <p className="text-slate-500">{detailsShipment.sender_info?.address}</p>
                                            <p className="text-slate-500 text-xs">{detailsShipment.sender_info?.phone}</p>
                                            <p className="text-slate-500 text-xs flex items-center gap-1">
                                                <Mail size={10} /> {detailsShipment.sender_info?.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                                            <User size={14} className="text-slate-400" /> Receiver
                                        </h4>
                                        <div className="text-sm space-y-1">
                                            <p className="font-medium text-secondary">{detailsShipment.receiver_info?.name}</p>
                                            <p className="text-slate-500">{detailsShipment.receiver_info?.address}</p>
                                            <p className="text-slate-500 text-xs">{detailsShipment.receiver_info?.phone}</p>
                                            <p className="text-slate-500 text-xs flex items-center gap-1">
                                                <Mail size={10} /> {detailsShipment.receiver_info?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Parcel Info */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <h4 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
                                        <Package size={14} /> Parcel Information
                                    </h4>
                                    <div className="grid grid-cols-2 text-sm gap-y-2">
                                        <div><span className="text-slate-400">Content:</span> <span className="text-secondary font-medium">{detailsShipment.parcel_details?.description}</span></div>
                                        <div><span className="text-slate-400">Weight:</span> <span className="text-secondary font-medium">{detailsShipment.parcel_details?.weight} kg</span></div>
                                        <div><span className="text-slate-400">Dimensions:</span> <span className="text-secondary font-medium">{detailsShipment.parcel_details?.dimensions.length}x{detailsShipment.parcel_details?.dimensions.width}x{detailsShipment.parcel_details?.dimensions.height} cm</span></div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`/track/${detailsShipment.tracking_number}`, '_blank')}
                                    >
                                        <Eye size={14} className="mr-1" /> View Tracking Page
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
