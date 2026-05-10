import React from 'react';
import { motion } from 'framer-motion';
import TrackingCard from './TrackingCard';
import { Shipment } from '../types';

interface HeroProps {
  onTrack: (id: string) => Promise<Shipment | null>;
  standalone?: boolean;
}

const Hero: React.FC<HeroProps> = ({ onTrack, standalone = false }) => {
  if (standalone) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <TrackingCard onTrack={onTrack} />
      </div>
    );
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 md:pt-48 overflow-hidden bg-bgMain transition-colors duration-300">
      {/* Blueprint Grid Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 pointer-events-none">
        <div className="absolute w-full h-full" style={{ backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-600/5 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-bgMain to-transparent"></div>
      </div>

      <div className="container mx-auto px-6 text-center z-10">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 md:mb-10 glass-surface rounded-sm"
        >
          <iconify-icon icon="solar:globus-linear" width="14" class="text-red-600"></iconify-icon>
          <span className="metadata-label text-textMuted">Trusted Global Shipping Network</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-5xl md:text-8xl font-extrabold heading-font mb-6 md:mb-8 leading-[1] tracking-tighter uppercase text-textMain"
        >
          EASY WORLDWIDE <br />
          <span className="text-red-600">DELIVERY.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto text-sm md:text-base text-textMuted mb-8 md:mb-14 leading-relaxed font-medium"
        >
          PerfectExpress simplifies the complexity of international logistics. 
          From small documents to large freight, we ensure your world stays connected 
          with reliable, real-time tracking and precise handling.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <TrackingCard onTrack={onTrack} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-8 pt-4 md:mt-24 md:pt-12 border-t border-borderColor grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12"
        >
          {[
            { label: 'On-Time Delivery', value: '99.9%', icon: 'solar:clock-circle-linear' },
            { label: 'Countries Served', value: '240+', icon: 'solar:global-linear' },
            { label: 'Daily Shipments', value: '50k+', icon: 'solar:box-linear' },
            { label: 'Client Retention', value: '98%', icon: 'solar:users-group-rounded-linear' }
          ].map((stat, idx) => (
            <motion.div 
              key={stat.label} 
              className="text-center group"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex justify-center mb-4">
                <iconify-icon icon={stat.icon} width="20" class="text-textMuted group-hover:text-red-600 transition-colors"></iconify-icon>
              </div>
              <p className="text-2xl font-black heading-font text-textMain">{stat.value}</p>
              <p className="metadata-label text-textMuted mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;