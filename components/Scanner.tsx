
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { analyzeInventoryImage, detectObjectsInFrame, DetectedObject } from '../services/geminiService';
import { InventoryItem } from '../types';
import { Camera, RefreshCw, Box, Search, ArrowRight, Zap, X, Image as ImageIcon, AlertCircle, Lightbulb, Eye, EyeOff, Loader2, Cpu, Package, Hash, MapPin, Layers } from 'lucide-react';

interface ScannerProps {
  onItemFound: (item: Partial<InventoryItem>) => void;
  inventory: InventoryItem[];
  onExistingItemClick: (item: InventoryItem) => void;
  isActive: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onItemFound, inventory, onExistingItemClick, isActive }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isSmartSightEnabled, setIsSmartSightEnabled] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsLive(true);
      setImage(null);
      setResult(null);
    } catch (err: any) {
      setError("Vision sensor offline. Camera permissions required.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    setIsLive(false);
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    setDetectedObjects([]);
  }, [stream]);

  useEffect(() => {
    if (!isActive) stopCamera();
    return () => stopCamera();
  }, [isActive, stopCamera]);

  useEffect(() => {
    if (isLive && isSmartSightEnabled && !loading) {
      detectionIntervalRef.current = window.setInterval(async () => {
        if (!isDetecting && videoRef.current && videoRef.current.readyState === 4) {
          await runDetection();
        }
      }, 3000);
    } else {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      setDetectedObjects([]);
    }
    return () => { if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current); };
  }, [isLive, isSmartSightEnabled, loading]);

  const runDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsDetecting(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const scale = 640 / Math.max(video.videoWidth, video.videoHeight);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      const objects = await detectObjectsInFrame(dataUrl);
      setDetectedObjects(objects);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDetecting(false);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImage(dataUrl);
      stopCamera();
      processImage(dataUrl);
    }
  };

  const processImage = async (base64Data: string) => {
    setLoading(true);
    try {
      const analysis = await analyzeInventoryImage(base64Data.split(',')[1]);
      setResult(analysis);
    } catch (error) {
      setError("AI Inference timeout. Neural link unstable.");
    } finally {
      setLoading(false);
    }
  };

  const similarItems = useMemo(() => {
    if (!result) return [];
    return inventory.filter(item => 
      item.name.toLowerCase().includes(result.objectName.toLowerCase().split(' ')[0]) ||
      item.category.toLowerCase() === result.category.toLowerCase()
    ).slice(0, 3);
  }, [result, inventory]);

  return (
    <div className="animate-in fade-in duration-700 pb-10">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-8 items-start">
        
        {/* LENS VIEWPORT */}
        <div className="xl:col-span-8 space-y-4 lg:space-y-6">
          <div className="bg-white p-2 lg:p-3 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden aspect-video xl:h-[700px] transition-premium ring-1 ring-slate-100">
            {error && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl">
                <div className="text-center max-w-xs animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={32} className="text-rose-500" />
                  </div>
                  <h4 className="text-white font-black text-sm uppercase tracking-widest mb-2">{error}</h4>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-10">Sensor hardware sync failure</p>
                  <button onClick={startCamera} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl active:scale-95 text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20">Initialize Sensor</button>
                </div>
              </div>
            )}

            {!isLive && !image ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-8 animate-pulse shadow-inner">
                  <Camera size={32} className="text-indigo-600" />
                </div>
                <h2 className="text-xl lg:text-3xl font-black text-slate-800 mb-2 tracking-tight">Enterprise Vision Core</h2>
                <p className="text-slate-400 text-xs lg:text-sm mb-10 lg:mb-16 max-w-sm font-medium">Map assets in real-time with Neural Object Recognition.</p>
                <div className="flex flex-row space-x-4 lg:space-x-8 w-full justify-center">
                  <button onClick={startCamera} className="group flex flex-col items-center justify-center w-full max-w-[180px] h-32 lg:h-56 bg-slate-900 rounded-[2rem] text-white shadow-2xl active:scale-95 transition-premium border border-slate-800">
                    <Zap size={32} className="mb-3 text-indigo-400 fill-indigo-400 transition-transform group-hover:scale-125" />
                    <span className="font-black uppercase tracking-[0.2em] text-[8px] lg:text-[10px]">Neural Stream</span>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full max-w-[180px] h-32 lg:h-56 bg-slate-50 rounded-[2rem] text-slate-400 border border-slate-100 active:scale-95 transition-premium">
                    <ImageIcon size={32} className="mb-3 opacity-30" />
                    <span className="font-black uppercase tracking-[0.2em] text-[8px] lg:text-[10px]">Static File</span>
                  </button>
                </div>
              </div>
            ) : isLive ? (
              <div className="relative w-full h-full rounded-[2rem] lg:rounded-[3rem] overflow-hidden bg-black ring-4 ring-slate-50 shadow-inner">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                
                {/* AI HUD OVERLAY */}
                <div className="absolute inset-0 pointer-events-none z-10 p-6">
                   <div className="flex justify-between items-start">
                      <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Vision Active</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Sensor Resolution</p>
                        <p className="text-[9px] font-black text-white">4K NEURAL FEED</p>
                      </div>
                   </div>

                   {detectedObjects.map((obj, i) => (
                     <div key={i} className="absolute border-2 border-indigo-500/80 bg-indigo-500/10 rounded-xl transition-all duration-500 ease-out shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                         style={{ top: `${obj.box_2d[0]/10}%`, left: `${obj.box_2d[1]/10}%`, width: `${(obj.box_2d[3]-obj.box_2d[1])/10}%`, height: `${(obj.box_2d[2]-obj.box_2d[0])/10}%` }}>
                       <div className="absolute top-0 left-0 -translate-y-full bg-indigo-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-t-lg whitespace-nowrap shadow-xl">
                         {obj.label} • {Math.round(obj.confidence*100)}%
                       </div>
                     </div>
                   ))}
                </div>

                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <div className="w-48 h-48 lg:w-96 lg:h-96 border-2 border-white/10 rounded-[2.5rem] lg:rounded-[4rem] relative">
                      <div className="scanner-line"></div>
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400"></div>
                   </div>
                </div>

                <div className="absolute bottom-6 lg:bottom-12 left-1/2 -translate-x-1/2 flex items-center space-x-4 lg:space-x-10 z-20">
                  <button onClick={() => setIsSmartSightEnabled(!isSmartSightEnabled)} className={`p-4 lg:p-6 rounded-full transition-premium border active:scale-90 ${isSmartSightEnabled ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.4)]' : 'bg-black/60 backdrop-blur-2xl text-white border-white/20'}`}>
                    {isDetecting ? <Loader2 size={24} className="animate-spin" /> : (isSmartSightEnabled ? <Eye size={24} /> : <EyeOff size={24} />)}
                  </button>
                  <button onClick={captureFrame} className="w-20 h-20 lg:w-28 lg:h-28 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-premium ring-[10px] ring-white/10 group">
                    <div className="w-14 h-14 lg:w-20 lg:h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-inner group-hover:bg-indigo-500 transition-colors">
                      <Zap size={28} className="text-white fill-white" />
                    </div>
                  </button>
                  <button onClick={stopCamera} className="p-4 lg:p-6 bg-black/60 backdrop-blur-2xl rounded-full text-white active:scale-90 transition-premium border border-white/20 hover:bg-rose-500 hover:border-rose-400"><X size={24} /></button>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full rounded-[2rem] lg:rounded-[3rem] overflow-hidden group bg-slate-100">
                <img src={image!} alt="Captured" className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]" />
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/85 backdrop-blur-3xl transition-premium z-40">
                    <div className="relative mb-8">
                       <div className="w-20 h-20 lg:w-24 lg:h-24 border-4 border-white/5 border-t-indigo-400 rounded-full animate-spin"></div>
                       <Box size={32} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-black text-[10px] uppercase tracking-[0.5em] animate-pulse mb-2">Analyzing Node Map</p>
                      <p className="text-indigo-400/60 text-[8px] font-black uppercase tracking-widest">Gemini Engine V3 Flash</p>
                    </div>
                  </div>
                )}
                <button onClick={() => { setImage(null); setIsLive(false); setResult(null); }} className="absolute top-8 right-8 bg-white/10 backdrop-blur-2xl p-4 rounded-[1.5rem] text-white active:scale-95 hover:bg-indigo-600 transition-premium border border-white/10 shadow-2xl"><RefreshCw size={24} /></button>
              </div>
            )}
          </div>
          
          {/* CATALOG CROSS-REFERENCE AREA */}
          <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center justify-between mb-10">
              <h4 className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center">
                <Search size={16} className="mr-4 text-indigo-600" />
                Intelligent Cross-Reference
              </h4>
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-slate-50 rounded-lg">
                <Layers size={12} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-500 uppercase">Live Indexing</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
              {similarItems.length > 0 ? similarItems.map(item => (
                <button key={item.id} onClick={() => onExistingItemClick(item)} className="p-6 lg:p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:border-indigo-400 hover:shadow-2xl transition-premium text-left group active:scale-[0.98] relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 shadow-sm transition-premium border border-slate-100"><Box size={24} /></div>
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase ${item.stockCount <= item.minStock ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-indigo-100 text-indigo-600 border border-indigo-200'}`}>{item.stockCount} Units</span>
                    </div>
                    <div className="font-black text-slate-900 text-sm lg:text-lg truncate mb-1">{item.name}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.sku}</div>
                    <div className="flex items-center text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-6">
                      <span>Sync Data</span>
                      <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-premium blur-2xl"></div>
                </button>
              )) : (
                <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-50 rounded-[3rem] text-slate-300 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6"><Box size={32} className="opacity-20" /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero local matches detected</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NEURAL ANALYSIS COMMAND PANEL */}
        <div className="w-full xl:col-span-4 h-full xl:sticky xl:top-10">
          {result ? (
            <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl border border-slate-100 animate-in slide-in-from-right-6 duration-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
              
              <div className="relative z-10">
                <div className="mb-10 lg:mb-14">
                  <div className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-[9px] lg:text-[10px] font-black rounded-xl uppercase tracking-[0.2em] mb-8 shadow-xl shadow-indigo-200 border border-indigo-400/50">
                    Confidence: {Math.round(result.confidence * 100)}%
                  </div>
                  <h4 className="text-3xl lg:text-4xl font-black text-slate-900 leading-[1.1] mb-2 tracking-tight">{result.objectName}</h4>
                  <p className="text-indigo-600 font-black text-[11px] lg:text-xs uppercase tracking-[0.3em]">{result.category}</p>
                </div>

                <div className="space-y-6 lg:space-y-8">
                  <div className="p-6 lg:p-8 bg-slate-900 rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest flex items-center">
                       <Cpu size={16} className="mr-3 text-indigo-400" />
                       Node Analysis
                    </p>
                    <p className="text-sm lg:text-base text-slate-300 font-medium leading-relaxed">{result.estimatedSpecs}</p>
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:gap-6">
                    <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:border-indigo-400 transition-premium">
                      <span className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest flex items-center"><Hash size={12} className="mr-2" />Assigned SKU</span>
                      <div className="font-mono font-black text-slate-900 text-xs lg:text-sm truncate">{result.likelySKU}</div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:border-violet-400 transition-premium">
                      <span className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest flex items-center"><MapPin size={12} className="mr-2" />Zone Node</span>
                      <div className="font-black text-slate-900 text-xs lg:text-sm truncate">{result.suggestedLocation}</div>
                    </div>
                  </div>

                  {result.barcodeValue && (
                    <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex flex-col items-center">
                      <div className="text-[9px] font-black uppercase text-indigo-400 mb-4 tracking-widest">Decoded Data String</div>
                      <div className="font-mono text-xl lg:text-2xl tracking-tighter font-black text-slate-900 break-all bg-white px-6 py-4 rounded-xl shadow-sm border border-indigo-100 w-full text-center">{result.barcodeValue}</div>
                    </div>
                  )}
                </div>

                <button onClick={() => onItemFound(result)} className="w-full mt-12 lg:mt-16 bg-indigo-600 hover:bg-black text-white font-black py-6 lg:py-8 rounded-[1.5rem] lg:rounded-[2.5rem] shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center space-x-4 active:scale-95 uppercase tracking-[0.3em] text-[10px] lg:text-xs">
                  <Package size={28} />
                  <span>Provision Node</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-4 border-dashed border-slate-100 min-h-[350px] lg:h-full lg:min-h-[600px] rounded-[3rem] lg:rounded-[4rem] flex flex-col items-center justify-center p-12 text-center opacity-40">
              <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-10 text-slate-200"><Search size={40} /></div>
              <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-slate-400">Await Neural Input Link</p>
            </div>
          )}
        </div>
      </div>
      
      {/* HIDDEN HELPERS */}
      <canvas ref={canvasRef} className="hidden" />
      <input type="file" ref={fileInputRef} onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => { setImage(ev.target?.result as string); processImage(ev.target?.result as string); };
          reader.readAsDataURL(file);
        }
      }} accept="image/*" className="hidden" />
    </div>
  );
};

export default Scanner;
