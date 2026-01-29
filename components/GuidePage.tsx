import React from 'react';
import { motion } from 'framer-motion';

const GuidePage: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Preparation & Packaging",
      desc: "Ensure your items are secure. Use double-walled boxes for items over 5kg. Apply internal cushioning (bubble wrap or foam) allowing 5cm of clearance on all sides.",
      icon: "solar:box-minimalistic-linear"
    },
    {
      num: "02",
      title: "Digital Labeling",
      desc: "Generate your waybill via our 'Get Quote' tool. Print the label clearly. Do not cover the barcode with tape. Place a duplicate address label inside the box.",
      icon: "solar:qr-code-linear"
    },
    {
      num: "03",
      title: "Customs Documentation",
      desc: "For international shipments, declare contents accurately. Vague descriptions like 'Parts' cause delays. Use specific HS codes provided by our automated tool.",
      icon: "solar:document-text-linear"
    },
    {
      num: "04",
      title: "Network Injection",
      desc: "Drop off at a local hub or schedule a courier pickup. Your package is scanned immediately, triggering the real-time tracking feed.",
      icon: "solar:conveyor-linear"
    },
    {
      num: "05",
      title: "Final Delivery",
      desc: "Receive notifications upon arrival. Our courier will require a digital signature or photo proof of delivery for security.",
      icon: "solar:box-check-linear"
    }
  ];

  return (
    <section className="pt-32 pb-24 bg-bgMain min-h-screen">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <span className="metadata-label text-red-600 block mb-4">Operational Protocols</span>
          <h1 className="text-4xl md:text-6xl font-extrabold heading-font uppercase tracking-tighter text-textMain mb-6">
            Shipping <span className="text-textMuted/50">Guide</span>
          </h1>
          <p className="text-textMuted max-w-xl mx-auto text-sm font-medium">
            Follow these protocols to ensure maximum velocity and safety for your shipments through the PerfectExpress network.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto relative">
          {/* Vertical Line */}
          <div className="absolute left-[27px] md:left-[35px] top-0 bottom-0 w-[1px] bg-borderColor"></div>

          <div className="space-y-16">
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative pl-24 group"
              >
                {/* Number Bubble */}
                <div className="absolute left-0 top-0 w-[54px] h-[54px] md:w-[70px] md:h-[70px] bg-bgMain border border-borderColor group-hover:border-red-600 transition-colors rounded-sm flex items-center justify-center z-10">
                  <span className="text-xl md:text-2xl font-black heading-font text-textMuted group-hover:text-red-600 transition-colors">{step.num}</span>
                </div>

                <div className="bg-bgSurface/40 border border-borderColor p-8 rounded-sm hover:bg-bgSurface transition-colors">
                  <div className="flex items-center gap-4 mb-4">
                    <iconify-icon icon={step.icon} width="24" class="text-red-600"></iconify-icon>
                    <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight text-textMain heading-font">{step.title}</h3>
                  </div>
                  <p className="text-sm text-textMuted leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 text-center"
        >
          <button className="px-12 py-5 bg-red-600 text-white hover:bg-red-700 rounded-sm font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl hover:scale-105 active:scale-95">
            Start A New Shipment
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default GuidePage;