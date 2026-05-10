import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const ProcessSection: React.FC = () => {
  const steps = [
    {
      id: "01",
      title: "Digital Booking",
      desc: "Input your shipment details instantly via our secure portal. Our system auto-verifies addresses and compliance requirements.",
      icon: "solar:laptop-linear"
    },
    {
      id: "02",
      title: "Smart Routing",
      desc: "AI algorithms select the optimal transit corridor based on real-time weather, traffic, and customs clearance speeds.",
      icon: "solar:satellite-linear"
    },
    {
      id: "03",
      title: "Precision Handover",
      desc: "Local couriers execute the final mile with white-glove care, providing photo proof-of-delivery upon completion.",
      icon: "solar:box-minimalistic-linear"
    }
  ];

  return (
    <section className="py-16 md:py-32 bg-bgMain border-b border-borderColor relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-bgSurface/20 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="mb-12 md:mb-24 flex flex-col md:flex-row justify-between items-end gap-8">
           <div className="max-w-xl">
             <div className="flex items-center gap-2 mb-4">
               <iconify-icon icon="solar:settings-linear" width="16" class="text-red-600"></iconify-icon>
               <span className="metadata-label text-textMuted">Operational Sequence</span>
             </div>
             <h2 className="text-4xl md:text-5xl font-extrabold heading-font uppercase tracking-tighter text-textMain">
               Streamlined <span className="text-textMuted/60">Logic.</span>
             </h2>
           </div>
           <p className="text-textMuted text-sm font-medium max-w-sm leading-relaxed text-right hidden md:block">
             We have removed the friction from global logistics. Three steps to anywhere in the world.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2, duration: 0.8 }}
              className="relative p-5 md:p-10 border border-borderColor bg-bgSurface/30 rounded-sm group hover:border-red-600/50 transition-colors"
            >
              <div className="absolute -top-6 -right-4 text-[120px] font-black text-neutral-500/10 heading-font pointer-events-none select-none group-hover:text-red-900/10 transition-colors">
                {step.id}
              </div>
              
              <div className="w-12 h-12 mb-5 md:mb-8 rounded-sm bg-bgMain border border-borderColor flex items-center justify-center text-textMain group-hover:scale-110 transition-transform duration-500">
                <iconify-icon icon={step.icon} width="24"></iconify-icon>
              </div>
              
              <h3 className="text-lg font-bold text-textMain uppercase tracking-tight mb-4 heading-font">{step.title}</h3>
              <p className="text-sm text-textMuted leading-relaxed font-medium relative z-10">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const TestimonialsSection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTestimonials([
        {
          id: 1,
          rating: 5,
          text: "PerfectExpress isn't just a courier; they are a strategic asset. Their ability to navigate complex customs for our prototype parts has saved us weeks of development time.",
          initials: "JS",
          name: "James Sterling",
          role: "Ops Director, TechFlow"
        },
        {
          id: 2,
          rating: 5,
          text: "I send care packages to my family in Tokyo monthly. The tracking is incredibly detailed, down to the minute it arrives at their doorstep. Absolute peace of mind.",
          initials: "MK",
          name: "Maria Kovalenko",
          role: "Private Client"
        }
      ]);
      setIsLoading(false);
    };

    fetchTestimonials();
  }, []);

  return (
    <section className="py-16 md:py-32 bg-bgMain relative transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10 md:mb-20">
          <span className="metadata-label text-red-600 mb-4 block">Trust Indicators</span>
          <h2 className="text-4xl md:text-5xl font-extrabold heading-font uppercase tracking-tighter mb-6 text-textMain">Partner Stories</h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
             >
               <iconify-icon icon="solar:reorder-linear" width="32" class="text-red-600"></iconify-icon>
             </motion.div>
             <p className="metadata-label text-textMuted">Loading verified reviews...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="p-6 md:p-10 bg-bgSurface rounded-sm border border-borderColor shadow-sm"
              >
                <div className="flex gap-1 mb-4 md:mb-8 text-red-600">
                  {[...Array(t.rating)].map((_, i) => <iconify-icon key={i} icon="solar:star-bold" width="14"></iconify-icon>)}
                </div>
                <p className="text-lg text-textMain/80 font-medium leading-relaxed mb-4 md:mb-8">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-bgMain border border-borderColor rounded-full flex items-center justify-center text-xs font-black text-textMuted">{t.initials}</div>
                  <div>
                    <p className="text-xs font-bold text-textMain uppercase tracking-widest">{t.name}</p>
                    <p className="text-[10px] text-textMuted uppercase tracking-wider">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export const CTASection: React.FC<{ onGetQuote: () => void }> = ({ onGetQuote }) => {
  return (
    <section className="py-12 md:py-24 bg-bgMain border-t border-borderColor relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--text-muted) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto glass-surface p-8 md:p-16 rounded-sm border border-borderColor"
        >
          <iconify-icon icon="solar:box-linear" width="40" class="text-textMain mb-8"></iconify-icon>
          <h2 className="text-4xl md:text-6xl font-extrabold heading-font uppercase tracking-tighter mb-6 text-textMain">
            Ready to <span className="text-red-600">Move?</span>
          </h2>
          <p className="text-textMuted text-sm md:text-base font-medium mb-6 md:mb-10 max-w-lg mx-auto">
            Join the network that powers global commerce. Get an instant quote for your shipment and experience the difference today.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetQuote}
            className="px-10 py-4 bg-textMain hover:opacity-90 text-bgMain font-black uppercase tracking-[0.2em] text-xs rounded-sm transition-colors shadow-lg"
          >
            Get Shipping Quote
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};