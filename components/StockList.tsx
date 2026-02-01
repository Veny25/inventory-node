
import React, { useState, useMemo, useCallback } from 'react';
import { InventoryItem } from '../types';
import { Search, Plus, Filter, Package, MapPin, ArrowUpRight, ChevronDown, Download, AlertTriangle } from 'lucide-react';

interface StockListProps {
  inventory: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onAddNew: () => void;
}

const StockList: React.FC<StockListProps> = ({ inventory, onEdit, onAddNew }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(inventory.map(item => item.category)));
    return ['All', ...cats.sort()];
  }, [inventory]);

  const filtered = useMemo(() => inventory.filter(item => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(searchLower) || 
      item.sku.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower);
    
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }), [inventory, search, selectedCategory]);

  const handleExportCSV = useCallback(() => {
    const headers = ['Name', 'Category', 'SKU', 'Stock', 'Location', 'Price'];
    const rows = filtered.map(item => [item.name, item.category, item.sku, item.stockCount, item.location, item.price]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }, [filtered]);

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-300 pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search enterprise assets..." 
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[1.25rem] shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center space-x-2 px-5 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-[1.25rem] hover:bg-slate-50 transition-all whitespace-nowrap text-xs"
            >
              <Filter size={14} />
              <span>{selectedCategory}</span>
              <ChevronDown size={14} className={isFilterOpen ? 'rotate-180' : ''} />
            </button>
            
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] py-2">
                <div className="max-h-60 overflow-y-auto no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setIsFilterOpen(false); }}
                      className={`w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 ${selectedCategory === cat ? 'text-indigo-600' : 'text-slate-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleExportCSV} className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-[1.25rem] transition-all">
            <Download size={20} />
          </button>

          <button onClick={onAddNew} className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-indigo-600 text-white font-black rounded-[1.25rem] hover:bg-black shadow-lg shadow-indigo-100 transition-all active:scale-95 whitespace-nowrap text-xs">
            <Plus size={20} />
            <span>New Asset</span>
          </button>
        </div>
      </div>

      {/* Persistent Table Layout (Works on all screen sizes with horizontal scroll) */}
      <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[800px] lg:min-w-0">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                <th className="px-6 lg:px-8 py-5 lg:py-6">Asset Descriptor</th>
                <th className="px-6 lg:px-8 py-5 lg:py-6">Classification</th>
                <th className="px-6 lg:px-8 py-5 lg:py-6 text-center">In Stock</th>
                <th className="px-6 lg:px-8 py-5 lg:py-6">Storage Node</th>
                <th className="px-6 lg:px-8 py-5 lg:py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => (
                <tr 
                  key={item.id} 
                  onClick={() => onEdit(item)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 lg:px-8 py-5 lg:py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-premium group-hover:scale-110 shadow-sm"><Package size={20} /></div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">{item.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 lg:px-8 py-5 lg:py-6">
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-indigo-100">{item.category}</span>
                  </td>
                  <td className="px-6 lg:px-8 py-5 lg:py-6 text-center">
                    <div className={`text-base lg:text-lg font-black ${item.stockCount <= item.minStock ? 'text-rose-500' : 'text-slate-900'}`}>{item.stockCount}</div>
                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Min: {item.minStock}</div>
                  </td>
                  <td className="px-6 lg:px-8 py-5 lg:py-6">
                    <div className="flex items-center text-xs font-bold text-slate-600 uppercase tracking-tight">
                      <MapPin size={12} className="mr-2 text-slate-300" />
                      {item.location}
                    </div>
                  </td>
                  <td className="px-6 lg:px-8 py-5 lg:py-6 text-right">
                    <button className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><ArrowUpRight size={20} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {filtered.length === 0 && (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200"><Search size={24} /></div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Zero local repository matches</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(StockList);
