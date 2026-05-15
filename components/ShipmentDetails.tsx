import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shipment } from '../types';
import { getTrackingInsight } from '../services/geminiService';
import TrackingMap from './TrackingMap';

interface ShipmentDetailsProps {
   shipment: Shipment;
   onBack: () => void;
}

const formatAddressLines = (street?: string, city?: string, country?: string) => {
   const safeStreet = (street || '').trim();
   const cityCountry = [city, country].filter(Boolean).join(', ').trim();

   if (!safeStreet) return { line1: cityCountry, line2: '' };
   if (!cityCountry) return { line1: safeStreet, line2: '' };

   const streetLower = safeStreet.toLowerCase();
   const cityLower = (city || '').toLowerCase();
   const countryLower = (country || '').toLowerCase();

   const hasCity = cityLower && streetLower.includes(cityLower);
   const hasCountry = countryLower && streetLower.includes(countryLower);

   if (hasCity && hasCountry) return { line1: safeStreet, line2: '' };
   if (hasCity) return { line1: safeStreet, line2: country || '' };

   return { line1: safeStreet, line2: cityCountry };
};

const ShipmentDetails: React.FC<ShipmentDetailsProps> = ({ shipment, onBack }) => {
   const [aiInsight, setAiInsight] = useState<string>('');

   useEffect(() => {
      getTrackingInsight(shipment.id, shipment.status).then(setAiInsight);
   }, [shipment.id, shipment.status]);

   return (
      <section className="pt-32 pb-24 bg-bgMain min-h-screen">
         <div className="container mx-auto px-6">
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-10"
            >
               <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-textMuted hover:text-red-600 transition-colors mb-8"
               >
                  <iconify-icon icon="solar:arrow-left-linear" width="16"></iconify-icon>
                  Back to Overview
               </button>

               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-borderColor pb-8">
                  <div>
                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="metadata-label text-red-600">Live Tracking</span>
                     </div>
                     <h1 className="text-4xl md:text-6xl font-extrabold heading-font uppercase tracking-tighter text-textMain">
                        {shipment.id}
                     </h1>
                  </div>
                  <div className="flex gap-8">
                     <div className="text-right">
                        <p className="metadata-label text-textMuted mb-1">Current Status</p>
                        <p className={`text-lg font-bold uppercase tracking-tight ${shipment.status === 'delivered' ? 'text-green-500' : 'text-textMain'
                           }`}>{shipment.status.replace(/-/g, ' ')}</p>
                     </div>
                     <div className="text-right">
                        <p className="metadata-label text-textMuted mb-1">Est. Arrival</p>
                        <p className="text-lg font-bold text-textMain uppercase tracking-tight">{shipment.estimatedArrival}</p>
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

               {/* Main Info */}
               <div className="lg:col-span-2 space-y-6">

                  {/* Address Details */}
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 }}
                     className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                     <div className="bg-bgSurface border border-borderColor rounded-sm p-6">
                        <div className="flex items-center gap-2 mb-4 text-textMuted">
                           <iconify-icon icon="solar:box-linear" width="16"></iconify-icon>
                           <span className="text-[10px] font-black uppercase tracking-widest">Origin / Sender</span>
                        </div>
                        <p className="text-sm font-bold text-textMain">{shipment.sender.company || shipment.sender.name}</p>
                        {(() => {
                           const addr = formatAddressLines(shipment.sender.street, shipment.sender.city, shipment.sender.country);
                           return (
                              <>
                                 {addr.line1 && <p className="text-xs text-textMuted mt-1">{addr.line1}</p>}
                                 {addr.line2 && <p className="text-xs text-textMuted">{addr.line2}</p>}
                              </>
                           );
                        })()}
                     </div>
                     <div className="bg-bgSurface border border-borderColor rounded-sm p-6">
                        <div className="flex items-center gap-2 mb-4 text-textMuted">
                           <iconify-icon icon="solar:map-point-linear" width="16"></iconify-icon>
                           <span className="text-[10px] font-black uppercase tracking-widest">Destination / Recipient</span>
                        </div>
                        <p className="text-sm font-bold text-textMain">{shipment.recipient.company || shipment.recipient.name}</p>
                        {(() => {
                           const addr = formatAddressLines(shipment.recipient.street, shipment.recipient.city, shipment.recipient.country);
                           return (
                              <>
                                 {addr.line1 && <p className="text-xs text-textMuted mt-1">{addr.line1}</p>}
                                 {addr.line2 && <p className="text-xs text-textMuted">{addr.line2}</p>}
                              </>
                           );
                        })()}
                     </div>
                  </motion.div>

                  {/* Origin / Destination City Strip */}
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.18 }}
                     className="bg-bgSurface/20 border border-borderColor rounded-sm p-4 relative overflow-hidden h-40 flex items-center justify-between px-3 md:px-8"
                  >
                     <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--text-muted) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                     <div className="relative z-10 text-center min-w-0">
                        <div className="w-10 h-10 bg-bgMain border border-borderColor rounded-full flex items-center justify-center text-textMuted mb-2 mx-auto shadow-lg">
                           <iconify-icon icon="solar:box-linear" width="16"></iconify-icon>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-textMuted mb-1">Origin</p>
                        <p className="text-sm font-black heading-font text-textMain truncate max-w-[90px] md:max-w-[140px]">
                           {shipment.sender.city || 'Origin'}
                        </p>
                     </div>

                     <div className="flex-1 mx-2 md:mx-4 relative">
                        <div className="h-[2px] w-full bg-borderColor relative overflow-hidden">
                           <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: shipment.status === 'delivered' ? '100%' : '50%' }}
                              transition={{ duration: 1.5, ease: 'easeInOut' }}
                              className="absolute left-0 top-0 bottom-0 bg-red-600"
                           ></motion.div>
                        </div>
                        <motion.div
                           initial={{ left: 0 }}
                           animate={{ left: shipment.status === 'delivered' ? '100%' : '50%' }}
                           transition={{ duration: 1.5, ease: 'easeInOut' }}
                           className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-bgMain border-2 border-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)] z-20"
                        >
                           <iconify-icon icon="solar:plane-linear" width="12" class="text-red-600"></iconify-icon>
                        </motion.div>
                     </div>

                     <div className="relative z-10 text-center min-w-0">
                        <div className="w-10 h-10 bg-bgMain border border-borderColor rounded-full flex items-center justify-center text-textMuted mb-2 mx-auto shadow-lg">
                           <iconify-icon icon="solar:map-point-linear" width="16"></iconify-icon>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-textMuted mb-1">Destination</p>
                        <p className="text-sm font-black heading-font text-textMain truncate max-w-[90px] md:max-w-[140px]">
                           {shipment.recipient.city || 'Destination'}
                        </p>
                     </div>
                  </motion.div>

                  {/* Route Map Visual */}
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.2 }}
                     className="h-[400px] mb-8"
                  >
                     <TrackingMap
                        currentLocation={shipment.currentLocation}
                        originAddress={`${shipment.sender.city}, ${shipment.sender.country}`}
                        destinationAddress={`${shipment.recipient.city}, ${shipment.recipient.country}`}
                        searchAddress={shipment.locationDetail}
                        location={shipment.coordinates}
                        status={shipment.status}
                        className="h-full border border-borderColor"
                     />
                  </motion.div>

                  {/* History Feed */}
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.3 }}
                     className="bg-bgSurface border border-borderColor rounded-sm p-8"
                  >
                     <h3 className="metadata-label text-textMuted mb-8 flex items-center gap-2">
                        <iconify-icon icon="solar:history-linear" width="14"></iconify-icon>
                        Shipment Progress
                     </h3>
                     <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-borderColor">
                        <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-borderColor">
                           {(() => {
                              const preDeliveryStatuses = new Set(['pending', 'quoted', 'confirmed']);
                              const movementHistory = shipment.history.filter(e => {
                                 const s = (e.status || '').toLowerCase().trim();
                                 return s && !preDeliveryStatuses.has(s);
                              });

                              const filteredHistory = [...movementHistory].reverse().reduce((acc: any[], event: any) => {
                                 const last = acc[acc.length - 1];
                                 const normalize = (str: string) => str?.toLowerCase().trim().replace(/\s+/g, ' ') || '';
                                 if (!last ||
                                    normalize(last.status) !== normalize(event.status) ||
                                    normalize(last.location) !== normalize(event.location)) {
                                    acc.push(event);
                                 }
                                 return acc;
                              }, []);

                              if (filteredHistory.length === 0) {
                                 return (
                                    <div className="relative pl-10">
                                       <div className="absolute left-0 top-1.5 w-[23px] h-[23px] bg-bgMain border border-borderColor rounded flex items-center justify-center">
                                          <div className="w-1.5 h-1.5 rounded-full bg-textMuted"></div>
                                       </div>
                                       <p className="text-xs text-textMuted font-medium italic">No movement recorded yet. Tracking updates will appear once the shipment is in transit.</p>
                                    </div>
                                 );
                              }

                              return filteredHistory.map((event, i) => (
                                 <div key={i} className="relative pl-10 group">
                                    <div className={`absolute left-0 top-1.5 w-[23px] h-[23px] bg-bgMain border rounded flex items-center justify-center transition-all ${i === 0 ? 'border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)] animate-pulse' : 'border-borderColor'}`}>
                                       <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-red-600 shadow-[0_0_5px_#dc2626]' : 'bg-textMuted'}`}></div>
                                    </div>
                                    <div className="space-y-2">
                                       <p className={`font-black uppercase tracking-tight leading-snug ${i === 0 ? 'text-lg text-textMain' : 'text-base text-textMain'}`}>
                                          {event.description}
                                       </p>
                                       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-textMuted">
                                          <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                             <iconify-icon icon="solar:map-point-linear" width="12"></iconify-icon>
                                             {event.location}
                                          </p>
                                          <p className="text-[9px] font-black uppercase tracking-widest">{event.date} • {event.time}</p>
                                       </div>
                                    </div>
                                 </div>
                              ));
                           })()}
                        </div>
                     </div>
                  </motion.div>
               </div>

               {/* Sidebar Info */}
               <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-6"
               >
                  {/* Package Specs */}
                  <div className="bg-bgMain border border-borderColor rounded-sm p-8">
                     <h3 className="metadata-label text-textMuted mb-6">Manifest Specifications</h3>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-borderColor">
                           <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Gross Weight</span>
                           <span className="text-sm font-bold text-textMain">{shipment.weight}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-borderColor">
                           <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Dimensions</span>
                           <span className="text-sm font-bold text-textMain">{shipment.dimensions}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-borderColor">
                           <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Service Tier</span>
                           <span className="text-sm font-bold text-textMain text-right">{shipment.serviceType}</span>
                        </div>
                     </div>
                  </div>

                  {/* Item Inventory */}
                  <div className="bg-bgMain border border-borderColor rounded-sm p-8">
                     <h3 className="metadata-label text-textMuted mb-6">Item Inventory</h3>
                     <div className="space-y-6">
                        {shipment.items.map((item, idx) => (
                           <div key={idx} className="flex gap-4 items-start">
                              <div className="w-8 h-8 bg-bgSurface border border-borderColor rounded-sm flex items-center justify-center text-xs font-black text-textMain shrink-0">
                                 {item.quantity}x
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-textMain leading-tight mb-1">{item.description}</p>
                                 <p className="text-[9px] text-textMuted font-black uppercase tracking-wider">SKU: {item.sku} • Val: {item.value}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-red-600/5 border border-red-600/20 rounded-sm p-8">
                     <div className="flex items-center gap-3 mb-4">
                        <iconify-icon icon="solar:shield-check-linear" width="20" class="text-red-600"></iconify-icon>
                        <h3 className="metadata-label text-red-600">AI Insight</h3>
                     </div>
                     <p className="text-xs text-textMain font-medium leading-relaxed italic opacity-80">
                        {aiInsight || "Analyzing manifest data..."}
                     </p>
                  </div>

                  <button className="w-full py-4 bg-bgSurface border border-borderColor hover:border-red-600 text-textMuted hover:text-textMain transition-all rounded-sm font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2">
                     <iconify-icon icon="solar:printer-linear" width="16"></iconify-icon>
                     Print Proof of Delivery
                  </button>
               </motion.div>

            </div>
         </div>
      </section>
   );
};

export default ShipmentDetails;
