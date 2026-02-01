
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
}

export interface Organization {
  id: string;
  name: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  type: 'creation' | 'stock_adjustment' | 'location_change' | 'config_update';
  details: string;
  user: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  barcode?: string;
  stockCount: number;
  minStock: number;
  location: string;
  price: number;
  lastUpdated: string;
  imageUrl?: string;
  history?: HistoryEntry[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  SCANNER = 'SCANNER',
  CHAT = 'CHAT',
  INVENTORY = 'INVENTORY'
}
