import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Shipment, AddressInfo, ShipmentItem } from '../types';
import { supabase } from '../services/supabase';

interface AdminShipmentEditorProps {
    shipment?: Shipment | null;
    onSave: () => void;
    onCancel: () => void;
}

const AdminShipmentEditor: React.FC<AdminShipmentEditorProps> = ({ shipment, onSave, onCancel }) => {
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
        serviceType: 'Standard'
    });

    useEffect(() => {
        if (shipment) {
            // Extract from JSONB if available, otherwise fallback
            const senderInfo = (shipment as any).sender_info || {};
            const receiverInfo = (shipment as any).receiver_info || {};
            const parcelDetails = (shipment as any).parcel_details || {};

            setFormData({
                senderName: senderInfo.name || shipment.sender?.name || '',
                senderEmail: senderInfo.email || '',
                senderAddress: senderInfo.address || shipment.sender?.street || '',
                receiverName: receiverInfo.name || shipment.recipient?.name || '',
                receiverEmail: receiverInfo.email || '',
                receiverAddress: receiverInfo.address || shipment.recipient?.street || '',
                weight: parcelDetails.weight || shipment.weight?.replace(' kg', '') || '',
                description: parcelDetails.description || shipment.items?.[0]?.description || '',
                serviceType: shipment.serviceType || 'Standard'
            });
        }
    }, [shipment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
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
            status: shipment ? shipment.status : 'pending',
            updated_at: new Date().toISOString()
        };

        try {
            if (shipment) {
                // Use tracking_number for updates since shipment.id is the tracking_number string
                const { error } = await supabase.from('shipments').update(payload).eq('tracking_number', shipment.id);
                if (error) throw error;
            } else {
                // Generate tracking number for new shipments
                const trackingNumber = `PFX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                const { error } = await supabase.from('shipments').insert([{
                    ...payload,
                    tracking_number: trackingNumber,
                    history: [{
                        status: 'pending',
                        location: 'System',
                        note: 'Shipment manifest created',
                        timestamp: new Date().toISOString()
                    }]
                }]);
                if (error) throw error;
            }
            onSave();
        } catch (error) {
            console.error('Error saving shipment:', error);
            alert('Failed to save shipment.');
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
