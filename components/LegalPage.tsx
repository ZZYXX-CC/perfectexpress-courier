import React from 'react';
import { motion } from 'framer-motion';

interface LegalPageProps {
  type: 'privacy' | 'terms' | 'cookies';
}

const content = {
  privacy: {
    title: "Privacy Protocol",
    ver: "v.4.1.0",
    date: "2024-10-14",
    body: (
      <>
        <h3 className="legal-heading">1. Data Collection</h3>
        <p className="legal-text">PerfectExpress collects data essential for logistics execution, including sender/recipient coordinates, package contents, and payment metadata. All telemetry data from our tracking network is anonymized after 90 days.</p>
        
        <h3 className="legal-heading">2. Usage of Information</h3>
        <p className="legal-text">We use your data solely to optimize route planning, customs clearance, and delivery verification. We do not sell personally identifiable information to third-party data brokers.</p>
        
        <h3 className="legal-heading">3. Security Infrastructure</h3>
        <p className="legal-text">All user data is encrypted at rest using AES-256 and in transit via TLS 1.3. Access to customer databases is restricted to cleared personnel with multi-factor authentication.</p>
      </>
    )
  },
  terms: {
    title: "Terms of Service",
    ver: "v.2.0.4",
    date: "2024-01-22",
    body: (
      <>
        <h3 className="legal-heading">1. Service Agreement</h3>
        <p className="legal-text">By utilizing the PerfectExpress network, you agree that your shipments comply with all IATA and local transport regulations. We reserve the right to inspect any package for safety compliance.</p>
        
        <h3 className="legal-heading">2. Liability Limitations</h3>
        <p className="legal-text">Our liability for lost or damaged goods is limited to the declared value or $100 USD, whichever is lower, unless supplemental 'Secure+' insurance is purchased prior to transit.</p>
        
        <h3 className="legal-heading">3. Prohibited Items</h3>
        <p className="legal-text">Transport of hazardous materials, illicit substances, or currency is strictly prohibited and will result in immediate account termination and reporting to relevant authorities.</p>
      </>
    )
  },
  cookies: {
    title: "Cookie Settings",
    ver: "v.1.1.0",
    date: "2024-05-30",
    body: (
      <>
        <h3 className="legal-heading">1. Essential Tokens</h3>
        <p className="legal-text">These cookies are required for the authentication of your account session and the security of the payment gateway. They cannot be disabled.</p>
        
        <h3 className="legal-heading">2. Analytics Tracers</h3>
        <p className="legal-text">We use anonymous tracers to measure site performance and load times across our global CDN. This helps us optimize the tracking dashboard speed.</p>
        
        <h3 className="legal-heading">3. User Preferences</h3>
        <p className="legal-text">These store your theme settings (Dark/Light mode) and recent tracking searches for your convenience.</p>
      </>
    )
  }
};

const LegalPage: React.FC<LegalPageProps> = ({ type }) => {
  const data = content[type];

  return (
    <section className="pt-32 pb-24 bg-bgMain min-h-screen">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-borderColor bg-bgSurface p-12 md:p-20 rounded-sm shadow-2xl relative overflow-hidden"
        >
          {/* Document Header */}
          <div className="flex justify-between items-start border-b border-borderColor pb-8 mb-12">
             <div>
               <div className="flex items-center gap-3 mb-2">
                 <iconify-icon icon="solar:document-text-linear" width="20" class="text-red-600"></iconify-icon>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-textMuted">Legal Document</span>
               </div>
               <h1 className="text-3xl md:text-5xl font-extrabold heading-font uppercase tracking-tight text-textMain">{data.title}</h1>
             </div>
             <div className="text-right hidden md:block">
               <p className="text-[10px] font-black uppercase tracking-widest text-textMuted mb-1">Version</p>
               <p className="text-xs font-bold text-textMain mb-2">{data.ver}</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-textMuted mb-1">Effective Date</p>
               <p className="text-xs font-bold text-textMain">{data.date}</p>
             </div>
          </div>

          {/* Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
            <iconify-icon icon="solar:shield-check-linear" width="400"></iconify-icon>
          </div>

          {/* Content */}
          <div className="space-y-10 relative z-10">
            <style>{`
              .legal-heading {
                font-family: 'Manrope', sans-serif;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: -0.01em;
                color: var(--text-main);
                font-size: 1.125rem; /* text-lg */
                margin-bottom: 1rem;
              }
              .legal-text {
                font-family: 'Inter', sans-serif;
                color: var(--text-muted);
                font-size: 0.875rem; /* text-sm */
                line-height: 1.75;
                font-weight: 500;
              }
            `}</style>
            {data.body}
          </div>

          {/* Footer Signature Area */}
          <div className="mt-20 pt-8 border-t border-borderColor flex justify-between items-end opacity-50">
             <div className="text-[9px] font-mono text-textMuted">
               DOC_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}<br/>
               HASH: {Math.random().toString(36).substr(2, 16).toUpperCase()}
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               <span className="text-[9px] font-black uppercase tracking-widest text-textMain">Verified</span>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LegalPage;