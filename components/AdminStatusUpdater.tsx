import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Shipment } from '../types';
import { useToast } from './ui/Toast';
import { updateShipment, logShipmentEvent } from '../services/adminService';

interface AdminStatusUpdaterProps {
    shipment: Shipment | null;
    onSave: () => void;
    onCancel: () => void;
}

type CoordinateResolution = {
    coordinates: { lat: string; lng: string } | null;
    error?: string;
    provider?: string;
    accuracy?: string;
};

const SHIPMENT_STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in-transit', label: 'In Transit' },
    { value: 'out-for-delivery', label: 'Out For Delivery' },
    { value: 'held', label: 'Held' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'delivered', label: 'Delivered' }
];

// ─── Geocoding helpers ───────────────────────────────────────────────

/**
 * Extract lat/lng from a wide variety of Google Maps URL formats:
 *   @lat,lng          (embedded map view)
 *   ?q=lat,lng        (search query)
 *   /place/lat,lng    (place link)
 *   !3dlat!4dlng      (internal URL params)
 *   ll=lat,lng        (static maps / old format)
 *   center=lat,lng    (embed params)
 *   /dir/lat,lng      (directions)
 */
function extractCoordsFromLink(url: string): { lat: string; lng: string } | null {
    if (!url) return null;

    let decodedUrl = url;
    try {
        decodedUrl = decodeURIComponent(url);
    } catch {
        decodedUrl = url;
    }

    const patterns = [
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,           // @lat,lng
        /[?&](?:q|query|destination|center|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // query params
        /\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,    // /place/lat,lng
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,        // !3dlat!4dlng
        /\/dir\/.*?(-?\d+\.?\d*),(-?\d+\.?\d*)/,   // /dir/.../lat,lng
    ];

    for (const source of [url, decodedUrl]) {
        const rawPairMatch = source.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
        if (rawPairMatch) {
            const lat = parseFloat(rawPairMatch[1]);
            const lng = parseFloat(rawPairMatch[2]);
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { lat: rawPairMatch[1], lng: rawPairMatch[2] };
            }
        }

        for (const pattern of patterns) {
            const match = source.match(pattern);
            if (match) {
                const lat = parseFloat(match[1]);
                const lng = parseFloat(match[2]);
                // Sanity check: valid coordinate ranges
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    return { lat: match[1], lng: match[2] };
                }
            }
        }

        // Some Google URLs store longitude before latitude: !2dlng!3dlat
        const lngLatMatch = source.match(/!2d(-?\d+\.?\d*)!3d(-?\d+\.?\d*)/);
        if (lngLatMatch) {
            const lng = parseFloat(lngLatMatch[1]);
            const lat = parseFloat(lngLatMatch[2]);
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { lat: lngLatMatch[2], lng: lngLatMatch[1] };
            }
        }
    }

    return null;
}

function isMapUrlLike(value: string): boolean {
    const input = value.trim().toLowerCase();
    return /^https?:\/\//.test(input) || input.includes('google.com/maps') || input.includes('maps.app.goo.gl');
}

function looksLikeResolvableLocationInput(value: string): boolean {
    const input = value.trim();
    if (!input || input.length < 5) return false;
    if (extractCoordsFromLink(input) || isMapUrlLike(input)) return true;

    const commaParts = input.split(',').map(part => part.trim()).filter(Boolean);
    const hasNumber = /\d/.test(input);
    const hasStreetWord = /\b(street|st\.?|road|rd\.?|avenue|ave\.?|close|drive|dr\.?|lane|ln\.?|way|boulevard|blvd\.?|crescent|estate|plot|block|suite|unit)\b/i.test(input);
    const hasPostalContext = /\b(zip|postal|postcode|fct|abuja|lagos|city|state)\b/i.test(input);

    return hasNumber && (hasStreetWord || hasPostalContext || commaParts.length >= 2);
}

async function resolveLocationCoordinates(input: string): Promise<CoordinateResolution> {
    const localCoords = extractCoordsFromLink(input);
    if (localCoords) return { coordinates: localCoords, provider: 'direct' };

    try {
        const res = await fetch('/api/resolve-map-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input })
        });
        if (!res.ok) return { coordinates: null, error: 'Location resolver is unavailable' };
        const data = await res.json();
        if (!data?.coordinates) {
            return {
                coordinates: null,
                error: data?.error || 'No precise coordinates found',
                provider: data?.provider,
                accuracy: data?.accuracy
            };
        }

        const lat = parseFloat(String(data.coordinates.lat));
        const lng = parseFloat(String(data.coordinates.lng));
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return {
                coordinates: { lat: String(lat), lng: String(lng) },
                provider: data?.provider,
                accuracy: data?.accuracy
            };
        }
    } catch {
        return { coordinates: null, error: 'Unable to contact location resolver' };
    }

    return { coordinates: null, error: 'Invalid coordinates returned' };
}

