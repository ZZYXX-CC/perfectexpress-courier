import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QuoteSection: React.FC = () => {
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [service, setService] = useState('Standard Shipping');
  const [result, setResult] = useState<string | null>(null);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !dest) return;
    const base = Math.floor(Math.random() * 800) + 150;
    const price = service === 'Express Delivery' ? base * 1.8 : base;
    setResult(`$${price.toFixed(2)} USD`);
  };

  return (
    <section className="py-24 bg-bgMain border-t border-borderColor transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-bgSurface/20 p-12 rounded border border-borderColor"
        >
          <div className="text-center mb-14">
            <iconify-icon icon="solar:calculator-linear" width="28" class="text-textMuted mb-4"></iconify-icon>
            <h2 className="text-3xl font-extrabold heading-font uppercase tracking-tight mb-4 text-textMain">Shipping Cost Estimate</h2>
            <p className="text-textMuted text-sm font-medium max-w-lg mx-auto leading-relaxed">
              Find out how much it costs to send your package. Just enter where you are sending from and to, and choose your preferred shipping speed.
            </p>
          </div>

          <form onSubmit={calculate} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-textMuted/80 uppercase tracking-widest">
                <iconify-icon icon="solar:map-point-linear" width="12"></iconify-icon>
                Shipping From
              </label>
              <input 
                type="text" 
                placeholder="CITY OR COUNTRY" 
                className="w-full bg-bgMain border border-borderColor rounded-sm px-6 py-4 focus:border-textMuted outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-textMuted/80 uppercase tracking-widest">
                <iconify-icon icon="solar:map-point-wave-linear" width="12"></iconify-icon>
                Shipping To
              </label>
              <input 
                type="text" 
                placeholder="CITY OR COUNTRY" 
                className="w-full bg-bgMain border border-borderColor rounded-sm px-6 py-4 focus:border-textMuted outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain"
                value={dest}
                onChange={e => setDest(e.target.value)}
              />
            </div>
            <div className="space-y-4 md:col-span-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-textMuted/80 uppercase tracking-widest">
                <iconify-icon icon="solar:box-linear" width="12"></iconify-icon>
                Shipping Speed
              </label>
              <select 
                className="w-full bg-bgMain border border-borderColor rounded-sm px-6 py-4 focus:border-textMuted outline-none transition-all appearance-none text-xs font-bold uppercase tracking-widest text-textMain"
                value={service}
                onChange={e => setService(e.target.value)}
              >
                <option>Standard Shipping (Affordable)</option>
                <option>Express Delivery (Fastest)</option>
                <option>Sea Cargo (Bulk Items)</option>
              </select>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="md:col-span-2 py-5 bg-textMain text-bgMain hover:opacity-90 rounded-sm font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-xl active:scale-[0.99]"
            >
              Get Shipping Price
            </motion.button>
          </form>

          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16 pt-12 border-t border-borderColor text-center"
              >
                <p className="text-textMuted text-[10px] mb-3 uppercase font-black tracking-widest">Estimated Price</p>
                <motion.p 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-6xl font-extrabold text-textMain heading-font tracking-tighter"
                >
                  {result}
                </motion.p>
                <p className="text-[10px] text-textMuted mt-8 uppercase font-bold max-w-sm mx-auto leading-relaxed">This is an estimate. Final price may change slightly based on the exact weight and size of your package.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default QuoteSection;