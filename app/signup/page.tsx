'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import GitHubIcon from '@/components/icons/GitHubIcon'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signup, authenticated, loading: authLoading, loginWithGitHub } = useAuth()
  const [userType, setUserType] = useState<'candidate' | 'company'>('candidate')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
    setSuccess(false)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)

    const result = await signup(
      formData.email,
      formData.password,
      formData.fullName || undefined,
      userType
    )

    if (result.success) {
      if (result.requiresConfirmation) {
        setSuccess(true)
        setError('')
      } else {
        // Redirect to onboarding with user_type
        router.push(`/onboarding?type=${userType}`)
      }
    } else {
      setError(result.error || 'Sign up failed')
    }
    setIsLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-dark">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black dark:text-gray">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-dark dark:text-gray-dark">
            Or{' '}
            <Link
              href="/login"
              className="font-medium text-black dark:text-gray hover:underline"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        {/* User Type Toggle */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-black dark:text-gray mb-3">
            I am a:
          </label>
          <div className="relative inline-flex w-full rounded-lg bg-gray-100 dark:bg-gray-dark/50 p-1">
            <button
              type="button"
              onClick={() => setUserType('candidate')}
              className={`relative flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                userType === 'candidate'
                  ? 'bg-black dark:bg-gray text-white dark:text-black'
                  : 'text-gray-dark dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => setUserType('company')}
              className={`relative flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                userType === 'company'
                  ? 'bg-black dark:bg-gray text-white dark:text-black'
                  : 'text-gray-dark dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Company
            </button>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                Sign up successful! Please check your email to confirm your account.
              </p>
            </div>
          )}
          <div className="rounded-md border border-gray-300 dark:border-[#333333] space-y-4">
            <div>
              <label htmlFor="fullName" className="sr-only">
                Full Name (Optional)
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-[#333333] placeholder-gray-500 dark:placeholder-gray-500 text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-black dark:focus:border-[#ffdf07] focus:z-10 sm:text-sm transition-colors"
                placeholder="Full Name (Optional)"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
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
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-[#333333] placeholder-gray-500 dark:placeholder-gray-500 text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-black dark:focus:border-[#ffdf07] focus:z-10 sm:text-sm transition-colors"
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
                autoComplete="new-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-[#333333] placeholder-gray-500 dark:placeholder-gray-500 text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-black dark:focus:border-[#ffdf07] focus:z-10 sm:text-sm transition-colors"
                placeholder="Password (min. 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-dark/50 placeholder-gray-500 dark:placeholder-gray-dark/70 text-black dark:text-gray bg-white dark:bg-gray-dark/30 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-gray focus:border-black dark:focus:border-gray focus:z-10 sm:text-sm transition-colors"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-gray disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-dark/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-black text-gray-dark dark:text-gray-dark">
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
              Sign up with GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

