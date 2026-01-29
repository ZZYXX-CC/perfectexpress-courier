import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shipment, User } from '../types';
import { supabase } from '../services/supabase';
import { fetchRealShipment } from '../services/geminiService';

interface UserDashboardProps {
   user: User;
   onTrack: (id: string) => void;
   onNavigate: (page: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onTrack, onNavigate }) => {
   const [shipments, setShipments] = useState<Shipment[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const loadShipments = async () => {
         const { data: { user: authUser } } = await supabase.auth.getUser();
         if (!authUser) return;

         const { data, error } = await supabase
            .from('shipments')
            .select('tracking_number')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false });

         if (data) {
            const fetchedShipments = await Promise.all(
               data.map(s => fetchRealShipment(s.tracking_number))
            );
            setShipments(fetchedShipments.filter(Boolean) as Shipment[]);
         }
         setLoading(false);
      };

      loadShipments();
   }, []);

   const spendData = [
      { month: 'JAN', amount: 450 },
      { month: 'FEB', amount: 920 },
      { month: 'MAR', amount: 340 },
      { month: 'APR', amount: 1250 },
      { month: 'MAY', amount: 890 },
      { month: 'JUN', amount: 670 },
   ];
   return (
      <section className="pt-32 pb-24 bg-bgMain min-h-screen">
         <div className="container mx-auto px-6">
            {/* Header */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-borderColor pb-8"
            >
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     <span className="metadata-label text-textMuted">Secure Connection Established</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extrabold heading-font uppercase tracking-tighter text-textMain">
                     Welcome, <span className="text-red-600">{user.name}</span>
                  </h1>
               </div>
               <div className="mt-6 md:mt-0 flex gap-4">
                  <div className="text-right">
                     <p className="text-[9px] font-black uppercase tracking-widest text-textMuted mb-1">Account ID</p>
                     <p className="text-sm font-bold text-textMain">PX-{Math.floor(Math.random() * 900000) + 100000}</p>
                  </div>
                  <div className="text-right border-l border-borderColor pl-4">
                     <p className="text-[9px] font-black uppercase tracking-widest text-textMuted mb-1">Plan Tier</p>
                     <p className="text-sm font-bold text-textMain">Enterprise</p>
                  </div>
               </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

               {/* Main Content: Active Manifest */}
               <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-2 space-y-10"
               >
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     <div className="bg-bgSurface p-6 rounded-sm border border-borderColor">
                        <div className="flex items-center gap-2 mb-4">
                           <iconify-icon icon="solar:box-linear" width="16" class="text-red-600"></iconify-icon>
                           <span className="text-[9px] font-black uppercase tracking-widest text-textMuted">Active</span>
                        </div>
                        <p className="text-3xl font-black heading-font text-textMain">
                           {shipments.filter(s => s.status !== 'Delivered').length}
                        </p>
                     </div>
                     <div className="bg-bgSurface p-6 rounded-sm border border-borderColor">
                        <div className="flex items-center gap-2 mb-4">
                           <iconify-icon icon="solar:verified-check-linear" width="16" class="text-red-600"></iconify-icon>
                           <span className="text-[9px] font-black uppercase tracking-widest text-textMuted">Delivered</span>
                        </div>
                        <p className="text-3xl font-black heading-font text-textMain">
                           {shipments.filter(s => s.status === 'Delivered').length}
                        </p>
                     </div>
                     <div className="hidden md:block bg-bgSurface p-6 rounded-sm border border-borderColor">
                        <div className="flex items-center gap-2 mb-4">
                           <iconify-icon icon="solar:wallet-linear" width="16" class="text-red-600"></iconify-icon>
                           <span className="text-[9px] font-black uppercase tracking-widest text-textMuted">Balance</span>
                        </div>
                        <p className="text-3xl font-black heading-font text-textMain">$0.00</p>
                     </div>
                  </div>

                  {/* Manifest List */}
                  <div className="bg-bgSurface/20 border border-borderColor rounded-sm overflow-hidden">
                     <div className="p-6 border-b border-borderColor flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-widest text-textMain">Active Manifest</h3>
                        <button className="text-[9px] font-black uppercase tracking-widest text-red-600 hover:text-white transition-colors">View All</button>
                     </div>
                     <div className="divide-y divide-borderColor">
                        {loading ? (
                           <div className="p-12 text-center text-textMuted animate-pulse uppercase tracking-[0.3em] text-[10px] font-black">
                              Fetching Network Manifest...
                           </div>
                        ) : shipments.length === 0 ? (
                           <div className="p-12 text-center text-textMuted uppercase tracking-widest text-[9px] font-bold">
                              No active shipments found in your manifest.
                           </div>
                        ) : (
                           shipments.map((shipment, i) => (
                              <div
                                 key={i}
                                 onClick={() => onTrack(shipment.id)}
                                 className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-bgSurface transition-colors cursor-pointer group"
                              >
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-bgMain border border-borderColor rounded-sm flex items-center justify-center group-hover:border-red-600 transition-colors">
                                       <iconify-icon icon="solar:box-minimalistic-linear" width="20" class="text-textMuted group-hover:text-red-600"></iconify-icon>
                                    </div>
                                    <div>
                                       <p className="text-xs font-black uppercase tracking-widest text-textMain mb-1">{shipment.id}</p>
                                       <div className="flex items-center gap-2 text-[10px] text-textMuted font-bold uppercase tracking-wider">
                                          <span>{shipment.origin}</span>
                                          <iconify-icon icon="solar:arrow-right-linear" width="12"></iconify-icon>
                                          <span>{shipment.destination}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${shipment.status === 'In Transit' ? 'bg-blue-900/20 text-blue-500 border-blue-900/50' :
                                       shipment.status === 'Delivered' ? 'bg-green-900/20 text-green-500 border-green-900/50' :
                                          shipment.status === 'Out for Delivery' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-900/50' :
                                             'bg-bgMain text-textMuted border-borderColor'
                                       }`}>
                                       {shipment.status}
                                    </span>
                                    <div className="text-right">
                                       <p className="text-[9px] text-textMuted uppercase tracking-widest font-bold">ETA</p>
                                       <p className="text-xs font-bold text-textMain">{shipment.estimatedArrival}</p>
                                    </div>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </motion.div>

               {/* Sidebar: Analytics & Actions */}
               <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-10"
               >
                  {/* Spending Chart */}
                  <div className="bg-bgMain border border-borderColor rounded-sm p-8 relative">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-textMuted mb-8 flex items-center gap-2">
                        <iconify-icon icon="solar:chart-2-linear" width="14" class="text-red-600"></iconify-icon>
                        Expenditure Velocity
                     </h3>
                     <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={spendData}>
                              <defs>
                                 <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <Tooltip
                                 contentStyle={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '8px' }}
                                 itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                              />
                              <Area type="monotone" dataKey="amount" stroke="#dc2626" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Rapid Actions */}
                  <div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-textMuted mb-4">Rapid Actions</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <button
                           onClick={() => onNavigate('quotes')}
                           className="p-4 bg-bgSurface border border-borderColor hover:border-red-600 transition-colors rounded-sm text-left group"
                        >
                           <iconify-icon icon="solar:calculator-linear" width="20" class="text-textMuted group-hover:text-red-600 mb-2 transition-colors"></iconify-icon>
                           <p className="text-[10px] font-black uppercase tracking-widest text-textMain">New Quote</p>
                        </button>
                        <button
                           onClick={() => onNavigate('tracking')}
                           className="p-4 bg-bgSurface border border-borderColor hover:border-red-600 transition-colors rounded-sm text-left group"
                        >
                           <iconify-icon icon="solar:radar-linear" width="20" class="text-textMuted group-hover:text-red-600 mb-2 transition-colors"></iconify-icon>
                           <p className="text-[10px] font-black uppercase tracking-widest text-textMain">Track Item</p>
                        </button>
                        <button
                           onClick={() => onNavigate('support')}
                           className="p-4 bg-bgSurface border border-borderColor hover:border-red-600 transition-colors rounded-sm text-left group"
                        >
                           <iconify-icon icon="solar:headphones-round-linear" width="20" class="text-textMuted group-hover:text-red-600 mb-2 transition-colors"></iconify-icon>
                           <p className="text-[10px] font-black uppercase tracking-widest text-textMain">Support</p>
                        </button>
                        <button
                           onClick={() => onNavigate('settings')}
                           className="p-4 bg-bgSurface border border-borderColor hover:border-red-600 transition-colors rounded-sm text-left group"
                        >
                           <iconify-icon icon="solar:settings-linear" width="20" class="text-textMuted group-hover:text-red-600 mb-2 transition-colors"></iconify-icon>
                           <p className="text-[10px] font-black uppercase tracking-widest text-textMain">Settings</p>
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         </div>
      </section>
   );
};

export default UserDashboard;
