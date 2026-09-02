import React, { createContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRODUCTS, RECENT_ACTIVITY, CATEGORIES, STORES, Product, RecentActivity, Store, getStockStatus } from '@/constants/inventory-data';
import {
  fetchProductsFromApi,
  fetchCategoriesFromApi,
  fetchStoresFromApi,
  fetchProductStoresFromApi,
  createProductOnApi,
  updateProductOnApi,
  deleteProductOnApi,
  syncProductStoresOnApi,
  createStoreOnApi,
  updateStoreOnApi,
  deleteStoreOnApi,
  createStockMovementOnApi,
  fetchStockMovementsFromApi,
} from '@/services/api';
import { useAuth } from '@/hooks/use-auth';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'qty-asc' | 'name-asc' | 'name-desc';

type InventoryContextType = {
  products: Product[];
  filteredProducts: Product[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (c: string[]) => void;
  sortOption: SortOption;
  setSortOption: (opt: SortOption) => void;
  addProduct: (product: Omit<Product, 'id' | 'lastUpdated'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  stores: Store[];
  addStore: (store: Omit<Store, 'id'>) => void;
  updateStore: (id: string, updates: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  getStoreById: (id: string) => Store | undefined;
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

// Backend stock_movements rows only track in/out/adjust — 'in' can't be told
// apart from a brand-new product vs. a restock, so it's mapped to 'restocked'
// for display; this only affects icon/color, not any stored data.
function mapStockMovementsToActivities(rows: any[]): RecentActivity[] {
  return rows.map((r) => ({
    id: 'sm_' + r.movement_id,
    type: r.type === 'out' ? 'removed' : r.type === 'adjust' ? 'updated' : 'restocked',
    productName: r.product_name ?? 'Unknown product',
    quantity: Number(r.quantity) || 0,
    timestamp: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    user: r.username ?? 'Unknown',
  }));
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
  const { user, token, hasFinancialAccess } = useAuth();
  const isFinancialRestricted = !hasFinancialAccess;
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>(STORES);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(RECENT_ACTIVITY);

  // Maps a store's local id to its backend row id, same rationale as
  // backendProductIdMapRef below — avoids colliding with the seeded 's1'/'s2'/'s3' ids.
  const backendStoreIdMapRef = useRef<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
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

  // Only stores with a known backend row (loaded from the API, or created
  // this session) can be synced — locally-seeded mock stores ('s1' etc.) have
  // no backend counterpart to point a foreign key at.
  const resolveStoreId = useCallback((storeId: string): string | null => {
    return backendStoreIdMapRef.current[storeId] ?? null;
  }, []);

  // Best-effort log to stock_movements — needs both a known backend product
  // row and a logged-in user, since the table has no defaults for either.
  const postStockMovement = useCallback((
    backendProductId: string,
    activityType: RecentActivity['type'],
    quantity: number
  ) => {
    if (!user?.user_id || quantity === 0) return;
    const movementType = activityType === 'removed' ? 'out' : activityType === 'updated' ? 'adjust' : 'in';
    createStockMovementOnApi({
      product_id: backendProductId,
      user_id: user.user_id,
      type: movementType,
      quantity,
    }).catch((e) => console.warn('Could not sync stock movement to backend:', e));
  }, [user]);

  // Best-effort backend category_id -> local slug lookup (reverse of
  // categoryIdMapRef), used to label products fetched from the backend.
  const categorySlugByIdRef = useRef<Record<number, string>>({});

  async function loadCategoryMaps() {
    try {
      const backendCategories = await fetchCategoriesFromApi();
      const slugToId: Record<string, number> = {};
      const idToSlug: Record<number, string> = {};
      for (const localCat of CATEGORIES) {
        if (localCat.id === 'all') continue;
        const match = backendCategories.find((bc: any) => {
          const bcName = String(bc.name ?? bc.category_name ?? bc.title ?? '').toLowerCase().replace(/[^a-z]/g, '');
          const localName = localCat.name.toLowerCase().replace(/[^a-z]/g, '');
          return bcName === localName || bcName.startsWith(localCat.id);
        });
        if (match) {
          const backendId = match.id ?? match.category_id;
          slugToId[localCat.id] = backendId;
          idToSlug[backendId] = localCat.id;
        }
      }
      categoryIdMapRef.current = slugToId;
      categorySlugByIdRef.current = idToSlug;
    } catch (e) {
      console.warn('Could not resolve backend category ids:', e);
    }
  }

  // Load from Backend API / GitHub / AsyncStorage on mount
  useEffect(() => {
    async function loadStoredData() {
      try {
        // 1. Try fetching from Backend API Server using fetchProductsFromApi
        await loadCategoryMaps();
        const data = await fetchProductsFromApi(token || undefined);
        if (Array.isArray(data) && data.length > 0) {
          const withCategorySlugs = data.map((p: any) => ({
            ...p,
            category: categorySlugByIdRef.current[p.category_id] ?? p.category ?? '',
          }));
          let migrated = mergeLocalImages(migrateProducts(withCategorySlugs));
          if (isFinancialRestricted) {
            migrated = migrated.map((p) => {
              const { price, ...rest } = p;
              return rest;
            });
          }

          try {
            const allocationRows = await fetchProductStoresFromApi();
            const rowsByProduct = new Map<string, { store_id: number; quantity: number }[]>();
            for (const row of allocationRows) {
              const pid = String(row.product_id);
              const list = rowsByProduct.get(pid) ?? [];
              list.push(row);
              rowsByProduct.set(pid, list);
            }
            migrated = migrated.map((p) => {
              const rows = rowsByProduct.get(p.id);
              if (!rows || rows.length === 0) return p;
              const storeQuantities: Record<string, number> = {};
              rows.forEach((r) => {
                storeQuantities[String(r.store_id)] = Number(r.quantity) || 0;
              });
              return { ...p, storeIds: Object.keys(storeQuantities), storeQuantities };
            });
          } catch (e) {
            console.warn('Could not fetch product-store allocations:', e);
          }

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
          let migrated = mergeLocalImages(migrateProducts(data));
          if (isFinancialRestricted) {
            migrated = migrated.map((p) => {
              const { price, ...rest } = p;
              return rest;
            });
          }
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
            let migrated = mergeLocalImages(migrateProducts(parsed));
            if (isFinancialRestricted) {
              migrated = migrated.map((p) => {
                const { price, ...rest } = p;
                return rest;
              });
            }
            setProducts(migrated);
          } else {
            let migrated = mergeLocalImages(migrateProducts(PRODUCTS));
            if (isFinancialRestricted) {
              migrated = migrated.map((p) => {
                const { price, ...rest } = p;
                return rest;
              });
            }
            setProducts(migrated);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          }
        } catch (storageErr) {
          console.error('Failed to load products from storage:', storageErr);
          let migrated = mergeLocalImages(migrateProducts(PRODUCTS));
          if (isFinancialRestricted) {
            migrated = migrated.map((p) => {
              const { price, ...rest } = p;
              return rest;
            });
          }
          setProducts(migrated);
        }
      }

      try {
        const backendMovements = await fetchStockMovementsFromApi();
        if (Array.isArray(backendMovements) && backendMovements.length > 0) {
          setRecentActivities(mapStockMovementsToActivities(backendMovements));
          return;
        }
      } catch (backendErr) {
        console.warn('Could not fetch stock movements from backend, falling back to storage:', backendErr);
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

    async function loadStores() {
      try {
        const backendStores = await fetchStoresFromApi();
        if (Array.isArray(backendStores) && backendStores.length > 0) {
          setStores(backendStores);
          for (const s of backendStores) {
            backendStoreIdMapRef.current[s.id] = s.id;
          }
        }
      } catch (e) {
        console.warn('Could not fetch stores from backend, using local defaults:', e);
      }
    }
    loadStores();
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
      price: newFields.price ?? 0,
      quantity: newFields.quantity,
      status: 'active',
      image: toRemoteImageUrl(newFields.image),
      supplier: newFields.supplier || null,
      min_quantity: newFields.minQuantity || 0,
    })
      .then((backendId) => {
        backendProductIdMapRef.current[localId] = backendId;
        postStockMovement(backendId, 'added', Number(newFields.quantity));

        const storeRows = Object.entries(newFields.storeQuantities || {})
          .map(([sId, qty]) => ({ store_id: resolveStoreId(sId), quantity: Number(qty) || 0 }))
          .filter((r): r is { store_id: string; quantity: number } => r.store_id !== null);
        if (storeRows.length > 0) {
          syncProductStoresOnApi(backendId, storeRows).catch((e) =>
            console.warn('Could not sync new product store allocation to backend:', e)
          );
        }
      })
      .catch((e) => console.warn('Could not sync new product to backend:', e));
  }, [logActivity, resolveCategoryId, resolveStoreId, postStockMovement]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    let merged: Product | undefined;
    let movement: { type: RecentActivity['type']; quantity: number } | undefined;

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
          movement = { type: 'restocked', quantity: qtyDiff };
          logActivity({
            type: 'restocked',
            productName: updates.name ?? original.name,
            quantity: qtyDiff,
          });
        } else if (qtyDiff < 0) {
          movement = { type: 'removed', quantity: Math.abs(qtyDiff) };
          logActivity({
            type: 'removed',
            productName: updates.name ?? original.name,
            quantity: Math.abs(qtyDiff),
          });
        } else {
          movement = { type: 'updated', quantity: 0 };
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
      if (movement) {
        postStockMovement(backendId, movement.type, movement.quantity);
      }
      updateProductOnApi(backendId, {
        sku: merged.sku,
        name: merged.name,
        category_id: resolveCategoryId(merged.category),
        price: merged.price ?? 0,
        quantity: merged.quantity,
        status: 'active',
        image: toRemoteImageUrl(merged.image),
        supplier: merged.supplier || null,
        min_quantity: merged.minQuantity || 0,
      }).catch((e) => console.warn('Could not sync product update to backend:', e));

      const storeRows = Object.entries(merged.storeQuantities || {})
        .map(([sId, qty]) => ({ store_id: resolveStoreId(sId), quantity: Number(qty) || 0 }))
        .filter((r): r is { store_id: string; quantity: number } => r.store_id !== null);
      if (storeRows.length > 0) {
        syncProductStoresOnApi(backendId, storeRows).catch((e) =>
          console.warn('Could not sync product store allocation to backend:', e)
        );
      }
    }
  }, [logActivity, resolveCategoryId, resolveStoreId, postStockMovement]);

  const deleteProduct = useCallback((id: string) => {
    let removedQuantity: number | undefined;

    setProducts((prev) => {
      const original = prev.find((p) => p.id === id);
      const updated = prev.filter((p) => p.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((e) =>
        console.error('Failed to save products to storage:', e)
      );

      if (original) {
        removedQuantity = original.quantity;
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
      if (removedQuantity !== undefined) {
        postStockMovement(backendId, 'removed', removedQuantity);
      }
      deleteProductOnApi(backendId).catch((e) => console.warn('Could not sync product deletion to backend:', e));
      delete backendProductIdMapRef.current[id];
    }
  }, [logActivity, postStockMovement]);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const addStore = useCallback((newFields: Omit<Store, 'id'>) => {
    const localId = 'local_' + Date.now().toString();
    const newStore: Store = { ...newFields, id: localId };
    setStores((prev) => [...prev, newStore]);

    createStoreOnApi(newFields)
      .then((backendId) => {
        backendStoreIdMapRef.current[localId] = backendId;
      })
      .catch((e) => console.warn('Could not sync new store to backend:', e));
  }, []);

  const updateStore = useCallback((id: string, updates: Partial<Store>) => {
    let merged: Store | undefined;
    setStores((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        merged = { ...s, ...updates };
        return merged;
      })
    );

    const backendId = backendStoreIdMapRef.current[id];
    if (merged && backendId) {
      updateStoreOnApi(backendId, {
        name: merged.name,
        type: merged.type,
        address: merged.address,
        manager: merged.manager,
        phone: merged.phone,
        status: merged.status,
      }).catch((e) => console.warn('Could not sync store update to backend:', e));
    }
  }, []);

  const deleteStore = useCallback((id: string) => {
    setStores((prev) => prev.filter((s) => s.id !== id));

    const backendId = backendStoreIdMapRef.current[id];
    if (backendId) {
      deleteStoreOnApi(backendId).catch((e) => console.warn('Could not sync store deletion to backend:', e));
      delete backendStoreIdMapRef.current[id];
    }
  }, []);

  const getStoreById = useCallback(
    (id: string) => stores.find((s) => s.id === id),
    [stores]
  );

  // Filter & Sort logic
  const filteredProducts = products
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.supplier && p.supplier.toLowerCase().includes(q));
      const matchesCategory = selectedCategories.includes('all') || selectedCategories.includes(p.category);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (hasFinancialAccess && sortOption === 'price-asc') return (a.price ?? 0) - (b.price ?? 0);
      if (hasFinancialAccess && sortOption === 'price-desc') return (b.price ?? 0) - (a.price ?? 0);
      if (sortOption === 'qty-asc') return a.quantity - b.quantity;
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
      return 0; // Default/no sort (original order)
    });

  const totalProducts = products.length;
  const totalValue = hasFinancialAccess
    ? products.reduce((sum, p) => sum + (p.price != null ? p.price * p.quantity : 0), 0)
    : 0;
  const lowStockCount = products.filter((p) => getStockStatus(p) === 'low_stock').length;
  const outOfStockCount = products.filter((p) => getStockStatus(p) === 'out_of_stock').length;

  return (
    <InventoryContext.Provider
      value={{
        products,
        filteredProducts,
        searchQuery,
        setSearchQuery,
        selectedCategories,
        setSelectedCategories,
        sortOption,
        setSortOption,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        stores,
        addStore,
        updateStore,
        deleteStore,
        getStoreById,
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
