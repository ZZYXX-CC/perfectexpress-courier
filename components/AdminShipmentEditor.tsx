import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Shipment, AddressInfo, ShipmentItem } from '../types';
import { supabase } from '../services/supabase';
import { useToast } from './ui/Toast';
import { generateTrackingNumber } from '../services/shipmentUtils';
import { notificationService } from '../services/notificationService';
import { emailService } from '../services/emailService';

interface AdminShipmentEditorProps {
    shipment?: Shipment | null;
    onSave: () => void;
    onCancel: () => void;
}

const AdminShipmentEditor: React.FC<AdminShipmentEditorProps> = ({ shipment, onSave, onCancel }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        senderName: '',
        senderEmail: '',
        senderAddress: '',
        receiverName: '',
        receiverEmail: '',
        receiverAddress: '',
        weight: '',
        description: '',
        serviceType: 'Standard',
        // New fields
        status: 'pending',
        price: '',
        currentLocation: '',
        createdAt: '',
        paymentStatus: 'unpaid'
    });

    useEffect(() => {
        if (shipment) {
            // Extract from JSONB if available, otherwise fallback
            const senderInfo = (shipment as any).sender_info || {};
            const receiverInfo = (shipment as any).receiver_info || {};
            const parcelDetails = (shipment as any).parcel_details || {};
            const raw = shipment as any;

            // Format date for datetime-local input
            const createdDate = shipment.createdAt || (shipment as any).created_at || shipment.estimatedArrival || '';
            const formattedDate = createdDate ? new Date(createdDate).toISOString().slice(0, 16) : '';

            setFormData({
                senderName: senderInfo.name || shipment.sender?.name || '',
                senderEmail: senderInfo.email || shipment.sender?.email || '',
                senderAddress: senderInfo.address || shipment.sender?.street || '',
                receiverName: receiverInfo.name || shipment.recipient?.name || '',
                receiverEmail: receiverInfo.email || shipment.recipient?.email || '',
                receiverAddress: receiverInfo.address || shipment.recipient?.street || '',
                weight: parcelDetails.weight || shipment.weight?.replace(' kg', '') || '',
                description: parcelDetails.description || shipment.items?.[0]?.description || '',
                serviceType: shipment.serviceType || 'Standard',
                // New fields
                status: shipment.status || 'pending',
                price: (shipment.price || raw.price)?.toString() || '',
                currentLocation: shipment.currentLocation || raw.current_location || '',
                createdAt: formattedDate,
                paymentStatus: shipment.paymentStatus || raw.payment_status || 'unpaid'
            });
        }
    }, [shipment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: Record<string, any> = {
            sender_info: {
                name: formData.senderName,
                email: formData.senderEmail,
                address: formData.senderAddress
            },
            receiver_info: {
                name: formData.receiverName,
                email: formData.receiverEmail,
                address: formData.receiverAddress
            },
            parcel_details: {
                weight: formData.weight,
                description: formData.description
            },
            service_type: formData.serviceType,
            status: formData.status,
            current_location: formData.currentLocation,
            payment_status: formData.paymentStatus,
            updated_at: new Date().toISOString()
        };

        // Add price if provided
        if (formData.price) {
            payload.price = parseFloat(formData.price);
        }

        // Add created_at if editing
        if (shipment && formData.createdAt) {
            payload.created_at = new Date(formData.createdAt).toISOString();
        }

        try {
            if (shipment) {
                const { error } = await supabase.from('shipments').update(payload).eq('tracking_number', shipment.id);
                if (error) throw error;

                // Notify the shipment owner about the edit
                const { data: ship } = await supabase.from('shipments').select('user_id').eq('tracking_number', shipment.id).single();
                if (ship?.user_id) {
                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                    if (ship.user_id !== currentUser?.id) {
                        const changes: string[] = [];
                        if (formData.status !== shipment.status) changes.push(`status → ${formData.status.toUpperCase()}`);
                        if (formData.paymentStatus !== (shipment.paymentStatus || (shipment as any).payment_status)) changes.push(`payment → ${formData.paymentStatus.toUpperCase()}`);
                        if (formData.price !== ((shipment.price || (shipment as any).price)?.toString() || '')) changes.push('price updated');
                        if (formData.currentLocation !== (shipment.currentLocation || (shipment as any).current_location || '')) changes.push(`location → ${formData.currentLocation}`);

                        await notificationService.createNotification({
                            user_id: ship.user_id,
                            type: 'shipment_update',
                            title: 'Shipment Updated',
                            message: changes.length > 0
                                ? `Your shipment ${shipment.id} was updated: ${changes.join(', ')}.`
                                : `Your shipment ${shipment.id} details have been updated.`,
                            link: `/track/${shipment.id}`
                        });
                    }
                }
            } else {
                // Generate tracking number for new shipments
                const trackingNumber = generateTrackingNumber();
                const senderEmail = formData.senderEmail?.trim();
                const receiverEmail = formData.receiverEmail?.trim();
                const ownerProfile =
                    (senderEmail ? await notificationService.findProfileByEmail(senderEmail) : null) ||
                    (receiverEmail ? await notificationService.findProfileByEmail(receiverEmail) : null);

                if (ownerProfile?.id) {
                    payload.user_id = ownerProfile.id;
                }

                const { data: createdShipment, error } = await supabase.from('shipments').insert([{
                    ...payload,
                    tracking_number: trackingNumber,
                    history: [{
                        status: 'pending',
                        location: 'System',
                        note: 'Shipment manifest created',
                        timestamp: new Date().toISOString()
                    }]
                }]).select().single();
                if (error) throw error;

                if (createdShipment) {
                    await notificationService.sendNewShipmentNotifications(createdShipment);

                    if (receiverEmail && receiverEmail.toLowerCase() !== (senderEmail || '').toLowerCase()) {
                        await notificationService.notifyUserByEmail(receiverEmail, {
                            type: 'shipment_update',
                            title: 'Incoming Shipment',
                            message: `${formData.senderName || 'A sender'} created a shipment to you. Tracking: ${trackingNumber}.`,
                            link: `/track/${trackingNumber}`
                        });

                        await emailService.sendEmail({
                            to: receiverEmail,
                            ...emailService.templates.receiverShipmentNotification(
                                trackingNumber,
                                formData.receiverName || 'Customer',
                                formData.senderName || 'PerfectExpress Customer'
                            )
                        });
                    }
                }
            }
            onSave();
            toast.showSuccess('Saved', shipment ? 'Shipment updated' : 'Shipment created');
        } catch {
            toast.showError('Error', 'Failed to save shipment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-bgMain border border-borderColor rounded-sm p-8 max-w-4xl mx-auto"
        >
            <div className="flex justify-between items-center mb-8 border-b border-borderColor pb-4">
                <h2 className="text-2xl font-black heading-font uppercase tracking-tighter text-textMain">
                    {shipment ? 'Edit Shipment' : 'New Shipment'} // <span className="text-red-600">Details</span>
                </h2>
                <button onClick={onCancel} className="text-textMuted hover:text-red-600 transition-colors">
                    <Icon icon="solar:close-circle-linear" width="24" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Sender Section */}
                <div className="space-y-6">
                    <h3 className="metadata-label text-red-600 border-b border-borderColor pb-2 mb-4">Sender Information</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Full Name</label>
                            <input
                                name="senderName"
                                value={formData.senderName}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                                placeholder="ENTER SENDER NAME"
                                required
                            />
                        </div>
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Email</label>
                            <input
                                name="senderEmail"
                                value={formData.senderEmail}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                                placeholder="EMAIL ADDR"
                            />
                        </div>
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Address</label>
                            <input
                                name="senderAddress"
                                value={formData.senderAddress}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                                placeholder="FULL STREET ADDRESS"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Receiver Section */}
                <div className="space-y-6">
                    <h3 className="metadata-label text-textMain border-b border-borderColor pb-2 mb-4">Receiver Information</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Full Name</label>
                            <input
                                name="receiverName"
                                value={formData.receiverName}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                                placeholder="ENTER RECEIVER NAME"
                                required
                            />
                        </div>
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Email</label>
                            <input
                                name="receiverEmail"
                                value={formData.receiverEmail}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                                placeholder="EMAIL ADDR"
                            />
                        </div>
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Address</label>
                            <input
                                name="receiverAddress"
                                value={formData.receiverAddress}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                                placeholder="FULL STREET ADDRESS"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Parcel Section - Full Width */}
                <div className="md:col-span-2 space-y-6 mt-4">
                    <h3 className="metadata-label text-textMuted border-b border-borderColor pb-2 mb-4">Parcel Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Description</label>
                            <input
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                                placeholder="E.G. ELECTRONICS"
                            />
                        </div>
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Weight (kg)</label>
                            <input
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Service Type</label>
                            <select
                                name="serviceType"
                                value={formData.serviceType}
                                onChange={handleChange}
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none uppercase"
                            >
                                <option value="Standard">Standard Freight</option>
                                <option value="Express">Express Air</option>
                                <option value="Luxury">Secure / Luxury</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Administrative Details */}
                <div className="md:col-span-2 space-y-6 mt-4">
                    <h3 className="metadata-label text-textMuted border-b border-borderColor pb-2 mb-4">Administrative Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Quoted Price ($)</label>
                            <input
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                type="number"
                                step="0.01"
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="metadata-label text-textMuted mb-1 block">Created Date</label>
                            <input
                                name="createdAt"
                                value={formData.createdAt}
                                onChange={handleChange}
                                type="datetime-local"
                                className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm font-bold text-textMain focus:border-red-600 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="md:col-span-2 flex justify-end gap-4 mt-8 pt-6 border-t border-borderColor">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-textMain transition-colors"
                    >
                        Cancel Operation
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-red-600 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : shipment ? 'Update Manifest' : 'Create Manifest'}
                    </button>
                </div>

            </form>
        </motion.div>
    );
};

export default AdminShipmentEditor;
