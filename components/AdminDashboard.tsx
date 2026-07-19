import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { User, Shipment } from '../types';
import { supabase } from '../services/supabase';
import AdminShipmentEditor from './AdminShipmentEditor';
import AdminUserEditor from './AdminUserEditor';
import AdminStatusUpdater from './AdminStatusUpdater';
import { getAllTickets, SupportTicket, updateTicketStatus, setTicketArchived, deleteTicket } from '../services/support';
import { deleteShipment, updateShipment, logShipmentEvent, getAllUsers, updateUserRole, UserProfile, inviteUser } from '../services/adminService';
import { mapShipmentRow } from '../services/shipmentUtils';
import { useToast } from './ui/Toast';
import { useConfirm } from './ui/ConfirmDialog';

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
   const navigate = useNavigate();
   const toast = useToast();
   const { confirm, prompt } = useConfirm();

   const [activeTab, setActiveTab] = useState<'shipments' | 'users' | 'analytics' | 'support'>('analytics');
   const [shipments, setShipments] = useState<Shipment[]>([]);
   const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [tickets, setTickets] = useState<SupportTicket[]>([]);
   const [showArchived, setShowArchived] = useState(false);
   const [busyTicketId, setBusyTicketId] = useState<string | null>(null);

   // Editor State
   const [isEditorOpen, setIsEditorOpen] = useState(false);
   const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);

   // User Editor State
   const [isUserEditorOpen, setIsUserEditorOpen] = useState(false);
   const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

   // Invite User State
   const [isInviteOpen, setIsInviteOpen] = useState(false);
   const [inviteEmail, setInviteEmail] = useState('');
   const [inviteRole, setInviteRole] = useState<'client' | 'admin'>('client');

   // Status Updater State
   const [isStatusUpdaterOpen, setIsStatusUpdaterOpen] = useState(false);
   const [statusUpdaterShipment, setStatusUpdaterShipment] = useState<Shipment | null>(null);

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

   const loadData = useCallback(async () => {
      setLoading(true);

      // Fetch Shipments
      const { data: shipmentData, error: shipError } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });

      if (shipmentData) {
         const mappedShipments: Shipment[] = shipmentData.map(mapShipmentRow);
         setShipments(mappedShipments);
      }

      // Fetch Users from profiles table using adminService
      const profiles = await getAllUsers();
      setUserProfiles(profiles);

      try {
         const allTickets = await getAllTickets();
         setTickets(allTickets);
      } catch (e) {
         console.error("Failed to fetch tickets", e);
      }

      setLoading(false);
   }, []);

   useEffect(() => {
      loadData();
   }, [loadData]);

   // Admin ticket/chat management: archive (reversible) + permanent delete.
   const handleArchiveTicket = async (ticket: SupportTicket) => {
      setBusyTicketId(ticket.id);
      try {
         const updated = await setTicketArchived(ticket.id, !ticket.archived);
         setTickets(prev => prev.map(t => (t.id === ticket.id ? { ...t, archived: updated.archived } : t)));
      } catch (e) {
         console.error('Archive failed', e);
         alert('Could not archive this ticket. If this persists, the database migration may not be applied yet.');
      } finally {
         setBusyTicketId(null);
      }
   };

   const handleDeleteTicket = async (ticket: SupportTicket) => {
      if (!window.confirm(`Permanently delete ticket ${ticket.ticket_number} and all its messages? This cannot be undone.`)) return;
      setBusyTicketId(ticket.id);
      try {
         await deleteTicket(ticket.id);
         setTickets(prev => prev.filter(t => t.id !== ticket.id));
      } catch (e) {
         console.error('Delete failed', e);
         alert('Could not delete this ticket. Check that admin delete permissions (RLS) are configured.');
      } finally {
         setBusyTicketId(null);
      }
   };

   const visibleTickets = tickets.filter(t => (showArchived ? true : !t.archived));

   useEffect(() => {
      const channel = supabase
         .channel('realtime_shipments_admin')
         .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'shipments' },
            () => {
               loadData();
            }
         )
         .subscribe();

      return () => {
         supabase.removeChannel(channel);
      };
   }, [loadData]);

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
      const confirmed = await confirm({
         title: 'Delete Shipment',
         message: 'Are you sure you want to delete this shipment? This action is irreversible.',
         confirmText: 'Delete',
         confirmStyle: 'danger'
      });
      if (confirmed) {
         const result = await deleteShipment(id);
         if (result.error) {
            toast.showError('Delete Failed', result.error);
         } else {
            toast.showSuccess('Deleted', 'Shipment removed successfully');
            loadData();
         }
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
      console.log('Action triggered for:', shipment.id, shipment.status);

      let newStatus = shipment.status;
      let updates: Record<string, unknown> = {};

      if (shipment.status === 'pending') {
         const priceText = await prompt('Enter Quote Amount', 'Set the shipping price for this order');
         if (priceText) {
            newStatus = 'quoted';
            updates = { price: parseFloat(priceText), status: newStatus };
         }
      } else if (shipment.status === 'quoted') {
         const confirmed = await confirm({
            title: 'Confirm Payment',
            message: 'Mark this shipment as payment received?',
            confirmText: 'Confirm Payment'
         });
         if (confirmed) {
            newStatus = 'confirmed';
            updates = { payment_status: 'paid', status: newStatus };
         }
      } else if (shipment.status === 'confirmed') {
         const confirmed = await confirm({
            title: 'Dispatch Shipment',
            message: 'Dispatch this shipment to carrier?',
            confirmText: 'Dispatch'
         });
         if (confirmed) {
            newStatus = 'in-transit';
            updates = { status: newStatus };
         }
      } else if (shipment.status === 'in-transit') {
         // Instead of a simple prompt, open the detailed status updater
         setStatusUpdaterShipment(shipment);
         setIsStatusUpdaterOpen(true);
         return; // Exit here, let the modal handle the update
      }

      if (Object.keys(updates).length > 0) {
         // Use logShipmentEvent for status changes (includes history logging)
         if (updates.status) {
            const result = await logShipmentEvent(
               shipment.id,
               {
                  status: updates.status as string,
                  location: (updates.current_location as string) || shipment.currentLocation || 'In Transit',
                  note: `Status updated to ${updates.status}`
               },
               false
            );

            if (updates.price) {
               await updateShipment(shipment.id, { price: updates.price as number });
            }

            if (result.error) {
               toast.showError('Update Failed', result.error);
            } else {
               toast.showSuccess('Updated', `Shipment status changed to ${updates.status}`);
               loadData();
            }
         } else {
            const result = await updateShipment(shipment.id, updates as any);
            if (result.error) {
               toast.showError('Update Failed', result.error);
            } else {
               toast.showSuccess('Updated', 'Location updated successfully');
               loadData();
            }
         }
      }
   };

   // --- Status Updater Handlers ---
   const handleOpenStatusUpdater = (shipment: Shipment) => {
      setStatusUpdaterShipment(shipment);
      setIsStatusUpdaterOpen(true);
   };

   const handleStatusUpdaterSave = () => {
      setIsStatusUpdaterOpen(false);
      setStatusUpdaterShipment(null);
      loadData();
   };

   const handleStatusUpdaterCancel = () => {
      setIsStatusUpdaterOpen(false);
      setStatusUpdaterShipment(null);
   };



   // --- User Role Toggle ---
   const handleToggleRole = async (userId: string, currentRole: string) => {
      const newRole = currentRole === 'admin' ? 'client' : 'admin';
      const confirmed = await confirm({
         title: 'Change User Role',
         message: `Change this user's role to ${newRole.toUpperCase()}?`,
         confirmText: 'Change Role',
         confirmStyle: newRole === 'admin' ? 'primary' : 'danger'
      });
      if (confirmed) {
         const result = await updateUserRole(userId, newRole);
         if (result.error) {
            toast.showError('Error', result.error);
         } else {
            toast.showSuccess('Role Updated', `User is now ${newRole}`);
            loadData();
         }
      }
   };

   // --- User Edit ---
   const handleEditUser = (profile: UserProfile) => {
      setEditingUser(profile);
      setIsUserEditorOpen(true);
   };

   const handleUserEditorSave = () => {
      setIsUserEditorOpen(false);
      setEditingUser(null);
      loadData();
   };

   const handleUserEditorCancel = () => {
      setIsUserEditorOpen(false);
      setEditingUser(null);
   };

   // --- Invite User Handlers ---
   const handleInviteUser = async () => {
      if (!inviteEmail) {
         toast.showError('Error', 'Please enter an email address');
         return;
      }

      const result = await inviteUser(inviteEmail, inviteRole);
      if (result.error) {
         toast.showError('Invite Failed', result.error);
      } else {
         toast.showSuccess('Invited', `Invitation sent to ${inviteEmail}`);
         setIsInviteOpen(false);
         setInviteEmail('');
         setInviteRole('client');
      }
   };

   // --- Impersonate User (Login as User) ---
   const handleImpersonateUser = async (userId: string) => {
      const confirmed = await confirm({
         title: 'Login As User',
         message: 'This will log you in as this user. You will need to log out and log back in as admin to return. Continue?',
         confirmText: 'Login As User',
         confirmStyle: 'danger'
      });
      if (confirmed) {
         // Store impersonation ID for App.tsx to pick up
         localStorage.setItem('impersonated_user_id', userId);

         toast.showInfo('Impersonation', 'Switching to user view...');
         setTimeout(() => {
            window.location.reload();
         }, 1000);
      }
   };

   return (
      <section className="pt-32 pb-24 bg-bgMain min-h-screen text-textMain font-sans">
         <div className="container mx-auto px-4 md:px-6">

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
               <div className="flex gap-1 mb-8 overflow-x-auto pb-2 scrollbar-hide">
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

                           {/* Table & Mobile Cards */}
                           <div className="border border-borderColor rounded-sm bg-bgSurface/10 backdrop-blur-md overflow-hidden">
                              <div className="overflow-x-auto">
                                 {/* Standard Table (Desktop) */}
                                 <table className="w-full text-left hidden lg:table min-w-[800px]">
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
                                             <td className="p-4">
                                                <button
                                                   onClick={() => navigate(`/track/${shipment.id}`)}
                                                   className="font-mono text-xs text-red-500 hover:text-red-400 hover:underline transition-colors"
                                                >
                                                   {shipment.id.substring(0, 12)}...
                                                </button>
                                             </td>
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
                                                <div className="flex items-center justify-end gap-1">
                                                   <button
                                                      onClick={() => handleSmartAction(shipment)}
                                                      className="text-[10px] font-bold uppercase tracking-widest border border-borderColor px-3 py-1.5 rounded-sm hover:border-red-600 hover:text-red-600 transition-colors bg-bgMain"
                                                   >
                                                      {shipment.status === 'pending' ? 'Review Quote' :
                                                         shipment.status === 'quoted' ? 'Confirm Pay' :
                                                            shipment.status === 'confirmed' ? 'Dispatch' :
                                                               'Update'}
                                                   </button>
                                                   <button onClick={() => handleOpenStatusUpdater(shipment)} className="p-2 text-textMuted hover:text-white transition-colors" title="Update Status & Location">
                                                      <Icon icon="solar:delivery-linear" />
                                                   </button>
                                                   <button onClick={() => handleEdit(shipment)} className="p-2 text-textMuted hover:text-white transition-colors" title="Edit">
                                                      <Icon icon="solar:pen-linear" />
                                                   </button>
                                                   <button onClick={() => handleDelete(shipment.id)} className="p-2 text-textMuted hover:text-red-600 transition-colors" title="Delete">
                                                      <Icon icon="solar:trash-bin-trash-linear" />
                                                   </button>
                                                </div>
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>

                              {/* Mobile Cards */}
                              <div className="lg:hidden divide-y divide-borderColor/50">
                                 {filteredShipments.map(shipment => (
                                    <div key={shipment.id} className="p-4 md:p-6 space-y-4 hover:bg-white/5 transition-colors">
                                       <div className="flex justify-between items-start">
                                          <div>
                                             <p className="metadata-label text-textMuted mb-1">Tracking Number</p>
                                             <button onClick={() => navigate(`/track/${shipment.id}`)} className="font-mono text-sm text-red-500 font-bold uppercase">
                                                {shipment.id}
                                             </button>
                                          </div>
                                          <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${statusColors[shipment.status] || 'border-slate-500 text-slate-500'}`}>
                                             {shipment.status}
                                          </span>
                                       </div>

                                       <div className="grid grid-cols-2 gap-4">
                                          <div>
                                             <p className="metadata-label text-textMuted mb-1">Origin</p>
                                             <p className="text-sm font-bold text-textMain break-words leading-tight">{shipment.origin}</p>
                                          </div>
                                          <div>
                                             <p className="metadata-label text-textMuted mb-1">Destination</p>
                                             <p className="text-sm font-bold text-textMain break-words leading-tight">{shipment.destination}</p>
                                          </div>
                                       </div>

                                       <div>
                                          <p className="metadata-label text-textMuted mb-1">Current Location</p>
                                          <div className="flex items-center gap-2 text-xs font-bold text-textMain">
                                             <Icon icon="solar:map-point-linear" className="text-red-600" />
                                             {shipment.currentLocation}
                                          </div>
                                       </div>

                                       <div className="flex gap-2 pt-2">
                                          <button
                                             onClick={() => handleSmartAction(shipment)}
                                             className="flex-grow bg-bgSurface border border-borderColor text-[9px] font-black uppercase tracking-[0.2em] py-3 rounded-sm hover:border-red-600 transition-colors"
                                          >
                                             {shipment.status === 'pending' ? 'Review Quote' :
                                                shipment.status === 'quoted' ? 'Confirm Payment' :
                                                   shipment.status === 'confirmed' ? 'Dispatch' :
                                                      'Update Location'}
                                          </button>
                                          <div className="flex gap-1">
                                             <button onClick={() => handleEdit(shipment)} className="p-3 bg-bgSurface border border-borderColor rounded-sm text-textMuted">
                                                <Icon icon="solar:pen-linear" />
                                             </button>
                                             <button onClick={() => handleDelete(shipment.id)} className="p-3 bg-bgSurface border border-borderColor rounded-sm text-red-600/50">
                                                <Icon icon="solar:trash-bin-trash-linear" />
                                             </button>
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>

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
                        >
                           <div className="border border-borderColor rounded-sm overflow-hidden bg-bgSurface/10 backdrop-blur-md">
                              {/* Toolbar */}
                              <div className="p-4 border-b border-borderColor flex justify-end">
                                 <button
                                    onClick={() => setIsInviteOpen(true)}
                                    className="bg-white text-black px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center gap-2"
                                 >
                                    <Icon icon="solar:user-plus-linear" width="16" />
                                    Invite User
                                 </button>
                              </div>
                              {/* Standard Table (Desktop) */}
                              <table className="w-full text-left hidden lg:table">
                                 <thead className="bg-bgSurface border-b border-borderColor">
                                    <tr>
                                       <th className="p-4 metadata-label text-textMuted">User</th>
                                       <th className="p-4 metadata-label text-textMuted">Email</th>
                                       <th className="p-4 metadata-label text-textMuted">Role</th>
                                       <th className="p-4 metadata-label text-textMuted">Joined</th>
                                       <th className="p-4 metadata-label text-textMuted text-right">Action</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-borderColor">
                                    {userProfiles.map(profile => (
                                       <tr key={profile.id} className="group hover:bg-white/5 transition-colors">
                                          <td className="p-4">
                                             <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center">
                                                   <span className="text-xs font-bold text-red-600">{profile.full_name?.charAt(0) || 'U'}</span>
                                                </div>
                                                <span className="text-sm font-bold text-textMain">{profile.full_name || 'Unnamed'}</span>
                                             </div>
                                          </td>
                                          <td className="p-4 text-xs text-textMuted">{profile.email}</td>
                                          <td className="p-4">
                                             <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${profile.role === 'admin'
                                                ? 'text-purple-500 bg-purple-500/10 border-purple-500/20'
                                                : 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                                                }`}>
                                                {profile.role}
                                             </span>
                                          </td>
                                          <td className="p-4 text-xs text-textMuted">
                                             {new Date(profile.created_at).toLocaleDateString()}
                                          </td>
                                          <td className="p-4 text-right">
                                             <div className="flex items-center justify-end gap-2">
                                                <button
                                                   onClick={() => handleEditUser(profile)}
                                                   className="p-2 text-textMuted hover:text-white transition-colors"
                                                   title="Edit User"
                                                >
                                                   <Icon icon="solar:pen-linear" />
                                                </button>
                                                <button
                                                   onClick={() => handleToggleRole(profile.id, profile.role)}
                                                   className="text-[10px] font-bold uppercase tracking-widest border border-borderColor px-3 py-1.5 rounded-sm hover:border-red-600 hover:text-red-600 transition-colors bg-bgMain"
                                                >
                                                   {profile.role === 'admin' ? 'Make Client' : 'Make Admin'}
                                                </button>
                                             </div>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>

                              {/* Mobile Cards */}
                              <div className="lg:hidden divide-y divide-borderColor/50">
                                 {userProfiles.map(profile => (
                                    <div key={profile.id} className="p-4 md:p-6 space-y-4 hover:bg-white/5 transition-colors">
                                       <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-bold text-red-600">{profile.full_name?.charAt(0) || 'U'}</span>
                                             </div>
                                             <div>
                                                <p className="text-sm font-bold text-textMain">{profile.full_name || 'Unnamed'}</p>
                                                <p className="text-[10px] text-textMuted uppercase font-mono">{profile.email}</p>
                                             </div>
                                          </div>
                                          <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${profile.role === 'admin' ? 'text-purple-500 border-purple-500/30' : 'text-blue-500 border-blue-500/30'}`}>
                                             {profile.role}
                                          </span>
                                       </div>
                                       <div className="flex gap-2">
                                          <button
                                             onClick={() => handleToggleRole(profile.id, profile.role)}
                                             className="flex-grow bg-bgSurface border border-borderColor text-[9px] font-black uppercase tracking-widest py-3 rounded-sm hover:border-red-600 transition-colors text-textMain"
                                          >
                                             {profile.role === 'admin' ? 'Set as Client' : 'Elevate to Admin'}
                                          </button>
                                          <button onClick={() => handleEditUser(profile)} className="p-3 bg-bgSurface border border-borderColor rounded-sm text-textMuted">
                                             <Icon icon="solar:pen-linear" />
                                          </button>
                                       </div>
                                    </div>
                                 ))}
                              </div>

                              {userProfiles.length === 0 && (
                                 <div className="p-12 text-center text-textMuted uppercase tracking-widest text-xs">
                                    No users found
                                 </div>
                              )}
                           </div>

                           {/* Invite Modal */}
                           {isInviteOpen && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                                 <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-bgMain border border-borderColor rounded-sm p-6 w-full max-w-md shadow-2xl"
                                 >
                                    <h3 className="text-xl font-bold heading-font mb-4">Invite New User</h3>
                                    <p className="text-sm text-textMuted mb-6">
                                       Pre-authorize a user email. When they sign up, they will automatically be assigned this role.
                                    </p>

                                    <div className="space-y-4 mb-8">
                                       <div>
                                          <label className="metadata-label text-textMuted mb-1 block">Email Address</label>
                                          <input
                                             type="email"
                                             value={inviteEmail}
                                             onChange={(e) => setInviteEmail(e.target.value)}
                                             className="w-full bg-bgSurface border border-borderColor p-3 rounded-sm text-sm text-textMain focus:border-red-600 focus:outline-none"
                                             placeholder="user@example.com"
                                          />
                                       </div>
                                       <div>
                                          <label className="metadata-label text-textMuted mb-1 block">Assign Role</label>
                                          <div className="flex gap-4">
                                             <button
                                                onClick={() => setInviteRole('client')}
                                                className={`flex-1 py-2 border rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${inviteRole === 'client' ? 'bg-bgSurface border-red-600 text-red-600' : 'border-borderColor text-textMuted'}`}
                                             >
                                                Client
                                             </button>
                                             <button
                                                onClick={() => setInviteRole('admin')}
                                                className={`flex-1 py-2 border rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${inviteRole === 'admin' ? 'bg-bgSurface border-red-600 text-red-600' : 'border-borderColor text-textMuted'}`}
                                             >
                                                Admin
                                             </button>
                                          </div>
                                       </div>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                       <button
                                          onClick={() => setIsInviteOpen(false)}
                                          className="px-4 py-2 text-xs font-bold text-textMuted hover:text-white uppercase tracking-widest"
                                       >
                                          Cancel
                                       </button>
                                       <button
                                          onClick={handleInviteUser}
                                          className="bg-red-600 text-white px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                                       >
                                          Invite User
                                       </button>
                                    </div>
                                 </motion.div>
                              </div>
                           )}
                        </motion.div>
                     )}

                     {activeTab === 'support' && (
                        <motion.div
                           key="support"
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                        >
                           <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                              <p className="text-[10px] font-black uppercase tracking-widest text-textMuted">
                                 {visibleTickets.length} {showArchived ? 'total' : 'active'} ticket{visibleTickets.length === 1 ? '' : 's'}
                              </p>
                              <button
                                 onClick={() => setShowArchived(v => !v)}
                                 className="text-[10px] font-black uppercase tracking-widest border border-borderColor px-3 py-1.5 rounded-sm hover:border-red-600 hover:text-red-600 transition-colors bg-bgMain text-textMain"
                              >
                                 {showArchived ? 'Hide archived' : 'Show archived'}
                              </button>
                           </div>
                           <div className="border border-borderColor rounded-sm overflow-hidden bg-bgSurface/10 backdrop-blur-md">
                              {/* Standard Table (Desktop) */}
                              <table className="w-full text-left hidden lg:table">
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
                                    {visibleTickets.map(ticket => (
                                       <tr key={ticket.id} className={`group hover:bg-white/5 transition-colors ${ticket.archived ? 'opacity-60' : ''}`}>
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
                                             <div className="flex items-center justify-end gap-2">
                                                {ticket.archived && (
                                                   <span className="text-[8px] font-black uppercase tracking-widest text-textMuted border border-borderColor px-2 py-0.5 rounded-sm">Archived</span>
                                                )}
                                                <a
                                                   href={`/dashboard/tickets/${ticket.id}`}
                                                   className="text-[10px] font-bold uppercase tracking-widest border border-borderColor px-3 py-1.5 rounded-sm hover:border-red-600 hover:text-red-600 transition-colors bg-bgMain"
                                                >
                                                   Manage
                                                </a>
                                                <button
                                                   onClick={() => handleArchiveTicket(ticket)}
                                                   disabled={busyTicketId === ticket.id}
                                                   className="text-[10px] font-bold uppercase tracking-widest border border-borderColor px-3 py-1.5 rounded-sm hover:border-textMuted transition-colors bg-bgMain text-textMuted hover:text-textMain disabled:opacity-40"
                                                >
                                                   {ticket.archived ? 'Unarchive' : 'Archive'}
                                                </button>
                                                <button
                                                   onClick={() => handleDeleteTicket(ticket)}
                                                   disabled={busyTicketId === ticket.id}
                                                   className="text-[10px] font-bold uppercase tracking-widest border border-red-600/40 px-3 py-1.5 rounded-sm text-red-600 hover:bg-red-600 hover:text-white transition-colors bg-bgMain disabled:opacity-40"
                                                >
                                                   Delete
                                                </button>
                                             </div>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>

                              {/* Mobile Cards */}
                              <div className="lg:hidden divide-y divide-borderColor/50">
                                 {visibleTickets.map(ticket => (
                                    <div key={ticket.id} className={`p-4 md:p-6 space-y-4 hover:bg-white/5 transition-colors ${ticket.archived ? 'opacity-60' : ''}`}>
                                       <div className="flex justify-between items-start">
                                          <div>
                                             <p className="font-mono text-xs text-red-500 font-bold uppercase">{ticket.ticket_number}</p>
                                             <p className="text-[9px] text-textMuted font-medium uppercase tracking-widest">{new Date(ticket.created_at).toLocaleDateString()}</p>
                                          </div>
                                          <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${ticket.status === 'open' ? 'text-green-500 border-green-500/30' : 'text-blue-500 border-blue-500/30'}`}>
                                             {ticket.status.replace('_', ' ')}
                                          </span>
                                       </div>
                                       <div>
                                          <p className="metadata-label text-textMuted mb-1">Subject</p>
                                          <p className="text-sm font-bold text-textMain">{ticket.subject}</p>
                                       </div>
                                       <div className="flex justify-between items-end pt-2">
                                          <div>
                                             <p className="metadata-label text-textMuted mb-0.5">Sender</p>
                                             <p className="text-xs font-bold text-textMain">{ticket.name}</p>
                                          </div>
                                          <a
                                             href={`/dashboard/tickets/${ticket.id}`}
                                             className="bg-bgSurface border border-borderColor text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-sm hover:border-red-600 transition-colors text-textMain"
                                          >
                                             Enter Dashboard
                                          </a>
                                       </div>
                                       <div className="flex gap-2 pt-1">
                                          <button
                                             onClick={() => handleArchiveTicket(ticket)}
                                             disabled={busyTicketId === ticket.id}
                                             className="flex-1 border border-borderColor text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-sm text-textMuted hover:text-textMain hover:border-textMuted transition-colors bg-bgMain disabled:opacity-40"
                                          >
                                             {ticket.archived ? 'Unarchive' : 'Archive'}
                                          </button>
                                          <button
                                             onClick={() => handleDeleteTicket(ticket)}
                                             disabled={busyTicketId === ticket.id}
                                             className="flex-1 border border-red-600/40 text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-sm text-red-600 hover:bg-red-600 hover:text-white transition-colors bg-bgMain disabled:opacity-40"
                                          >
                                             Delete
                                          </button>
                                       </div>
                                    </div>
                                 ))}
                              </div>

                              {visibleTickets.length === 0 && (
                                 <div className="p-12 text-center text-textMuted uppercase tracking-widest text-xs">
                                    {showArchived ? 'No tickets found' : 'No active tickets found'}
                                 </div>
                              )}
                           </div>
                        </motion.div>
                     )}
                  </>
               )}
            </AnimatePresence>




            <AnimatePresence>
               {isUserEditorOpen && (
                  <AdminUserEditor
                     userProfile={editingUser}
                     onSave={handleUserEditorSave}
                     onCancel={handleUserEditorCancel}
                     onImpersonate={handleImpersonateUser}
                  />
               )}
            </AnimatePresence>

            <AnimatePresence>
               {isStatusUpdaterOpen && (
                  <AdminStatusUpdater
                     shipment={statusUpdaterShipment}
                     onSave={handleStatusUpdaterSave}
                     onCancel={handleStatusUpdaterCancel}
                  />
               )}
            </AnimatePresence>

         </div>
      </section>
   );
};

export default AdminDashboard;
