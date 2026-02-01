
import React, { useState } from 'react';
import { Box, ShieldCheck, ArrowRight, Building2, User as UserIcon, Zap, Globe, Lock } from 'lucide-react';
import { User, Organization } from '../types';

interface AuthProps {
  onLogin: (user: User, org: Organization) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orgName: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.orgName) return;
    
    const orgId = formData.orgName.toLowerCase().replace(/\s+/g, '_');
    const userId = formData.email.toLowerCase().replace(/[@.]/g, '_');
    
    onLogin(
      { id: userId, name: formData.name, email: formData.email, role: 'owner' },
      { id: orgId, name: formData.orgName }
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] flex items-center justify-center p-4 overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[150px] rounded-full"></div>
      
      <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 bg-slate-900/40 backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-2xl overflow-hidden relative">
        {/* Marketing / Value Prop Side */}
        <div className="hidden lg:flex flex-col justify-between p-20 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent">
          <div>
            <div className="flex items-center space-x-3 mb-16 animate-in slide-in-from-left-4 duration-500">
              <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                <Box className="text-white" size={32} />
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tighter">Inventory<span className="text-indigo-400">Pro</span></h1>
            </div>
            
            <div className="space-y-6 animate-in slide-in-from-left-6 duration-700">
              <h2 className="text-6xl font-black text-white leading-[1.05] tracking-tight">
                Enterprise <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">Asset Intelligence.</span>
              </h2>
              <p className="text-slate-400 text-xl leading-relaxed max-w-md font-medium">
                The next generation of inventory control. Powered by vision analysis and multi-tenant security for elite organizations.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center space-x-3 text-slate-300">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400"><Lock size={18} /></div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Data Isolation</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-violet-400"><Zap size={18} /></div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Vision Ready</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400"><Globe size={18} /></div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Scaleable Cloud</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-fuchsia-400"><ShieldCheck size={18} /></div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Verified Ops</span>
            </div>
          </div>
        </div>

        {/* User Action Side */}
        <div className="p-10 lg:p-20 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-12">
              <h3 className="text-4xl font-black text-white mb-3">
                {isRegistering ? 'Start Your Journey' : 'Secure Entry'}
              </h3>
              <p className="text-slate-400 font-medium">
                {isRegistering 
                  ? 'Join 2,500+ businesses optimizing their workflow today.' 
                  : 'Access your organization\'s secure repository node.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block ml-1">Full Operator Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input 
                    required
                    type="text" 
                    placeholder="E.g. James Sterling"
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-3xl text-white placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block ml-1">Professional Email</label>
                <input 
                  required
                  type="email" 
                  placeholder="name@organization.com"
                  className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-3xl text-white placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block ml-1">Company / Branch Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input 
                    required
                    type="text" 
                    placeholder="E.g. Sterling Logistics"
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-3xl text-white placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                    value={formData.orgName}
                    onChange={e => setFormData({...formData, orgName: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold py-6 rounded-3xl shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center space-x-3 active:scale-[0.97] group mt-10">
                <span className="uppercase tracking-[0.2em] text-xs">{isRegistering ? 'Create Workspace' : 'Initialize Session'}</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-12 text-center">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-slate-500 text-[11px] font-black uppercase tracking-widest hover:text-indigo-400 transition-colors flex items-center justify-center mx-auto space-x-2"
              >
                <span>{isRegistering ? 'Existing partner? Secure login' : 'New business? Register workspace'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-8 text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] pointer-events-none">
        InventoryPro v2.5 Enterprise Edition
      </div>
    </div>
  );
};

export default Auth;
