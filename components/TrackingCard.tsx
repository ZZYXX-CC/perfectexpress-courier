import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTrackingInsight } from '../services/geminiService';
import { Shipment } from '../types';

interface TrackingCardProps {
  onTrack: (id: string) => Promise<Shipment | null>;
}

const TrackingCard: React.FC<TrackingCardProps> = ({ onTrack }) => {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const statusOrder: string[] = [
    'pending',
    'quoted',
    'confirmed',
    'in-transit',
    'out-for-delivery',
    'delivered'
  ];

  const getProgress = (status: string) => {
    if (status === 'held') return 60;
    if (status === 'cancelled') return 0;

    const index = statusOrder.indexOf(status);
    if (index === -1) return 50; // Unknown/custom statuses get 50%
    const base = Math.round((index / (statusOrder.length - 1)) * 100);
    return index === 0 ? 10 : base;
  };

  const getProgressLabel = (status: string) => {
    const knownLabels: Record<string, string> = {
      'pending': 'Order Created',
      'quoted': 'Awaiting Payment',
      'confirmed': 'Payment Confirmed',
      'in-transit': 'In Transit',
      'out-for-delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'held': 'On Hold',
      'cancelled': 'Cancelled',
    };
    return knownLabels[status] || status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId) return;
    
    setLoading(true);
    setAiInsight(null);
    setCurrentStatus(null);
    setTrackError(null);

    // Short delay to simulate network feel even with local mock
    await new Promise(r => setTimeout(r, 600));

    try {
      const shipment = await onTrack(trackingId);
      if (!shipment) {
        setTrackError('Shipment not found');
        return;
      }

      setCurrentStatus(shipment.status);
      const insight = await getTrackingInsight(trackingId, shipment.status);
      setAiInsight(insight || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-bgSurface/40 p-1.5 rounded-sm border border-borderColor shadow-2xl backdrop-blur-sm transition-colors duration-300">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-1.5">
          <div className="flex-1 relative">
             <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-textMuted">
               <iconify-icon icon="solar:magnifer-linear" width="18"></iconify-icon>
             </div>
             <input
              type="text"
              placeholder="ENTER SHIPMENT REFERENCE (PFX-XXXXXXXX)"
              className="w-full bg-bgSurface border-none rounded-sm pl-14 pr-6 py-5 focus:ring-1 focus:ring-textMuted outline-none transition-all font-bold uppercase tracking-widest text-[10px] text-textMain"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-bgSurface text-white px-10 py-5 rounded-sm font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <iconify-icon icon="solar:refresh-linear" width="18" class="animate-spin"></iconify-icon>
                Checking...
              </>
            ) : (
              <>
                <iconify-icon icon="solar:map-point-wave-linear" width="18"></iconify-icon>
                Track Package
              </>
            )}
          </motion.button>
        </form>

        <AnimatePresence>
          {trackError && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mx-1.5 mt-4 mb-1 p-6 bg-bgMain border border-borderColor rounded-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 text-center">
                  {trackError}
                </p>
              </div>
            </motion.div>
          )}

          {currentStatus && !trackError && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mx-1.5 mt-4 mb-1 p-6 bg-bgMain border border-borderColor rounded-sm">
                {/* Progress Bar */}
                <div className="mb-6">
                   <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-textMain">{getProgressLabel(currentStatus)}</span>
                      <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest">{getProgress(currentStatus)}% Complete</span>
                   </div>
                   <div className="h-2 w-full bg-bgSurface border border-borderColor rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgress(currentStatus)}%` }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className="h-full bg-red-600 relative"
                      >
                         <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/40 blur-[4px]"></div>
                      </motion.div>
                   </div>
                   <div className="flex justify-between mt-2">
                      {([
                         { status: 'pending', label: 'order created' },
                         { status: 'quoted', label: 'awaiting payment' },
                         { status: 'confirmed', label: 'payment confirmed' },
                         { status: 'in-transit', label: 'in transit' },
                         { status: 'out-for-delivery', label: 'out for delivery' },
                         { status: 'delivered', label: 'delivered' }
                      ] as { status: string; label: string }[]).map((step) => {
                         const stepProgress = getProgress(step.status);
                         const currentProgress = getProgress(currentStatus);
                         const isActive = currentProgress >= stepProgress;
                         
                         return (
                           <div key={step.status} className={`flex flex-col items-center gap-1 transition-colors duration-500 ${isActive ? 'text-textMain' : 'text-textMuted/30'}`}>
                              <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-red-600' : 'bg-current'}`}></div>
                              <span className="hidden md:block text-[8px] font-bold uppercase tracking-wider">{step.label}</span>
                           </div>
                         )
                      })}
                   </div>
                </div>

                {/* AI Insight */}
                {aiInsight && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-3 pt-4 border-t border-borderColor/50">
                      <iconify-icon icon="solar:re-routing-linear" width="14" class="text-textMuted"></iconify-icon>
                      <span className="text-textMuted font-black text-[9px] uppercase tracking-[0.3em]">Network Intelligence Feed</span>
                    </div>
                    <p className="text-[11px] text-textMain/80 leading-relaxed font-medium">
                      {aiInsight}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-10 text-[8px] font-black uppercase tracking-[0.4em] text-textMuted">
        <span className="flex items-center gap-2">
          <iconify-icon icon="solar:clock-circle-linear" width="12" class="text-red-600"></iconify-icon>
          24/7 Support
        </span>
        <span className="flex items-center gap-2">
          <iconify-icon icon="solar:shield-check-linear" width="12" class="text-red-600"></iconify-icon>
          Secure Handling
        </span>
        <span className="flex items-center gap-2">
          <iconify-icon icon="solar:ranking-linear" width="12" class="text-red-600"></iconify-icon>
          Fastest Routes
        </span>
      </div>
    </div>
  );
};

export default TrackingCard;