function extractPlaceNameFromMapLink(url: string): string {
    try {
        const decoded = decodeURIComponent(url);
        const placeMatch = decoded.match(/\/place\/([^/@?]+)/);
        if (placeMatch) {
            return placeMatch[1].replace(/\+/g, ' ');
        }
    } catch {
        return '';
    }
    return '';
}

function splitSavedLocation(currentLocation?: string, locationDetail?: string): { label: string; detail: string } {
    const cleanLocation = (currentLocation || '')
        .replace(/\s*\[@-?\d+\.?\d*,-?\d+\.?\d*\]\s*$/, '')
        .trim();
    const cleanDetail = (locationDetail || '').trim();

    if (cleanDetail) {
        const suffix = `, ${cleanDetail}`;
        const label = cleanLocation.endsWith(suffix)
            ? cleanLocation.slice(0, -suffix.length).trim()
            : cleanLocation;
        return { label: label || cleanLocation || '', detail: cleanDetail };
    }

    const parts = cleanLocation.split(',').map(part => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
        return { label: parts[0], detail: parts.slice(1).join(', ') };
    }

    return { label: cleanLocation, detail: '' };
}

/**
 * Reverse-geocode lat/lng to a concise address string via Nominatim.
 * Used to turn Google Maps URL coords into readable text while storing
 * the actual map pin in the coordinates column.
 */
async function reverseGeocodeAddress(lat: string, lng: string): Promise<string | null> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
            { headers: { 'Accept': 'application/json' } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.address) return data?.display_name || null;

        const a = data.address;
        const parts = [
            a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
            a.suburb || a.neighbourhood,
            a.city || a.town || a.village,
            a.country
        ].filter(Boolean);

        return parts.length > 0 ? parts.join(', ') : (data.display_name || null);
    } catch {
        return null;
    }
}

// ─── Component ───────────────────────────────────────────────────────

