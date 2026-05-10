import React from 'react';
import { motion } from 'framer-motion';

const Features: React.FC = () => {
  const features = [
    {
      title: "Precision Routes",
      desc: "Our advanced network mapping ensures your package takes the most efficient path, bypassing delays and congestion in real-time.",
      icon: "solar:routing-2-linear",
      link: "View Network"
    },
    {
      title: "Live Visibility",
      desc: "Comprehensive tracking updates from point-of-origin to final destination. Never guess where your valuable shipments are located.",
      icon: "solar:map-point-wave-linear",
      link: "Track Feed"
    },
    {
      title: "Seamless Customs",
      desc: "We handle the regulatory complexity of international trade, ensuring your goods move across borders without friction or hidden fees.",
      icon: "solar:verified-check-linear",
      link: "Global Trade"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <section className="py-10 md:py-32 bg-bgMain border-y border-borderColor transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 md:mb-24"
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
              <span className="metadata-label text-textMuted">Service Excellence</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold heading-font uppercase tracking-tighter mb-6 text-textMain">World-Class <span className="text-textMuted/60">Capabilities.</span></h2>
            <p className="text-textMuted text-base leading-relaxed font-medium">
              We leverage an industrial-grade infrastructure to provide a boutique shipping experience. Every shipment is treated with the highest priority.
            </p>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10"
        >
          {features.map((f, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              whileHover={{ y: -8, borderColor: '#dc2626' }}
              className="group p-4 md:p-12 bg-bgSurface/50 rounded-sm border border-borderColor transition-all duration-500"
            >
              <div className="w-14 h-14 bg-bgMain rounded-sm border border-borderColor flex items-center justify-center text-textMuted mb-6 md:mb-10 group-hover:text-red-600 group-hover:border-red-600/30 transition-all duration-500">
                <iconify-icon icon={f.icon} width="28"></iconify-icon>
              </div>
              <h3 className="text-xl font-bold mb-6 heading-font uppercase tracking-tight text-textMain">{f.title}</h3>
              <p className="text-textMuted text-sm leading-relaxed mb-6 md:mb-10 font-medium">
                {f.desc}
              </p>
              <div className="flex items-center gap-3 metadata-label text-textMuted group-hover:text-textMain transition-colors cursor-pointer">
                <span>{f.link}</span>
                <iconify-icon icon="solar:arrow-right-up-linear" width="16"></iconify-icon>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;