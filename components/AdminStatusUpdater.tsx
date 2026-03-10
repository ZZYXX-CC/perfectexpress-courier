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

const AdminStatusUpdater: React.FC<AdminStatusUpdaterProps> = ({ shipment, onSave, onCancel }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        status: 'pending',
        currentLocation: '',
        paymentStatus: 'unpaid',
        latitude: '',
        longitude: '',
        mapLink: '' // New field for pasting links
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

            // Auto-parse map link
            if (name === 'mapLink' && value) {
                const coordinatePatterns = [
                    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // @lat,lng
                    /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // ?q=lat,lng
                    /[?&]ll=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // ?ll=lat,lng
                    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // !3dlat!4dlng
                    /(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/ // plain "lat,lng"
                ];

                const match = coordinatePatterns
                    .map((pattern) => value.match(pattern))
                    .find(Boolean);

                if (match) {
                    updates.latitude = match[1];
                    updates.longitude = match[2];
                }
            }
            return updates;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shipment) return;

        setLoading(true);

        const currentLoc = formData.currentLocation || shipment.currentLocation || 'System';

        const statusChanged = formData.status !== shipment.status;
        const locationChanged = formData.currentLocation !== shipment.currentLocation;
        const paymentChanged = formData.paymentStatus !== (shipment.paymentStatus || 'unpaid');

        const updates: any = {};

        if (paymentChanged) {
            updates.payment_status = formData.paymentStatus;
        }

        if (formData.latitude && formData.longitude) {
            updates.coordinates = {
                lat: parseFloat(formData.latitude),
                lng: parseFloat(formData.longitude)
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
        } catch (error) {
            console.error('Error updating status:', error);
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

                {/* Smart Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        type="button"
                        onClick={() => {
                            const originLabel = shipment.sender.city || shipment.origin || 'Origin';
                            setFormData(prev => ({
                                ...prev,
                                status: 'in-transit',
                                currentLocation: `${originLabel} Logistics Center`
                            }));
                        }}
                        className="p-3 border border-borderColor rounded-sm hover:border-red-600 hover:text-red-600 text-textMuted text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2 group"
                    >
                        <Icon icon="solar:transmission-square-linear" width="20" className="group-hover:scale-110 transition-transform" />
                        Quick Dispatch
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const destinationLabel = shipment.recipient.city || shipment.destination || 'Destination';
                            setFormData(prev => ({
                                ...prev,
                                status: 'out-for-delivery',
                                currentLocation: `${destinationLabel} Delivery Hub`
                            }));
                        }}
                        className="p-3 border border-borderColor rounded-sm hover:border-green-600 hover:text-green-600 text-textMuted text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2 group"
                    >
                        <Icon icon="solar:delivery-linear" width="20" className="group-hover:scale-110 transition-transform" />
                        Out for Delivery
                    </button>
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
                            <option value="pending">Order Created</option>
                            <option value="quoted">Quote Issued</option>
                            <option value="confirmed">Payment Confirmed</option>
                            <option value="in-transit">In Transit</option>
                            <option value="out-for-delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="held">Held / Exception</option>
                            <option value="cancelled">Order Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label className="metadata-label text-textMuted mb-1 block">Current Location</label>
                        <input
                            name="currentLocation"
                            value={formData.currentLocation}
                            onChange={handleChange}
                            className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                            placeholder={shipment.currentLocation || "CITY, COUNTRY"}
                        />
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Latitude</label>
                            <input
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none"
                                placeholder="0.000000"
                            />
                        </div>
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Longitude</label>
                            <input
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none"
                                placeholder="0.000000"
                            />
                        </div>
                    </div>

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
                            className="px-6 py-3 bg-red-600 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default AdminStatusUpdater;
