'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from '@iconify/react'
import L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'

// Sub-component to handle map resize invalidation
function ResizeMap({ resizeKey }: { resizeKey: string }) {
    const map = useMap()

    useEffect(() => {
        // Run multiple invalidations across a few frames to handle mobile viewport/layout settling.
        const timers: Array<ReturnType<typeof setTimeout>> = []
        const schedule = [0, 120, 280, 500]

        schedule.forEach((delay) => {
            timers.push(
                setTimeout(() => {
                    map.invalidateSize()
                    map.setView(map.getCenter(), map.getZoom(), { animate: false })
                }, delay)
            )
        })

        return () => timers.forEach((t) => clearTimeout(t))
    }, [map, resizeKey])

    return null
}

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
    fullscreenMode?: boolean
}

const isValidCoordinate = (value: unknown, min: number, max: number): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max

const geocodeCache = new Map<string, { lat: number; lng: number; label: string; cachedAt: number }>()
const GEOCODE_CACHE_TTL = 1000 * 60 * 60 * 12 // 12 hours

const sanitizeLocationText = (text: string) => text.replace(/\s+/g, ' ').trim()

const HUB_WORDS = /(hub|warehouse|facility|station|depot|delivery|center|centre|terminal|port|airport)/gi

const extractCityQuery = (text: string) => {
    const cleaned = sanitizeLocationText(text)
    if (!cleaned) return ''

    const parts = cleaned
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)

    // Prefer "City, Country" when available.
    if (parts.length >= 2) {
        return `${parts[0]}, ${parts[parts.length - 1]}`
    }

    // Strip logistic suffixes like "Tokyo Delivery Hub" -> "Tokyo"
    const stripped = cleaned.replace(HUB_WORDS, '').replace(/\s+/g, ' ').trim()
    if (stripped) return stripped

    return cleaned
}

const extractCoordinatesFromText = (text?: string) => {
    if (!text) return null

    const patterns = [
        /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
        /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
        /[?&]ll=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
        /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
        /(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/
    ]

    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (!match) continue

        const lat = Number(match[1])
        const lng = Number(match[2])

        if (isValidCoordinate(lat, -90, 90) && isValidCoordinate(lng, -180, 180)) {
            return { lat, lng }
        }
    }

    return null
}

const buildLocationQueries = (currentLocation?: string, destinationAddress?: string, originAddress?: string) => {
    const rawCandidates = [currentLocation, destinationAddress, originAddress].filter(Boolean) as string[]
    const expanded = rawCandidates.flatMap((raw) => {
        const cleaned = sanitizeLocationText(raw)
        const primary = extractCityQuery(cleaned)
        const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean)
        const cityOnly = parts[0] || ''
        const countryOnly = parts.length > 1 ? parts[parts.length - 1] : ''
        const noHub = cleaned.replace(HUB_WORDS, '').replace(/\s+/g, ' ').trim()

        return [primary, cityOnly, noHub, countryOnly]
    })

    return [...new Set(expanded.map((q) => sanitizeLocationText(q)).filter(Boolean))]
}

const getCachedGeocode = (key: string) => {
    const inMemory = geocodeCache.get(key)
    if (inMemory && Date.now() - inMemory.cachedAt <= GEOCODE_CACHE_TTL) {
        return inMemory
    }

    if (typeof window === 'undefined') return null

    const storageKey = `tracking-map-geocode:${key}`
    const raw = window.sessionStorage.getItem(storageKey)
    if (!raw) return null

    try {
        const parsed = JSON.parse(raw) as { lat: number; lng: number; label: string; cachedAt: number }
        if (Date.now() - parsed.cachedAt > GEOCODE_CACHE_TTL) {
            window.sessionStorage.removeItem(storageKey)
            return null
        }

        geocodeCache.set(key, parsed)
        return parsed
    } catch {
        window.sessionStorage.removeItem(storageKey)
        return null
    }
}

const setCachedGeocode = (key: string, value: { lat: number; lng: number; label: string }) => {
    const payload = { ...value, cachedAt: Date.now() }
    geocodeCache.set(key, payload)

    if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(`tracking-map-geocode:${key}`, JSON.stringify(payload))
    }
}

