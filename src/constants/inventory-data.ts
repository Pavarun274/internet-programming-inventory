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

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'All', color: '#208AEF', icon: 'square.grid.2x2', count: 24 },
  { id: 'electronics', name: 'Electronics', color: '#5E6CF6', icon: 'laptopcomputer', count: 8 },
  { id: 'clothing', name: 'Clothing', color: '#E35EC4', icon: 'tshirt', count: 6 },
  { id: 'food', name: 'Food & Bev', color: '#F97316', icon: 'cart', count: 5 },
  { id: 'tools', name: 'Tools', color: '#10B981', icon: 'wrench.and.screwdriver', count: 5 },
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'MacBook Pro 14"',
    sku: 'MBP-14-M3',
    category: 'electronics',
    quantity: 12,
    minQuantity: 5,
    price: 1999.99,
    supplier: 'Apple Inc.',
    lastUpdated: '2026-07-08',
    description: 'Apple MacBook Pro 14-inch with M3 chip, 16GB RAM, 512GB SSD.',
  },
  {
    id: '2',
    name: 'iPhone 16 Pro',
    sku: 'IPH-16P-BLK',
    category: 'electronics',
    quantity: 3,
    minQuantity: 10,
    price: 1099.99,
    supplier: 'Apple Inc.',
    lastUpdated: '2026-07-07',
    description: 'iPhone 16 Pro with titanium finish, 256GB storage.',
  },
  {
    id: '3',
    name: 'Sony WH-1000XM5',
    sku: 'SNY-WH5-BLK',
    category: 'electronics',
    quantity: 0,
    minQuantity: 5,
    price: 349.99,
    supplier: 'Sony Corp.',
    lastUpdated: '2026-07-06',
    description: 'Premium noise-cancelling wireless headphones.',
  },
  {
    id: '4',
    name: 'Running Shoes Nike',
    sku: 'NK-RUN-SZ10',
    category: 'clothing',
    quantity: 25,
    minQuantity: 8,
    price: 129.99,
    supplier: 'Nike LLC',
    lastUpdated: '2026-07-08',
    description: 'Nike Air Zoom Pegasus 40 running shoes, size 10.',
  },
  {
    id: '5',
    name: 'Polo Shirt - Blue',
    sku: 'PLO-BLU-M',
    category: 'clothing',
    quantity: 4,
    minQuantity: 10,
    price: 49.99,
    supplier: 'Gap Inc.',
    lastUpdated: '2026-07-05',
    description: 'Classic polo shirt in royal blue, size medium.',
  },
  {
    id: '6',
    name: 'Denim Jeans Slim',
    sku: 'DNM-SLM-32',
    category: 'clothing',
    quantity: 18,
    minQuantity: 6,
    price: 79.99,
    supplier: 'Levi Strauss',
    lastUpdated: '2026-07-07',
    description: 'Slim fit denim jeans, waist 32 inseam 30.',
  },
  {
    id: '7',
    name: 'Organic Coffee Beans',
    sku: 'COF-ORG-1KG',
    category: 'food',
    quantity: 2,
    minQuantity: 15,
    price: 24.99,
    supplier: 'Roast Co.',
    lastUpdated: '2026-07-08',
    description: 'Fair-trade organic Arabica coffee beans, 1kg bag.',
  },
  {
    id: '8',
    name: 'Green Tea Matcha',
    sku: 'TEA-MAT-250G',
    category: 'food',
    quantity: 30,
    minQuantity: 10,
    price: 19.99,
    supplier: 'Ippodo Tea',
    lastUpdated: '2026-07-06',
    description: 'Ceremonial grade matcha green tea powder, 250g.',
  },
  {
    id: '9',
    name: 'Power Drill Set',
    sku: 'DRL-SET-20V',
    category: 'tools',
    quantity: 7,
    minQuantity: 3,
    price: 189.99,
    supplier: 'DeWalt',
    lastUpdated: '2026-07-07',
    description: '20V cordless drill with 2 batteries and 50-piece bit set.',
  },
  {
    id: '10',
    name: 'Wrench Set 14pc',
    sku: 'WRN-SET-14',
    category: 'tools',
    quantity: 0,
    minQuantity: 5,
    price: 64.99,
    supplier: 'Craftsman',
    lastUpdated: '2026-07-04',
    description: 'Combination wrench set, 14 pieces, SAE and metric.',
  },
  {
    id: '11',
    name: 'iPad Air 11"',
    sku: 'IPD-AIR-11',
    category: 'electronics',
    quantity: 9,
    minQuantity: 4,
    price: 699.99,
    supplier: 'Apple Inc.',
    lastUpdated: '2026-07-08',
    description: 'iPad Air 11-inch with M2 chip, 128GB, Wi-Fi.',
  },
  {
    id: '12',
    name: 'Wireless Mouse',
    sku: 'MOU-WLS-BLK',
    category: 'electronics',
    quantity: 22,
    minQuantity: 10,
    price: 59.99,
    supplier: 'Logitech',
    lastUpdated: '2026-07-06',
    description: 'MX Master 3S wireless mouse, black.',
  },
  {
    id: '13',
    name: 'Protein Bar Box',
    sku: 'PRO-BAR-24',
    category: 'food',
    quantity: 45,
    minQuantity: 12,
    price: 39.99,
    supplier: 'Quest Nutrition',
    lastUpdated: '2026-07-08',
    description: 'Chocolate chip cookie dough protein bars, box of 24.',
  },
  {
    id: '14',
    name: 'Tape Measure 25ft',
    sku: 'TAP-25FT',
    category: 'tools',
    quantity: 14,
    minQuantity: 5,
    price: 24.99,
    supplier: 'Stanley',
    lastUpdated: '2026-07-05',
    description: 'Classic 25ft retractable tape measure with magnetic hook.',
  },
  {
    id: '15',
    name: 'Winter Jacket',
    sku: 'JKT-WIN-XL',
    category: 'clothing',
    quantity: 6,
    minQuantity: 5,
    price: 199.99,
    supplier: 'The North Face',
    lastUpdated: '2026-07-03',
    description: 'Insulated winter jacket, size XL, midnight navy.',
  },
];

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
