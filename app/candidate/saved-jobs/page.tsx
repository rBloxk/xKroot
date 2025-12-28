'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'
import Image from 'next/image'

interface SavedJob {
  id: string
  saved_at: string
  role_requirement: {
    id: string
    role_title: string
    role_level: string | null
    department: string | null
    work_type: string | null
    location: string | null
    salary_min: number | null
    salary_max: number | null
    job_description: string | null
    status: string
    application_deadline: string | null
    created_at: string
    company_profile: {
      id: string
      company_name: string
      company_size: string | null
      industry: string | null
      location: string | null
      logo_url: string | null
    }
  }
}

export default function SavedJobsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingJobId, setRemovingJobId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    } else if (!authLoading && user?.user_type !== 'candidate') {
      router.push('/')
    } else if (user?.user_type === 'candidate') {
      loadSavedJobs()
    }
  }, [authLoading, user, router])

  const loadSavedJobs = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await fetch('/api/candidate/saved-jobs')
      const data = await response.json()
      
      if (response.ok) {
        setSavedJobs(data.savedJobs || [])
      } else {
        setError(data.error || 'Failed to load saved jobs')
      }
    } catch (error: any) {
      console.error('Error loading saved jobs:', error)
      setError(error.message || 'Failed to load saved jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveSavedJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to remove this job from your saved jobs?')) {
      return
    }

    try {
      setRemovingJobId(jobId)
      const response = await fetch(`/api/candidate/saved-jobs?job_id=${jobId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        // Remove from local state
        setSavedJobs(savedJobs.filter(savedJob => savedJob.role_requirement.id !== jobId))
      } else {
        alert(data.error || 'Failed to remove saved job')
      }
    } catch (error: any) {
      console.error('Error removing saved job:', error)
      alert(error.message || 'Failed to remove saved job')
    } finally {
      setRemovingJobId(null)
    }
  }

  if (authLoading || isLoading) {
    return (
      <RoleProtectedRoute allowedRoles={['candidate']}>
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
    <RoleProtectedRoute allowedRoles={['candidate']}>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                  Saved Jobs
                </h1>
                <p className="text-gray-dark dark:text-gray-300">
                  Jobs you've saved for later
                </p>
              </div>
              <Link
                href="/candidate/dashboard"
                className="px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-white/10 dark:hover:bg-gray-dark/10 rounded-lg transition-colors"
              >
                ← Dashboard
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {savedJobs.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p className="text-gray-dark dark:text-gray-300 mb-4 text-lg">
                You haven't saved any jobs yet.
              </p>
              <p className="text-gray-dark dark:text-gray-400 mb-6">
                Browse available jobs and save the ones you're interested in.
              </p>
              <Link
                href="/jobs"
                className="inline-block px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {savedJobs.map((savedJob) => {
                const job = savedJob.role_requirement
                const company = job.company_profile
                
                return (
                  <div
                    key={savedJob.id}
                    className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {company.logo_url && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-300 dark:border-[#333333] flex-shrink-0">
                              <Image
                                src={company.logo_url}
                                alt={company.company_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-2xl font-semibold text-black dark:text-white">
                              {job.role_title}
                            </h3>
                            <p className="text-lg text-gray-dark dark:text-gray-300">
                              {company.company_name}
                            </p>
                          </div>
                          {job.role_level && (
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 rounded capitalize">
                              {job.role_level}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-dark dark:text-gray-300 mt-3">
                          {job.work_type && (
                            <span className="capitalize">💼 {job.work_type}</span>
                          )}
                          {job.location && (
                            <span>📍 {job.location}</span>
                          )}
                          {(job.salary_min || job.salary_max) && (
                            <span>
                              💰 ${job.salary_min?.toLocaleString() || '0'} - ${job.salary_max?.toLocaleString() || '∞'}
                            </span>
                          )}
                          {job.department && (
                            <span>🏢 {job.department}</span>
                          )}
                        </div>
                        {job.job_description && (
                          <p className="text-sm text-gray-dark dark:text-gray-400 mt-3 line-clamp-2">
                            {job.job_description}
                          </p>
                        )}
                        <p className="text-xs text-gray-dark dark:text-gray-400 mt-3">
                          Saved on {new Date(savedJob.saved_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-300 dark:border-[#333333]">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
                      >
                        View Details →
                      </Link>
                      <Link
                        href={`/jobs/${job.id}/apply`}
                        className="px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors border border-gray-300 dark:border-[#333333]"
                      >
                        Apply Now
                      </Link>
                      <button
                        onClick={() => handleRemoveSavedJob(job.id)}
                        disabled={removingJobId === job.id}
                        className="ml-auto px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {removingJobId === job.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </RoleProtectedRoute>
  )
}

