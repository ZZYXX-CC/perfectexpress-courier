import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shipment } from '../types';
import { getTrackingInsight } from '../services/geminiService';
import TrackingMap from './TrackingMap';

interface ShipmentDetailsProps {
   shipment: Shipment;
   onBack: () => void;
}

const ShipmentDetails: React.FC<ShipmentDetailsProps> = ({ shipment, onBack }) => {
   const [aiInsight, setAiInsight] = useState<string>('');
   const [isMapFullscreen, setIsMapFullscreen] = useState(false);

   const formatAddressLines = (street?: string, city?: string, country?: string) => {
      const safeStreet = (street || '').trim();
      const cityCountry = [city, country].filter(Boolean).join(', ').trim();

      if (!safeStreet) {
         return { line1: cityCountry, line2: '' };
      }

      if (!cityCountry) {
         return { line1: safeStreet, line2: '' };
      }

      const streetLower = safeStreet.toLowerCase();
      const cityLower = (city || '').toLowerCase();
      const countryLower = (country || '').toLowerCase();

      const hasCity = cityLower && streetLower.includes(cityLower);
      const hasCountry = countryLower && streetLower.includes(countryLower);

      if (hasCity && hasCountry) {
         return { line1: safeStreet, line2: '' };
      }

      return { line1: safeStreet, line2: cityCountry };
   };

   const formatStatusLabel = (status: Shipment['status']) => {
      return status
         .split('-')
         .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
         .join(' ');
   };

   useEffect(() => {
      getTrackingInsight(shipment.id, shipment.status).then(setAiInsight);
   }, [shipment.id, shipment.status]);

   const googleMapsUrl = useMemo(() => {
      if (shipment.coordinates?.lat && shipment.coordinates?.lng) {
         return `https://www.google.com/maps?q=${shipment.coordinates.lat},${shipment.coordinates.lng}`;
      }

      const query = [
         shipment.currentLocation,
         shipment.recipient.city,
         shipment.recipient.country,
      ]
         .filter(Boolean)
         .join(', ');

      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || shipment.id)}`;
   }, [shipment]);

   useEffect(() => {
      if (!isMapFullscreen) return;

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
         document.body.style.overflow = previousOverflow;
      };
   }, [isMapFullscreen]);

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
                           }`}>{formatStatusLabel(shipment.status)}</p>
                     </div>
                     <div className="text-right">
                        <p className="metadata-label text-textMuted mb-1">Est. Arrival</p>
                        <p className="text-lg font-bold text-textMain uppercase tracking-tight">{shipment.estimatedArrival}</p>
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* Tracking Map */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.12 }}
               className={`mb-10 ${isMapFullscreen ? 'fixed inset-0 z-[100] bg-bgMain p-3 md:p-6 overflow-hidden flex flex-col h-dvh' : ''}`}
            >
               <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 shrink-0">
                  <div>
                     <p className="metadata-label text-red-600 mb-1">Live Map View</p>
                     <h2 className="text-xl md:text-2xl font-black heading-font uppercase tracking-tight text-textMain">
                        Route Visibility
                     </h2>
                  </div>

                  <div className="flex items-center gap-2">
                     {isMapFullscreen && (
                        <a
                           href={googleMapsUrl}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-sm font-black uppercase tracking-widest text-[10px] transition-all"
                        >
                           <iconify-icon icon="solar:map-point-wave-linear" width="16"></iconify-icon>
                           Open in Google Maps
                        </a>
                     )}

                     <button
                        onClick={() => setIsMapFullscreen(prev => !prev)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-bgSurface border border-borderColor hover:border-red-600 text-textMain rounded-sm font-black uppercase tracking-widest text-[10px] transition-all"
                     >
                        <iconify-icon
                           icon={isMapFullscreen ? 'solar:minimize-square-linear' : 'solar:maximize-square-linear'}
                           width="16"
                        ></iconify-icon>
                        {isMapFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                     </button>
                  </div>
               </div>

               <TrackingMap
                  currentLocation={shipment.currentLocation}
                  originAddress={`${shipment.sender.city}, ${shipment.sender.country}`}
                  destinationAddress={`${shipment.recipient.city}, ${shipment.recipient.country}`}
                  location={shipment.coordinates}
                  status={shipment.status}
                  className={isMapFullscreen ? 'flex-1 min-h-0 h-full' : 'h-[380px] md:h-[460px]'}
               />
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
                           const senderAddress = formatAddressLines(shipment.sender.street, shipment.sender.city, shipment.sender.country);
                           return (
                              <>
                                 <p className="text-xs text-textMuted mt-1">{senderAddress.line1}</p>
                                 {senderAddress.line2 && <p className="text-xs text-textMuted">{senderAddress.line2}</p>}
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
                           const recipientAddress = formatAddressLines(shipment.recipient.street, shipment.recipient.city, shipment.recipient.country);
                           return (
                              <>
                                 <p className="text-xs text-textMuted mt-1">{recipientAddress.line1}</p>
                                 {recipientAddress.line2 && <p className="text-xs text-textMuted">{recipientAddress.line2}</p>}
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
                     className="bg-bgSurface/20 border border-borderColor rounded-sm p-8 relative overflow-hidden h-64 flex items-center justify-between px-4 md:px-16"
                  >
                     <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--text-muted) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                     <div className="relative z-10 text-center min-w-0">
                        <div className="w-16 h-16 bg-bgMain border border-borderColor rounded-full flex items-center justify-center text-textMuted mb-4 mx-auto shadow-lg">
                           <iconify-icon icon="solar:box-linear" width="24"></iconify-icon>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-textMuted mb-1">Origin</p>
                        <p className="text-xl font-black heading-font text-textMain truncate max-w-[140px] md:max-w-[200px]">
                           {shipment.sender.city || shipment.origin || 'Origin'}
                        </p>
                     </div>

                     <div className="flex-1 mx-4 md:mx-8 relative">
                        <div className="h-[2px] w-full bg-borderColor relative overflow-hidden">
                           <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '50%' }}
                              transition={{ duration: 1.5, ease: 'easeInOut' }}
                              className="absolute left-0 top-0 bottom-0 bg-red-600"
                           ></motion.div>
                        </div>
                        <motion.div
                           initial={{ left: 0 }}
                           animate={{ left: '50%' }}
                           transition={{ duration: 1.5, ease: 'easeInOut' }}
                           className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-bgMain border-2 border-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)] z-20"
                        >
                           <iconify-icon icon="solar:plane-linear" width="16" class="text-red-600"></iconify-icon>
                        </motion.div>
                     </div>

                     <div className="relative z-10 text-center min-w-0">
                        <div className="w-16 h-16 bg-bgMain border border-borderColor rounded-full flex items-center justify-center text-textMuted mb-4 mx-auto shadow-lg">
                           <iconify-icon icon="solar:map-point-linear" width="24"></iconify-icon>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-textMuted mb-1">Destination</p>
                        <p className="text-xl font-black heading-font text-textMain truncate max-w-[140px] md:max-w-[200px]">
                           {shipment.recipient.city || shipment.destination || 'Destination'}
                        </p>
                     </div>
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
                        {(() => {
                           // Filter consecutive duplicates with robust normalization
                           const filteredHistory = [...shipment.history].reverse().reduce((acc: any[], event: any) => {
                              const last = acc[acc.length - 1];

                              const normalize = (str: string) => str?.toLowerCase().trim().replace(/\s+/g, ' ') || '';

                              if (!last ||
                                 normalize(last.status) !== normalize(event.status) ||
                                 normalize(last.location) !== normalize(event.location)) {
                                 acc.push(event);
                              }
                              return acc;
                           }, []);

                           return filteredHistory.map((event, i) => (
                              <div key={i} className="relative pl-10 group">
                                 <div className={`absolute left-0 top-1.5 w-[23px] h-[23px] bg-bgMain border rounded flex items-center justify-center transition-all ${i === 0 ? 'border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)] animate-pulse' : 'border-borderColor'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-red-600 shadow-[0_0_5px_#dc2626]' : 'bg-textMuted'}`}></div>
                                 </div>
                                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                                    <p className="text-sm font-bold text-textMain uppercase tracking-tight">{event.location}</p>
                                    <p className="text-[9px] font-black text-textMuted uppercase tracking-widest">{event.date} • {event.time}</p>
                                 </div>
                                 <p className="text-xs text-textMuted font-medium">{event.description}</p>
                              </div>
                           ));
                        })()}
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
