import api from './api'
import { User } from '@/types/auth'

export interface RegisterData {
  email: string
  password: string
  username?: string
  firstName?: string
  lastName?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

export const authService = {
  register: async (data: RegisterData): Promise<any> => {
    const response = await api.post('/auth/register', data) // Returns { success: true, data: { ... } }
    return response.data.data
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data) // Returns { success: true, data: { ... } }
    return response.data.data
  },

  getProfile: async () => {
    const response = await api.get('/auth/me')
    return response.data.data
  },

  logout: () => {
    localStorage.removeItem('token')
    window.location.href = '/auth/login'
  },
}