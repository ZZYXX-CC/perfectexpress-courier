import React from 'react';
import { motion } from 'framer-motion';

interface NetworkPageProps {
  regionId: 'na' | 'eu' | 'ap' | 'local';
}

const regions = {
  na: {
    name: "North America",
    code: "NET-NA-01",
    hubs: ["New York JFK", "Los Angeles LAX", "Toronto YYZ", "Mexico City MEX"],
    stats: [
      { label: "Daily Sort", value: "4.2M" },
      { label: "Fleet Units", value: "12,500" },
      { label: "Coverage", value: "99.8%" },
      { label: "Next Day", value: "Available" }
    ],
    desc: "Our North American infrastructure utilizes a high-speed ground network integrated with 14 major air gateways to ensure coast-to-coast delivery within 24 hours."
  },
  eu: {
    name: "Europe & UK",
    code: "NET-EU-02",
    hubs: ["London LHR", "Frankfurt FRA", "Paris CDG", "Amsterdam AMS"],
    stats: [
      { label: "Cross-Border", value: "Seamless" },
      { label: "Rail Link", value: "Active" },
      { label: "Green Fleet", value: "65%" },
      { label: "Hubs", value: "42" }
    ],
    desc: "Optimized for the complex regulatory environment of the Eurozone, featuring automated customs clearance and a dedicated high-speed rail freight corridor."
  },
  ap: {
    name: "Asia Pacific",
    code: "NET-AP-03",
    hubs: ["Tokyo NRT", "Singapore SIN", "Hong Kong HKG", "Sydney SYD"],
    stats: [
      { label: "Ocean Freight", value: "Daily" },
      { label: "Air Cargo", value: "Hourly" },
      { label: "Growth", value: "+18% YoY" },
      { label: "Ports", value: "88" }
    ],
    desc: "Connecting the world's manufacturing powerhouses with consumer markets. Our APAC network specializes in high-volume freight and electronics logistics."
  },
  local: {
    name: "Local Delivery",
    code: "NET-LOC-04",
    hubs: ["Urban Micro-Hubs", "Smart Lockers", "Retail Partners"],
    stats: [
      { label: "Last Mile", value: "< 2hrs" },
      { label: "EV Fleet", value: "100%" },
      { label: "Precision", value: "GPS+" },
      { label: "Night Ops", value: "24/7" }
    ],
    desc: "Precision last-mile logistics using electric vans and drone prototypes to navigate dense urban environments with zero emissions."
  }
};

const NetworkPage: React.FC<NetworkPageProps> = ({ regionId }) => {
  const data = regions[regionId];

  return (
    <section className="pt-32 pb-24 bg-bgMain min-h-screen">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 border-b border-borderColor pb-10"
        >
           <div className="flex items-center gap-3 mb-4">
             <span className="px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-sm">
               Network Status: Online
             </span>
             <span className="text-[10px] text-textMuted font-black uppercase tracking-[0.2em]">{data.code}</span>
           </div>
           <h1 className="text-5xl md:text-7xl font-extrabold heading-font uppercase tracking-tighter text-textMain mb-6">
             {data.name}
           </h1>
           <p className="text-textMuted text-base md:text-lg max-w-2xl font-medium leading-relaxed">
             {data.desc}
           </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {data.stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-bgSurface border border-borderColor p-8 rounded-sm group hover:border-red-600/50 transition-colors"
              >
                <p className="text-[9px] text-textMuted uppercase font-black tracking-widest mb-2">{stat.label}</p>
                <p className="text-3xl font-black heading-font text-textMain group-hover:text-red-600 transition-colors">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Hub List */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-bgSurface/20 border border-borderColor rounded-sm p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <iconify-icon icon="solar:globus-linear" width="120"></iconify-icon>
            </div>
            <h3 className="text-xl font-bold heading-font uppercase tracking-tight text-textMain mb-8 flex items-center gap-3">
              <iconify-icon icon="solar:radar-linear" width="24" class="text-red-600"></iconify-icon>
              Strategic Hubs
            </h3>
            <ul className="space-y-6">
              {data.hubs.map((hub, i) => (
                <li key={i} className="flex items-center justify-between border-b border-borderColor/50 pb-4 last:border-0">
                  <span className="text-sm font-bold text-textMain uppercase tracking-wider">{hub}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] text-textMuted uppercase font-black tracking-widest">Active</span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default NetworkPage;