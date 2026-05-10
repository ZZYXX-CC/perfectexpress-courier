import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', shipments: 210 },
  { name: 'Tue', shipments: 280 },
  { name: 'Wed', shipments: 340 },
  { name: 'Thu', shipments: 410 },
  { name: 'Fri', shipments: 480 },
  { name: 'Sat', shipments: 390 },
  { name: 'Sun', shipments: 310 },
];

const Dashboard: React.FC = () => {
  return (
    <section className="py-8 md:py-24 bg-bgMain transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 md:mb-20 gap-4 md:gap-10 border-b border-borderColor pb-6 md:pb-16"
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <iconify-icon icon="solar:info-circle-linear" width="16" class="text-red-600"></iconify-icon>
              <span className="metadata-label text-textMuted">The PerfectExpress Story</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold heading-font uppercase tracking-tighter mb-6 text-textMain">Built for <span className="text-textMuted/60">Global Efficiency.</span></h2>
            <p className="text-textMuted text-sm md:text-base leading-relaxed font-medium">
              Since 2009, PerfectExpress has been redefined the shipping industry by combining high-end logistics technology with human-centric service. We don't just move boxes; we bridge the gap between people and the things they value. Our global network now spans 6 continents, delivering peace of mind with every parcel.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 w-full lg:w-auto">
            <motion.div whileHover={{ borderColor: '#dc2626' }} className="bg-bgSurface border border-borderColor p-4 md:p-8 rounded-sm transition-colors">
              <p className="metadata-label text-textMuted mb-2">Delivery Hubs</p>
              <p className="text-3xl font-black text-textMain heading-font">1,542</p>
            </motion.div>
            <motion.div whileHover={{ borderColor: '#dc2626' }} className="bg-bgSurface border border-borderColor p-4 md:p-8 rounded-sm transition-colors">
              <p className="metadata-label text-textMuted mb-2">Customer Trust</p>
              <p className="text-3xl font-black text-red-600 heading-font">4.9/5</p>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-2 glass-surface p-6 md:p-12 rounded-sm"
          >
            <div className="flex justify-between items-center mb-6 md:mb-12">
              <h3 className="metadata-label text-textMuted flex items-center gap-3">
                <iconify-icon icon="solar:ranking-linear" width="16" class="text-red-600"></iconify-icon>
                Weekly Operational Velocity
              </h3>
            </div>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="var(--border-color)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-muted)" 
                    fontSize={10} 
                    fontWeight="900" 
                    tickLine={false} 
                    axisLine={false} 
                    dy={20} 
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    fontSize={10} 
                    fontWeight="900" 
                    tickLine={false} 
                    axisLine={false} 
                    dx={-20} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '2px', padding: '12px' }}
                    itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    cursor={{ stroke: 'var(--border-color)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="shipments" 
                    stroke="#dc2626" 
                    fillOpacity={1} 
                    fill="url(#colorArea)" 
                    strokeWidth={3} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-bgSurface border border-borderColor p-6 md:p-12 rounded-sm flex flex-col justify-between"
          >
            <div>
              <h3 className="metadata-label text-textMuted mb-6 md:mb-10">Service Reliability Index</h3>
              <div className="space-y-6 md:space-y-12">
                {[
                  { label: 'North America', val: 96, status: 'Fastest' },
                  { label: 'Europe & UK', val: 94, status: 'Direct' },
                  { label: 'Asia Pacific', val: 91, status: 'Expanding' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center metadata-label text-textMuted mb-4">
                      <span>{item.label}</span>
                      <span className="text-textMain">{item.status}</span>
                    </div>
                    <div className="h-1.5 w-full bg-bgMain rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.val}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.3 }}
                        className="h-full bg-red-600/80"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <motion.div 
              whileHover={{ y: -5 }}
              className="mt-8 md:mt-16 p-4 md:p-8 bg-bgMain/60 border border-borderColor rounded-sm"
            >
                <p className="metadata-label text-red-600 mb-3">Our Mission</p>
                <p className="text-xs text-textMuted leading-relaxed font-medium">
                  We empower global commerce by simplifying the shipping experience for individuals and enterprises through unmatched precision and reliability.
                </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;