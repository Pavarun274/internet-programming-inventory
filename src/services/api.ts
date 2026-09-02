// Primary API URL — university cloud server (assigned port 3064)
export const API_BASE_URL = 'http://119.59.102.161:3064/api';
export const FALLBACK_API_BASE_URL = 'http://119.59.102.161:3064/api';

/**
 * Enhanced API Call Function with automatic fallback handling
 */
export const apiCall = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
  };

  const cleanEndpoint = endpoint.startsWith('/api')
    ? endpoint.slice(4)
    : endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Try Primary Port 3044 URL first
  try {
    const primaryUrl = `${API_BASE_URL}${cleanEndpoint}`;
    const response = await fetch(primaryUrl, config);
    if (response.ok) {
      return await response.json();
    }
  } catch (primaryErr) {
    console.warn(`[API Warning] Primary Port 3044 URL failed, trying fallback URL:`, primaryErr);
  }

  // Try Web Path Fallback URL
  try {
    const fallbackUrl = `${FALLBACK_API_BASE_URL}${cleanEndpoint}`;
    const response = await fetch(fallbackUrl, config);
    if (response.ok) {
      return await response.json();
    }
    throw new Error(`HTTP Error: ${response.status}`);
  } catch (fallbackErr) {
    console.warn(`[API Warning] Could not connect to backend server:`, fallbackErr);
    throw fallbackErr;
  }
};

/**
 * Retrieves products directly from the API via apiCall('/products')
 */
export const fetchProductsFromApi = async (authToken?: string) => {
  const options: RequestInit = authToken
    ? { headers: { Authorization: `Bearer ${authToken}` } }
    : {};

  const data = await apiCall('/products', options);

  if (!Array.isArray(data)) {
    throw new Error('Invalid data format received');
  }

  return data.map((product: any) => ({
    ...product,
    // The products table's primary key is `product_id`, not `id` — the
    // frontend Product model keys everything off `id`, so it must be mapped
    // here or every product loaded from the backend would have no usable id.
    id: String(product.id ?? product.product_id),
    // mysql2 returns DECIMAL columns (price) as strings, not numbers.
    // If the price column is stripped by backend RBAC for 'user' role, price is undefined.
    price: product.price !== undefined && product.price !== null ? Number(product.price) || 0 : undefined,
    quantity: Number(product.quantity) || 0,
    // The table tracks this as `min_quantity`, not `minQuantity`.
    minQuantity: Number(product.min_quantity ?? product.minQuantity) || 0,
    supplier: product.supplier ?? '',
    // The table tracks this as `updated_at`, not `lastUpdated` — map it so the
    // "Last updated" display has something to show for backend-sourced products.
    lastUpdated: product.updated_at
      ? String(product.updated_at).split('T')[0]
      : (product.lastUpdated ?? ''),
    description: product.description ?? '',
    storeIds: product.storeIds ?? ['s1'],
    category: product.category ?? '',
    storeAvailability: typeof product.storeAvailability === 'string'
      ? JSON.parse(product.storeAvailability || '[]')
      : product.storeAvailability || [],
  }));
};

export type FinancesApiResponse = {
  status: string;
  summary: {
    totalValue: number;
    estimatedCost: number;
    potentialProfit: number;
    totalProducts: number;
  };
  monthlySales: {
    month: string;
    s1: number;
    s2: number;
    s3: number;
    total2026: number;
    total2025: number;
  }[];
  dailyTopSellers: {
    date: string;
    items: {
      storeId: string;
      productName: string;
      category: string;
      qtySold: number;
      revenue: number;
    }[];
  }[];
};

/**
 * Retrieves financial metrics and analytics from the API via apiCall('/finances')
 */
export const fetchFinancesFromApi = async (authToken?: string): Promise<FinancesApiResponse> => {
  const options: RequestInit = authToken
    ? { headers: { Authorization: `Bearer ${authToken}` } }
    : {};
  return await apiCall<FinancesApiResponse>('/finances', options);
};

/**
 * Retrieves categories from the API via apiCall('/categories')
 */
export const fetchCategoriesFromApi = async (): Promise<any[]> => {
  const data = await apiCall('/categories');
  if (!Array.isArray(data)) {
    throw new Error('Invalid data format received');
  }
  return data;
};

export type ProductApiPayload = {
  sku: string;
  name: string;
  category_id?: number | string | null;
  price?: number;
  quantity: number;
  status?: string;
  image?: string | null;
  supplier?: string | null;
  min_quantity?: number;
};

// Shared secret embedded at build time — lets the server tell our own app's
// write requests apart from anyone hitting the API directly.
const API_KEY_HEADERS = { 'x-api-key': process.env.EXPO_PUBLIC_API_KEY ?? '' };

/**
 * Creates a product on the backend. Returns the numeric id assigned by the DB.
 */
export const createProductOnApi = async (payload: ProductApiPayload): Promise<string> => {
  const data = await apiCall<{ productId: number | string }>('/products', {
    method: 'POST',
    headers: API_KEY_HEADERS,
    body: JSON.stringify(payload),
  });
  return String(data.productId);
};

/**
 * Updates an existing product on the backend by id.
 */
export const updateProductOnApi = async (id: string, payload: ProductApiPayload): Promise<void> => {
  await apiCall(`/products/${id}`, {
    method: 'PUT',
    headers: API_KEY_HEADERS,
    body: JSON.stringify(payload),
  });
};

