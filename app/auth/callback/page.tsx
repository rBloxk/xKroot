'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from the URL (Supabase puts tokens in the hash)
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const error = params.get('error')
        const errorDescription = params.get('error_description')

        // Handle errors
        if (error) {
          console.error('OAuth error:', error, errorDescription)
          router.push(`/login?error=${encodeURIComponent(errorDescription || error)}`)
          return
        }

        // If we have tokens in the hash, exchange them for a session
        if (accessToken && refreshToken) {
          // Set the session using Supabase client
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError || !sessionData.session) {
            console.error('Session error:', sessionError)
            router.push(`/login?error=${encodeURIComponent(sessionError?.message || 'session_failed')}`)
            return
          }

          // Get user info
          const user = sessionData.user
          if (user) {
            // User record will be created/updated in /api/auth/set-session

            // Create/update profile if needed
            try {
              const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: user.id,
                  email: user.email || '',
                  full_name: user.user_metadata?.full_name || 
                            user.user_metadata?.name ||
                            user.user_metadata?.preferred_username ||
                            null,
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'id'
                })

              if (profileError) {
                console.log('Profile update skipped:', profileError)
              }
            } catch (error) {
              // Profiles table might not exist, that's okay
              console.log('Profile creation skipped')
            }

            // Set cookies via API (this will also create/update user record)
            await fetch('/api/auth/set-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: accessToken,
                refresh_token: refreshToken,
                user: user,
              }),
            })

            // Check if user needs onboarding (user_type not set)
            try {
              const userTypeResponse = await fetch('/api/user/type')
              if (userTypeResponse.ok) {
                const userTypeData = await userTypeResponse.json()
                // Only redirect to onboarding if user_type is not set (null or undefined)
                // If user_type is 'candidate' or 'company', they've already completed onboarding
                const needsOnboarding = !userTypeData.user_type
                if (needsOnboarding) {
                  router.push('/onboarding')
                  return
                }
              }
            } catch (error) {
              // If check fails, redirect to onboarding to be safe
              console.log('User type check failed, redirecting to onboarding:', error)
              router.push('/onboarding')
              return
            }

            // Redirect to home
            router.push('/')
          } else {
            router.push('/login?error=no_user')
          }
        } else {
          // Check for code parameter (alternative flow)
          const code = searchParams.get('code')
          if (code) {
            // Exchange code for session
            const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
            
            if (sessionError || !sessionData.session) {
              router.push(`/login?error=${encodeURIComponent(sessionError?.message || 'code_exchange_failed')}`)
              return
            }

            // Set cookies via API (this will also create/update user record)
            await fetch('/api/auth/set-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
                user: sessionData.user,
              }),
            })

            router.push('/')
          } else {
            router.push('/login?error=no_tokens')
          }
        }
      } catch (error: any) {
        console.error('Auth callback error:', error)
        router.push(`/login?error=${encodeURIComponent(error.message || 'callback_failed')}`)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
        <p className="mt-4 text-gray-dark dark:text-gray-dark">Completing authentication...</p>
      </div>
    </div>
  )
}

