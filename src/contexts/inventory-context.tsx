import React, { createContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRODUCTS, RECENT_ACTIVITY, CATEGORIES, Product, RecentActivity, getStockStatus } from '@/constants/inventory-data';
import {
  fetchProductsFromApi,
  fetchCategoriesFromApi,
  createProductOnApi,
  updateProductOnApi,
  deleteProductOnApi,
} from '@/services/api';

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
const PRODUCTS_URL = 'https://raw.githubusercontent.com/Pavarun274/internet-programming-inventory/main/products.json';

export const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

function migrateProducts(parsed: any[]): Product[] {
  return parsed.map((p) => {
    const storeIds: string[] = p.storeIds || (p.storeId ? [p.storeId] : ['s1']);
    let storeQuantities: Record<string, number> = p.storeQuantities ? { ...p.storeQuantities } : {};

    if (!p.storeQuantities || Object.keys(storeQuantities).length === 0) {
      storeQuantities = {};
      storeIds.forEach((sId, idx) => {
        storeQuantities[sId] = idx === 0 ? Number(p.quantity || 0) : 0;
      });
    }

    const calculatedTotal = Object.values(storeQuantities).reduce((sum, val) => sum + (Number(val) || 0), 0);

    return {
      ...p,
      storeIds,
      storeQuantities,
      quantity: calculatedTotal,
    };
  });
}

// Images picked from the device library are local file:// URIs that only
// resolve on that device — only http(s) URLs are meaningful to store
// centrally, so device-local picks stay local-only instead of polluting
// the backend with unusable paths.
function toRemoteImageUrl(image: string | undefined): string | null {
  return image && /^https?:\/\//i.test(image) ? image : null;
}

