const DEFAULT_BASE_URL =
  (typeof process !== 'undefined' && (process as any).env?.API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  'http://localhost:7000/api';

interface HttpOptions extends RequestInit {
  token?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  asBlob?: boolean;
}

const buildQueryString = (query?: HttpOptions['query']) => {
  if (!query) return '';
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `?${params.join('&')}` : '';
};

const handleResponse = async (res: Response, asBlob?: boolean) => {
  if (!res.ok) {
    const message = await res.text();
    const errorMsg = message || `Request failed with status ${res.status}`;
    console.error(`[HTTP Error] ${res.status} ${res.statusText}:`, errorMsg);
    throw new Error(errorMsg);
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
  { token, query, asBlob, headers, ...init }: HttpOptions = {}
): Promise<T> => {
  const qs = buildQueryString(query);
  const finalUrl = `${DEFAULT_BASE_URL}${url}${qs}`;

  const isFormData = init.body instanceof FormData;
  
  const mergedHeaders: HeadersInit = {
    // Only set Content-Type for non-FormData requests
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers || {}),
  };

  if (token) {
    (mergedHeaders as any).Authorization = `Bearer ${token}`;
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
