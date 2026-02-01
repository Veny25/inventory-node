
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InventoryItem, HistoryEntry } from '../types';
import { extractBarcode, performAdvancedOCR } from '../services/geminiService';
import { Save, X, Trash2, Tag, Hash, DollarSign, MapPin, Layers, Package, AlertTriangle, Camera, Loader2, Zap, AlertCircle, Box, RefreshCw, Keyboard, Search, Info, History, Settings2, Clock, User } from 'lucide-react';

interface EditItemModalProps {
  item: Partial<InventoryItem> | null;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ item, onClose, onSave, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'history'>('config');
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '', category: '', sku: '', barcode: '', stockCount: 0, minStock: 5, location: '', price: 0, ...item
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isOCRing, setIsOCRing] = useState(false);
  const [showLiveScanner, setShowLiveScanner] = useState(false);
  const [error, setError] = useState<{ message: string; type: 'DENIED' | 'NOT_FOUND' | 'GENERIC' | 'SCAN_FAILED' } | null>(null);
  
  const barcodeVideoRef = useRef<HTMLVideoElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseAttempt();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isDirty]);

  const handleCloseAttempt = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const startBarcodeScanner = async () => {
    setError(null);
    setShowLiveScanner(true);
    
    setTimeout(async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1080 }, height: { ideal: 1080 } } 
        });
        streamRef.current = stream;
        if (barcodeVideoRef.current) {
          barcodeVideoRef.current.srcObject = stream;
          try {
            await barcodeVideoRef.current.play();
          } catch (e) {
            console.error("Barcode video play error", e);
          }
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError({ message: "Camera access was denied.", type: 'DENIED' });
        } else {
          setError({ message: "Hardware Unavailable", type: 'GENERIC' });
        }
      }
    }, 200);
  };

  const stopBarcodeScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (barcodeVideoRef.current) {
      barcodeVideoRef.current.srcObject = null;
    }
    setShowLiveScanner(false);
    setIsScanning(false);
    setIsOCRing(false);
  };

  useEffect(() => { return () => stopBarcodeScanner(); }, []);

  const captureAndScan = async (useAdvancedOCR = false) => {
    if (barcodeVideoRef.current && barcodeCanvasRef.current) {
      if (useAdvancedOCR) setIsOCRing(true);
      else setIsScanning(true);
      
      setError(null);
      
      const video = barcodeVideoRef.current;
      const canvas = barcodeCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      try {
        const code = useAdvancedOCR ? await performAdvancedOCR(base64) : await extractBarcode(base64);
        
        if (code && code.length > 2) {
          setFormData(prev => ({ ...prev, barcode: code }));
          setIsDirty(true);
          stopBarcodeScanner();
        } else {
          setError({ 
            message: useAdvancedOCR ? "Deep analysis failed to read text." : "Scan failed to find code.", 
            type: 'SCAN_FAILED' 
          });
        }
      } catch (e) {
        setError({ message: "Service Error", type: 'GENERIC' });
      } finally {
        setIsScanning(false);
        setIsOCRing(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: (name.includes('Count') || name.includes('Stock') || name === 'price') ? Number(value) : value }));
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: item?.id || `asset_${Date.now()}`,
      name: formData.name || 'New Asset',
      category: formData.category || 'General',
      sku: formData.sku || 'N/A',
      barcode: formData.barcode,
      stockCount: formData.stockCount || 0,
      minStock: formData.minStock || 0,
      location: formData.location || 'Warehouse',
      price: formData.price || 0,
      lastUpdated: new Date().toISOString(),
      history: item?.history || []
    } as InventoryItem);
  };

  const InputField = ({ label, name, icon: Icon, type = "text", placeholder, colSpan = "col-span-1", action, autoFocus }: any) => (
    <div className={colSpan}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">{label}</label>
      <div className="relative group flex space-x-2">
        <div className="relative flex-1">
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
          <input 
            name={name} 
            type={type}
            id={`field-${name}`}
            autoFocus={autoFocus}
            value={(formData as any)[name]} 
            onChange={handleChange} 
            placeholder={placeholder}
            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-sm font-black transition-all outline-none" 
          />
        </div>
        {action}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={(e) => { if (e.target === e.currentTarget) handleCloseAttempt(); }}>
      <div ref={modalRef} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-12 py-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{item?.id ? 'Asset Configuration' : 'Asset Registration'}</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Repository Node {item?.id || 'New'}</p>
          </div>
          <button onClick={handleCloseAttempt} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 hover:shadow-xl hover:shadow-slate-200 transition-all flex-shrink-0 active:scale-95"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="px-12 pt-6 flex space-x-8 border-b border-slate-100 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('config')}
            className={`pb-4 flex items-center space-x-2 text-xs font-black uppercase tracking-widest transition-all relative active:scale-95 ${activeTab === 'config' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Settings2 size={16} />
            <span>Configuration</span>
            {activeTab === 'config' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></div>}
          </button>
          {item?.id && (
            <button 
              onClick={() => setActiveTab('history')}
              className={`pb-4 flex items-center space-x-2 text-xs font-black uppercase tracking-widest transition-all relative active:scale-95 ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <History size={16} />
              <span>Log History</span>
              {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></div>}
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'config' ? (
            <form id="asset-form" onSubmit={handleSubmit} className="p-12 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <InputField label="Asset Identifier" name="name" icon={Tag} placeholder="e.g. Workstation Pro" colSpan="col-span-2" autoFocus />
                
                <InputField 
                  label="Inventory Tag / Barcode" 
                  name="barcode" 
                  icon={Hash} 
                  colSpan="col-span-2"
                  action={
                    <button type="button" onClick={startBarcodeScanner} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-95">
                      <Camera size={20} />
                    </button>
                  }
                />

                <InputField label="Vertical" name="category" icon={Layers} placeholder="Electronics" />
                <InputField label="SKU Index" name="sku" icon={Package} placeholder="SKU-000" />
                
                <InputField label="Stock Units" name="stockCount" type="number" icon={Box} />
                <InputField label="Safety Buffer" name="minStock" type="number" icon={AlertTriangle} />
                
                <InputField label="Storage Node" name="location" icon={MapPin} placeholder="Zone A-1" />
                <InputField label="Unit Value" name="price" type="number" icon={DollarSign} />
              </div>
            </form>
          ) : (
            <div className="p-12 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-10">
                {item?.history && item.history.length > 0 ? (
                  [...item.history].reverse().map((entry, idx) => (
                    <div key={entry.id} className="relative">
                      <div className={`absolute -left-11 top-0 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                        entry.type === 'creation' ? 'bg-emerald-500' : 
                        entry.type === 'stock_adjustment' ? 'bg-indigo-500' : 
                        entry.type === 'location_change' ? 'bg-amber-500' : 'bg-slate-500'
                      }`}></div>
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            {entry.type.replace('_', ' ')}
                          </span>
                          <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            <Clock size={10} className="mr-1" />
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">{entry.details}</p>
                        <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-tight">
                          <User size={12} className="mr-1.5" />
                          Authorized: {entry.user}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-slate-400">
                    <p className="text-sm font-bold">No history available for this node.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-12 border-t border-slate-100 bg-slate-50/50 flex space-x-6 flex-shrink-0">
          {activeTab === 'config' ? (
            <button form="asset-form" type="submit" className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-indigo-200 hover:bg-black transition-all flex items-center justify-center space-x-3 active:scale-[0.98]">
              <Save size={24} />
              <span className="uppercase tracking-[0.2em] text-xs">Commit Changes</span>
            </button>
          ) : (
            <button 
              onClick={() => setActiveTab('config')}
              className="flex-1 bg-slate-900 text-white font-black py-6 rounded-3xl hover:bg-black transition-all flex items-center justify-center space-x-3 active:scale-[0.98]"
            >
              <Settings2 size={24} />
              <span className="uppercase tracking-[0.2em] text-xs">Back to Config</span>
            </button>
          )}
          {item?.id && (
            <button type="button" onClick={() => onDelete?.(item.id!)} className="px-8 bg-rose-50 text-rose-500 rounded-3xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all active:scale-95">
              <Trash2 size={24} />
            </button>
          )}
        </div>
      </div>

      {showLiveScanner && (
        <div className="fixed inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in" onClick={(e) => { if (e.target === e.currentTarget) stopBarcodeScanner(); }}>
          <div className="relative w-full max-w-lg aspect-square bg-black rounded-[4rem] overflow-hidden border-4 border-indigo-500 shadow-[0_0_100px_rgba(99,102,241,0.2)]">
            {error && !isScanning && !isOCRing ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center p-12 bg-slate-900/98 backdrop-blur-xl">
                <div className="text-center w-full max-w-sm animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={32} className="text-rose-500" />
                  </div>
                  <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">{error.message}</h4>
                  
                  {error.type === 'DENIED' ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">Quick Fix:</p>
                       <ul className="space-y-3 text-xs text-slate-300 font-medium">
                        <li className="flex items-start space-x-2">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>Reset permissions in browser settings.</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>Ensure no other app is using the camera.</span>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs font-medium mb-8">Synchronize your lens or enter data manually.</p>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    {error.type === 'SCAN_FAILED' && (
                      <button 
                        onClick={() => captureAndScan(true)}
                        className="w-full flex items-center justify-center space-x-3 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                      >
                        <Search size={18} />
                        <span className="text-[10px] uppercase tracking-[0.2em]">Try Advanced Scan</span>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => { stopBarcodeScanner(); setTimeout(() => document.getElementById('field-barcode')?.focus(), 100); }}
                      className="w-full flex items-center justify-center space-x-3 bg-white/10 text-white font-black py-4 rounded-2xl hover:bg-white/20 transition-all border border-white/10 active:scale-95"
                    >
                      <Keyboard size={18} />
                      <span className="text-[10px] uppercase tracking-[0.2em]">Manual Entry</span>
                    </button>
                    
                    <button 
                      onClick={() => startBarcodeScanner()}
                      className="w-full text-indigo-400 font-black text-[9px] uppercase tracking-widest mt-2 hover:text-indigo-300 transition-colors"
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <video ref={barcodeVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-56 h-56 border-2 border-dashed rounded-[2.5rem] relative transition-all duration-500 ${isOCRing ? 'border-amber-400 scale-110' : 'border-indigo-400/50'}`}>
                <div className={`scanner-line ${isOCRing ? 'bg-amber-400' : ''}`}></div>
              </div>
            </div>

            {(isScanning || isOCRing) && (
              <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-xl flex flex-col items-center justify-center">
                <Loader2 className="text-white animate-spin mb-4" size={48} />
                <p className="text-white font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">
                  {isOCRing ? 'Analyzing Patterns...' : 'Synchronizing Vision...'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-12 flex items-center space-x-8">
            <button onClick={stopBarcodeScanner} className="p-6 bg-white/5 text-white rounded-full hover:bg-rose-500 border border-white/10 transition-all group active:scale-90">
              <X size={32} className="group-hover:rotate-90 transition-transform" />
            </button>
            
            {!error && !isScanning && !isOCRing && (
              <button 
                onClick={() => captureAndScan(false)} 
                className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl scale-100 active:scale-90 border-8 border-indigo-500/30 transition-all hover:bg-indigo-500"
              >
                <Camera size={40} />
              </button>
            )}

            <button 
              onClick={() => { stopBarcodeScanner(); setTimeout(() => document.getElementById('field-barcode')?.focus(), 100); }}
              className="p-6 bg-white/5 text-white rounded-full hover:bg-indigo-600 border border-white/10 transition-all active:scale-90"
              title="Manual Input"
            >
              <Keyboard size={32} />
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Center code in reticle for auto-sync</p>
          </div>
          
          <canvas ref={barcodeCanvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default EditItemModal;
