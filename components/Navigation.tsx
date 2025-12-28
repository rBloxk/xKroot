'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import ThemeToggle from './ThemeToggle'
import Notifications from './Notifications'

const navLinks = [
  { href: '/', label: '' },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const { authenticated, user, logout, loading: authLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [isCheckingProfile, setIsCheckingProfile] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!authenticated || !user) {
        setNeedsOnboarding(false)
        return
      }

      setIsCheckingProfile(true)
      try {
        if (user.user_type === 'company') {
          // Check if company profile exists and is 100% complete
          const response = await fetch('/api/company/profile')
          if (response.ok) {
            const data = await response.json()
            const profile = data.profile
            
            if (!profile) {
              setNeedsOnboarding(true)
              return
            }
            
            // Check if all required fields are filled for 100% completeness
            // A field is considered filled if it exists, is not null, and is not an empty string
            const isFieldFilled = (value: any) => {
              if (value === null || value === undefined) return false
              if (typeof value === 'string' && value.trim() === '') return false
              if (Array.isArray(value) && value.length === 0) return false
              return true
            }
            
            // Check required fields - same logic as dashboard
            const hasCompanyName = isFieldFilled(profile.company_name)
            const hasDescription = isFieldFilled(profile.description)
            const hasCompanySize = isFieldFilled(profile.company_size)
            const hasIndustry = isFieldFilled(profile.industry)
            const hasLocation = isFieldFilled(profile.location)
            
            const profileComplete = hasCompanyName && hasDescription && hasCompanySize && hasIndustry && hasLocation
            
            setNeedsOnboarding(!profileComplete)
          } else {
            // If profile doesn't exist, needs onboarding
            setNeedsOnboarding(true)
          }
        } else if (user.user_type === 'candidate') {
          // Check if candidate profile exists and is 100% complete
          const response = await fetch('/api/candidate/profile')
          if (response.ok) {
            const data = await response.json()
            const profile = data.profile
            // Profile is 100% complete if profile_completeness is 100
            const profileComplete = profile && profile.profile_completeness === 100
            setNeedsOnboarding(!profileComplete)
          } else {
            // If profile doesn't exist, needs onboarding
            setNeedsOnboarding(true)
          }
        } else {
          // No user_type set, needs onboarding
          setNeedsOnboarding(true)
        }
      } catch (error) {
        console.error('Error checking profile status:', error)
        // On error, assume needs onboarding to be safe
        setNeedsOnboarding(true)
      } finally {
        setIsCheckingProfile(false)
      }
    }

    checkProfileStatus()
  }, [authenticated, user, pathname])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
    setIsLoggingOut(false)
    router.push('/')
  }

  const getDashboardLink = () => {
    if (!user?.user_type) return '/onboarding'
    if (user.user_type === 'company') return '/company/dashboard'
    if (user.user_type === 'admin') return '/admin'
    return '/candidate/dashboard'
  }

  const getSetupLink = () => {
    if (!user?.user_type) return '/onboarding'
    if (user.user_type === 'company') return '/company/setup'
    return '/candidate/setup'
  }

  const getLogoLink = () => {
    if (!authenticated || !user) return '/'
    return getDashboardLink()
  }

  // Choose logo based on theme
  const logoSrc = theme === 'dark' 
    ? '/images/xkroot-logo-white.png' 
    : '/images/xkroot-logo.png'

  return (
    <nav className="glass-strong sticky top-0 z-50 border-b border-white/20 dark:border-white/10 dark:backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={getLogoLink()} className="flex items-center z-50">
            <Image
              src={logoSrc}
              alt="xkroot logo"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${
                    isActive
                      ? 'text-black dark:text-gray font-semibold'
                      : 'text-gray-dark dark:text-gray-300 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
                {!authLoading && (
                  authenticated ? (
                    <div className="flex items-center space-x-3">
                      {/* Feed Icon */}
                      {user?.user_type === 'candidate' && (
                        <Link
                          href="/feed"
                          className={`p-2 rounded-lg hover:bg-white/10 dark:hover:bg-[#1a1a1a] transition-colors ${
                            pathname === '/feed'
                              ? 'text-black dark:text-white'
                              : 'text-gray-600 dark:text-gray-600'
                          }`}
                          title="Feed"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12,14a3,3,0,0,0-3,3v7.026h6V17A3,3,0,0,0,12,14Z"/>
                            <path d="M13.338.833a2,2,0,0,0-2.676,0L0,10.429v10.4a3.2,3.2,0,0,0,3.2,3.2H7V17a5,5,0,0,1,10,0v7.026h3.8a3.2,3.2,0,0,0,3.2-3.2v-10.4Z"/>
                          </svg>
                        </Link>
                      )}
                      <Notifications />
                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className={`p-2 rounded-lg hover:bg-white/10 dark:hover:bg-[#1a1a1a] transition-colors ${
                        profileDropdownOpen
                          ? 'text-black dark:text-white'
                          : 'text-gray-600 dark:text-gray-600'
                      }`}
                      title={user?.full_name || user?.email || 'Profile'}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="256" cy="128" r="128"/>
                        <path d="M256,298.667c-105.99,0.118-191.882,86.01-192,192C64,502.449,73.551,512,85.333,512h341.333c11.782,0,21.333-9.551,21.333-21.333C447.882,384.677,361.99,298.784,256,298.667z"/>
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {profileDropdownOpen && (
                      <>
                        {/* Backdrop to close dropdown */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setProfileDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] shadow-lg z-50">
                          <div className="py-2">
                            {/* User Info */}
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-[#333333]">
                              <p className="text-sm font-semibold text-black dark:text-white">
                                {user?.full_name || 'User'}
                              </p>
                              <p className="text-xs text-gray-dark dark:text-gray-400 truncate">
                                {user?.email}
                              </p>
                            </div>
                            
                            {/* Menu Items */}
                            <div className="py-1">
                              {user?.user_type === 'candidate' && (
                                <>
                                  <Link
                                    href="/candidate/opportunities"
                                    onClick={() => setProfileDropdownOpen(false)}
                                    className="flex items-center px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Opportunities
                                  </Link>
                                  <Link
                                    href="/candidate/saved-jobs"
                                    onClick={() => setProfileDropdownOpen(false)}
                                    className="flex items-center px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                    Saved Jobs
                                  </Link>
                                </>
                              )}
                              {user?.user_type === 'company' && (
                                <Link
                                  href="/company/candidates"
                                  onClick={() => setProfileDropdownOpen(false)}
                                  className="flex items-center px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  Candidates
                                </Link>
                              )}
                              {needsOnboarding ? (
                                <Link
                                  href={getSetupLink()}
                                  onClick={() => setProfileDropdownOpen(false)}
                                  className="flex items-center px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Complete Profile
                                </Link>
                              ) : (
                                <Link
                                  href={getDashboardLink()}
                                  onClick={() => setProfileDropdownOpen(false)}
                                  className="flex items-center px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  Dashboard
                                </Link>
                              )}
                              <Link
                                href="/profile"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profile
                              </Link>
                              <button
                                onClick={() => {
                                  setProfileDropdownOpen(false)
                                  handleLogout()
                                }}
                                disabled={isLoggingOut}
                                className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors disabled:opacity-50"
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-white/10 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-white/10 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )
            )}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-black dark:text-white hover:bg-white/10 dark:hover:bg-[#1a1a1a] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-white/20 dark:border-white/10 pt-4 animate-fade-in">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'text-black dark:text-white font-semibold bg-white/10 dark:bg-[#1a1a1a]'
                        : 'text-gray-dark dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-white/5 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              {!authLoading && (
                authenticated ? (
                  <>
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-[#333333]">
                      <p className="text-sm font-semibold text-black dark:text-white">
                        {user?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-dark dark:text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                    
                    {/* Menu Items */}
                    {user?.user_type === 'candidate' && (
                      <>
                        <Link
                          href="/candidate/opportunities"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Opportunities
                        </Link>
                        <Link
                          href="/candidate/saved-jobs"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          Saved Jobs
                        </Link>
                      </>
                    )}
                    {user?.user_type === 'company' && (
                      <Link
                        href="/company/candidates"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Candidates
                      </Link>
                    )}
                    {needsOnboarding ? (
                      <Link
                        href={getSetupLink()}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Complete Profile
                      </Link>
                    ) : (
                      <Link
                        href={getDashboardLink()}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Dashboard
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      disabled={isLoggingOut}
                      className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 rounded-lg text-gray-dark dark:text-gray-dark hover:text-black dark:hover:text-gray hover:bg-white/5 dark:hover:bg-gray-dark/5 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 rounded-lg text-white bg-black dark:bg-gray hover:bg-gray-dark dark:hover:bg-gray-dark transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