const AdminStatusUpdater: React.FC<AdminStatusUpdaterProps> = ({ shipment, onSave, onCancel }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const [locationResolverMessage, setLocationResolverMessage] = useState('');
    const [locationResolverState, setLocationResolverState] = useState<'idle' | 'resolving' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        status: 'pending',
        currentLocation: '',
        statusNote: '',
        paymentStatus: 'unpaid',
        latitude: '',
        longitude: '',
        mapLink: ''
    });

    useEffect(() => {
        if (shipment) {
            const savedLocation = splitSavedLocation(shipment.currentLocation, shipment.locationDetail);
            setFormData({
                status: shipment.status || 'pending',
                currentLocation: savedLocation.label,
                statusNote: '',
                paymentStatus: shipment.paymentStatus || 'unpaid',
                latitude: shipment.coordinates?.lat?.toString() || '',
                longitude: shipment.coordinates?.lng?.toString() || '',
                mapLink: savedLocation.detail
            });
            setLocationResolverMessage('');
            setLocationResolverState('idle');
        }
    }, [shipment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates = { ...prev, [name]: value };

            if (name === 'mapLink') {
                setLocationResolverMessage('');
                setLocationResolverState('idle');

                if (value && (value.startsWith('http') || value.includes('google.com/maps'))) {
                    const coords = extractCoordsFromLink(value);
                    if (coords) {
                        updates.latitude = coords.lat;
                        updates.longitude = coords.lng;
                        setLocationResolverMessage('Coordinates found directly in map link');
                        setLocationResolverState('success');
                    } else {
                        // URL present but coords not extractable — clear any stale coords
                        updates.latitude = '';
                        updates.longitude = '';
                    }
                } else if (!value) {
                    // Field cleared — clear coords
                    updates.latitude = '';
                    updates.longitude = '';
                } else {
                    // Plain address changed — old coordinates are no longer trustworthy.
                    updates.latitude = '';
                    updates.longitude = '';
                }
            }

            if (name === 'currentLocation' && !prev.mapLink && looksLikeResolvableLocationInput(value)) {
                setLocationResolverMessage('');
                setLocationResolverState('idle');

                const coords = extractCoordsFromLink(value);
                if (coords) {
                    updates.latitude = coords.lat;
                    updates.longitude = coords.lng;
                    setLocationResolverMessage('Coordinates found directly in current location');
                    setLocationResolverState('success');
                } else {
                    updates.latitude = '';
                    updates.longitude = '';
                }
            }

            return updates;
        });
    };

    useEffect(() => {
        const lookupInput = formData.mapLink.trim() ||
            (looksLikeResolvableLocationInput(formData.currentLocation) ? formData.currentLocation.trim() : '');

        if (!lookupInput || lookupInput.length < 5) {
            return;
        }
        if (formData.latitude && formData.longitude) return;

        let cancelled = false;
        const timer = window.setTimeout(() => {
            setLocationResolverState('resolving');
            setLocationResolverMessage('Resolving precise coordinates...');
            resolveLocationCoordinates(lookupInput).then(result => {
                if (cancelled) return;
                if (result.coordinates) {
                    setFormData(prev => ({
                        ...prev,
                        latitude: result.coordinates!.lat,
                        longitude: result.coordinates!.lng
                    }));
                    setLocationResolverState('success');
                    setLocationResolverMessage(
                        result.provider === 'google-geocoding'
                            ? `Google resolved coordinates${result.accuracy ? ` (${result.accuracy})` : ''}`
                            : result.provider === 'osm-nominatim'
                                ? `OpenStreetMap resolved coordinates${result.accuracy ? ` (${result.accuracy})` : ''}`
                                : 'Coordinates resolved'
                    );
                } else {
                    setLocationResolverState('error');
                    setLocationResolverMessage(result.error || 'No precise coordinates found');
                }
            });
        }, 700);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [formData.mapLink, formData.currentLocation, formData.latitude, formData.longitude]);

    const applyResolvedCoordinates = (
        result: CoordinateResolution,
        onSuccess: (coords: { lat: string; lng: string }) => void,
        fallbackMessage = 'No precise coordinates found'
    ) => {
        if (result.coordinates) {
            onSuccess(result.coordinates);
            setLocationResolverState('success');
            setLocationResolverMessage(
                result.provider === 'google-geocoding'
                    ? `Google resolved coordinates${result.accuracy ? ` (${result.accuracy})` : ''}`
                    : result.provider === 'osm-nominatim'
                        ? `OpenStreetMap resolved coordinates${result.accuracy ? ` (${result.accuracy})` : ''}`
                        : 'Coordinates resolved'
            );
            return true;
        }

        setLocationResolverState('error');
        setLocationResolverMessage(result.error || fallbackMessage);
        return false;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shipment) return;

        setLoading(true);
        setGeocoding(true);

        const savedLocation = splitSavedLocation(shipment.currentLocation, shipment.locationDetail);
        const previousLocation = savedLocation.label;
        const previousLocationDetail = savedLocation.detail;
        const typedLocation = (formData.currentLocation || previousLocation || 'System')
            .replace(/\s*\[@-?\d+\.?\d*,-?\d+\.?\d*\]\s*$/, '')
            .trim();
        const locationDetail = formData.mapLink.trim();
        const currentFieldLookupInput = !locationDetail && looksLikeResolvableLocationInput(typedLocation) ? typedLocation : '';
        const lookupInput = locationDetail || currentFieldLookupInput;
        const locationDetailForSave = locationDetail || currentFieldLookupInput;
        const currentFieldIsMachineInput = !!currentFieldLookupInput && (!!extractCoordsFromLink(currentFieldLookupInput) || isMapUrlLike(currentFieldLookupInput));
        const displayName = currentFieldIsMachineInput
            ? (previousLocation || 'Pinned Location')
            : typedLocation;
        const isMapUrl = !!lookupInput && isMapUrlLike(lookupInput);

        let resolvedLat = formData.latitude;
        let resolvedLng = formData.longitude;
        let resolvedAddress = '';

        if (lookupInput) {
            if (!isMapUrl) {
                resolvedAddress = lookupInput;
            } else {
                if (!resolvedLat || !resolvedLng) {
                    const resolvedLinkResult = await resolveLocationCoordinates(lookupInput);
                    if (resolvedLinkResult.coordinates) {
                        resolvedLat = resolvedLinkResult.coordinates.lat;
                        resolvedLng = resolvedLinkResult.coordinates.lng;
                    } else {
                        setLocationResolverState('error');
                        setLocationResolverMessage(resolvedLinkResult.error || 'No precise coordinates found in map link');
                    }
                }

                // Maps URL — reverse-geocode coords for a display address
                if (resolvedLat && resolvedLng) {
                    resolvedAddress = await reverseGeocodeAddress(resolvedLat, resolvedLng) || '';
                }
                if (!resolvedAddress) {
                    resolvedAddress = extractPlaceNameFromMapLink(lookupInput);
                }
            }
        }

        const currentLoc = displayName || resolvedAddress || 'System';

        if ((!resolvedLat || !resolvedLng) && lookupInput && !isMapUrl && resolvedAddress.length >= 3) {
            const result = await resolveLocationCoordinates(resolvedAddress);
            applyResolvedCoordinates(result, coords => {
                resolvedLat = coords.lat;
                resolvedLng = coords.lng;
            });
        }

        setGeocoding(false);

        const statusChanged = formData.status !== shipment.status;
        const statusNote = formData.statusNote.trim();
        const noteChanged = statusNote.length > 0;
        const cleanShipmentLoc = previousLocation;
        const locationChanged = currentLoc !== cleanShipmentLoc || locationDetailForSave !== previousLocationDetail;
        const paymentChanged = formData.paymentStatus !== (shipment.paymentStatus || 'unpaid');
        const parsedLat = resolvedLat ? parseFloat(resolvedLat) : NaN;
        const parsedLng = resolvedLng ? parseFloat(resolvedLng) : NaN;
        const resolvedCoordinates = Number.isFinite(parsedLat) && Number.isFinite(parsedLng)
            ? { lat: parsedLat, lng: parsedLng }
            : undefined;
        const coordinatesChanged = !!resolvedCoordinates && (
            !shipment.coordinates ||
            shipment.coordinates.lat !== resolvedCoordinates.lat ||
            shipment.coordinates.lng !== resolvedCoordinates.lng
        );

        const updates: any = {};

        if (paymentChanged) {
            updates.payment_status = formData.paymentStatus;
        }

        if (!locationChanged && coordinatesChanged && resolvedCoordinates) {
            updates.coordinates = resolvedCoordinates;
        }

        try {
            // If status, note, or location changed, log it (saves status + current_location + history)
            if (statusChanged || locationChanged || noteChanged) {
                const result = await logShipmentEvent(shipment.id, {
                    status: formData.status,
                    location: currentLoc,
                    note: statusNote || (formData.status !== shipment.status
                        ? `Operational status changed to ${formData.status.toUpperCase()}`
                        : `Logistics update: Location updated`),
                    coordinates: locationChanged ? (resolvedCoordinates ?? null) : resolvedCoordinates,
                    locationDetail: locationDetailForSave
                });
                if (result.error) throw new Error(result.error);
            }

            // Update payment status or coordinates-only edits.
            if (Object.keys(updates).length > 0) {
                const result = await updateShipment(shipment.id, updates);
                if (result.error) throw result.error;
            }

            toast.showSuccess('Updated', 'Shipment status updated successfully');
            onSave();
        } catch (error) {
            console.error('Error updating shipment:', error);
            toast.showError('Error', error instanceof Error ? error.message : 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    if (!shipment) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <div
                className="bg-bgMain border border-borderColor rounded-sm p-8 max-w-lg w-full shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 border-b border-borderColor pb-4">
                    <h2 className="text-xl font-black heading-font uppercase tracking-tighter text-textMain">
                        Update // <span className="text-red-600">Status</span>
                    </h2>
                    <button onClick={onCancel} className="text-textMuted hover:text-red-600 transition-colors">
                        <Icon icon="solar:close-circle-linear" width="24" />
                    </button>
                </div>

                <div className="mb-6 p-4 bg-bgSurface/50 rounded-sm border border-borderColor flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-600/10 rounded-full flex items-center justify-center text-red-600">
                        <Icon icon="solar:box-linear" width="20" />
                    </div>
                    <div>
                        <p className="text-xs text-textMuted font-bold uppercase tracking-wider">Shipment ID</p>
                        <p className="text-sm font-black text-textMain">{shipment.id}</p>
                    </div>
                </div>


                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="metadata-label text-textMuted mb-1 block">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                        >
                            {SHIPMENT_STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <p className="text-[8px] text-textMuted mt-1 tracking-wider uppercase">
                            Allowed flow: pending · quoted · confirmed · in-transit · out-for-delivery · held · cancelled · delivered
                        </p>
                    </div>

                    <div>
                        <label className="metadata-label text-textMuted mb-1 block">Status Description</label>
                        <textarea
                            name="statusNote"
                            value={formData.statusNote}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none resize-none"
                            placeholder="E.G. HELD BY CUSTOMS PENDING CLEARANCE"
                        />
                        <p className="text-[8px] text-textMuted mt-1 tracking-wider uppercase">
                            Optional public note saved in tracking history
                        </p>
                    </div>

                    <div>
                        <label className="metadata-label text-textMuted mb-1 block">Current Location</label>
                        <input
                            name="currentLocation"
                            value={formData.currentLocation}
                            onChange={handleChange}
                            className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                            placeholder={shipment.currentLocation || "BUILDING / FACILITY NAME"}
                        />
                        <p className="text-[8px] text-textMuted mt-1 tracking-wider uppercase">
                            Use this for the public label, e.g. "Ikeja Sorting Hub"
                        </p>
                    </div>

                    <div>
                        <label className="metadata-label text-textMuted mb-1 block">Location Search</label>
                        <input
                            name="mapLink"
                            value={formData.mapLink}
                            onChange={handleChange}
                            className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none"
                            placeholder="PASTE FULL ADDRESS, COORDINATES, OR GOOGLE MAPS LINK"
                        />
                        {formData.mapLink && formData.latitude && formData.longitude ? (
                            <p className="text-[8px] text-green-500 mt-1 tracking-wider uppercase flex items-center gap-1">
                                <Icon icon="solar:check-circle-linear" width="10" />
                                Coordinates ready: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                            </p>
                        ) : locationResolverState === 'resolving' ? (
                            <p className="text-[8px] text-blue-400 mt-1 tracking-wider uppercase flex items-center gap-1">
                                <Icon icon="solar:refresh-linear" width="10" className="animate-spin" />
                                {locationResolverMessage || 'Resolving precise coordinates...'}
                            </p>
                        ) : locationResolverState === 'error' && locationResolverMessage ? (
                            <p className="text-[8px] text-amber-400 mt-1 tracking-wider uppercase flex items-center gap-1">
                                <Icon icon="solar:danger-triangle-linear" width="10" />
                                {locationResolverMessage}
                            </p>
                        ) : formData.mapLink && !(formData.mapLink.startsWith('http') || formData.mapLink.includes('google.com/maps')) ? (
                            <p className="text-[8px] text-blue-400 mt-1 tracking-wider uppercase flex items-center gap-1">
                                <Icon icon="solar:map-point-wave-linear" width="10" />
                                Address will be resolved with Google Maps
                            </p>
                        ) : (
                            <p className="text-[8px] text-textMuted mt-1 tracking-wider uppercase">
                                Best no-API option: paste coordinates from Google Maps, e.g. 9.0765, 7.3986
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Latitude</label>
                            <input
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none"
                                placeholder="Auto-resolved"
                            />
                        </div>
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Longitude</label>
                            <input
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none"
                                placeholder="Auto-resolved"
                            />
                        </div>
                    </div>

                    {!formData.latitude && !formData.longitude && (formData.currentLocation || formData.mapLink) && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                            <Icon icon="solar:map-arrow-square-linear" width="14" className="text-blue-400 shrink-0" />
                            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">
                                {formData.mapLink && !(formData.mapLink.startsWith('http') || formData.mapLink.includes('google.com/maps'))
                                    ? 'OpenStreetMap can miss Google-only addresses; paste coordinates for exact pins'
                                    : 'Paste a Google Maps link with coordinates or enter latitude/longitude manually'}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="metadata-label text-textMuted mb-1 block">Payment Status</label>
                        <select
                            name="paymentStatus"
                            value={formData.paymentStatus}
                            onChange={handleChange}
                            className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                        >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-borderColor">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-textMain transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-red-600 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    {geocoding ? (
                                        <>
                                            <Icon icon="solar:map-point-wave-linear" width="14" className="animate-pulse" />
                                            Resolving Location...
                                        </>
                                    ) : (
                                        'Saving...'
                                    )}
                                </>
                            ) : (
                                'Update Status'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default AdminStatusUpdater;