function mergeLocalImages(products: Product[]): Product[] {
  const localImages = new Map(
    PRODUCTS.filter((p) => p.image).map((p) => [p.id, p.image as string])
  );

  return products.map((p) => ({
    ...p,
    image: p.image || localImages.get(p.id),
  }));
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(RECENT_ACTIVITY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // Best-effort local category slug -> backend category_id lookup, populated on mount
  const categoryIdMapRef = useRef<Record<string, number>>({});

  // Maps a product's local id to its backend row id. Kept separate from the
  // product's own `id` field — overwriting `id` with the raw backend id risks
  // colliding with locally-seeded demo products (e.g. both landing on "1"),
  // which breaks list rendering (duplicate React keys).
  const backendProductIdMapRef = useRef<Record<string, string>>({});

  const resolveCategoryId = useCallback((categorySlug: string): number | null => {
    return categoryIdMapRef.current[categorySlug] ?? null;
  }, []);

  useEffect(() => {
    async function loadCategoryIds() {
      try {
        const backendCategories = await fetchCategoriesFromApi();
        const map: Record<string, number> = {};
        for (const localCat of CATEGORIES) {
          if (localCat.id === 'all') continue;
          const match = backendCategories.find((bc: any) => {
            const bcName = String(bc.name ?? bc.category_name ?? bc.title ?? '').toLowerCase().replace(/[^a-z]/g, '');
            const localName = localCat.name.toLowerCase().replace(/[^a-z]/g, '');
            return bcName === localName || bcName.startsWith(localCat.id);
          });
          if (match) {
            map[localCat.id] = match.id ?? match.category_id;
          }
        }
        categoryIdMapRef.current = map;
      } catch (e) {
        console.warn('Could not resolve backend category ids, product sync will use null category_id:', e);
      }
    }
    loadCategoryIds();
  }, []);

  // Load from Backend API / GitHub / AsyncStorage on mount
  useEffect(() => {
    async function loadStoredData() {
      try {
        // 1. Try fetching from Backend API Server using fetchProductsFromApi
        const data = await fetchProductsFromApi();
        if (Array.isArray(data) && data.length > 0) {
          const migrated = mergeLocalImages(migrateProducts(data));
          setProducts(migrated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          // These products' `id` already IS the backend row id (see
          // fetchProductsFromApi) — seed the map so later edits/deletes on
          // them reach the server instead of only updating local state.
          for (const p of migrated) {
            backendProductIdMapRef.current[p.id] = p.id;
          }
          return;
        }
      } catch (backendErr) {
        console.warn('Could not fetch from Backend API, falling back to GitHub/Storage:', backendErr);
      }

      try {
        // 2. Fallback to GitHub Raw URL
        const response = await fetch(PRODUCTS_URL);
        if (response.ok) {
          const data = await response.json();
          const migrated = mergeLocalImages(migrateProducts(data));
          setProducts(migrated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } else {
          throw new Error(`Failed to fetch from GitHub: ${response.status}`);
        }
      } catch (e) {
        console.warn('Could not fetch products from GitHub, trying storage fallback:', e);
        try {
          const storedProducts = await AsyncStorage.getItem(STORAGE_KEY);
          if (storedProducts) {
            const parsed = JSON.parse(storedProducts);
            const migrated = mergeLocalImages(migrateProducts(parsed));
            setProducts(migrated);
          } else {
            const migrated = mergeLocalImages(migrateProducts(PRODUCTS));
            setProducts(migrated);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          }
        } catch (storageErr) {
          console.error('Failed to load products from storage:', storageErr);
          setProducts(mergeLocalImages(migrateProducts(PRODUCTS)));
        }
      }

      try {
        const storedActivities = await AsyncStorage.getItem(ACTIVITIES_KEY);
        if (storedActivities) {
          setRecentActivities(JSON.parse(storedActivities));
        } else {
          await AsyncStorage.setItem(ACTIVITIES_KEY, JSON.stringify(RECENT_ACTIVITY));
        }
      } catch (e) {
        console.error('Failed to load activities from storage:', e);
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
    const localId = Date.now().toString();
    const newProd: Product = {
      ...newFields,
      id: localId,
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

    // Best-effort sync to backend; on success, remember its row id (keyed by
    // the local id) so future edits/deletes target the right record. The
    // product's own `id` is never overwritten — a raw backend id could
    // collide with a locally-seeded demo product's id.
    createProductOnApi({
      sku: newFields.sku,
      name: newFields.name,
      category_id: resolveCategoryId(newFields.category),
      price: newFields.price,
      quantity: newFields.quantity,
      status: 'active',
      image: toRemoteImageUrl(newFields.image),
    })
      .then((backendId) => {
        backendProductIdMapRef.current[localId] = backendId;
      })
      .catch((e) => console.warn('Could not sync new product to backend:', e));
  }, [logActivity, resolveCategoryId]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    let merged: Product | undefined;

    setProducts((prev) => {
      const original = prev.find((p) => p.id === id);
      const updated = prev.map((p) => {
        if (p.id !== id) return p;
        const next = {
          ...p,
          ...updates,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
        merged = next;
        return next;
      });
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
            quantity: 0,
          });
        }
      }
      return updated;
    });

    // Best-effort sync to backend using the full merged record — sending only
    // the partial `updates` would blank out columns this call didn't touch,
    // since the backend UPDATE sets every column unconditionally. Only
    // products created through this session (or otherwise mapped) have a
    // known backend row to target.
    const backendId = backendProductIdMapRef.current[id];
    if (merged && backendId) {
      updateProductOnApi(backendId, {
        sku: merged.sku,
        name: merged.name,
        category_id: resolveCategoryId(merged.category),
        price: merged.price,
        quantity: merged.quantity,
        status: 'active',
        image: toRemoteImageUrl(merged.image),
      }).catch((e) => console.warn('Could not sync product update to backend:', e));
    }
  }, [logActivity, resolveCategoryId]);

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

    const backendId = backendProductIdMapRef.current[id];
    if (backendId) {
      deleteProductOnApi(backendId).catch((e) => console.warn('Could not sync product deletion to backend:', e));
      delete backendProductIdMapRef.current[id];
    }
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