/**
 * Deletes a product on the backend by id.
 */
export const deleteProductOnApi = async (id: string): Promise<void> => {
  await apiCall(`/products/${id}`, {
    method: 'DELETE',
    headers: API_KEY_HEADERS,
  });
};

/**
 * Retrieves stores from the API via apiCall('/stores')
 */
export const fetchStoresFromApi = async (): Promise<any[]> => {
  const data = await apiCall('/stores');
  if (!Array.isArray(data)) {
    throw new Error('Invalid data format received');
  }
  return data.map((store: any) => ({
    ...store,
    // The stores table's primary key is `store_id`, not `id` — the frontend
    // Store model keys everything off `id`.
    id: String(store.id ?? store.store_id),
  }));
};

export type StoreApiPayload = {
  name: string;
  type?: string | null;
  address?: string | null;
  manager?: string | null;
  phone?: string | null;
  status?: string | null;
};

/**
 * Creates a store on the backend. Returns the numeric id assigned by the DB.
 */
export const createStoreOnApi = async (payload: StoreApiPayload): Promise<string> => {
  const data = await apiCall<{ storeId: number | string }>('/stores', {
    method: 'POST',
    headers: API_KEY_HEADERS,
    body: JSON.stringify(payload),
  });
  return String(data.storeId);
};

/**
 * Updates an existing store on the backend by id.
 */
export const updateStoreOnApi = async (id: string, payload: StoreApiPayload): Promise<void> => {
  await apiCall(`/stores/${id}`, {
    method: 'PUT',
    headers: API_KEY_HEADERS,
    body: JSON.stringify(payload),
  });
};

/**
 * Deletes a store on the backend by id.
 */
export const deleteStoreOnApi = async (id: string): Promise<void> => {
  await apiCall(`/stores/${id}`, {
    method: 'DELETE',
    headers: API_KEY_HEADERS,
  });
};

/**
 * Retrieves every product-store quantity row via apiCall('/product-stores').
 * Returns raw rows keyed by the backend's numeric product_id/store_id.
 */
export const fetchProductStoresFromApi = async (): Promise<
  { product_id: number; store_id: number; quantity: number }[]
> => {
  const data = await apiCall('/product-stores');
  if (!Array.isArray(data)) {
    throw new Error('Invalid data format received');
  }
  return data;
};

/**
 * Replaces a product's full store allocation on the backend.
 */
export const syncProductStoresOnApi = async (
  productId: string,
  stores: { store_id: number | string; quantity: number }[]
): Promise<void> => {
  await apiCall(`/products/${productId}/stores`, {
    method: 'PUT',
    headers: API_KEY_HEADERS,
    body: JSON.stringify({ stores }),
  });
};

export type StockMovementPayload = {
  product_id: string | number;
  user_id: string | number;
  type: 'in' | 'out' | 'adjust';
  quantity: number;
  note?: string | null;
};

/**
 * Records a stock movement (receive / dispatch / adjustment) on the backend.
 * Returns the numeric id assigned by the DB.
 */
export const createStockMovementOnApi = async (payload: StockMovementPayload): Promise<string> => {
  const data = await apiCall<{ movementId: number | string }>('/stock-movements', {
    method: 'POST',
    headers: API_KEY_HEADERS,
    body: JSON.stringify(payload),
  });
  return String(data.movementId);
};

/**
 * Retrieves the stock movement history from the API via apiCall('/stock-movements')
 */
export const fetchStockMovementsFromApi = async (): Promise<any[]> => {
  const data = await apiCall('/stock-movements');
  if (!Array.isArray(data)) {
    throw new Error('Invalid data format received');
  }
  return data;
};

/**
 * Uploads a locally-picked image (a device file:// URI) to the backend and
 * returns the public http(s) URL to store on the product. Bypasses apiCall
 * since it must send multipart form data, not JSON.
 */
export const uploadImageOnApi = async (localUri: string): Promise<string> => {
  const filename = localUri.split('/').pop() || 'photo.jpg';
  const extMatch = /\.(\w+)$/.exec(filename);
  const ext = (extMatch?.[1] || 'jpg').toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  // RN 0.86's fetch/FormData no longer accepts the old RN-specific
  // `{ uri, name, type }` shorthand for a file part ("Unsupported
  // FormDataPart implementation") — it needs a real Blob instead. The
  // fetched blob's own type is usually correct, but falls back to the
  // extension-derived mimeType since the multer filter on the server
  // rejects uploads with no/unrecognized mimetype.
  const fileResponse = await fetch(localUri);
  const rawBlob = await fileResponse.blob();
  const blob = rawBlob.type ? rawBlob : new Blob([rawBlob], { type: mimeType });

  const formData = new FormData();
  formData.append('image', blob, filename);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: API_KEY_HEADERS,
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Upload failed with status ${response.status}`);
  }
  return data.url;
};

export type AuthUser = {
  user_id: number;
  username: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

// Bypasses apiCall's fallback logic — auth errors need the server's actual
// message (e.g. "Invalid username or password") surfaced to the user, not
// swallowed by a generic "HTTP Error: 401" from a retry chain.
async function authRequest(path: string, payload: object): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...API_KEY_HEADERS },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export const loginOnApi = (username: string, password: string): Promise<AuthResponse> =>
  authRequest('/auth/login', { username, password });

export const registerOnApi = (username: string, email: string, password: string): Promise<AuthResponse> =>
  authRequest('/auth/register', { username, email, password });
