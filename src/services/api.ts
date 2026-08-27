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
    // mysql2 returns DECIMAL columns (price) as strings, not numbers — leaving
    // it as a string crashes any `.toFixed()` call downstream.
    price: Number(product.price) || 0,
    quantity: Number(product.quantity) || 0,
    // These columns don't exist on the real products table at all, so they'd
    // otherwise come back `undefined` even though Product requires them.
    minQuantity: Number(product.minQuantity) || 0,
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
  price: number;
  quantity: number;
  status?: string;
  image?: string | null;
  supplier?: string | null;
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
