import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { User, Shipment } from '../types';
import { supabase } from '../services/supabase';
import AdminShipmentEditor from './AdminShipmentEditor';
import { getAllTickets, SupportTicket, updateTicketStatus } from '../services/support';

// --- Icons ---
import { Icon } from '@iconify/react';

interface AdminDashboardProps {
   user: User;
}

const statusColors: Record<string, string> = {
   'pending': 'text-slate-500 bg-slate-500/10 border-slate-500/20',
   'quoted': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
   'confirmed': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
   'in-transit': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
   'out-for-delivery': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
   'delivered': 'text-green-500 bg-green-500/10 border-green-500/20',
   'held': 'text-red-500 bg-red-500/10 border-red-500/20',
   'cancelled': 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20',
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
   const [activeTab, setActiveTab] = useState<'shipments' | 'users' | 'analytics' | 'support'>('analytics');
   const [shipments, setShipments] = useState<Shipment[]>([]);
   const [users, setUsers] = useState<User[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [tickets, setTickets] = useState<SupportTicket[]>([]);

   // Editor State
   const [isEditorOpen, setIsEditorOpen] = useState(false);
   const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);

   // --- Metrics for Overlay ---
   const volumeData = [
      { time: '08:00', vol: 120 },
      { time: '10:00', vol: 350 },
      { time: '12:00', vol: 480 },
      { time: '14:00', vol: 410 },
      { time: '16:00', vol: 590 },
      { time: '18:00', vol: 320 },
      { time: '20:00', vol: 180 },
   ];

   useEffect(() => {
      loadData();
   }, []);

   const loadData = async () => {
      setLoading(true);

      // Fetch Shipments
      const { data: shipmentData, error: shipError } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });

      if (shipmentData) {
         // Map raw DB data to Frontend Shipment type
         const mappedShipments: Shipment[] = shipmentData.map(data => {
            const senderInfo = data.sender_info || {};
            const receiverInfo = data.receiver_info || {};
            const parcelDetails = data.parcel_details || {};

            return {
               id: data.tracking_number || data.id,
               status: data.status,
               origin: senderInfo.address || 'Unknown',
               destination: receiverInfo.address || 'Unknown',
               estimatedArrival: data.estimated_delivery ? new Date(data.estimated_delivery).toLocaleDateString() : 'TBD',
               currentLocation: data.current_location || 'Pending',
               weight: parcelDetails.weight ? (parcelDetails.weight + " kg") : (data.weight ? (data.weight + " kg") : '0 kg'),
               dimensions: data.dimensions || 'N/A',
               serviceType: data.service_type || 'Standard',
               history: data.history || [],
               items: data.items || [{ description: parcelDetails.description || 'Shipment Items', quantity: 1, value: data.price || '0', sku: 'GENERIC' }],
               sender: {
                  name: senderInfo.name || 'Unknown',
                  street: senderInfo.address || 'Unknown',
                  city: '',
                  country: ''
               },
               recipient: {
                  name: receiverInfo.name || 'Unknown',
                  street: receiverInfo.address || 'Unknown',
                  city: '',
                  country: ''
               },
               price: parseFloat(data.price || '0'),
               paymentStatus: data.payment_status
            };
         });
         setShipments(mappedShipments);
      }

      // Fetch Users from profiles table
      const { data: profileData } = await supabase.from('profiles').select('*').order('full_name');
      if (profileData) {
         setUsers(profileData.map(p => ({
            name: p.full_name || 'Unnamed User',
            email: p.email || 'No Email',
            role: p.role === 'admin' ? 'Admin' : 'Client'
         })));
      }

      try {
         const allTickets = await getAllTickets();
         setTickets(allTickets);
      } catch (e) {
         console.error("Failed to fetch tickets", e);
      }

      setLoading(false);
   };

   const filteredShipments = shipments.filter(s =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.sender?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.recipient?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
   );

   // --- Editor Handlers ---
   const handleCreate = () => {
      setEditingShipment(null);
      setIsEditorOpen(true);
   };

   const handleEdit = (shipment: Shipment) => {
      setEditingShipment(shipment);
      setIsEditorOpen(true);
   };

   const handleDelete = async (id: string) => {
      if (confirm('Are you sure you want to delete this shipment? This action is irreversible.')) {
         await supabase.from('shipments').delete().eq('tracking_number', id);
         loadData();
      }
   };

   const onEditorSave = () => {
      setIsEditorOpen(false);
      setEditingShipment(null);
      loadData();
   };

   const onEditorCancel = () => {
      setIsEditorOpen(false);
      setEditingShipment(null);
   };

   // --- Action Handlers ---
   const handleSmartAction = async (shipment: Shipment) => {
      // Placeholder for dialog triggers
      console.log('Action triggered for:', shipment.id, shipment.status);

      let newStatus = shipment.status;
      let updates: any = {};

      if (shipment.status === 'pending') {
         // Should open Quote Dialog
         const priceText = prompt('Enter Quote Amount:'); // Temp fallback
         if (priceText) {
            newStatus = 'quoted';
            updates = { price: parseFloat(priceText), status: newStatus };
         }
      } else if (shipment.status === 'quoted') {
         // Should open Payment Confirm
         if (confirm('Confirm Payment Received?')) {
            newStatus = 'confirmed';
            updates = { payment_status: 'paid', status: newStatus };
         }
      } else if (shipment.status === 'confirmed') {
         if (confirm('Dispatch Shipment?')) {
            newStatus = 'in-transit';
            updates = { status: newStatus };
         }
      } else if (shipment.status === 'in-transit') {
         const loc = prompt('Update Location (or leave empty to mark delivered):');
         if (loc) {
            updates = { current_location: loc };
         } else {
            newStatus = 'delivered';
            updates = { status: newStatus };
         }
      }

      if (Object.keys(updates).length > 0) {
         // Update history if status changed
         if (updates.status) {
            const newHistoryItem = {
               status: updates.status,
               location: updates.current_location || shipment.currentLocation || 'In Transit',
               note: `Status updated to ${updates.status}`,
               timestamp: new Date().toISOString()
            };

            // We need to fetch the current history from the DB first or just append if possible
            // In a real app we'd fetch or use a RPC. For now we append if we have it.
            const { data: currentShipment } = await supabase.from('shipments').select('history').eq('tracking_number', shipment.id).single();
            if (currentShipment) {
               updates.history = [...(currentShipment.history || []), newHistoryItem];
            }
         }

         updates.updated_at = new Date().toISOString();

         const { error } = await supabase.from('shipments').update(updates).eq('tracking_number', shipment.id);
         if (error) {
            console.error('Update error:', error);
            alert('Failed to update shipment.');
         } else {
            loadData(); // Refresh
         }
      }
   };

   return (
      <section className="pt-32 pb-24 bg-bgMain min-h-screen text-textMain font-sans">
         <div className="container mx-auto px-6">

            {/* --- Header --- */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-12 border-b border-borderColor pb-8 flex flex-col md:flex-row justify-between items-end"
            >
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                     <span className="metadata-label text-red-600">Admin Console v2.0</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extrabold heading-font uppercase tracking-tighter text-textMain">
                     Command <span className="text-textMuted">Center</span>
                  </h1>
               </div>

               {/* Global Stats */}
               <div className="flex gap-8 mt-6 md:mt-0">
                  <div className="text-right">
                     <p className="metadata-label text-textMuted mb-1">Total Active</p>
                     <p className="text-xl font-black heading-font text-textMain">{shipments.length}</p>
                  </div>
                  <div className="text-right">
                     <p className="metadata-label text-textMuted mb-1">Revenue</p>
                     <p className="text-xl font-black heading-font text-textMain">$12,450</p>
                  </div>
               </div>
            </motion.div>

            {/* --- Navigation Tabs --- */}
            {!isEditorOpen && (
               <div className="flex gap-1 mb-8">
                  {['analytics', 'shipments', 'users', 'support'].map((tab) => (
                     <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] border border-b-0 rounded-t-sm transition-all ${activeTab === tab
                           ? 'bg-bgSurface text-red-600 border-borderColor border-b-bgSurface'
                           : 'bg-transparent text-textMuted border-transparent hover:text-textMain'
                           }`}
                     >
                        {tab}
                     </button>
                  ))}
                  <div className="flex-grow border-b border-borderColor"></div>
               </div>
            )}

            {/* --- Content Area --- */}
            <AnimatePresence mode="wait">
               {isEditorOpen ? (
                  <AdminShipmentEditor
                     shipment={editingShipment}
                     onSave={onEditorSave}
                     onCancel={onEditorCancel}
                  />
               ) : (
                  <>
                     {activeTab === 'analytics' && (
                        <motion.div
                           key="analytics"
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                           className="grid grid-cols-1 lg:grid-cols-4 gap-8"
                        >
                           {/* Analytics Widgets (Ported from V1) */}
                           <div className="lg:col-span-3 bg-bgMain border border-borderColor rounded-sm p-8 relative overflow-hidden group">
                              <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
                              <div className="flex justify-between items-center mb-8 relative z-10">
                                 <h3 className="metadata-label text-textMuted">System Load</h3>
                                 <Icon icon="solar:graph-up-linear" className="text-red-600 w-5 h-5" />
                              </div>
                              <div className="h-64 w-full relative z-10">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={volumeData}>
                                       <Tooltip
                                          contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626' }}
                                          itemStyle={{ fontSize: '12px', color: '#fafafa' }}
                                       />
                                       <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} />
                                       <Bar dataKey="vol" fill="#dc2626" radius={[2, 2, 0, 0]} barSize={40} />
                                    </BarChart>
                                 </ResponsiveContainer>
                              </div>
                           </div>

                           <div className="lg:col-span-1 space-y-4">
                              <div className="p-6 bg-bgSurface/20 border border-borderColor rounded-sm backdrop-blur-sm">
                                 <h3 className="metadata-label text-textMuted mb-2">Pending Quotes</h3>
                                 <p className="text-3xl font-black heading-font">{shipments.filter(s => s.status === 'pending').length}</p>
                              </div>
                              <div className="p-6 bg-bgSurface/20 border border-borderColor rounded-sm backdrop-blur-sm">
                                 <h3 className="metadata-label text-textMuted mb-2">Pending Payment</h3>
                                 <p className="text-3xl font-black heading-font">{shipments.filter(s => s.status === 'quoted').length}</p>
                              </div>
                              <div className="p-6 bg-bgSurface/20 border border-borderColor rounded-sm backdrop-blur-sm">
                                 <h3 className="metadata-label text-textMuted mb-2">In Transit</h3>
                                 <p className="text-3xl font-black heading-font">{shipments.filter(s => s.status === 'in-transit').length}</p>
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {activeTab === 'shipments' && (
                        <motion.div
                           key="shipments"
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                        >
                           {/* Toolbar */}
                           <div className="flex justify-between items-center mb-6">
                              <div className="relative">
                                 <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted w-4 h-4" />
                                 <input
                                    type="text"
                                    placeholder="SEARCH MANIFESTS..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-bgMain border border-borderColor text-textMain pl-10 pr-4 py-2 rounded-sm text-xs font-bold tracking-wider uppercase focus:outline-none focus:border-red-600 w-64 transition-colors"
                                 />
                              </div>
                              <button
                                 onClick={handleCreate}
                                 className="bg-white text-black px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center gap-2"
                              >
                                 <Icon icon="solar:add-circle-linear" width="16" />
                                 New Shipment
                              </button>
                           </div>

                           {/* Table */}
                           <div className="border border-borderColor rounded-sm overflow-hidden bg-bgSurface/10 backdrop-blur-md">
                              <table className="w-full text-left">
                                 <thead className="bg-bgSurface border-b border-borderColor">
                                    <tr>
                                       <th className="p-4 metadata-label text-textMuted">ID</th>
                                       <th className="p-4 metadata-label text-textMuted">Route</th>
                                       <th className="p-4 metadata-label text-textMuted">Status</th>
                                       <th className="p-4 metadata-label text-textMuted">Location</th>
                                       <th className="p-4 metadata-label text-textMuted text-right">Action</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-borderColor">
                                    {filteredShipments.map(shipment => (
                                       <tr key={shipment.id} className="group hover:bg-white/5 transition-colors">
                                          <td className="p-4 font-mono text-xs text-red-500">{shipment.id.substring(0, 8)}...</td>
                                          <td className="p-4">
                                             <div className="flex flex-col">
                                                <span className="text-sm font-bold text-textMain">{shipment.origin}</span>
                                                <Icon icon="solar:arrow-down-linear" className="text-textMuted my-1 w-3" />
                                                <span className="text-sm font-bold text-textMain">{shipment.destination}</span>
                                             </div>
                                          </td>
                                          <td className="p-4">
                                             <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${statusColors[shipment.status] || 'border-slate-500 text-slate-500'}`}>
                                                {shipment.status}
                                             </span>
                                          </td>
                                          <td className="p-4 text-xs text-textMuted">
                                             <div className="flex items-center gap-2">
                                                <Icon icon="solar:map-point-linear" />
                                                {shipment.currentLocation}
                                             </div>
                                          </td>
                                          <td className="p-4 text-right">
                                             <button
                                                onClick={() => handleSmartAction(shipment)}
                                                className="text-[10px] font-bold uppercase tracking-widest border border-borderColor px-3 py-1.5 rounded-sm hover:border-red-600 hover:text-red-600 transition-colors bg-bgMain"
                                             >
                                                {shipment.status === 'pending' ? 'Review Quote' :
                                                   shipment.status === 'quoted' ? 'Confirm Pay' :
                                                      shipment.status === 'confirmed' ? 'Dispatch' :
                                                         'Update'}
                                             </button>
                                             <button onClick={() => handleEdit(shipment)} className="p-2 text-textMuted hover:text-white transition-colors">
                                                <Icon icon="solar:pen-linear" />
                                             </button>
                                             <button onClick={() => handleDelete(shipment.id)} className="p-2 text-textMuted hover:text-red-600 transition-colors">
                                                <Icon icon="solar:trash-bin-trash-linear" />
                                             </button>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                              {filteredShipments.length === 0 && (
                                 <div className="p-12 text-center text-textMuted uppercase tracking-widest text-xs">
                                    No active shipments found
                                 </div>
                              )}
                           </div>
                        </motion.div>
                     )}

                     {activeTab === 'users' && (
                        <motion.div
                           key="users"
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                           className="p-12 text-center border border-dashed border-borderColor rounded-sm"
                        >
                           <Icon icon="solar:users-group-rounded-linear" className="w-12 h-12 text-textMuted mx-auto mb-4" />
                           <h3 className="text-lg font-bold text-textMain mb-2">User Directory</h3>
                           <p className="text-textMuted text-sm mb-6">Manage internal and external accounts.</p>
                           <button className="bg-white text-black px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest">
                              Sync Users
                           </button>
                        </motion.div>
                     )}

                     {activeTab === 'support' && (
                        <motion.div
                           key="support"
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                        >
                           <div className="border border-borderColor rounded-sm overflow-hidden bg-bgSurface/10 backdrop-blur-md">
                              <table className="w-full text-left">
                                 <thead className="bg-bgSurface border-b border-borderColor">
                                    <tr>
                                       <th className="p-4 metadata-label text-textMuted">Ticket Info</th>
                                       <th className="p-4 metadata-label text-textMuted">User</th>
                                       <th className="p-4 metadata-label text-textMuted">Subject</th>
                                       <th className="p-4 metadata-label text-textMuted">Status</th>
                                       <th className="p-4 metadata-label text-textMuted text-right">Action</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-borderColor">
                                    {tickets.map(ticket => (
                                       <tr key={ticket.id} className="group hover:bg-white/5 transition-colors">
                                          <td className="p-4">
                                             <div className="flex flex-col">
                                                <span className="font-mono text-xs text-red-500">{ticket.ticket_number}</span>
                                                <span className="text-[9px] text-textMuted">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                             </div>
                                          </td>
                                          <td className="p-4">
                                             <div className="flex flex-col">
                                                <span className="text-xs font-bold text-textMain">{ticket.name}</span>
                                                <span className="text-[10px] text-textMuted">{ticket.email}</span>
                                             </div>
                                          </td>
                                          <td className="p-4 text-xs font-medium text-textMain max-w-xs truncate">{ticket.subject}</td>
                                          <td className="p-4">
                                             <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${ticket.status === 'open' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                                                ticket.status === 'in_progress' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' :
                                                   ticket.status === 'resolved' ? 'text-purple-500 bg-purple-500/10 border-purple-500/20' :
                                                      'text-neutral-500 bg-neutral-500/10 border-neutral-500/20'
                                                }`}>
                                                {ticket.status.replace('_', ' ')}
                                             </span>
                                          </td>
                                          <td className="p-4 text-right">
                                             <a
                                                href={`/dashboard/tickets/${ticket.id}`}
                                                className="text-[10px] font-bold uppercase tracking-widest border border-borderColor px-3 py-1.5 rounded-sm hover:border-red-600 hover:text-red-600 transition-colors bg-bgMain"
                                             >
                                                Manage
                                             </a>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                              {tickets.length === 0 && (
                                 <div className="p-12 text-center text-textMuted uppercase tracking-widest text-xs">
                                    No active tickets found
                                 </div>
                              )}
                           </div>
                        </motion.div>
                     )}
                  </>
               )}
            </AnimatePresence>

         </div>
      </section>
   );
};

export default AdminDashboard;