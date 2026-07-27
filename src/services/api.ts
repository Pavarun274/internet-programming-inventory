// Primary API URL (Port 3044) and Web Path Fallback URL
export const API_BASE_URL = 'http://119.59.102.161:3044/api';
export const FALLBACK_API_BASE_URL = 'http://119.59.102.161/web/dcas/ip/std6730202700/api';

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
    console.error(`[API Error] Could not connect to backend server:`, fallbackErr);
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
    storeAvailability: typeof product.storeAvailability === 'string'
      ? JSON.parse(product.storeAvailability || '[]')
      : product.storeAvailability || [],
  }));
};
