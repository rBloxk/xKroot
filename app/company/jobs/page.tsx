'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'

interface Job {
  id: string
  role_title: string
  role_level: string | null
  department: string | null
  status: string
  work_type: string | null
  location: string | null
  salary_min: number | null
  salary_max: number | null
  views_count: number
  applications_count: number
  created_at: string
  company_profile: {
    company_name: string
  }
}

export default function CompanyJobsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCompanyProfile()
  }, [])

  const loadCompanyProfile = async () => {
    try {
      const response = await fetch('/api/company/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.profile?.id) {
          setCompanyId(data.profile.id)
          loadJobs(data.profile.id)
        } else {
          setError('Please complete your company profile first')
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Failed to load profile')
      setIsLoading(false)
    }
  }

  const loadJobs = async (companyId: string) => {
    try {
      const response = await fetch(`/api/jobs?company_id=${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
      setError('Failed to load jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (companyId) loadJobs(companyId)
      } else {
        setError('Failed to delete job posting')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    }
  }

  if (isLoading) {
    return (
      <RoleProtectedRoute allowedRoles={['company']}>
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
    <RoleProtectedRoute allowedRoles={['company']}>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
                  Job Postings
                </h1>
                <p className="text-gray-dark dark:text-gray-300">
                  Manage your job postings and find the right candidates
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/company/dashboard"
                  className="px-4 py-2 text-sm font-medium text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10 rounded-lg transition-colors"
                >
                  ← Dashboard
                </Link>
                <Link
                  href="/company/jobs/new"
                  className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
                >
                  + New Job
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {!companyId ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <p className="text-gray-dark dark:text-gray-300 mb-4">
                Please complete your company profile first.
              </p>
              <Link
                href="/company/setup"
                className="inline-block px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
              >
                Complete Profile
              </Link>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <p className="text-gray-dark dark:text-gray-300 mb-4">
                No job postings yet. Create your first job posting to start finding candidates!
              </p>
              <Link
                href="/company/jobs/new"
                className="inline-block px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
              >
                Create Job Posting
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-black dark:text-gray">
                          {job.role_title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded capitalize ${
                          job.status === 'open' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                          job.status === 'draft' ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200' :
                          job.status === 'closed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                          job.status === 'filled' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-dark dark:text-gray-300 mb-4">
                        {job.role_level && (
                          <div>
                            <span className="font-medium text-black dark:text-gray">Level: </span>
                            <span className="capitalize">{job.role_level}</span>
                          </div>
                        )}
                        {job.department && (
                          <div>
                            <span className="font-medium text-black dark:text-gray">Department: </span>
                            <span>{job.department}</span>
                          </div>
                        )}
                        {job.work_type && (
                          <div>
                            <span className="font-medium text-black dark:text-gray">Work Type: </span>
                            <span className="capitalize">{job.work_type}</span>
                          </div>
                        )}
                        {job.location && (
                          <div>
                            <span className="font-medium text-black dark:text-gray">Location: </span>
                            <span>{job.location}</span>
                          </div>
                        )}
                        {(job.salary_min || job.salary_max) && (
                          <div>
                            <span className="font-medium text-black dark:text-gray">Salary: </span>
                            <span>
                              ${job.salary_min?.toLocaleString() || '0'} - ${job.salary_max?.toLocaleString() || '∞'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-dark dark:text-gray-300">
                        <span>👁️ {job.views_count} views</span>
                        <span>📄 {job.applications_count} applications</span>
                        <span>📅 {new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/company/jobs/${job.id}/edit`}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <Link
                        href={`/company/applications/${job.id}`}
                        className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                        title="View Applications"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </Link>
                      <Link
                        href={`/company/matches/${job.id}`}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="View Matches"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </Link>
                      <Link
                        href={`/jobs/${job.id}`}
                        target="_blank"
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="View Public Page"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleProtectedRoute>
  )
}

