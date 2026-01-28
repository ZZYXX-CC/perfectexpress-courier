'use client'

import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'
import { MapPin, Navigation, Package } from 'lucide-react'

interface TrackingMapProps {
    className?: string
    currentLocation?: string
    originAddress?: string
    destinationAddress?: string
    location?: {
        lat: number
        lng: number
    }
    status?: string
}

export default function TrackingMap({ 
    className, 
    currentLocation,
    originAddress,
    destinationAddress,
    location,
    status 
}: TrackingMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    // Show a nice placeholder with location info when no API key
    if (!apiKey) {
        return (
            <div className={`bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl border border-slate-200 overflow-hidden ${className}`}>
                <div className="h-full flex flex-col">
                    {/* Map placeholder header */}
                    <div className="bg-slate-800 text-white px-4 py-3 flex items-center gap-2">
                        <Navigation size={16} className="text-primary" />
                        <span className="text-sm font-medium">Live Tracking</span>
                        {status && (
                            <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase">
                                {status}
                            </span>
                        )}
                    </div>
                    
                    {/* Location details */}
                    <div className="flex-1 p-4 space-y-3">
                        {currentLocation && (
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Package size={16} className="text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500 uppercase font-medium">Current Location</p>
                                    <p className="text-sm font-semibold text-slate-800 truncate">{currentLocation}</p>
                                </div>
                            </div>
                        )}
                        
                        {originAddress && (
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <MapPin size={16} className="text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500 uppercase font-medium">Origin</p>
                                    <p className="text-sm text-slate-700 truncate">{originAddress}</p>
                                </div>
                            </div>
                        )}
                        
                        {destinationAddress && (
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <MapPin size={16} className="text-orange-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500 uppercase font-medium">Destination</p>
                                    <p className="text-sm text-slate-700 truncate">{destinationAddress}</p>
                                </div>
                            </div>
                        )}
                        
                        {!currentLocation && !originAddress && !destinationAddress && (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <p className="text-sm">Location tracking available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const defaultCenter = { lat: 51.505, lng: -0.09 }
    const center = location || defaultCenter

    return (
        <APIProvider apiKey={apiKey}>
            <div className={`rounded-xl overflow-hidden shadow-lg ${className}`}>
                <Map
                    defaultCenter={defaultCenter}
                    center={center}
                    defaultZoom={10}
                    zoom={12}
                    gestureHandling={'cooperative'}
                    disableDefaultUI={false}
                    zoomControl={true}
                    className="w-full h-full"
                >
                    <Marker position={center} />
                </Map>
            </div>
        </APIProvider>
    )
}
