'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

type UserType = 'candidate' | 'company'

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, refreshAuth } = useAuth()
  const [selectedType, setSelectedType] = useState<UserType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isFromSignup, setIsFromSignup] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  // Check if user came from signup (with type in query) or login
  useEffect(() => {
    if (user && !authLoading && !hasCompletedOnboarding) {
      const typeFromQuery = searchParams.get('type')
      if (typeFromQuery && (typeFromQuery === 'candidate' || typeFromQuery === 'company')) {
        // User came from signup with a type - check if it's already set
        checkUserTypeAndRedirect(typeFromQuery as UserType)
      } else {
        // User came from login, check if they already have a type
      checkUserType()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, hasCompletedOnboarding])

  const checkUserType = async () => {
    try {
      const response = await fetch('/api/user/type', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.user_type) {
          // User already has a type set, redirect to appropriate dashboard
          redirectToDashboard(data.user_type)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to check user type' }))
        
        if (errorData.error === 'Unauthorized') {
          // If unauthorized, refresh auth and try again
          await refreshAuth()
          return
        }
        console.error('Error checking user type:', errorData.error)
        // Don't show error to user, just let them proceed with selection
      }
    } catch (error) {
      console.error('Error checking user type:', error)
      // Don't show error to user, just let them proceed with selection
    }
  }

  const checkUserTypeAndRedirect = async (expectedType: UserType) => {
    try {
      const response = await fetch('/api/user/type', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        if (data.user_type && data.user_type === expectedType) {
          // User type is already set and matches, redirect to dashboard
          redirectToDashboard(data.user_type)
        } else if (!data.user_type || data.user_type === 'candidate') {
          // User type not set or is default, set it now
          setSelectedType(expectedType)
          setIsFromSignup(true)
          await handleSubmit(expectedType)
        } else {
          // User type is different, redirect to their dashboard
          redirectToDashboard(data.user_type)
        }
      } else {
        // If API call fails, check if it's unauthorized
        const errorData = await response.json().catch(() => ({ error: 'Failed to check user type' }))
        if (errorData.error === 'Unauthorized') {
          // If unauthorized, refresh auth and try again
          await refreshAuth()
          // Retry after refresh
          setTimeout(() => checkUserTypeAndRedirect(expectedType), 500)
          return
        }
        console.error('Error checking user type:', errorData.error)
        // If API call fails, try to set the type anyway
        setSelectedType(expectedType)
        setIsFromSignup(true)
        await handleSubmit(expectedType)
      }
    } catch (error) {
      console.error('Error checking user type:', error)
      // If check fails, try to set the type
      setSelectedType(expectedType)
      setIsFromSignup(true)
      await handleSubmit(expectedType)
    }
  }

  const redirectToDashboard = (userType: string) => {
    if (userType === 'company') {
      router.push('/company/dashboard')
    } else {
      router.push('/candidate/dashboard')
    }
  }

  const handleSubmit = async (type?: UserType) => {
    const userType = type || selectedType
    if (!userType) {
      setError('Please select a user type')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/user/type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_type: userType }),
      })

      const data = await response.json()

      if (response.ok) {
        // Mark onboarding as completed to prevent useEffect from interfering
        setHasCompletedOnboarding(true)
        // Refresh auth to get updated user type
        await refreshAuth()
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100))
        // Redirect to appropriate dashboard
        const redirectPath = userType === 'company' ? '/company/dashboard' : '/candidate/dashboard'
        router.push(redirectPath)
        // Force navigation if router.push doesn't work
        setTimeout(() => {
          window.location.href = redirectPath
        }, 500)
      } else {
        if (data.error === 'Unauthorized') {
          // If unauthorized, refresh auth and try again
          await refreshAuth()
          // Retry the request
          const retryResponse = await fetch('/api/user/type', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ user_type: userType }),
          })
          const retryData = await retryResponse.json()
          if (retryResponse.ok) {
            setHasCompletedOnboarding(true)
            await refreshAuth()
            await new Promise(resolve => setTimeout(resolve, 100))
            const redirectPath = userType === 'company' ? '/company/dashboard' : '/candidate/dashboard'
            router.push(redirectPath)
            // Force navigation if router.push doesn't work
            setTimeout(() => {
              window.location.href = redirectPath
            }, 500)
          } else {
            setError(retryData.error || 'Failed to save user type. Please try again.')
            setIsSubmitting(false)
          }
        } else {
          setError(data.error || 'Failed to save user type')
          setIsSubmitting(false)
        }
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8">
            <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
              Welcome to xKroot!
            </h1>
            <p className="text-gray-dark dark:text-gray-300 mb-8">
              {isFromSignup 
                ? 'Setting up your account...' 
                : 'Let\'s get started. Please select your role to continue.'}
            </p>

            {user && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#333333]">
                <p className="text-sm text-gray-dark dark:text-gray-300">
                  Signed in as: <span className="font-medium text-black dark:text-gray">{user.email}</span>
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {!isFromSignup && (
              <>
                {/* User Type Toggle - Only show for login flow */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-black dark:text-gray mb-3">
                    I am a:
                  </label>
                  <div className="relative inline-flex w-full rounded-lg bg-gray-100 dark:bg-[#1a1a1a] p-1">
              <button
                      type="button"
                onClick={() => setSelectedType('candidate')}
                disabled={isSubmitting}
                      className={`relative flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all ${
                  selectedType === 'candidate'
                          ? 'bg-black dark:bg-gray text-white dark:text-black'
                          : 'text-gray-dark dark:text-gray-dark hover:text-black dark:hover:text-gray'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                      Individual
              </button>
              <button
                      type="button"
                onClick={() => setSelectedType('company')}
                disabled={isSubmitting}
                      className={`relative flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all ${
                  selectedType === 'company'
                          ? 'bg-black dark:bg-gray text-white dark:text-black'
                          : 'text-gray-dark dark:text-gray-400 hover:text-black dark:hover:text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                      Company
              </button>
                  </div>
            </div>

            <div className="flex justify-end">
              <button
                    onClick={() => handleSubmit()}
                disabled={!selectedType || isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Continue'}
              </button>
            </div>
              </>
            )}

            {isFromSignup && isSubmitting && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-gray mx-auto"></div>
                <p className="mt-4 text-sm text-gray-dark dark:text-gray-300">Setting up your account...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

