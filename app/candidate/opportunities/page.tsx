'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CandidateOpportunitiesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    } else if (!authLoading && user?.user_type !== 'candidate') {
      router.push('/')
    }
  }, [authLoading, user, router])

  if (authLoading || !user || user.user_type !== 'candidate') {
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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
            Opportunities
          </h1>
          <p className="text-lg text-gray-dark dark:text-gray-300">
            Discover your next career move
          </p>
        </div>

        {/* Opportunity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Browse All Jobs */}
          <Link
            href="/jobs"
            className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 hover:border-black dark:hover:border-gray transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#ffdf07] dark:bg-[#ffdf07] flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-black dark:text-white">
                Browse All Jobs
              </h3>
            </div>
            <p className="text-gray-dark dark:text-gray-300 mb-4">
              Explore all available positions from companies looking for talent like you
            </p>
            <span className="text-sm font-medium text-black dark:text-white hover:underline">
              View Jobs →
            </span>
          </Link>

          {/* My Matches */}
          <Link
            href="/candidate/matches"
            className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 hover:border-black dark:hover:border-gray transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#ffdf07] dark:bg-[#ffdf07] flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-black dark:text-white">
                My Matches
              </h3>
            </div>
            <p className="text-gray-dark dark:text-gray-300 mb-4">
              See jobs that match your skills, experience, and preferences
            </p>
            <span className="text-sm font-medium text-black dark:text-white hover:underline">
              View Matches →
            </span>
          </Link>

          {/* My Applications */}
          <Link
            href="/candidate/applications"
            className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 hover:border-black dark:hover:border-gray transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#ffdf07] dark:bg-[#ffdf07] flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-black dark:text-white">
                My Applications
              </h3>
            </div>
            <p className="text-gray-dark dark:text-gray-300 mb-4">
              Track the status of your job applications and responses
            </p>
            <span className="text-sm font-medium text-black dark:text-white hover:underline">
              View Applications →
            </span>
          </Link>
        </div>

        {/* Quick Stats or Recent Activity */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/candidate/dashboard"
              className="px-6 py-3 text-left bg-gray-50 dark:bg-[#252525] rounded-lg hover:bg-gray-100 dark:hover:bg-[#333333] transition-colors"
            >
              <div className="font-semibold text-black dark:text-white mb-1">Go to Dashboard</div>
              <div className="text-sm text-gray-dark dark:text-gray-400">View your profile and activity</div>
            </Link>
            <Link
              href="/candidate/setup"
              className="px-6 py-3 text-left bg-gray-50 dark:bg-[#252525] rounded-lg hover:bg-gray-100 dark:hover:bg-[#333333] transition-colors"
            >
              <div className="font-semibold text-black dark:text-white mb-1">Complete Profile</div>
              <div className="text-sm text-gray-dark dark:text-gray-400">Improve your match score</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

