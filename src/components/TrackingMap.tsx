'use client'

import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'

interface TrackingMapProps {
    className?: string
    location?: {
        lat: number
        lng: number
    }
}

export default function TrackingMap({ className, location }: TrackingMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
        return (
            <div className={`flex items-center justify-center bg-slate-100 rounded-xl text-slate-400 p-8 ${className}`}>
                <p>Map unavailable (Missing API Key)</p>
            </div>
        )
    }

    const defaultCenter = { lat: 51.505, lng: -0.09 } // Default to London (or any central hub)
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
                    disableDefaultUI={true}
                    className="w-full h-full"
                >
                    <Marker position={center} />
                </Map>
            </div>
        </APIProvider>
    )
}
