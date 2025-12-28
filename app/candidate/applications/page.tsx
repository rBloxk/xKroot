'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'

interface Application {
  id: string
  cover_letter: string | null
  resume_url: string | null
  portfolio_url: string | null
  application_status: string
  submitted_at: string
  role_requirement: {
    id: string
    role_title: string
    role_level: string | null
    department: string | null
    work_type: string | null
    location: string | null
    company_profile: {
      id: string
      company_name: string
    }
  }
}

export default function CandidateApplicationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadApplications()
  }, [statusFilter])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      let url = '/api/applications'
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`
      }

      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setApplications(data.applications || [])
      } else {
        setError(data.error || 'Failed to load applications')
        console.error('Error response:', data)
      }
    } catch (error: any) {
      console.error('Error loading applications:', error)
      setError(error.message || 'Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadApplications()
      } else {
        setError('Failed to withdraw application')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200',
      under_review: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      shortlisted: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      interview_scheduled: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
      interview_completed: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
      offer_extended: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      offer_accepted: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      offer_declined: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
      withdrawn: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200',
    }
    return colors[status] || colors.submitted
  }

  if (isLoading) {
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
                <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
                  My Applications
                </h1>
                <p className="text-gray-dark dark:text-gray-300">
                  Track your job applications
                </p>
              </div>
              <Link
                href="/candidate/dashboard"
                className="px-4 py-2 text-sm font-medium text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10 rounded-lg transition-colors"
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

          {/* Status Filter */}
          <div className="mb-6 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-4">
            <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="offer_extended">Offer Extended</option>
              <option value="offer_accepted">Offer Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <p className="text-gray-dark dark:text-gray-300 mb-4">
                {statusFilter === 'all' 
                  ? "You haven't applied to any jobs yet." 
                  : `No applications with status "${statusFilter}"`}
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
              {applications.map((application) => (
                <div
                  key={application.id}
                  className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-semibold text-black dark:text-gray">
                          {application.role_requirement.role_title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(application.application_status)}`}>
                          {application.application_status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-lg text-gray-dark dark:text-gray-300 mb-3">
                        {application.role_requirement.company_profile.company_name}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-dark dark:text-gray-300">
                        {application.role_requirement.role_level && (
                          <span className="capitalize">Level: {application.role_requirement.role_level}</span>
                        )}
                        {application.role_requirement.department && (
                          <span>📍 {application.role_requirement.department}</span>
                        )}
                        {application.role_requirement.work_type && (
                          <span className="capitalize">💼 {application.role_requirement.work_type}</span>
                        )}
                        {application.role_requirement.location && (
                          <span>🌍 {application.role_requirement.location}</span>
                        )}
                        <span>📅 Applied {new Date(application.submitted_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <Link
                        href={`/jobs/${application.role_requirement.id}`}
                        className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors text-center"
                      >
                        View Job →
                      </Link>
                      {(application.application_status === 'submitted' || application.application_status === 'under_review') && (
                        <button
                          onClick={() => handleWithdraw(application.id)}
                          className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cover Letter Preview */}
                  {application.cover_letter && (
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-[#333333]">
                      <h4 className="text-sm font-semibold text-black dark:text-gray mb-2">
                        Your Cover Letter
                      </h4>
                      <p className="text-sm text-gray-dark dark:text-gray-300 line-clamp-3">
                        {application.cover_letter}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleProtectedRoute>
  )
}