export default function TrackingMap({
    className,
    currentLocation,
    originAddress,
    destinationAddress,
    location,
    status,
    fullscreenMode = false
}: TrackingMapProps) {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark')
    const [resolvedLocation, setResolvedLocation] = useState<{
        lat: number
        lng: number
        label: string
    } | null>(null)
    const [isResolving, setIsResolving] = useState(false)
    const [geocodeFailed, setGeocodeFailed] = useState(false)
    const [tileIndex, setTileIndex] = useState(0)
    const tileErrorCountRef = useRef(0)

    const hasValidCoordinates =
        !!location &&
        isValidCoordinate(location.lat, -90, 90) &&
        isValidCoordinate(location.lng, -180, 180)

    const locationQueries = useMemo(() => {
        return buildLocationQueries(currentLocation, destinationAddress, originAddress)
    }, [currentLocation, destinationAddress, originAddress])

    useEffect(() => {
        const resolveTheme = () => {
            const attr = document.documentElement.getAttribute('data-theme')
            setTheme(attr === 'light' ? 'light' : 'dark')
        }

        resolveTheme()

        const observer = new MutationObserver(resolveTheme)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        })

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        let mounted = true

        if (hasValidCoordinates && location) {
            setResolvedLocation({
                lat: location.lat,
                lng: location.lng,
                label: sanitizeLocationText(currentLocation || destinationAddress || originAddress || 'Shipment Location')
            })
            setGeocodeFailed(false)
            setIsResolving(false)
            return
        }

        const parsedCoords = extractCoordinatesFromText(currentLocation) || extractCoordinatesFromText(destinationAddress)
        if (parsedCoords) {
            setResolvedLocation({
                ...parsedCoords,
                label: sanitizeLocationText(currentLocation || destinationAddress || originAddress || 'Shipment Location')
            })
            setGeocodeFailed(false)
            setIsResolving(false)
            return
        }

        if (!locationQueries.length) {
            setResolvedLocation(null)
            setGeocodeFailed(true)
            setIsResolving(false)
            return
        }

        // Use the first cached hit from our query candidates.
        for (const query of locationQueries) {
            const cached = getCachedGeocode(query.toLowerCase())
            if (cached) {
                setResolvedLocation({ lat: cached.lat, lng: cached.lng, label: cached.label || query })
                setGeocodeFailed(false)
                setIsResolving(false)
                return
            }
        }

        setIsResolving(true)
        setGeocodeFailed(false)

        const controller = new AbortController()

        const geocodeOpenMeteo = async (query: string) => {
            const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
            const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
            if (!response.ok) throw new Error('Open-Meteo geocoding request failed')

            const data = (await response.json()) as {
                results?: Array<{ latitude: number; longitude: number; name?: string; country?: string }>
            }

            const first = data?.results?.[0]
            const lat = first?.latitude
            const lng = first?.longitude
            if (!first || !isValidCoordinate(lat, -90, 90) || !isValidCoordinate(lng, -180, 180)) return null

            const label = [first.name, first.country].filter(Boolean).join(', ') || query
            return { lat, lng, label }
        }

        const geocodeNominatim = async (query: string) => {
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
            const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
            if (!response.ok) throw new Error('Nominatim geocoding request failed')

            const results = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string; name?: string }>
            const first = results?.[0]
            const lat = first ? Number(first.lat) : NaN
            const lng = first ? Number(first.lon) : NaN
            if (!first || !isValidCoordinate(lat, -90, 90) || !isValidCoordinate(lng, -180, 180)) return null

            const label = first.display_name || first.name || query
            return { lat, lng, label }
        }

        const geocode = async () => {
            try {
                for (const query of locationQueries) {
                    let result: { lat: number; lng: number; label: string } | null = null

                    try {
                        result = await geocodeOpenMeteo(query)
                    } catch {
                        result = null
                    }

                    if (!result) {
                        try {
                            result = await geocodeNominatim(query)
                        } catch {
                            result = null
                        }
                    }

                    if (!result) continue

                    setCachedGeocode(query.toLowerCase(), result)
                    if (!mounted) return
                    setResolvedLocation(result)
                    setGeocodeFailed(false)
                    return
                }

                if (!mounted || controller.signal.aborted) return
                setResolvedLocation(null)
                setGeocodeFailed(true)
            } finally {
                if (mounted) setIsResolving(false)
            }
        }

        geocode()

        return () => {
            mounted = false
            controller.abort()
        }
    }, [
        hasValidCoordinates,
        location,
        currentLocation,
        destinationAddress,
        originAddress,
        locationQueries
    ])

    const center = resolvedLocation ? [resolvedLocation.lat, resolvedLocation.lng] as [number, number] : null

    const pulsingIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="map-marker-container"><div class="map-pulse"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    })

    const tileSources =
        theme === 'light'
            ? [
                  {
                      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                      attribution:
                          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  },
                  {
                      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  }
              ]
            : [
                  {
                      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                      attribution:
                          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  },
                  {
                      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  }
              ]

    const safeTileIndex = Math.min(tileIndex, tileSources.length - 1)
    const tileConfig = tileSources[safeTileIndex]

    useEffect(() => {
        // reset to primary tile provider when location/theme changes
        setTileIndex(0)
        tileErrorCountRef.current = 0
    }, [theme, center?.[0], center?.[1]])

    const mapPlaceholder = (
        <div className={`bg-bgSurface rounded-sm border border-borderColor overflow-hidden ${className}`}>
            <div className="h-full flex flex-col">
                <div className="bg-neutral-900 text-white px-4 py-3 flex items-center gap-2 border-b border-white/5">
                    <Icon icon="solar:map-point-linear" width="16" className="text-red-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Live Tracking</span>
                    {status && (
                        <span className="ml-auto text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
                            {status}
                        </span>
                    )}
                </div>

                <div className="flex-1 p-6 space-y-4">
                    <div className="flex items-center justify-center p-8 border border-dashed border-borderColor rounded-sm bg-bgMain/50">
                        <div className="text-center">
                            <Icon icon="solar:map-linear" width="48" className="text-textMuted mx-auto mb-2 opacity-50" />
                            <p className="text-xs text-textMuted font-medium">
                                {isResolving
                                    ? 'Resolving shipment location...'
                                    : geocodeFailed
                                      ? 'Unable to map this shipment location right now'
                                      : 'Location data unavailable for this shipment'}
                            </p>
                            {locationQueries.length > 0 && (
                                <p className="text-[11px] text-textMuted mt-2 opacity-70">{locationQueries[0]}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    if (!center) {
        return mapPlaceholder
    }

    const mapKey = `${center[0]}-${center[1]}-${theme}`
    const resizeKey = `${mapKey}-${fullscreenMode ? 'fullscreen' : 'normal'}`
    const initialZoom = hasValidCoordinates ? 12 : 7

    return (
        <div className={`rounded-sm overflow-hidden border border-borderColor bg-bgSurface ${className}`} style={{ width: '100%', position: 'relative' }}>
            <MapContainer
                key={mapKey}
                center={center}
                zoom={initialZoom}
                scrollWheelZoom={false}
                attributionControl={false}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                className="z-0"
            >
                <ResizeMap resizeKey={resizeKey} />
                <TileLayer
                    attribution={tileConfig.attribution}
                    url={tileConfig.url}
                    eventHandlers={{
                        tileerror: () => {
                            tileErrorCountRef.current += 1
                            // If primary provider fails repeatedly, fall back to OSM.
                            if (tileErrorCountRef.current >= 3 && tileIndex < tileSources.length - 1) {
                                setTileIndex((prev) => Math.min(prev + 1, tileSources.length - 1))
                            }
                        }
                    }}
                />
                <Marker position={center} icon={pulsingIcon}>
                    <Popup>
                        <div className="text-xs font-bold">
                            <p className="text-red-600 uppercase mb-1">{status || 'Shipment Location'}</p>
                            <p className="text-slate-800">{resolvedLocation.label || currentLocation || 'Updating...'}</p>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    )
}
