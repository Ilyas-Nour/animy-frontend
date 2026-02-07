import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token (client-side only)
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // DO NOT automatically redirect to login or clear token here.
    // This is too aggressive and causes sign-outs on refresh/race conditions.
    // The AuthContext and individual pages should handle 401s where appropriate.

    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized (401):', error.config.url)
    }

    return Promise.reject(error)
  }
)

export default api
