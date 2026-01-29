import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface UserSettingsProps {
    onBack: () => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await new Promise(r => setTimeout(r, 1200)); // Simulate save
        setLoading(false);
    };

    return (
        <section className="pt-32 pb-24 bg-bgMain min-h-screen">
            <div className="container mx-auto px-6 max-w-5xl">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-red-600 transition-colors mb-6"
                    >
                        <iconify-icon icon="solar:arrow-left-linear" width="16"></iconify-icon>
                        Back to Dashboard
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-bgSurface border border-borderColor rounded-sm flex items-center justify-center text-red-600">
                             <iconify-icon icon="solar:settings-linear" width="24"></iconify-icon>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold heading-font uppercase tracking-tighter text-textMain">
                            Account <span className="text-textMuted">Config</span>
                        </h1>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar Nav */}
                    <div className="md:col-span-1 space-y-2">
                        {[
                            { id: 'profile', label: 'Profile Data', icon: 'solar:user-id-linear' },
                            { id: 'security', label: 'Security & Login', icon: 'solar:shield-keyhole-linear' },
                            { id: 'notifications', label: 'Notifications', icon: 'solar:bell-linear' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-4 border rounded-sm transition-all text-[10px] font-black uppercase tracking-widest ${
                                    activeTab === tab.id 
                                    ? 'bg-bgSurface border-red-600 text-textMain shadow-[inset_4px_0_0_0_#dc2626]' 
                                    : 'bg-transparent border-borderColor text-textMuted hover:bg-bgSurface hover:text-textMain'
                                }`}
                            >
                                <iconify-icon icon={tab.icon} width="16"></iconify-icon>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Form Area */}
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="md:col-span-3 bg-bgSurface/20 border border-borderColor rounded-sm p-8 md:p-12 relative overflow-hidden"
                    >
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <iconify-icon icon="solar:settings-linear" width="200"></iconify-icon>
                        </div>

                        <form onSubmit={handleSave}>
                            {activeTab === 'profile' && (
                                <div className="space-y-8 relative z-10">
                                    <div className="border-b border-borderColor pb-6 mb-6">
                                        <h2 className="text-lg font-bold text-textMain uppercase tracking-tight mb-1">Personal Information</h2>
                                        <p className="text-xs text-textMuted">Update your identification details and company association.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Full Name</label>
                                            <input type="text" defaultValue="ALEX MERCER" className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Email Address</label>
                                            <input type="email" defaultValue="alex.mercer@innovate.corp" className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Company Name</label>
                                            <input type="text" defaultValue="INNOVATE CORP" className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Phone Number</label>
                                            <input type="text" defaultValue="+1 (555) 019-2834" className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-8 relative z-10">
                                    <div className="border-b border-borderColor pb-6 mb-6">
                                        <h2 className="text-lg font-bold text-textMain uppercase tracking-tight mb-1">Security Credentials</h2>
                                        <p className="text-xs text-textMuted">Manage your password and two-factor authentication.</p>
                                    </div>
                                    <div className="space-y-6 max-w-md">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Current Password</label>
                                            <input type="password" placeholder="••••••••••••" className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">New Password</label>
                                            <input type="password" placeholder="••••••••••••" className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Confirm New Password</label>
                                            <input type="password" placeholder="••••••••••••" className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" />
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-borderColor">
                                        <div className="flex items-center justify-between p-4 bg-bgMain border border-borderColor rounded-sm">
                                            <div>
                                                <p className="text-xs font-bold text-textMain uppercase tracking-wide">Two-Factor Authentication</p>
                                                <p className="text-[10px] text-textMuted mt-1">Add an extra layer of security to your account.</p>
                                            </div>
                                            <button type="button" className="text-[9px] font-black uppercase tracking-widest text-red-600 hover:text-white transition-colors">Enable</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-8 relative z-10">
                                    <div className="border-b border-borderColor pb-6 mb-6">
                                        <h2 className="text-lg font-bold text-textMain uppercase tracking-tight mb-1">Alert Preferences</h2>
                                        <p className="text-xs text-textMuted">Configure how you receive shipment updates.</p>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { title: "Shipment Delivered", desc: "Notify me when a package arrives at its destination." },
                                            { title: "Exception Alerts", desc: "Notify me immediately if a delay or issue occurs." },
                                            { title: "Out for Delivery", desc: "Notify me when the courier is on the final mile." },
                                            { title: "Promotional Offers", desc: "Receive updates about new routes and pricing tiers." }
                                        ].map((setting, idx) => (
                                            <div key={idx} className="flex items-start justify-between p-4 bg-bgMain border border-borderColor rounded-sm hover:border-textMuted/30 transition-colors">
                                                <div>
                                                    <p className="text-xs font-bold text-textMain uppercase tracking-wide">{setting.title}</p>
                                                    <p className="text-[10px] text-textMuted mt-1">{setting.desc}</p>
                                                </div>
                                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                                    <input type="checkbox" defaultChecked={idx < 3} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-red-600 right-5" />
                                                    <label className="toggle-label block overflow-hidden h-5 rounded-full bg-bgSurface cursor-pointer border border-borderColor"></label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-10 pt-8 border-t border-borderColor flex justify-end">
                                <button 
                                    disabled={loading}
                                    className="px-10 py-4 bg-red-600 text-white hover:bg-red-700 rounded-sm font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <iconify-icon icon="solar:refresh-linear" width="16" class="animate-spin"></iconify-icon>
                                            Saving Changes
                                        </>
                                    ) : (
                                        'Save Configuration'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
            <style>{`
                .toggle-checkbox:checked {
                    right: 0;
                    border-color: #dc2626;
                }
                .toggle-checkbox:checked + .toggle-label {
                    background-color: #dc2626;
                }
            `}</style>
        </section>
    );
};

export default UserSettings;
