'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from '@iconify/react'
import L from 'leaflet'
import { useEffect, useState, useRef, useCallback } from 'react'

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
    searchAddress?: string
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
    searchAddress,
    location,
    status
}: TrackingMapProps) {
    const theme = useTheme()
    const defaultCenter: [number, number] = [51.505, -0.09]
    const [isFullscreen, setIsFullscreen] = useState(false)
    const mapContainerRef = useRef<HTMLDivElement>(null)

    // Geocoded coordinates from the address text
    const [geocodedCenter, setGeocodedCenter] = useState<[number, number] | null>(null)
    const [isGeocoding, setIsGeocoding] = useState(false)
    const lastGeocodedRef = useRef<string>('')

    // Determine if admin has set a meaningful currentLocation
    const hasAdminLocation = !!(currentLocation && currentLocation.toLowerCase() !== 'pending' && currentLocation.trim().length >= 3)
    const hasStoredCoordinates = !!(location?.lat && location?.lng)

    // Geocode the location text, but skip when we already have stored coordinates.
    // Stored coords are authoritative: they came from an explicit Google Maps link
    // pasted by the admin, or were already resolved by Nominatim at save time.
    // Re-geocoding the text would let Nominatim pick a similarly-named wrong place.
    useEffect(() => {
        // Fast path: admin has set a location AND we have stored coords — trust them.
        if (hasAdminLocation && hasStoredCoordinates) {
            setGeocodedCenter(null)
            lastGeocodedRef.current = ''
            return
        }

        // If admin has set a public location but no stored coordinates, do not
        // invent a shipment pin from text. Address geocoders often return a
        // similarly-named wrong place, which is worse than showing no precise pin.
        if (hasAdminLocation && !hasStoredCoordinates) {
            setGeocodedCenter(null)
            lastGeocodedRef.current = ''
            return
        }

        // Build a prioritized list of addresses to try geocoding
        const candidates: string[] = []

        // Priority 1: currentLocation — expand into progressively simpler variants
        // For 3+ parts (e.g. "Hub Name, 85 Wharf St, Sydney"):
        //   1. "85 Wharf St, Sydney" (without facility prefix — most likely geocodable)
        //   2. "Hub Name, 85 Wharf St, Sydney" (full string — fallback)
        //   3. "Sydney" (just city — last resort)
        // For 1-2 parts: try full string first (it's likely a real address or city)
        if (hasAdminLocation) {
            const full = currentLocation!.trim()
            const parts = full.split(',').map(p => p.trim()).filter(Boolean)

            if (parts.length >= 3) {
                // 3+ segments: first is likely a building/facility name — skip it
                const withoutPrefix = parts.slice(1).join(', ')
                if (withoutPrefix.length >= 3) candidates.push(withoutPrefix)
                candidates.push(full)
                const lastPart = parts[parts.length - 1]
                if (lastPart.length >= 3 && lastPart !== withoutPrefix) candidates.push(lastPart)
            } else {
                // 1-2 segments: likely a real address or city name
                candidates.push(full)
                if (parts.length === 2) {
                    const lastPart = parts[1]
                    if (lastPart.length >= 3) candidates.push(lastPart)
                }
            }
        }

        // Only fall back to destination/origin if admin hasn't set a location
        if (!hasAdminLocation) {
            // If we have stored coordinates and no admin location, just use those
            if (hasStoredCoordinates) {
                setGeocodedCenter(null)
                lastGeocodedRef.current = ''
                return
            }

            // Priority 2: destination city
            if (destinationAddress && destinationAddress.length >= 3) {
                candidates.push(destinationAddress)
            }

            // Priority 3: origin city
            if (originAddress && originAddress.length >= 3) {
                candidates.push(originAddress)
            }
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
            // None resolved — clear so we fall back to stored coords or default
            setGeocodedCenter(null)
            setIsGeocoding(false)
        }

        tryGeocode()
    }, [currentLocation, originAddress, destinationAddress, location, hasAdminLocation, hasStoredCoordinates])

    // Priority:
    // 1. Stored coords when admin has set a location (map link or geocoded on save)
    // 2. Geocoded result from address text (only when no stored coords available)
    // 3. Stored coords as general fallback
    // 4. Default center
    const center: [number, number] =
        (hasAdminLocation && hasStoredCoordinates)
            ? [location.lat, location.lng]
            : geocodedCenter
                ? geocodedCenter
                : hasStoredCoordinates
                    ? [location.lat, location.lng]
                    : defaultCenter
    const hasMapPin = hasStoredCoordinates || (!hasAdminLocation && !!geocodedCenter)

    const mapKey = `${center[0]}-${center[1]}-${theme}-${isFullscreen ? 'fs' : 'normal'}`

    // Custom pulsing marker icon
    const pulsingIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="map-marker-container"><div class="map-pulse"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    })

    // Fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev)
    }, [])

    // Close fullscreen on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false)
            }
        }
        if (isFullscreen) {
            document.addEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = ''
        }
    }, [isFullscreen])

    // Open in Google Maps
    const openGoogleMaps = useCallback(() => {
        const fallbackSearchAddress = searchAddress || currentLocation || destinationAddress || originAddress || ''
        const url = hasMapPin
            ? `https://www.google.com/maps/@${center[0]},${center[1]},17z`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackSearchAddress)}`
        window.open(url, '_blank', 'noopener,noreferrer')
    }, [center, currentLocation, destinationAddress, originAddress, searchAddress, hasMapPin])

    const fullscreenStyles: React.CSSProperties = isFullscreen
        ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            borderRadius: 0,
        }
        : {
            height: '400px',
            width: '100%',
            position: 'relative' as const,
        }

    return (
        <div
            ref={mapContainerRef}
            className={`rounded-sm overflow-hidden border border-borderColor bg-bgSurface ${isFullscreen ? '' : className}`}
            style={fullscreenStyles}
        >
            {/* Top-left: Locating indicator */}
            {isGeocoding && (
                <div className="absolute top-3 left-3 z-[1000] bg-bgMain/90 border border-borderColor rounded-sm px-3 py-1.5 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-textMuted">Locating...</span>
                </div>
            )}

            {!hasMapPin && hasAdminLocation && (
                <div className="absolute inset-x-3 bottom-12 z-[1000] bg-bgMain/95 border border-amber-500/30 rounded-sm px-3 py-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                        Precise map pin not available. Add coordinates or a Google Maps link with coordinates.
                    </p>
                </div>
            )}

            {/* Top-right: Map action buttons */}
            <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
                {/* Open in Google Maps */}
                <button
                    onClick={openGoogleMaps}
                    title="Open in Google Maps"
                    className="bg-bgMain/90 border border-red-600 rounded-sm px-3 py-1.5 flex items-center gap-2 transition-all cursor-pointer"
                >
                    <Icon icon="mdi:google-maps" width="14" className="text-red-600" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-600 inline">Open in Google Maps</span>
                </button>

                {/* Fullscreen toggle */}
                <button
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen map'}
                    className="bg-bgMain/90 border border-red-600 rounded-sm px-3 py-1.5 flex items-center gap-2 transition-all cursor-pointer"
                >
                    <Icon
                        icon={isFullscreen ? 'solar:minimize-square-linear' : 'solar:maximize-square-linear'}
                        width="16"
                        className="text-red-600"
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-600 inline">
                        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    </span>
                </button>
            </div>

            {/* Bottom-left: Status badge */}
            {status && (
                <div className="absolute bottom-3 left-3 z-[1000]">
                    <span className="text-[9px] bg-bgMain/90 border border-red-500/20 text-red-500 px-2.5 py-1 rounded-sm uppercase tracking-widest font-bold">
                        {status.replace(/-/g, ' ')}
                    </span>
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
                {hasMapPin && (
                    <Marker position={center} icon={pulsingIcon}>
                        <Popup>
                            <div className="text-xs font-bold">
                                <p className="text-red-600 uppercase mb-1">{status || 'Shipment Location'}</p>
                                <p className="text-slate-800">{currentLocation || 'Updating...'}</p>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    )
}
