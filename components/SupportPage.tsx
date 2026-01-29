import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SupportPage: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
  };

  return (
    <section className="pt-32 pb-24 bg-bgMain min-h-screen">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-bgSurface border border-borderColor rounded-full">
             <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-textMuted">Live Support: Active</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold heading-font uppercase tracking-tighter text-textMain mb-4">
            Communication <span className="text-red-600">Center</span>
          </h1>
          <p className="text-textMuted max-w-xl mx-auto text-sm font-medium">
            Direct lines to our operational support teams. Priority is given to tracking inquiries and account management.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Contact Details */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-bgSurface p-8 rounded-sm border border-borderColor">
              <iconify-icon icon="solar:phone-calling-linear" width="32" class="text-red-600 mb-6"></iconify-icon>
              <h3 className="text-sm font-black uppercase tracking-widest text-textMain mb-2">Priority Voice</h3>
              <p className="text-2xl font-bold text-textMain heading-font mb-1">+1 (888) 990-2244</p>
              <p className="text-[10px] text-textMuted uppercase tracking-wider">Mon-Fri // 08:00 - 20:00 EST</p>
            </div>

            <div className="bg-bgSurface p-8 rounded-sm border border-borderColor">
              <iconify-icon icon="solar:letter-linear" width="32" class="text-red-600 mb-6"></iconify-icon>
              <h3 className="text-sm font-black uppercase tracking-widest text-textMain mb-2">Digital Support</h3>
              <p className="text-lg font-bold text-textMain mb-1">support@perfectexpress.com</p>
              <p className="text-[10px] text-textMuted uppercase tracking-wider">Avg Response: 45 Mins</p>
            </div>

            <div className="bg-bgSurface p-8 rounded-sm border border-borderColor">
              <iconify-icon icon="solar:map-point-linear" width="32" class="text-red-600 mb-6"></iconify-icon>
              <h3 className="text-sm font-black uppercase tracking-widest text-textMain mb-2">Global HQ</h3>
              <address className="text-sm text-textMuted not-italic font-medium leading-relaxed">
                4400 Logistics Way, Suite 100<br/>
                Terminal 4, Industrial Park<br/>
                New York, NY 10001
              </address>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="lg:col-span-2 bg-bgSurface/20 border border-borderColor p-10 rounded-sm"
          >
            {isSent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-bgMain border border-borderColor rounded-full flex items-center justify-center text-green-500 mb-6">
                  <iconify-icon icon="solar:check-circle-linear" width="40"></iconify-icon>
                </div>
                <h3 className="text-2xl font-black heading-font uppercase text-textMain mb-2">Transmission Received</h3>
                <p className="text-textMuted text-sm font-medium">Our team is reviewing your message. Case #49291 created.</p>
                <button 
                  onClick={() => setIsSent(false)}
                  className="mt-8 text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-500"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Identification</label>
                    <input 
                      required
                      type="text" 
                      placeholder="FULL NAME"
                      className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-4 focus:border-red-600 outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain"
                      value={formState.name}
                      onChange={e => setFormState({...formState, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Return Address</label>
                    <input 
                      required
                      type="email" 
                      placeholder="EMAIL@DOMAIN.COM"
                      className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-4 focus:border-red-600 outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain"
                      value={formState.email}
                      onChange={e => setFormState({...formState, email: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Inquiry Details</label>
                  <textarea 
                    required
                    rows={6}
                    placeholder="ENTER YOUR MESSAGE OR TRACKING NUMBER..."
                    className="w-full bg-bgMain border border-borderColor rounded-sm px-4 py-4 focus:border-red-600 outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain resize-none"
                    value={formState.message}
                    onChange={e => setFormState({...formState, message: e.target.value})}
                  ></textarea>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-[9px] text-textMuted font-medium italic">
                    * All communications are recorded for quality assurance.
                  </p>
                  <button className="px-10 py-4 bg-textMain text-bgMain hover:bg-red-600 hover:text-white rounded-sm font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg active:scale-95">
                    Transmit Message
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SupportPage;