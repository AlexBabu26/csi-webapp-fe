import { getAuthToken, getRefreshToken, setAuthTokens, clearAuth, isTokenExpiringSoon } from './auth';

const DEFAULT_BASE_URL =
  (typeof process !== 'undefined' && (process as any).env?.API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  'https://csi-project-be.vercel.app/api';
  // 'http://0.0.0.0:7000/api';

interface HttpOptions extends RequestInit {
  token?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  asBlob?: boolean;
  skipAuthRefresh?: boolean; // Skip auto-refresh (used for refresh endpoint itself)
}

const buildQueryString = (query?: HttpOptions['query']) => {
  if (!query) return '';
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `?${params.join('&')}` : '';
};

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Refresh the access token using the refresh token
 */
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  console.log('[HTTP] Refreshing access token...');
  
  const response = await fetch(`${DEFAULT_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[HTTP] Token refresh failed:', errorText);
    clearAuth();
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  console.log('[HTTP] Token refresh successful');
  
  // Store new tokens
  setAuthTokens(data.access_token, data.refresh_token || refreshToken);
  
  return data.access_token;
};

/**
 * Get a valid access token, refreshing if necessary
 */
const getValidToken = async (providedToken?: string): Promise<string | null> => {
  // If a token was explicitly provided, use it
  if (providedToken) return providedToken;
  
  const currentToken = getAuthToken();
  if (!currentToken) return null;
  
  // Check if token is expiring soon (within 60 seconds)
  if (isTokenExpiringSoon(currentToken, 60)) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.warn('[HTTP] Token expiring soon but no refresh token available');
      return currentToken; // Return current token, let the request fail
    }
    
    // Prevent multiple simultaneous refresh calls
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }
    
    isRefreshing = true;
    refreshPromise = refreshAccessToken()
      .finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    
    try {
      return await refreshPromise;
    } catch {
      // If refresh fails, return current token and let request fail
      return currentToken;
    }
  }
  
  return currentToken;
};

const handleResponse = async (res: Response, asBlob?: boolean) => {
  if (!res.ok) {
    const message = await res.text();
    const errorMsg = message || `Request failed with status ${res.status}`;
    console.error(`[HTTP Error] ${res.status} ${res.statusText}:`, errorMsg);
    
    // Create an error with status code for easier handling
    const error = new Error(errorMsg) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  if (asBlob) return res.blob();
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.warn('[HTTP] Failed to parse JSON response:', text);
    return text;
  }
};

export const http = async <T = any>(
  url: string,
  { token, query, asBlob, headers, skipAuthRefresh, ...init }: HttpOptions = {}
): Promise<T> => {
  const qs = buildQueryString(query);
  const finalUrl = `${DEFAULT_BASE_URL}${url}${qs}`;

  const isFormData = init.body instanceof FormData;
  
  // Get a valid token (will auto-refresh if needed)
  const authToken = skipAuthRefresh ? token : await getValidToken(token);
  
  const mergedHeaders: HeadersInit = {
    // Only set Content-Type for non-FormData requests
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers || {}),
  };

  if (authToken) {
    (mergedHeaders as any).Authorization = `Bearer ${authToken}`;
  }

  // Remove Content-Type if it was explicitly set to undefined (for FormData)
  if ((mergedHeaders as any)['Content-Type'] === undefined) {
    delete (mergedHeaders as any)['Content-Type'];
  }

  console.log(`[HTTP] ${init.method || 'GET'} ${finalUrl}`);
  
  try {
    const response = await fetch(finalUrl, {
      ...init,
      headers: mergedHeaders,
    });

    // Handle 401 Unauthorized - try to refresh token and retry
    if (response.status === 401 && !skipAuthRefresh && !token) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        console.log('[HTTP] Got 401, attempting token refresh...');
        try {
          const newToken = await refreshAccessToken();
          
          // Retry the original request with new token
          console.log('[HTTP] Retrying request with new token...');
          const retryHeaders = { ...mergedHeaders };
          (retryHeaders as any).Authorization = `Bearer ${newToken}`;
          
          const retryResponse = await fetch(finalUrl, {
            ...init,
            headers: retryHeaders,
          });
          
          return handleResponse(retryResponse, asBlob) as Promise<T>;
        } catch (refreshError) {
          console.error('[HTTP] Token refresh failed, clearing auth:', refreshError);
          clearAuth();
          // Redirect to login
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/';
          }
          throw new Error('Session expired. Please login again.');
        }
      } else {
        // No refresh token, clear auth and redirect
        clearAuth();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/';
        }
        throw new Error('Session expired. Please login again.');
      }
    }

    return handleResponse(response, asBlob) as Promise<T>;
  } catch (error) {
    console.error(`[HTTP] Request failed for ${init.method || 'GET'} ${url}:`, error);
    throw error;
  }
};

export const httpGet = <T = any>(url: string, options?: HttpOptions) =>
  http<T>(url, { ...options, method: 'GET' });

export const httpPost = <T = any>(url: string, body?: any, options?: HttpOptions) =>
  http<T>(url, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const httpPut = <T = any>(url: string, body?: any, options?: HttpOptions) =>
  http<T>(url, {
    ...options,
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const httpDelete = <T = any>(url: string, options?: HttpOptions) =>
  http<T>(url, { ...options, method: 'DELETE' });

export const httpPostFormData = <T = any>(url: string, formData: FormData, token?: string) =>
  http<T>(url, {
    method: 'POST',
    body: formData,
    token,
    headers: {}, // Let browser set Content-Type with boundary for FormData
  });

// Export the server base URL for media/file URLs (without /api suffix)
export const API_SERVER_URL = DEFAULT_BASE_URL.replace('/api', '');

/**
 * Converts a relative API path to a full URL for media files.
 * Use this for images, files, etc. returned from the API.
 * 
 * @example
 * getMediaUrl('/api/files/site/logos/abc.jpeg') 
 * // Returns: 'http://localhost:7000/api/files/site/logos/abc.jpeg'
 */
export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Prepend the API server URL
  return `${API_SERVER_URL}${path}`;
};
