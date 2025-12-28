'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'

interface Analytics {
  users: {
    total: number
    by_type: Record<string, number>
    new_last_30_days: number
  }
  candidates: {
    total: number
    with_skills: number
    availability: Record<string, number>
  }
  companies: {
    total: number
    with_jobs: number
    by_size: Record<string, number>
  }
  jobs: {
    total: number
    by_status: Record<string, number>
    by_level: Record<string, number>
    total_views: number
    total_applications: number
  }
  matches: {
    total: number
    by_status: Record<string, number>
    average_score: number
    high_quality_matches: number
  }
  applications: {
    total: number
    by_status: Record<string, number>
    new_last_30_days: number
  }
  recent_activity: {
    recent_users: any[]
    recent_jobs: any[]
    recent_applications: any[]
  }
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      } else {
        setError('Failed to load analytics')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setError('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <RoleProtectedRoute allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
            <p className="mt-4 text-gray-dark dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </RoleProtectedRoute>
    )
  }

  return (
    <RoleProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-gray-dark dark:text-gray-300">
                  Platform overview and analytics
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/admin/users"
                  className="px-4 py-2 text-sm font-medium text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10 rounded-lg transition-colors"
                >
                  Manage Users
                </Link>
                <button
                  onClick={loadAnalytics}
                  className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {analytics && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                    Total Users
                  </h3>
                  <p className="text-3xl font-bold text-black dark:text-gray">
                    {analytics.users.total}
                  </p>
                  <p className="text-xs text-gray-dark dark:text-gray-300 mt-2">
                    +{analytics.users.new_last_30_days} in last 30 days
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                    Active Jobs
                  </h3>
                  <p className="text-3xl font-bold text-black dark:text-gray">
                    {analytics.jobs.by_status.open || 0}
                  </p>
                  <p className="text-xs text-gray-dark dark:text-gray-300 mt-2">
                    {analytics.jobs.total} total jobs
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                    Total Matches
                  </h3>
                  <p className="text-3xl font-bold text-black dark:text-gray">
                    {analytics.matches.total}
                  </p>
                  <p className="text-xs text-gray-dark dark:text-gray-300 mt-2">
                    Avg score: {analytics.matches.average_score.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                    Applications
                  </h3>
                  <p className="text-3xl font-bold text-black dark:text-gray">
                    {analytics.applications.total}
                  </p>
                  <p className="text-xs text-gray-dark dark:text-gray-300 mt-2">
                    +{analytics.applications.new_last_30_days} in last 30 days
                  </p>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Users Breakdown */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-gray mb-4">
                    Users by Type
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.users.by_type).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-dark dark:text-gray-300 capitalize">
                          {type}
                        </span>
                        <span className="text-sm font-medium text-black dark:text-gray">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jobs Breakdown */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-gray mb-4">
                    Jobs by Status
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.jobs.by_status).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-sm text-gray-dark dark:text-gray-300 capitalize">
                          {status}
                        </span>
                        <span className="text-sm font-medium text-black dark:text-gray">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Matches Breakdown */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-gray mb-4">
                    Matches by Status
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.matches.by_status).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-sm text-gray-dark dark:text-gray-300 capitalize">
                          {status}
                        </span>
                        <span className="text-sm font-medium text-black dark:text-gray">
                          {count}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-gray-300 dark:border-[#333333]">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-black dark:text-gray">
                          High Quality (≥80%)
                        </span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {analytics.matches.high_quality_matches}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Applications Breakdown */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-gray mb-4">
                    Applications by Status
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.applications.by_status).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-sm text-gray-dark dark:text-gray-300 capitalize">
                          {status.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-medium text-black dark:text-gray">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                <h3 className="text-lg font-semibold text-black dark:text-gray mb-4">
                  Recent Activity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                      Recent Users
                    </h4>
                    <div className="space-y-2">
                      {analytics.recent_activity.recent_users.slice(0, 5).map((user: any) => (
                        <div key={user.id} className="text-xs text-gray-dark dark:text-gray-300">
                          <span className="font-medium">{user.email}</span>
                          <span className="ml-2 capitalize">({user.user_type})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                      Recent Jobs
                    </h4>
                    <div className="space-y-2">
                      {analytics.recent_activity.recent_jobs.slice(0, 5).map((job: any) => (
                        <div key={job.id} className="text-xs text-gray-dark dark:text-gray-300">
                          <span className="font-medium">{job.role_title}</span>
                          <span className="ml-2 capitalize">({job.status})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                      Recent Applications
                    </h4>
                    <div className="space-y-2">
                      {analytics.recent_activity.recent_applications.slice(0, 5).map((app: any) => (
                        <div key={app.id} className="text-xs text-gray-dark dark:text-gray-300">
                          <span className="capitalize">{app.application_status.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleProtectedRoute>
  )
}

