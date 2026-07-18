import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRODUCTS, RECENT_ACTIVITY, Product, RecentActivity, getStockStatus } from '@/constants/inventory-data';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'qty-asc' | 'name-asc';

type InventoryContextType = {
  products: Product[];
  filteredProducts: Product[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  sortOption: SortOption;
  setSortOption: (opt: SortOption) => void;
  addProduct: (product: Omit<Product, 'id' | 'lastUpdated'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  recentActivities: RecentActivity[];
  stats: {
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
};

const STORAGE_KEY = 'inventory_products_v2';
const ACTIVITIES_KEY = 'inventory_activities';

export const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(RECENT_ACTIVITY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // Load from AsyncStorage on mount
  useEffect(() => {
    async function loadStoredData() {
      try {
        const storedProducts = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
        } else {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTS));
        }

        const storedActivities = await AsyncStorage.getItem(ACTIVITIES_KEY);
        if (storedActivities) {
          setRecentActivities(JSON.parse(storedActivities));
        } else {
          await AsyncStorage.setItem(ACTIVITIES_KEY, JSON.stringify(RECENT_ACTIVITY));
        }
      } catch (e) {
        console.error('Failed to load inventory from storage:', e);
      }
    }
    loadStoredData();
  }, []);

  const logActivity = useCallback((activity: Omit<RecentActivity, 'id' | 'timestamp' | 'user'>) => {
    const newAct: RecentActivity = {
      ...activity,
      id: 'act_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      user: 'Admin',
    };
    setRecentActivities((prev) => {
      const updated = [newAct, ...prev];
      AsyncStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updated)).catch((e) =>
        console.error('Failed to save activities to storage:', e)
      );
      return updated;
    });
  }, []);

  const addProduct = useCallback((newFields: Omit<Product, 'id' | 'lastUpdated'>) => {
    const newProd: Product = {
      ...newFields,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setProducts((prev) => {
      const updated = [newProd, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((e) =>
        console.error('Failed to save products to storage:', e)
      );
      return updated;
    });

    logActivity({
      type: 'added',
      productName: newFields.name,
      quantity: Number(newFields.quantity),
    });
  }, [logActivity]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const original = prev.find((p) => p.id === id);
      const updated = prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updates,
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : p
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((e) =>
        console.error('Failed to save products to storage:', e)
      );

      if (original) {
        const newQty = Number(updates.quantity !== undefined ? updates.quantity : original.quantity);
        const qtyDiff = newQty - original.quantity;
        if (qtyDiff > 0) {
          logActivity({
            type: 'restocked',
            productName: updates.name ?? original.name,
            quantity: qtyDiff,
          });
        } else if (qtyDiff < 0) {
          logActivity({
            type: 'removed',
            productName: updates.name ?? original.name,
            quantity: Math.abs(qtyDiff),
          });
        } else {
          logActivity({
            type: 'updated',
            productName: updates.name ?? original.name,
            quantity: original.quantity,
          });
        }
      }
      return updated;
    });
  }, [logActivity]);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => {
      const original = prev.find((p) => p.id === id);
      const updated = prev.filter((p) => p.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((e) =>
        console.error('Failed to save products to storage:', e)
      );

      if (original) {
        logActivity({
          type: 'removed',
          productName: original.name,
          quantity: original.quantity,
        });
      }
      return updated;
    });
  }, [logActivity]);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  // Filter & Sort logic
  const filteredProducts = products
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.supplier && p.supplier.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'qty-asc') return a.quantity - b.quantity;
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
      return 0; // Default/no sort (original order)
    });

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const lowStockCount = products.filter((p) => getStockStatus(p) === 'low_stock').length;
  const outOfStockCount = products.filter((p) => getStockStatus(p) === 'out_of_stock').length;

  return (
    <InventoryContext.Provider
      value={{
        products,
        filteredProducts,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        sortOption,
        setSortOption,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        recentActivities,
        stats: {
          totalProducts,
          totalValue,
          lowStockCount,
          outOfStockCount,
        },
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}
