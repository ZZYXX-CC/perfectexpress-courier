'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from '@iconify/react'
import L from 'leaflet'
import { useEffect, useState, useRef } from 'react'

const TILE_URLS = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

// Simple in-memory geocode cache to avoid redundant API calls
const geocodeCache = new Map<string, [number, number] | null>()

async function geocodeAddress(address: string): Promise<[number, number] | null> {
    if (!address || address.trim().length < 3) return null

    const cacheKey = address.trim().toLowerCase()
    if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey) ?? null

    try {
        const encoded = encodeURIComponent(address.trim())
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
            { headers: { 'Accept': 'application/json' } }
        )
        if (!res.ok) return null

        const data = await res.json()
        if (data && data.length > 0) {
            const result: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
            geocodeCache.set(cacheKey, result)
            return result
        }
        geocodeCache.set(cacheKey, null)
        return null
    } catch {
        return null
    }
}

function useTheme(): 'dark' | 'light' {
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
    })

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light'
            setTheme(current || 'dark')
        })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
        return () => observer.disconnect()
    }, [])

    return theme
}

function ResizeMap() {
    const map = useMap()
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize()
        }, 500)
        return () => clearTimeout(timer)
    }, [map])
    return null
}

// Fix for default marker icons in Leaflet + Vite/React
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

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
    const theme = useTheme()
    const defaultCenter: [number, number] = [51.505, -0.09]

    // Geocoded coordinates from the address text (used when no lat/lng provided)
    const [geocodedCenter, setGeocodedCenter] = useState<[number, number] | null>(null)
    const [isGeocoding, setIsGeocoding] = useState(false)
    const lastGeocodedRef = useRef<string>('')

    // Geocode the best available address text when no stored coordinates exist
    useEffect(() => {
        // If we already have stored coordinates, skip geocoding
        if (location?.lat && location?.lng) {
            setGeocodedCenter(null)
            lastGeocodedRef.current = ''
            return
        }

        // Build a prioritized list of addresses to try geocoding
        const candidates: string[] = []

        // Priority 1: currentLocation (the admin-set location text)
        if (currentLocation && currentLocation.toLowerCase() !== 'pending' && currentLocation.length >= 3) {
            candidates.push(currentLocation)
        }

        // Priority 2: destination city (where the package is going)
        if (destinationAddress && destinationAddress.length >= 3) {
            candidates.push(destinationAddress)
        }

        // Priority 3: origin city (where it came from)
        if (originAddress && originAddress.length >= 3) {
            candidates.push(originAddress)
        }

        if (candidates.length === 0) {
            setGeocodedCenter(null)
            return
        }

        // Build a stable key from all candidates to avoid redundant geocoding
        const candidateKey = candidates.join('||').trim().toLowerCase()
        if (lastGeocodedRef.current === candidateKey) return
        lastGeocodedRef.current = candidateKey

        setIsGeocoding(true)

        // Try each candidate in order until one resolves
        const tryGeocode = async () => {
            for (const address of candidates) {
                const result = await geocodeAddress(address)
                if (result) {
                    setGeocodedCenter(result)
                    setIsGeocoding(false)
                    return
                }
            }
            // None resolved
            setIsGeocoding(false)
        }

        tryGeocode()
    }, [currentLocation, originAddress, destinationAddress, location])

    // Priority: stored coordinates > geocoded coordinates > default
    const center: [number, number] = location?.lat && location?.lng
        ? [location.lat, location.lng]
        : geocodedCenter
            ? geocodedCenter
            : defaultCenter

    const mapKey = `${center[0]}-${center[1]}-${theme}`

    // Custom pulsing marker icon
    const pulsingIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="map-marker-container"><div class="map-pulse"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    })

    return (
        <div className={`rounded-sm overflow-hidden border border-borderColor bg-bgSurface ${className}`} style={{ height: '400px', width: '100%', position: 'relative' }}>
            {isGeocoding && (
                <div className="absolute top-3 left-3 z-10 bg-bgMain/90 border border-borderColor rounded-sm px-3 py-1.5 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-textMuted">Locating...</span>
                </div>
            )}
            <MapContainer
                key={mapKey}
                center={center}
                zoom={15}
                scrollWheelZoom={false}
                attributionControl={false}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                className="z-0"
            >
                <ResizeMap />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url={TILE_URLS[theme]}
                />
                <Marker position={center} icon={pulsingIcon}>
                    <Popup>
                        <div className="text-xs font-bold">
                            <p className="text-red-600 uppercase mb-1">{status || 'Shipment Location'}</p>
                            <p className="text-slate-800">{currentLocation || 'Updating...'}</p>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    )
}

