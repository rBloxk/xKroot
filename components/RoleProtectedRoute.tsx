'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
  redirectTo?: string
}

export default function RoleProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo = '/onboarding'
}: RoleProtectedRouteProps) {
  const { user, loading: authLoading, authenticated } = useAuth()
  const router = useRouter()
  const [userType, setUserType] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkRole = async () => {
      if (!authenticated || authLoading) {
        return
      }

      if (!user) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch('/api/user/type')
        if (response.ok) {
          const data = await response.json()
          setUserType(data.user_type)
          
          // If user doesn't have a type, redirect to onboarding
          if (!data.user_type) {
            // Check if they're on onboarding page already
            if (window.location.pathname !== '/onboarding') {
              router.push('/onboarding')
            }
            return
          }

          // Check if user's role is allowed
          if (!allowedRoles.includes(data.user_type)) {
            // Redirect based on user type
            if (data.user_type === 'company') {
              router.push('/company/dashboard')
            } else if (data.user_type === 'admin') {
              router.push('/admin')
            } else {
              router.push(redirectTo)
            }
            return
          }
        } else {
          // If we can't check role, redirect to onboarding
          router.push('/onboarding')
          return
        }
      } catch (error) {
        console.error('Error checking role:', error)
        router.push('/onboarding')
        return
      } finally {
        setIsChecking(false)
      }
    }

    checkRole()
  }, [authenticated, authLoading, user, router, allowedRoles, redirectTo])

  // Show loading state
  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-dark">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated, don't render children
  if (!authenticated || !user) {
    return null
  }

  // If user doesn't have required role, don't render children (redirect will happen)
  if (!userType || !allowedRoles.includes(userType)) {
    return null
  }

  // User has required role, render children
  return <>{children}</>
}

