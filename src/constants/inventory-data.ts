import productsData from './products.json';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  count: number;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  storeIds: string[];
  quantity: number;
  minQuantity: number;
  price: number;
  supplier: string;
  lastUpdated: string;
  description: string;
  image?: string;
};

export type RecentActivity = {
  id: string;
  type: 'added' | 'removed' | 'updated' | 'restocked';
  productName: string;
  quantity: number;
  timestamp: string;
  user: string;
};

export type Store = {
  id: string;
  name: string;
  address: string;
  manager: string;
  phone: string;
  type: string;
  status: string;
};

export const STORES: Store[] = [
  {
    id: 's1',
    name: 'Main Warehouse - Bangkok',
    address: '123 Sukhumvit Rd, Khlong Toei, Bangkok 10110',
    manager: 'Sarah Wilson',
    phone: '+66 2 123 4567',
    type: 'Warehouse',
    status: 'Operational',
  },
  {
    id: 's2',
    name: 'Retail Outlet - Siam Paragon',
    address: '991 Rama I Rd, Pathum Wan, Bangkok 10330',
    manager: 'John Davis',
    phone: '+66 2 987 6543',
    type: 'Retail Store',
    status: 'Operational',
  },
  {
    id: 's3',
    name: 'Fulfillment Center - Samut Prakan',
    address: '456 Bangna-Trad Rd, Bang Phli, Samut Prakan 10540',
    manager: 'Michael Chen',
    phone: '+66 2 444 8888',
    type: 'Fulfillment',
    status: 'Restocking',
  },
];

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'All', color: '#208AEF', icon: 'square.grid.2x2', count: 24 },
  { id: 'electronics', name: 'Electronics', color: '#5E6CF6', icon: 'laptopcomputer', count: 8 },
  { id: 'clothing', name: 'Clothing', color: '#E35EC4', icon: 'tshirt', count: 6 },
  { id: 'food', name: 'Food & Bev', color: '#F97316', icon: 'cart', count: 5 },
  { id: 'tools', name: 'Tools', color: '#10B981', icon: 'wrench.and.screwdriver', count: 5 },
];

export const PRODUCTS: Product[] = productsData as Product[];

export const RECENT_ACTIVITY: RecentActivity[] = [
  {
    id: 'a1',
    type: 'restocked',
    productName: 'MacBook Pro 14"',
    quantity: 5,
    timestamp: '2026-07-08T14:30:00',
    user: 'Admin',
  },
  {
    id: 'a2',
    type: 'removed',
    productName: 'Sony WH-1000XM5',
    quantity: 2,
    timestamp: '2026-07-08T11:15:00',
    user: 'John D.',
  },
  {
    id: 'a3',
    type: 'added',
    productName: 'Protein Bar Box',
    quantity: 24,
    timestamp: '2026-07-08T09:00:00',
    user: 'Admin',
  },
  {
    id: 'a4',
    type: 'updated',
    productName: 'Polo Shirt - Blue',
    quantity: 4,
    timestamp: '2026-07-07T16:45:00',
    user: 'Sarah M.',
  },
  {
    id: 'a5',
    type: 'restocked',
    productName: 'Running Shoes Nike',
    quantity: 15,
    timestamp: '2026-07-07T10:20:00',
    user: 'Admin',
  },
];

export function getStockStatus(product: Product): StockStatus {
  if (product.quantity === 0) return 'out_of_stock';
  if (product.quantity < product.minQuantity) return 'low_stock';
  return 'in_stock';
}

export function getStatsFromProducts(products: Product[]) {
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const lowStock = products.filter((p) => getStockStatus(p) === 'low_stock').length;
  const outOfStock = products.filter((p) => getStockStatus(p) === 'out_of_stock').length;
  return { totalProducts, totalValue, lowStock, outOfStock };
}
