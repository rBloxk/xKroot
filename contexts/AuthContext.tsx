'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  full_name?: string | null
  user_type?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  authenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, fullName?: string, userType?: 'candidate' | 'company') => Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean }>
  loginWithGitHub: () => Promise<void>
  loginWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify')
      if (response.ok) {
        const data = await response.json()
        if (data.authenticated && data.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error. Please try again.' }
    }
  }

  const signup = async (email: string, password: string, fullName?: string, userType?: 'candidate' | 'company') => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, user_type: userType || 'candidate' }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.user) {
          setUser(data.user)
        }
        return { 
          success: true, 
          requiresConfirmation: data.requiresConfirmation || false 
        }
      } else {
        return { success: false, error: data.error || 'Sign up failed' }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
      // Still clear user state even if request fails
      setUser(null)
    }
  }

  const loginWithGitHub = async () => {
    try {
      // Redirect to GitHub OAuth endpoint
      window.location.href = '/api/auth/github'
    } catch (error: any) {
      console.error('GitHub login error:', error)
    }
  }

  const loginWithMagicLink = async (email: string) => {
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        return { 
          success: true, 
          message: data.message || 'Magic link sent! Check your email.' 
        }
      } else {
        return { success: false, error: data.error || 'Failed to send magic link' }
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error. Please try again.' }
    }
  }

  const refreshAuth = async () => {
    await checkAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated: !!user,
        login,
        signup,
        loginWithGitHub,
        loginWithMagicLink,
        logout,
        refreshAuth,
      }}
    >
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

