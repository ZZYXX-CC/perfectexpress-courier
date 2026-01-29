import React from 'react';
import { motion } from 'framer-motion';

const Loader: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9999] bg-bgMain flex flex-col items-center justify-center cursor-wait"
    >
      <div className="w-64 relative">
        {/* Progress Bar */}
        <div className="h-1 w-full bg-bgSurface border border-borderColor rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="h-full bg-red-600 relative"
          >
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-white/50 blur-[8px]"></div>
          </motion.div>
        </div>
        
        {/* Text Details */}
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-textMuted animate-pulse">
            Processing
          </span>
          <span className="text-[9px] font-bold text-red-600">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 0.5, repeatType: "reverse" }}
            >
              ///
            </motion.span>
          </span>
        </div>
      </div>
      
      {/* Background Grid Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(var(--text-muted) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
    </motion.div>
  );
};

export default Loader;