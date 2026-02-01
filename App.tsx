
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ViewMode, InventoryItem, HistoryEntry, User, Organization } from './types';
import { INITIAL_INVENTORY } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import ChatBot from './components/ChatBot';
import StockList from './components/StockList';
import EditItemModal from './components/EditItemModal';
import Auth from './components/Auth';

const STORAGE_PREFIX = 'inventory_pro_org_v2_';
const AUTH_USER_KEY = 'inventory_pro_user_v2';
const AUTH_ORG_KEY = 'inventory_pro_org_v2';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_ORG_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const storageKey = useMemo(() => 
    currentOrg ? `${STORAGE_PREFIX}${currentOrg.id}` : null, 
  [currentOrg]);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // Initial load
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setInventory(JSON.parse(saved));
        } catch {
          setInventory(INITIAL_INVENTORY);
        }
      } else {
        setInventory(INITIAL_INVENTORY);
      }
    }
  }, [storageKey]);

  // Debounced Save for performance
  useEffect(() => {
    if (!storageKey || inventory.length === 0) return;

    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(inventory));
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    };
  }, [inventory, storageKey]);

  const handleLogin = useCallback((user: User, org: Organization) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_ORG_KEY, JSON.stringify(org));
    setCurrentUser(user);
    setCurrentOrg(org);
    setActiveView(ViewMode.DASHBOARD);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_ORG_KEY);
    setCurrentUser(null);
    setCurrentOrg(null);
    setInventory([]);
    setActiveView(ViewMode.DASHBOARD);
  }, []);

  const lowStockCount = useMemo(() => 
    inventory.filter(item => item.stockCount <= item.minStock).length, 
  [inventory]);

  const handleItemFound = useCallback((analysis: any) => {
    const existing = inventory.find(i => 
      (analysis.barcodeValue && i.barcode === analysis.barcodeValue) || 
      (analysis.likelySKU && i.sku === analysis.likelySKU) ||
      (i.name.toLowerCase() === analysis.objectName.toLowerCase())
    );

    if (existing) {
      setEditingItem(existing);
    } else {
      setEditingItem({
        id: `asset_${Date.now()}`,
        name: analysis.objectName,
        category: analysis.category,
        sku: analysis.likelySKU || `SKU-${Math.random().toString(36).substring(7).toUpperCase()}`,
        barcode: analysis.barcodeValue || '',
        stockCount: 1,
        minStock: 5,
        location: analysis.suggestedLocation || 'Unassigned',
        price: 0,
        lastUpdated: new Date().toISOString()
      });
    }
  }, [inventory]);

  const saveItem = useCallback((item: InventoryItem) => {
    const now = new Date().toISOString();
    const currentUserName = currentUser?.name || "System";

    setInventory(prev => {
      const existingIndex = prev.findIndex(i => i.id === item.id);
      
      if (existingIndex !== -1) {
        const existingItem = prev[existingIndex];
        const changes: string[] = [];
        if (existingItem.stockCount !== item.stockCount) changes.push(`Stock change: ${existingItem.stockCount} to ${item.stockCount}`);
        if (existingItem.location !== item.location) changes.push(`Moved to ${item.location}`);
        
        const newHistoryEntries: HistoryEntry[] = changes.map(detail => ({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: now,
          type: 'stock_adjustment',
          details: detail,
          user: currentUserName
        }));

        const updatedItem = {
          ...item,
          lastUpdated: now,
          history: [...(existingItem.history || []), ...newHistoryEntries].slice(-20)
        };

        const newInventory = [...prev];
        newInventory[existingIndex] = updatedItem;
        return newInventory;
      } else {
        const initialHistory: HistoryEntry[] = [{
          id: `log_${Date.now()}`,
          timestamp: now,
          type: 'creation',
          details: 'Registered via vision system',
          user: currentUserName
        }];
        return [{ ...item, lastUpdated: now, history: initialHistory }, ...prev];
      }
    });
    setEditingItem(null);
  }, [currentUser]);

  const deleteItem = useCallback((id: string) => {
    if (confirm('Delete asset node permanently?')) {
      setInventory(prev => prev.filter(i => i.id !== id));
      setEditingItem(null);
    }
  }, []);

  if (!currentUser || !currentOrg) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Layout 
      activeView={activeView} 
      onViewChange={setActiveView} 
      lowStockCount={lowStockCount}
      user={currentUser}
      organization={currentOrg}
      onLogout={handleLogout}
    >
      <div className="w-full h-full max-w-[1600px] mx-auto no-scrollbar overflow-x-hidden">
        {activeView === ViewMode.DASHBOARD && <Dashboard inventory={inventory} onItemClick={setEditingItem} />}
        {activeView === ViewMode.INVENTORY && <StockList inventory={inventory} onEdit={setEditingItem} onAddNew={() => setEditingItem({})} />}
        {activeView === ViewMode.SCANNER && <Scanner onItemFound={handleItemFound} inventory={inventory} onExistingItemClick={setEditingItem} isActive={!editingItem} />}
        {activeView === ViewMode.CHAT && <ChatBot inventory={inventory} />}
        {editingItem && <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} onSave={saveItem} onDelete={deleteItem} />}
      </div>
    </Layout>
  );
};

export default App;
