'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, AuthState } from '@/types/auth'
import { authService } from '@/lib/auth'

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: User) => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Check for token synchronously during initialization to avoid flicker
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      return {
        user: null,
        token,
        isAuthenticated: !!token,
        isLoading: !!token, // Still loading profile if token exists
      }
    }
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
    }
  })

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token')

    if (token) {
      console.log('[AuthContext] Token found. Fetching fresh profile...')
      authService
        .getProfile()
        .then((user) => {
          console.log('[AuthContext] Profile fetch successful for:', user.username)
          setAuthState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        })
        .catch((err) => {
          const is401 = err.response?.status === 401;
          console.error(`[AuthContext] Profile fetch failed (401=${is401}):`, err.message)

          if (is401) {
            console.log('[AuthContext] Session expired (401). Clearing token.')
            localStorage.removeItem('token')
            setAuthState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            })
          } else {
            console.log('[AuthContext] Network/Server error. Retaining local session state.')
            // We have a token, but server is down/unreachable. 
            // Keep isAuthenticated=true but stop loading. 
            // The app might fail later on API calls but user isn't "signed out" yet.
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
            }))
          }
        })
    } else {
      console.log('[AuthContext] No token found. Initializing as guest.')
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }, [])

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token)
    setAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    })
  }

  const logout = () => {
    localStorage.removeItem('token')
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  const updateUser = (user: Partial<User>) => {
    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...user } : (user as User),
    }))
  }

  const refreshProfile = async () => {
    try {
      const user = await authService.getProfile()
      setAuthState((prev) => ({
        ...prev,
        user,
      }))
    } catch (err) {
      console.error('[AuthContext] refreshProfile failed:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, updateUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}