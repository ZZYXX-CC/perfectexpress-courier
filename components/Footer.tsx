import React from 'react';

interface FooterProps {
  setPage: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ setPage }) => {
  return (
    <footer className="py-20 bg-bgMain border-t border-borderColor transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-bgSurface border border-borderColor rounded-sm flex items-center justify-center">
                  <iconify-icon icon="solar:delivery-linear" width="24" class="text-red-600"></iconify-icon>
                </div>
                <span className="text-2xl font-extrabold tracking-tighter heading-font uppercase text-textMain">Perfect<span className="text-red-600">Express</span></span>
             </div>
             <p className="text-textMuted text-xs font-medium leading-relaxed max-w-sm">
                Providing easy and reliable shipping solutions for families and businesses worldwide. We focus on getting your packages where they need to be, safely and on time.
             </p>
          </div>
          
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-textMuted/70 mb-8">Our Network</h4>
            <ul className="space-y-4 text-[10px] font-bold text-textMuted uppercase tracking-widest">
              <li><button onClick={() => setPage('network-na')} className="hover:text-red-600 transition-colors text-left">North America</button></li>
              <li><button onClick={() => setPage('network-eu')} className="hover:text-red-600 transition-colors text-left">European Hubs</button></li>
              <li><button onClick={() => setPage('network-ap')} className="hover:text-red-600 transition-colors text-left">Asia Pacific</button></li>
              <li><button onClick={() => setPage('network-local')} className="hover:text-red-600 transition-colors text-left">Local Delivery</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-textMuted/70 mb-8">Helpful Links</h4>
            <ul className="space-y-4 text-[10px] font-bold text-textMuted uppercase tracking-widest">
              <li><button onClick={() => setPage('guide')} className="hover:text-red-600 transition-colors text-left">Shipping Guide</button></li>
              <li><button onClick={() => setPage('tracking')} className="hover:text-red-600 transition-colors text-left">Track Package</button></li>
              <li><button onClick={() => setPage('support')} className="hover:text-red-600 transition-colors text-left">Support Center</button></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-borderColor">
          <div className="flex gap-8 text-[9px] font-black uppercase tracking-[0.2em] text-textMuted/80">
            <button onClick={() => setPage('privacy')} className="hover:text-textMain transition-colors">Privacy Policy</button>
            <button onClick={() => setPage('terms')} className="hover:text-textMain transition-colors">Terms of Service</button>
            <button onClick={() => setPage('cookies')} className="hover:text-textMain transition-colors">Cookie Settings</button>
          </div>

          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-textMuted/80">
            © 2024 PERFECTEXPRESS GLOBAL SHIPPING. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;