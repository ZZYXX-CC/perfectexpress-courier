import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { createShipment, ShipmentData } from '../services/shipmentService';

interface ShipmentFormProps {
    onSuccess: (trackingNumber: string) => void;
    onCancel: () => void;
}

export const ShipmentForm: React.FC<ShipmentFormProps> = ({ onSuccess, onCancel }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<ShipmentData>({
        sender_info: { name: '', email: '', address: '', phone: '' },
        receiver_info: { name: '', email: '', address: '', phone: '' },
        parcel_details: { description: '', weight: '', quantity: '1', type: 'Package' }
    });

    const handleChange = (section: keyof ShipmentData, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] as any),
                [field]: value
            }
        }));
    };

    const nextStep = () => {
        if (validateStep()) setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    const validateStep = () => {
        if (step === 1) {
            const { name, email, address } = formData.sender_info;
            if (!name || !email || !address) {
                setError('Please fill in all sender details');
                return false;
            }
        }
        if (step === 2) {
            const { name, address } = formData.receiver_info;
            if (!name || !address) {
                setError('Please fill in receiver details');
                return false;
            }
        }
        setError(null);
        return true;
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await createShipment(formData);
            if (result.error) {
                setError(result.error);
            } else if (result.trackingNumber) {
                onSuccess(result.trackingNumber);
            }
        } catch (err) {
            console.error('Shipment submit failed:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, name: 'Sender', icon: 'solar:user-rounded-linear' },
        { id: 2, name: 'Receiver', icon: 'solar:user-check-rounded-linear' },
        { id: 3, name: 'Parcel', icon: 'solar:box-linear' },
        { id: 4, name: 'Review', icon: 'solar:clipboard-check-linear' }
    ];

    return (
        <div className="bg-bgMain border border-borderColor rounded-sm overflow-hidden shadow-2xl max-w-2xl mx-auto">
            {/* Steps Indicator */}
            <div className="flex border-b border-borderColor bg-bgSurface/20">
                {steps.map((s) => (
                    <div
                        key={s.id}
                        className={`flex-1 p-4 flex flex-col items-center gap-2 border-r border-borderColor last:border-0 transition-opacity ${step >= s.id ? 'opacity-100' : 'opacity-30'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${step === s.id ? 'bg-red-600 text-white' : step > s.id ? 'bg-textMain text-bgMain' : 'bg-bgSurface text-textMuted border border-borderColor'}`}>
                            {step > s.id ? <Icon icon="solar:check-read-linear" width="16" /> : s.id}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">{s.name}</span>
                    </div>
                ))}
            </div>

            <div className="p-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-600/10 border border-red-600/20 rounded-sm flex items-center gap-3 animate-shake">
                        <Icon icon="solar:danger-triangle-linear" className="text-red-600" width="20" />
                        <p className="text-[11px] font-black uppercase tracking-widest text-red-600">{error}</p>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="metadata-label mb-2 block">Full Name</label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            value={formData.sender_info.name}
                                            onChange={(e) => handleChange('sender_info', 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="metadata-label mb-2 block">Email Address</label>
                                        <input
                                            type="email"
                                            className="admin-input"
                                            value={formData.sender_info.email}
                                            onChange={(e) => handleChange('sender_info', 'email', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="metadata-label mb-2 block">Phone Number</label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            value={formData.sender_info.phone}
                                            onChange={(e) => handleChange('sender_info', 'phone', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="metadata-label mb-2 block">Pickup Address</label>
                                        <textarea
                                            className="admin-input min-h-[100px]"
                                            value={formData.sender_info.address}
                                            onChange={(e) => handleChange('sender_info', 'address', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="metadata-label mb-2 block">Recipient Name</label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            value={formData.receiver_info.name}
                                            onChange={(e) => handleChange('receiver_info', 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="metadata-label mb-2 block">Contact Email</label>
                                        <input
                                            type="email"
                                            className="admin-input"
                                            value={formData.receiver_info.email}
                                            onChange={(e) => handleChange('receiver_info', 'email', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="metadata-label mb-2 block">Contact Phone</label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            value={formData.receiver_info.phone}
                                            onChange={(e) => handleChange('receiver_info', 'phone', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="metadata-label mb-2 block">Delivery Address</label>
                                        <textarea
                                            className="admin-input min-h-[100px]"
                                            value={formData.receiver_info.address}
                                            onChange={(e) => handleChange('receiver_info', 'address', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="metadata-label mb-2 block">Content Description</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Electronic components, Personal clothes"
                                            className="admin-input"
                                            value={formData.parcel_details.description}
                                            onChange={(e) => handleChange('parcel_details', 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="metadata-label mb-2 block">Weight (kg)</label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            value={formData.parcel_details.weight}
                                            onChange={(e) => handleChange('parcel_details', 'weight', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="metadata-label mb-2 block">Quantity</label>
                                        <input
                                            type="number"
                                            className="admin-input"
                                            value={formData.parcel_details.quantity}
                                            onChange={(e) => handleChange('parcel_details', 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="metadata-label mb-2 block">Parcel Type</label>
                                        <select
                                            className="admin-input"
                                            value={formData.parcel_details.type}
                                            onChange={(e) => handleChange('parcel_details', 'type', e.target.value)}
                                        >
                                            <option>Package</option>
                                            <option>Document</option>
                                            <option>Pallet</option>
                                            <option>Container</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-8 text-[11px]">
                                    <div className="space-y-3">
                                        <h4 className="font-black uppercase text-red-600 tracking-widest border-b border-borderColor pb-1">Origin</h4>
                                        <p className="font-bold text-textMain uppercase">{formData.sender_info.name}</p>
                                        <p className="text-textMuted leading-relaxed">{formData.sender_info.address}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="font-black uppercase text-red-600 tracking-widest border-b border-borderColor pb-1">Destination</h4>
                                        <p className="font-bold text-textMain uppercase">{formData.receiver_info.name}</p>
                                        <p className="text-textMuted leading-relaxed">{formData.receiver_info.address}</p>
                                    </div>
                                    <div className="col-span-2 space-y-3">
                                        <h4 className="font-black uppercase text-red-600 tracking-widest border-b border-borderColor pb-1">Parcel Inventory</h4>
                                        <div className="bg-bgSurface/20 p-4 border border-borderColor flex justify-between">
                                            <div>
                                                <p className="text-textMain font-bold uppercase">{formData.parcel_details.description}</p>
                                                <p className="text-[9px] text-textMuted uppercase mt-1">Type: {formData.parcel_details.type} • Qty: {formData.parcel_details.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-textMain font-black">{formData.parcel_details.weight} KG</p>
                                                <p className="text-[9px] text-red-600 uppercase mt-1 font-bold italic tracking-widest">Est. Weight</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Footer Controls */}
                <div className="mt-10 flex justify-between border-t border-borderColor pt-8">
                    {step === 1 ? (
                        <button onClick={onCancel} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-red-600 transition-colors">
                            Cancel
                        </button>
                    ) : (
                        <button onClick={prevStep} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-textMain transition-colors flex items-center gap-2">
                            <Icon icon="solar:arrow-left-linear" width="16" />
                            Previous
                        </button>
                    )}

                    {step < 4 ? (
                        <button
                            onClick={nextStep}
                            className="bg-textMain text-bgMain px-8 py-3 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                        >
                            Next Step
                            <Icon icon="solar:arrow-right-linear" width="16" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-red-600 text-white px-10 py-3 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <Icon icon="solar:refresh-linear" width="16" className="animate-spin" />
                            ) : (
                                <Icon icon="solar:check-read-linear" width="16" />
                            )}
                            Finalize Booking
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
