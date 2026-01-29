import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabase';

interface UserSettingsProps {
    onBack: () => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        companyName: '',
        phoneNumber: ''
    });

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setProfileLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setFormData({
                    fullName: profile.full_name || '',
                    email: profile.email || user.email || '',
                    companyName: '',
                    phoneNumber: ''
                });
            } else {
                setFormData({
                    fullName: user.user_metadata?.full_name || '',
                    email: user.email || '',
                    companyName: '',
                    phoneNumber: ''
                });
            }
            setProfileLoading(false);
        };

        loadProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.fullName,
                    email: formData.email,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            alert('Profile updated successfully');
        } catch (err: any) {
            console.error('Error saving profile:', err);
            alert('Failed to save profile: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
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
                                    {profileLoading ? (
                                        <div className="text-center py-12">
                                            <div className="inline-block animate-spin mb-4">
                                                <iconify-icon icon="solar:refresh-linear" width="32" class="text-red-600"></iconify-icon>
                                            </div>
                                            <p className="text-textMuted text-sm">Loading profile...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Full Name</label>
                                                <input 
                                                    type="text" 
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" 
                                                    placeholder="FULL NAME"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Email Address</label>
                                                <input 
                                                    type="email" 
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" 
                                                    placeholder="EMAIL@DOMAIN.COM"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Company Name</label>
                                                <input 
                                                    type="text" 
                                                    value={formData.companyName}
                                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" 
                                                    placeholder="COMPANY NAME"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Phone Number</label>
                                                <input 
                                                    type="text" 
                                                    value={formData.phoneNumber}
                                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" 
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            </div>
                                        </div>
                                    )}
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
                                            <div className="relative">
                                                <input 
                                                    type={showCurrentPassword ? "text" : "password"} 
                                                    placeholder="••••••••••••" 
                                                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 pr-12 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" 
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-textMuted hover:text-textMain transition-colors"
                                                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                                >
                                                    <iconify-icon icon={showCurrentPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} width="18"></iconify-icon>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">New Password</label>
                                            <div className="relative">
                                                <input 
                                                    type={showNewPassword ? "text" : "password"} 
                                                    placeholder="••••••••••••" 
                                                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 pr-12 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" 
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-textMuted hover:text-textMain transition-colors"
                                                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                                                >
                                                    <iconify-icon icon={showNewPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} width="18"></iconify-icon>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Confirm New Password</label>
                                            <div className="relative">
                                                <input 
                                                    type={showConfirmPassword ? "text" : "password"} 
                                                    placeholder="••••••••••••" 
                                                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 pr-12 py-3 focus:border-red-600 outline-none text-xs font-bold uppercase tracking-widest text-textMain" 
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-textMuted hover:text-textMain transition-colors"
                                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                >
                                                    <iconify-icon icon={showConfirmPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} width="18"></iconify-icon>
                                                </button>
                                            </div>
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
