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

  let finalUrl = `${API_URL}${url}`;
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

  const response = await fetch(finalUrl, config);

  if (!response.ok) {
    if (response.status === 401) {
      console.warn('[API] Unauthorized (401):', `${API_URL}${url}`);
    }
    
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    
    // Mimic axios error structure
    const error: any = new Error(errorData.message || response.statusText);
    error.response = {
      status: response.status,
      data: errorData,
      config: { url: `${API_URL}${url}` }
    };
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return { data: null, status: response.status };
  }

  const data = await response.json();
  return { data, status: response.status };
}

export const api = {
  get: <T = any>(url: string, config?: any) => fetchWithInterceptor(url, { ...config, method: 'GET' }) as Promise<{ data: T; status: number }>,
  post: <T = any>(url: string, data?: any, config?: any) => fetchWithInterceptor(url, { ...config, method: 'POST', data }) as Promise<{ data: T; status: number }>,
  put: <T = any>(url: string, data?: any, config?: any) => fetchWithInterceptor(url, { ...config, method: 'PUT', data }) as Promise<{ data: T; status: number }>,
  patch: <T = any>(url: string, data?: any, config?: any) => fetchWithInterceptor(url, { ...config, method: 'PATCH', data }) as Promise<{ data: T; status: number }>,
  delete: <T = any>(url: string, config?: any) => fetchWithInterceptor(url, { ...config, method: 'DELETE' }) as Promise<{ data: T; status: number }>,
};

export default api;
