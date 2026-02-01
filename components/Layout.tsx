
import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, User, Organization } from '../types';
import { LayoutDashboard, Box, Camera, MessageSquare, Bell, Search, Settings, ChevronRight, X as CloseIcon, LogOut, ChevronDown, Building2, Zap, LayoutGrid, Menu, Wifi, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  lowStockCount: number;
  user: User;
  organization: Organization;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, lowStockCount, user, organization, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSynced, setIsSynced] = useState(true);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simulate periodic sync pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSynced(false);
      setTimeout(() => setIsSynced(true), 800);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const NavItem = ({ view, label, Icon }: { view: ViewMode, label: string, Icon: any }) => (
    <button
      onClick={() => {
        onViewChange(view);
        setIsMobileMenuOpen(false);
      }}
      className={`group flex items-center justify-between w-full px-5 py-4 rounded-2xl transition-premium active:scale-[0.97] ${
        activeView === view 
          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' 
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center space-x-4">
        <Icon size={22} className={activeView === view ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'} />
        <span className="font-bold text-sm tracking-tight">{label}</span>
      </div>
      {activeView === view && <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>}
    </button>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-8 lg:p-10">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <Box className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tighter leading-none">Inventory<span className="text-indigo-600">Pro</span></h1>
            <div className="flex items-center text-[8px] lg:text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">
              <Building2 size={10} className="mr-1.5" />
              <span className="truncate max-w-[120px]">{organization.name}</span>
            </div>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-6 lg:px-8 space-y-2 lg:space-y-3">
        <div className="text-[9px] lg:text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-4 lg:mb-6 ml-3">Operations Hub</div>
        <NavItem view={ViewMode.DASHBOARD} label="Intelligence" Icon={LayoutDashboard} />
        <NavItem view={ViewMode.INVENTORY} label="Stock Manager" Icon={LayoutGrid} />
        <NavItem view={ViewMode.SCANNER} label="Vision Scanner" Icon={Camera} />
        <NavItem view={ViewMode.CHAT} label="Assistant" Icon={MessageSquare} />
      </nav>

      <div className="p-6 lg:p-8">
        <div className="bg-slate-900 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-4">
              <Zap size={12} className="text-indigo-400 fill-indigo-400" />
              <p className="text-[9px] lg:text-[10px] text-slate-400 font-black uppercase tracking-widest">Enterprise Scope</p>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl lg:text-3xl font-black">Active</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 lg:w-32 lg:h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-150 transition-premium"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#fbfcfd] font-sans">
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer (Slide-out) */}
      <aside className={`fixed top-0 left-0 bottom-0 w-72 bg-white z-[110] lg:hidden transform transition-transform duration-300 ease-out flex flex-col shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900"
        >
          <CloseIcon size={24} />
        </button>
        <SidebarContent />
      </aside>

      {/* Sidebar - Desktop */}
      <aside className="w-80 bg-white border-r border-slate-100 flex flex-col hidden lg:flex relative z-40">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 lg:h-24 bg-white/70 backdrop-blur-2xl border-b border-slate-100 flex items-center justify-between px-4 lg:px-12 z-30">
          <div className="flex items-center space-x-3 lg:space-x-6">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-400 lg:hidden hover:text-slate-900 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                <div className={`w-2 h-2 rounded-full ${isSynced ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'} transition-colors`}></div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{isSynced ? 'Synced' : 'Connecting...'}</span>
              </div>
              <div>
                <h2 className="text-lg lg:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  {activeView === ViewMode.DASHBOARD && "Intelligence"}
                  {activeView === ViewMode.INVENTORY && "Repository"}
                  {activeView === ViewMode.SCANNER && "Vision"}
                  {activeView === ViewMode.CHAT && "Assistant"}
                </h2>
                <p className="hidden sm:block text-[8px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1 lg:mt-0.5">Session: {organization.id}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 lg:space-x-8">
            <div className="relative hidden xl:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Deep query repository..." 
                className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 w-64 transition-premium outline-none"
              />
            </div>
            
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 lg:p-3.5 rounded-xl lg:rounded-2xl relative transition-premium active:scale-90 ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Bell size={20} />
                {lowStockCount > 0 && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 lg:w-5 lg:h-5 bg-rose-500 border-2 lg:border-4 border-white text-white text-[7px] lg:text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                    {lowStockCount}
                  </span>
                )}
              </button>
            </div>
            
            <div className="h-6 lg:h-10 w-[1px] bg-slate-100"></div>
            
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 lg:space-x-4 group active:scale-95 transition-premium"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-900">{user.name.split(' ')[0]}</p>
                  <p className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.15em]">{user.role}</p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-[1rem] bg-gradient-to-br from-indigo-600 to-violet-600 shadow-xl shadow-indigo-100 border-2 border-white flex items-center justify-center text-white text-[10px] lg:text-sm font-extrabold relative overflow-hidden transition-premium group-hover:scale-105">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-6 w-56 lg:w-64 bg-white rounded-[1.5rem] lg:rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 z-50">
                  <div className="p-5 lg:p-6 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-[10px] lg:text-xs font-black text-slate-900 truncate mb-1">{user.email}</p>
                    <p className="text-[8px] lg:text-[10px] text-indigo-500 font-black uppercase tracking-widest">{organization.name}</p>
                  </div>
                  <div className="p-2 lg:p-3 space-y-1">
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                      <Settings size={18} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Preferences</span>
                    </button>
                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl transition-premium text-left group"
                    >
                      <LogOut size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">End Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 lg:p-12 custom-scrollbar no-scrollbar relative">
          <div className="max-w-[1600px] mx-auto h-full">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Layout;
