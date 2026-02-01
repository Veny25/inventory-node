
import React from 'react';
import { InventoryItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, AlertTriangle, Layers, DollarSign, Clock, CheckCircle2, ArrowRight, Zap, Target, Activity, ShieldCheck, Cpu } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ inventory, onItemClick }) => {
  const lowStockItems = React.useMemo(() => inventory.filter(item => item.stockCount <= item.minStock), [inventory]);
  const totalValue = React.useMemo(() => inventory.reduce((acc, item) => acc + (item.price * item.stockCount), 0), [inventory]);
  
  const categoryData = React.useMemo(() => inventory.reduce((acc: any[], item) => {
    const existing = acc.find(c => c.name === item.category);
    if (existing) {
      existing.value += item.stockCount;
    } else {
      acc.push({ name: item.category, value: item.stockCount });
    }
    return acc;
  }, []), [inventory]);

  const recentItems = React.useMemo(() => [...inventory]
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 5), [inventory]);

  const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f97316'];

  const StatCard = React.memo(({ title, value, subtitle, Icon, colorClass, trend }: any) => (
    <div className="bg-white p-6 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-slate-100 group hover:border-indigo-400 transition-premium relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-4 rounded-[1.25rem] ${colorClass} bg-opacity-10 text-opacity-100 transition-premium group-hover:scale-110 shadow-sm`}>
            <Icon size={24} />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-[9px] font-black ${trend > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
              <span>{trend > 0 ? '↑' : '↓'} {trend}%</span>
            </div>
          )}
        </div>
        <p className="text-slate-400 text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight truncate">{value}</h3>
        <p className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3 opacity-60 flex items-center">
          <Activity size={10} className="mr-1.5" />
          {subtitle}
        </p>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-50/50 transition-colors blur-3xl"></div>
    </div>
  ));

  return (
    <div className="space-y-6 lg:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-10">
      {/* SYSTEM HEADER TICKER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 lg:p-6 bg-slate-900 rounded-[1.5rem] lg:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
         <div className="flex items-center space-x-6 relative z-10">
            <div className="flex items-center space-x-3 border-r border-white/10 pr-6">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Operational Integrity: 100%</span>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Cpu size={18} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Vision Engine: Optimized</span>
            </div>
         </div>
         <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 relative z-10">
           Last Update: {new Date().toLocaleTimeString()}
         </div>
         <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent"></div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-10">
        <StatCard 
          title="Assets Value" 
          value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} 
          subtitle="Net Repository Valuation"
          Icon={DollarSign}
          colorClass="bg-indigo-600 text-indigo-600"
          trend={12}
        />
        <StatCard 
          title="Stock Alerts" 
          value={lowStockItems.length} 
          subtitle="Critical Node Intervention"
          Icon={AlertTriangle}
          colorClass="bg-rose-500 text-rose-500"
        />
        <StatCard 
          title="Total Units" 
          value={inventory.reduce((a, b) => a + b.stockCount, 0).toLocaleString()} 
          subtitle="Enterprise Unit Count"
          Icon={Layers}
          colorClass="bg-violet-500 text-violet-500"
          trend={-3}
        />
        <StatCard 
          title="Ops Health" 
          value={`${Math.round((1 - lowStockItems.length / (inventory.length || 1)) * 100)}%`} 
          subtitle="Logical Distribution Score"
          Icon={Target}
          colorClass="bg-emerald-500 text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
        <div className="lg:col-span-2 space-y-6 lg:space-y-12">
          {/* COMPARATIVE ANALYSIS CHART */}
          <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-xl shadow-slate-200/30 border border-slate-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 lg:mb-16 gap-6">
              <div>
                <h3 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight">Stock Distribution</h3>
                <p className="text-slate-400 text-[10px] lg:text-sm font-medium uppercase tracking-[0.2em] mt-1">Cross-category unit comparative</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center space-x-6 px-6">
                 <div className="flex items-center space-x-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Nominal</span>
                 </div>
                 <div className="flex items-center space-x-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Warning</span>
                 </div>
              </div>
            </div>
            <div className="h-[250px] lg:h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventory}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', radius: 16 }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="stockCount" radius={[10, 10, 0, 0]} barSize={window.innerWidth < 1024 ? 30 : 60}>
                    {inventory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.stockCount <= entry.minStock ? '#f43f5e' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECENT OPS LOG */}
          <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-xl shadow-slate-200/30 border border-slate-100">
            <div className="flex items-center justify-between mb-10 lg:mb-12">
              <h3 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center">
                <Clock className="mr-5 text-indigo-500" size={28} />
                Operational History
              </h3>
              <button className="text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:underline">Full Audit View</button>
            </div>
            <div className="space-y-4">
              {recentItems.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => onItemClick(item)}
                  className="w-full flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:border-indigo-400 hover:shadow-2xl transition-premium group text-left active:scale-[0.99]"
                >
                  <div className="flex items-center space-x-4 lg:space-x-8">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-premium shadow-sm border border-slate-100">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-base lg:text-xl font-black text-slate-900 mb-1 truncate max-w-[150px] lg:max-w-none">{item.name}</p>
                      <p className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(item.lastUpdated).toLocaleDateString()} • SKU: {item.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 lg:space-x-12">
                    <div className="text-right">
                      <p className="text-xl lg:text-2xl font-black text-slate-900">{item.stockCount}</p>
                      <p className="text-[9px] lg:text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{item.location}</p>
                    </div>
                    <ArrowRight size={22} className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-2 transition-premium" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* VERTICAL ALLOCATION PANEL */}
        <div className="bg-white p-10 lg:p-14 rounded-[2.5rem] lg:rounded-[4rem] shadow-xl shadow-slate-200/30 border border-slate-100 h-fit lg:sticky lg:top-10 flex flex-col items-center">
          <div className="w-full mb-12">
            <h3 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight">Node Topology</h3>
            <p className="text-slate-400 text-[10px] lg:text-sm font-medium uppercase tracking-[0.2em] mt-1">Classification split</p>
          </div>
          
          <div className="relative w-full h-[300px] lg:h-[400px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={window.innerWidth < 1024 ? 80 : 120}
                  outerRadius={window.innerWidth < 1024 ? 110 : 160}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl lg:text-7xl font-black text-slate-900 leading-none">{inventory.length}</span>
                <span className="text-[10px] lg:text-sm text-slate-400 font-black uppercase tracking-[0.4em] mt-2">SKU Nodes</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 gap-4 mt-12">
            {categoryData.slice(0, 4).map((c: any, i: number) => (
              <div key={c.name} className="flex items-center justify-between p-5 lg:p-6 bg-slate-50 rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 group hover:bg-white transition-premium">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[10px] lg:text-[12px] font-black text-slate-600 uppercase tracking-widest truncate max-w-[120px]">{c.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] lg:text-sm font-black text-slate-900 block">{Math.round((c.value / (inventory.reduce((a,b) => a+b.stockCount, 0) || 1)) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
