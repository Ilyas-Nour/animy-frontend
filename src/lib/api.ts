const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

interface RequestOptions extends RequestInit {
  data?: any;
  params?: Record<string, string | number | boolean>;
}

async function fetchWithInterceptor(url: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.data instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.data && !(options.data instanceof FormData)) {
    config.body = JSON.stringify(options.data);
  } else if (options.data instanceof FormData) {
    config.body = options.data;
  }

  // CORS Bypassing Strategy:
  // If we are in the browser, route through our local API proxy to avoid CORS blocks from Hugging Face.
  // If we are on the server (SSR/Edge), we can talk to the backend directly.
  const isBrowser = typeof window !== 'undefined';
  let finalUrl = '';
  
  if (isBrowser) {
    // Route through local proxy: /api/proxy?url=/endpoint&param=val
    const proxyUrl = new URL('/api/proxy', window.location.origin);
    proxyUrl.searchParams.set('url', url);
    
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          proxyUrl.searchParams.append(key, String(value));
        }
      }
    }
    finalUrl = proxyUrl.toString();
  } else {
    // Direct backend call for server-side requests
    finalUrl = `${API_URL}${url}`;
    if (options.params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
      }
    }
  }

  // 15-second timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(finalUrl, { ...config, signal: controller.signal });
    clearTimeout(timeoutId);

  if (!response.ok) {
    console.error(`[API ERROR] ${response.status} - ${finalUrl}`);
    
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    
    const error: any = new Error(errorData.message || response.statusText);
    error.response = {
      status: response.status,
      data: errorData,
      config: { url: finalUrl }
    };
    throw error;
  }

  if (response.status === 204) {
    return { data: null, status: response.status };
  }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data, status: response.status };
    }
  
    const text = await response.text();
    return { data: text as any, status: response.status };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request Timeout: The server took too long to respond.');
    }
    throw error;
  }
}

export const api = {
  get: <T = any>(url: string, config?: any) => fetchWithInterceptor(url, { ...config, method: 'GET' }) as Promise<{ data: T; status: number }>,
  post: <T = any>(url: string, data?: any, config?: any) => fetchWithInterceptor(url, { ...config, method: 'POST', data }) as Promise<{ data: T; status: number }>,
  put: <T = any>(url: string, data?: any, config?: any) => fetchWithInterceptor(url, { ...config, method: 'PUT', data }) as Promise<{ data: T; status: number }>,
  patch: <T = any>(url: string, data?: any, config?: any) => fetchWithInterceptor(url, { ...config, method: 'PATCH', data }) as Promise<{ data: T; status: number }>,
  delete: <T = any>(url: string, config?: any) => fetchWithInterceptor(url, { ...config, method: 'DELETE' }) as Promise<{ data: T; status: number }>,
};

export default api;
