
import { InventoryItem } from './types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    name: 'Wireless Ergonomic Mouse',
    category: 'Peripherals',
    sku: 'MS-ERG-001',
    barcode: '123456789012',
    stockCount: 45,
    minStock: 10,
    location: 'Shelf A3',
    price: 59.99,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Mechanical Keyboard (Blue Switch)',
    category: 'Peripherals',
    sku: 'KB-MEC-002',
    barcode: '223456789012',
    stockCount: 12,
    minStock: 5,
    location: 'Shelf B1',
    price: 129.50,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '3',
    name: '4K OLED Monitor 27"',
    category: 'Displays',
    sku: 'MN-4KO-003',
    barcode: '323456789012',
    stockCount: 3,
    minStock: 5,
    location: 'Back Room - Row 4',
    price: 799.00,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '4',
    name: 'USB-C Hub Multiport',
    category: 'Accessories',
    sku: 'AC-HUB-004',
    barcode: '423456789012',
    stockCount: 89,
    minStock: 20,
    location: 'Shelf A1',
    price: 45.00,
    lastUpdated: new Date().toISOString()
  }
];

export const APP_MODELS = {
  // Using gemini-3-flash-preview for high speed and low latency
  TEXT: 'gemini-3-pro-preview',
  IMAGE: 'gemini-3-flash-preview'
};
