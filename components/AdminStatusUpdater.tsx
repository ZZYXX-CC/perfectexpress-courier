import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Shipment } from '../types';
import { supabase } from '../services/supabase';
import { useToast } from './ui/Toast';
import { updateShipment, logShipmentEvent } from '../services/adminService';

interface AdminStatusUpdaterProps {
    shipment: Shipment | null;
    onSave: () => void;
    onCancel: () => void;
}

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

    const patterns = [
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,           // @lat,lng
        /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,      // ?q=lat,lng
        /\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,    // /place/lat,lng
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,        // !3dlat!4dlng
        /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,      // ll=lat,lng
        /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,  // center=lat,lng
        /\/dir\/.*?(-?\d+\.?\d*),(-?\d+\.?\d*)/,   // /dir/.../lat,lng
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            // Sanity check: valid coordinate ranges
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { lat: match[1], lng: match[2] };
            }
        }
    }
    return null;
}

/**
 * Geocode an address string to lat/lng via Nominatim.
 */
async function geocodeAddress(address: string): Promise<{ lat: string; lng: string } | null> {
    if (!address || address.trim().length < 3) return null;

    try {
        const encoded = encodeURIComponent(address.trim());
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
            { headers: { 'Accept': 'application/json' } }
        );
        if (!res.ok) return null;

        const data = await res.json();
        if (data && data.length > 0) {
            return { lat: data[0].lat, lng: data[0].lon };
        }
        return null;
    } catch {
        return null;
    }
}

// ─── Component ───────────────────────────────────────────────────────

const AdminStatusUpdater: React.FC<AdminStatusUpdaterProps> = ({ shipment, onSave, onCancel }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const [formData, setFormData] = useState({
        status: 'pending',
        currentLocation: '',
        paymentStatus: 'unpaid',
        latitude: '',
        longitude: '',
        mapLink: ''
    });

    useEffect(() => {
        if (shipment) {
            setFormData({
                status: shipment.status || 'pending',
                currentLocation: shipment.currentLocation || '',
                paymentStatus: shipment.paymentStatus || 'unpaid',
                latitude: shipment.coordinates?.lat?.toString() || '',
                longitude: shipment.coordinates?.lng?.toString() || '',
                mapLink: ''
            });
        }
    }, [shipment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates = { ...prev, [name]: value };

            // Auto-parse map link for coordinates
            if (name === 'mapLink' && value) {
                const coords = extractCoordsFromLink(value);
                if (coords) {
                    updates.latitude = coords.lat;
                    updates.longitude = coords.lng;
                }
            }
            return updates;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shipment) return;

        setLoading(true);

        let resolvedLat = formData.latitude;
        let resolvedLng = formData.longitude;

        // ── Auto-geocode: if admin didn't provide coords, resolve them ──
        if (!resolvedLat || !resolvedLng) {
            setGeocoding(true);

            // Priority 1: Try geocoding from map link (if it contains a place name, not coords)
            if (formData.mapLink && !resolvedLat) {
                // If the link has a place/ segment with a name instead of coords
                const placeMatch = formData.mapLink.match(/\/place\/([^/]+)/);
                if (placeMatch) {
                    const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
                    if (!/^-?\d/.test(placeName)) {
                        const result = await geocodeAddress(placeName);
                        if (result) {
                            resolvedLat = result.lat;
                            resolvedLng = result.lng;
                        }
                    }
                }
            }

            // Priority 2: Geocode the currentLocation text
            if ((!resolvedLat || !resolvedLng) && formData.currentLocation) {
                const result = await geocodeAddress(formData.currentLocation);
                if (result) {
                    resolvedLat = result.lat;
                    resolvedLng = result.lng;
                }
            }

            // Priority 3: Geocode the shipment's city name
            if ((!resolvedLat || !resolvedLng) && shipment) {
                const cityFallback = shipment.recipient?.city || shipment.sender?.city || '';
                const countryFallback = shipment.recipient?.country || shipment.sender?.country || '';
                const fallbackAddress = [cityFallback, countryFallback].filter(Boolean).join(', ');
                if (fallbackAddress.length >= 3) {
                    const result = await geocodeAddress(fallbackAddress);
                    if (result) {
                        resolvedLat = result.lat;
                        resolvedLng = result.lng;
                    }
                }
            }

            setGeocoding(false);
        }

        const currentLoc = formData.currentLocation || shipment.currentLocation || 'System';

        const statusChanged = formData.status !== shipment.status;
        const locationChanged = formData.currentLocation !== shipment.currentLocation;
        const paymentChanged = formData.paymentStatus !== (shipment.paymentStatus || 'unpaid');

        const updates: any = {};

        if (paymentChanged) {
            updates.payment_status = formData.paymentStatus;
        }

        if (resolvedLat && resolvedLng) {
            updates.coordinates = {
                lat: parseFloat(resolvedLat),
                lng: parseFloat(resolvedLng)
            };
        }

        try {
            // If status OR location changed, log it (handles history + status updates)
            if (statusChanged || locationChanged) {
                await logShipmentEvent(shipment.id, {
                    status: formData.status,
                    location: currentLoc,
                    note: formData.status !== shipment.status
                        ? `Operational status changed to ${formData.status.toUpperCase()}`
                        : `Logistics update: Arrived at ${currentLoc}`
                });
            }

            // Update any remaining fields (payment status / coordinates)
            if (Object.keys(updates).length > 0) {
                const result = await updateShipment(shipment.id, updates);
                if (result.error) throw result.error;
            }

            toast.showSuccess('Updated', 'Shipment status updated successfully');
            onSave();
        } catch {
            toast.showError('Error', 'Failed to update status');
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
                        <input
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                            placeholder="ENTER STATUS (E.G. IN-TRANSIT, HELD, DELIVERED)"
                        />
                        <p className="text-[8px] text-textMuted mt-1 tracking-wider uppercase">
                            Common: pending · quoted · confirmed · in-transit · out-for-delivery · delivered · held · cancelled
                        </p>
                    </div>

                    <div>
                        <label className="metadata-label text-textMuted mb-1 block">Current Location</label>
                        <input
                            name="currentLocation"
                            value={formData.currentLocation}
                            onChange={handleChange}
                            className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                            placeholder={shipment.currentLocation || "FULL ADDRESS, CITY, COUNTRY"}
                        />
                        <p className="text-[8px] text-textMuted mt-1 tracking-wider uppercase">
                            Tip: Enter a specific address for precise map pin placement
                        </p>
                    </div>

                    <div>
                        <label className="metadata-label text-textMuted mb-1 block">Google Maps Link</label>
                        <input
                            name="mapLink"
                            value={formData.mapLink}
                            onChange={handleChange}
                            className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none"
                            placeholder="PASTE MAPS LINK HERE TO AUTO-FILL COORDS"
                        />
                        {formData.mapLink && formData.latitude && formData.longitude && (
                            <p className="text-[8px] text-green-500 mt-1 tracking-wider uppercase flex items-center gap-1">
                                <Icon icon="solar:check-circle-linear" width="10" />
                                Coordinates extracted: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
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

                    {!formData.latitude && !formData.longitude && formData.currentLocation && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                            <Icon icon="solar:map-arrow-square-linear" width="14" className="text-blue-400 shrink-0" />
                            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">
                                Coordinates will be auto-resolved from the address on save
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
