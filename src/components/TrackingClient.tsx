'use client'

import { useState } from 'react'
import { useRealtimeShipment } from '@/hooks/useRealtimeShipments'
import TrackingTimeline from '@/components/TrackingTimeline'
import TrackingMap from '@/components/TrackingMap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Box, MapPin, Wifi } from 'lucide-react'

type Shipment = {
    id: string
    tracking_number: string | null
    sender_info: unknown
    receiver_info: unknown
    parcel_details: unknown
    status: string | null
    payment_status: string | null
    current_location: string | null
    history: unknown
    created_at: string | null
}

interface TrackingClientProps {
    initialShipment: Shipment
}

export default function TrackingClient({ initialShipment }: TrackingClientProps) {
    const [shipment, setShipment] = useState<Shipment>(initialShipment)
    const [hasUpdate, setHasUpdate] = useState(false)

    // Subscribe to real-time updates for this specific shipment
    useRealtimeShipment(shipment.tracking_number || '', (updatedShipment) => {
        setShipment(updatedShipment as Shipment)
        setHasUpdate(true)
        // Reset the update indicator after 3 seconds
        setTimeout(() => setHasUpdate(false), 3000)
    })

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-secondary">
                            Tracking <span className="text-primary">{shipment.tracking_number}</span>
                        </h1>
                        <span className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                            hasUpdate ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
                        }`}>
                            <Wifi size={12} className="animate-pulse" />
                            {hasUpdate ? 'Updated!' : 'Live'}
                        </span>
                    </div>
                    <p className="text-slate-500">
                        Global Express Shipment
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-lg py-1 px-4 border-primary text-primary bg-primary/5 uppercase transition-all ${
                        hasUpdate ? 'ring-2 ring-green-500 ring-offset-2' : ''
                    }`}>
                        {shipment.status}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Timeline */}
                <div className="lg:col-span-2 space-y-8">
                    <TrackingTimeline history={shipment.history as any[]} currentStatus={shipment.status || ''} />
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    {/* Map / Location Display */}
                    <TrackingMap 
                        className="w-full h-64 md:h-72" 
                        currentLocation={shipment.current_location || undefined}
                        originAddress={(shipment.sender_info as any)?.address}
                        destinationAddress={(shipment.receiver_info as any)?.address}
                        status={shipment.status || undefined}
                    />

                    <Card className="glass border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg text-secondary">Parcel Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Box className="text-primary mt-1" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Description</p>
                                    <p className="text-slate-500">{(shipment.parcel_details as any)?.description || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="font-bold text-primary w-5 text-center text-sm mt-1">KG</div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Weight</p>
                                    <p className="text-slate-500">{(shipment.parcel_details as any)?.weight || 'N/A'} kg</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg text-secondary">Address Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 relative">
                            <div className="absolute left-3 top-6 bottom-6 w-0.5 bg-slate-100" />

                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">From</p>
                                <p className="font-medium text-secondary">{(shipment.sender_info as any)?.name}</p>
                                <p className="text-sm text-slate-500">{(shipment.sender_info as any)?.address}</p>
                            </div>

                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center">
                                    <MapPin className="w-3 h-3 text-primary" />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">To</p>
                                <p className="font-medium text-secondary">{(shipment.receiver_info as any)?.name}</p>
                                <p className="text-sm text-slate-500">{(shipment.receiver_info as any)?.address}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}
