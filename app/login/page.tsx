'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import GitHubIcon from '@/components/icons/GitHubIcon'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, authenticated, loading: authLoading, loginWithGitHub, loginWithMagicLink } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false)

  // Check for OAuth errors in URL
  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (oauthError) {
      setError(decodeURIComponent(oauthError))
    }
  }, [searchParams])

  useEffect(() => {
    if (authenticated && !authLoading) {
      router.push('/')
    }
  }, [authenticated, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(formData.email, formData.password)

    if (result.success) {
      // Check if user needs onboarding
      try {
        const userTypeResponse = await fetch('/api/user/type')
        if (userTypeResponse.ok) {
          const userTypeData = await userTypeResponse.json()
          const needsOnboarding = !userTypeData.user_type || userTypeData.user_type === 'candidate'
          if (needsOnboarding) {
            router.push('/onboarding')
            return
          }
        }
      } catch (error) {
        console.error('Error checking user type:', error)
        // Continue to home if check fails
      }
      router.push('/')
    } else {
      setError(result.error || 'Login failed')
      setIsLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email) {
      setError('Please enter your email address')
      return
    }

    setError('')
    setIsSendingMagicLink(true)

    const result = await loginWithMagicLink(formData.email)

    if (result.success) {
      setMagicLinkSent(true)
    } else {
      setError(result.error || 'Failed to send magic link')
    }
    setIsSendingMagicLink(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black dark:text-gray">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-dark dark:text-gray-300">
            Or{' '}
            <Link
              href="/signup"
              className="font-medium text-black dark:text-gray hover:underline"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          {magicLinkSent && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                Magic link sent! Check your email and click the link to sign in.
              </p>
            </div>
          )}
          <div className="rounded-md border border-gray-300 dark:border-[#333333] -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 dark:border-[#333333] placeholder-gray-500 dark:placeholder-gray-500 text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-black dark:focus:border-[#ffdf07] focus:z-10 sm:text-sm transition-colors"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 dark:border-[#333333] placeholder-gray-500 dark:placeholder-gray-500 text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-black dark:focus:border-[#ffdf07] focus:z-10 sm:text-sm transition-colors"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || magicLinkSent}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-gray disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in with Password'}
            </button>
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={isSendingMagicLink || magicLinkSent || !formData.email}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-[#333333] text-sm font-medium rounded-md text-black dark:text-white bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSendingMagicLink ? 'Sending...' : magicLinkSent ? 'Magic Link Sent!' : 'Send Magic Link'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-[#333333]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-black text-gray-dark dark:text-gray-300">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={loginWithGitHub}
              className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-dark/50 rounded-md text-sm font-medium text-black dark:text-gray bg-white dark:bg-gray-dark/30 hover:bg-gray-50 dark:hover:bg-gray-dark/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-gray transition-colors"
            >
              <GitHubIcon className="w-5 h-5" />
              Sign in with GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

