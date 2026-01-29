import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { User } from '../types';

interface AdminDashboardProps {
  user: User;
}

const volumeData = [
  { time: '08:00', vol: 120 },
  { time: '10:00', vol: 350 },
  { time: '12:00', vol: 480 },
  { time: '14:00', vol: 410 },
  { time: '16:00', vol: 590 },
  { time: '18:00', vol: 320 },
  { time: '20:00', vol: 180 },
];

const logs = [
  { time: '14:24:12', event: 'Hub Sync: New York Gateway online', type: 'sys' },
  { time: '14:23:55', event: 'Manifest PX-9921 created via API', type: 'user' },
  { time: '14:23:10', event: 'Alert: Capacity warning at FRA-02', type: 'warn' },
  { time: '14:22:05', event: 'User login: admin_master', type: 'auth' },
  { time: '14:21:44', event: 'Fleet tracking update: Unit 442', type: 'sys' },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  return (
    <section className="pt-32 pb-24 bg-bgMain min-h-screen">
      <div className="container mx-auto px-6">
        
        {/* Overwatch Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 border-b border-borderColor pb-8 flex flex-col md:flex-row justify-between items-end"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <span className="metadata-label text-red-600">Live Operations Feed</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold heading-font uppercase tracking-tighter text-textMain">
              Operations <span className="text-textMuted">Overwatch</span>
            </h1>
          </div>
          <div className="flex gap-8 mt-6 md:mt-0">
             <div className="text-right">
               <p className="metadata-label text-textMuted mb-1">Network Load</p>
               <p className="text-xl font-black heading-font text-textMain">84%</p>
             </div>
             <div className="text-right">
               <p className="metadata-label text-textMuted mb-1">Active Nodes</p>
               <p className="text-xl font-black heading-font text-textMain">1,204</p>
             </div>
             <div className="text-right">
               <p className="metadata-label text-textMuted mb-1">Global Time</p>
               <p className="text-xl font-black heading-font text-textMain">14:25 UTC</p>
             </div>
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Network Health */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 bg-bgSurface/20 border border-borderColor rounded-sm p-6"
          >
            <h3 className="metadata-label text-textMuted mb-6 flex items-center gap-2">
               <iconify-icon icon="solar:globus-linear" width="14"></iconify-icon>
               Regional Status
            </h3>
            <div className="space-y-4">
               {[
                 { region: 'North America', status: 'Optimal', color: 'text-green-500' },
                 { region: 'Europe West', status: 'Heavy Load', color: 'text-yellow-500' },
                 { region: 'Asia Pacific', status: 'Optimal', color: 'text-green-500' },
                 { region: 'South America', status: 'Maint.', color: 'text-blue-500' },
               ].map((r, i) => (
                 <div key={i} className="flex justify-between items-center p-3 bg-bgMain border border-borderColor rounded-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-textMain">{r.region}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${r.color}`}>{r.status}</span>
                 </div>
               ))}
            </div>

            <div className="mt-8 pt-8 border-t border-borderColor">
               <h3 className="metadata-label text-textMuted mb-6">Fleet Allocation</h3>
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                       <span className="text-textMain">Air Freight</span>
                       <span className="text-textMuted">82% In Air</span>
                    </div>
                    <div className="h-1 w-full bg-bgMain rounded-full overflow-hidden">
                       <div className="h-full bg-red-600 w-[82%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                       <span className="text-textMain">Ground Transport</span>
                       <span className="text-textMuted">94% Active</span>
                    </div>
                    <div className="h-1 w-full bg-bgMain rounded-full overflow-hidden">
                       <div className="h-full bg-textMain w-[94%]"></div>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>

          {/* Column 2 & 3: Main Visuals */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
             {/* Volume Chart */}
             <div className="bg-bgMain border border-borderColor rounded-sm p-8">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="metadata-label text-textMuted">Processing Volume (Packages/Hr)</h3>
                   <span className="text-red-600 text-[10px] font-black uppercase tracking-widest animate-pulse">Live</span>
                </div>
                <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={volumeData}>
                         <Tooltip 
                            cursor={{fill: 'var(--bg-surface)'}}
                            contentStyle={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '8px' }}
                            itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-main)' }}
                         />
                         <XAxis dataKey="time" tick={{fontSize: 10, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                         <Bar dataKey="vol" fill="#dc2626" radius={[2, 2, 0, 0]} barSize={40} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Quick Actions Grid */}
             <div className="grid grid-cols-3 gap-4">
                <button className="p-6 bg-bgSurface border border-borderColor hover:bg-red-600 hover:text-white transition-all rounded-sm group">
                   <iconify-icon icon="solar:users-group-rounded-linear" width="24" class="text-textMuted group-hover:text-white mb-2"></iconify-icon>
                   <p className="text-[10px] font-black uppercase tracking-widest">User Mgmt</p>
                </button>
                <button className="p-6 bg-bgSurface border border-borderColor hover:bg-red-600 hover:text-white transition-all rounded-sm group">
                   <iconify-icon icon="solar:bill-list-linear" width="24" class="text-textMuted group-hover:text-white mb-2"></iconify-icon>
                   <p className="text-[10px] font-black uppercase tracking-widest">Invoices</p>
                </button>
                <button className="p-6 bg-bgSurface border border-borderColor hover:bg-red-600 hover:text-white transition-all rounded-sm group">
                   <iconify-icon icon="solar:settings-linear" width="24" class="text-textMuted group-hover:text-white mb-2"></iconify-icon>
                   <p className="text-[10px] font-black uppercase tracking-widest">System Config</p>
                </button>
             </div>
          </motion.div>

          {/* Column 4: Logs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 bg-bgMain border border-borderColor rounded-sm p-6 flex flex-col h-full"
          >
             <h3 className="metadata-label text-textMuted mb-6 flex items-center gap-2">
                <iconify-icon icon="solar:terminal-linear" width="14"></iconify-icon>
                System Logs
             </h3>
             <div className="flex-1 overflow-hidden font-mono text-[10px] space-y-4">
                {logs.map((log, i) => (
                   <div key={i} className="border-l-2 border-borderColor pl-3 pb-1">
                      <span className="text-textMuted opacity-50 block mb-1">{log.time}</span>
                      <span className={`font-bold ${
                         log.type === 'warn' ? 'text-yellow-500' : 
                         log.type === 'sys' ? 'text-textMain' : 'text-textMuted'
                      }`}>
                         {log.event}
                      </span>
                   </div>
                ))}
                <div className="border-l-2 border-red-600 pl-3 animate-pulse">
                   <span className="text-red-600 font-bold">Awaiting input...</span>
                </div>
             </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;