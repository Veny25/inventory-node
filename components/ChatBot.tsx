
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { chatWithInventoryAssistantStream } from '../services/geminiService';
import { ChatMessage, InventoryItem } from '../types';
import { Send, Sparkles, Database, ShieldCheck, Zap, Terminal, Info, Command, AlertCircle } from 'lucide-react';

interface ChatBotProps {
  inventory: InventoryItem[];
}

const MessageItem = React.memo(({ msg }: { msg: ChatMessage }) => (
  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-3 duration-400`}>
    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[90%] sm:max-w-[80%]`}>
      <div className={`p-6 lg:p-8 rounded-[2.5rem] shadow-xl text-sm lg:text-base leading-relaxed ${
        msg.role === 'user' 
          ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' 
          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
      }`}>
        {msg.text.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-3' : ''}>
            {line}
          </p>
        ))}
      </div>
      <div className="flex items-center mt-3 px-4 space-x-2">
        {msg.role === 'model' && <Sparkles size={12} className="text-indigo-400" />}
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          {msg.role === 'user' ? 'Local Admin Session' : 'Intelligenve Core'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  </div>
));

const ChatBot: React.FC<ChatBotProps> = ({ inventory }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: "Operations Officer online. I have analyzed your current repository nodes. System valuation is approximately $" + 
            inventory.reduce((acc, item) => acc + (item.price * item.stockCount), 0).toLocaleString() + 
            ". We have " + 
            inventory.filter(i => i.stockCount <= i.minStock).length + 
            " critical alerts. How shall we optimize the current stock distribution?", 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiHistory = useMemo(() => {
    return messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    })).slice(0, -1);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const currentInput = input;
    const userMsg: ChatMessage = { role: 'user', text: currentInput, timestamp: new Date() };
    const modelMsgInitial: ChatMessage = { role: 'model', text: '', timestamp: new Date() };
    
    setMessages(prev => [...prev, userMsg, modelMsgInitial]);
    setInput('');
    setLoading(true);

    try {
      const context = JSON.stringify(inventory.map(i => ({
        name: i.name,
        cat: i.category,
        sku: i.sku,
        stock: i.stockCount,
        min: i.minStock,
        loc: i.location,
        val: i.price,
        status: i.stockCount <= i.minStock ? 'CRITICAL' : 'OPTIMAL'
      })), null, 2);

      const stream = await chatWithInventoryAssistantStream(currentInput, context, apiHistory);
      
      let fullText = '';
      for await (const chunk of stream) {
        fullText += (chunk as any).text || '';
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'model') {
            return [...prev.slice(0, -1), { ...last, text: fullText }];
          }
          return prev;
        });
      }
    } catch (error) {
      setMessages(prev => [...prev.slice(0, -1), { role: 'model', text: "Logical engine error. Connection terminated.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, inventory, apiHistory]);

  const CommandHint = ({ text, cmd }: { text: string, cmd: string }) => (
    <button 
      onClick={() => setInput(cmd)}
      className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center space-x-2 active:scale-95"
    >
      <Command size={12} />
      <span>{text}</span>
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-700">
      {/* HEADER */}
      <div className="px-8 lg:px-12 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center space-x-5">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-slate-900 rounded-[1.25rem] lg:rounded-[1.5rem] flex items-center justify-center text-indigo-400 shadow-2xl relative">
            <Terminal size={24} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-sm lg:text-base font-black text-slate-900 uppercase tracking-[0.2em]">Neural Intelligence Console</h3>
            <p className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gemini 3 Pro Integration Active</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-4">
           <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center space-x-3 shadow-sm">
              <Database size={14} className="text-indigo-500" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{inventory.length} SKUs ANALYZED</span>
           </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 lg:space-y-12 bg-white custom-scrollbar">
        {messages.map((msg, idx) => (
          <MessageItem key={idx} msg={msg} />
        ))}
        {loading && !messages[messages.length - 1].text && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex flex-col items-start max-w-[80%]">
              <div className="bg-slate-50 p-6 lg:p-8 rounded-[2.5rem] rounded-tl-none border border-slate-100 flex items-center space-x-5 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">Querying Repository...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="p-8 lg:p-12 bg-slate-50/50 border-t border-slate-100 space-y-6">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
           <CommandHint text="Stock Audit" cmd="Run a critical stock audit and suggest reorder priorities." />
           <CommandHint text="Value Summary" cmd="Summarize total inventory valuation by category." />
           <CommandHint text="Optimization" cmd="Identify the top 3 items to relocate for better efficiency." />
           <CommandHint text="Low Stock" cmd="Show me all items currently in critical status." />
        </div>

        <div className="relative group">
          <input 
            type="text" 
            placeholder="Command input (e.g. 'Analyze Q3 stock trends')..." 
            className="w-full pl-8 pr-20 py-6 lg:py-8 bg-white border border-slate-200 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm lg:text-lg font-bold transition-all outline-none placeholder:text-slate-300"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            autoFocus
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-4 lg:p-5 rounded-[1.5rem] lg:rounded-[2rem] hover:bg-indigo-600 disabled:opacity-20 transition-all shadow-2xl active:scale-90"
          >
            <Send size={24} />
          </button>
        </div>
        
        <div className="flex items-center justify-between px-4">
           <div className="flex items-center space-x-8">
             <div className="flex items-center space-x-2">
               <ShieldCheck size={14} className="text-emerald-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Secure Protocol</span>
             </div>
             <div className="flex items-center space-x-2">
               <Zap size={14} className="text-amber-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">H-Latency Link</span>
             </div>
           </div>
           <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-40">Operational Assistant v4.2</p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatBot);
