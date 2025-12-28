'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  candidate_profile: {
    id: string
    bio: string | null
    location: string | null
    current_position: string | null
    years_experience: number | null
  }
  role_requirement: {
    id: string
    role_title: string
    company_profile: {
      company_name: string
    }
  }
}

export default function CompanyApplicationsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.jobId as string
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [job, setJob] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadJobAndApplications()
  }, [jobId, statusFilter])

  const loadJobAndApplications = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // Load job
      const jobResponse = await fetch(`/api/jobs/${jobId}`, {
        credentials: 'include',
      })
      if (jobResponse.ok) {
        const jobData = await jobResponse.json()
        setJob(jobData.job)
      } else {
        const errorData = await jobResponse.json().catch(() => ({}))
        console.error('Error loading job:', errorData)
      }

      // Load applications
      let url = `/api/applications?job_id=${jobId}`
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`
      }

      const applicationsResponse = await fetch(url, {
        credentials: 'include',
      })
      
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json()
        setApplications(applicationsData.applications || [])
      } else {
        const errorData = await applicationsResponse.json().catch(() => ({}))
        console.error('Error loading applications:', {
          status: applicationsResponse.status,
          statusText: applicationsResponse.statusText,
          error: errorData,
        })
        
        if (applicationsResponse.status === 401) {
          setError('Please log in to view applications')
        } else if (applicationsResponse.status === 403) {
          setError(errorData.error || 'You do not have permission to view applications for this job')
        } else if (applicationsResponse.status === 404) {
          setError('Job not found')
        } else {
          setError(errorData.error || 'Failed to load applications')
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ application_status: newStatus }),
      })

      if (response.ok) {
        loadJobAndApplications()
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to update application status')
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
                  Applications
                </h1>
                {job && (
                  <p className="text-gray-dark dark:text-gray-300">
                    For: {job.role_title}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Link
                  href="/company/jobs"
                  className="px-4 py-2 text-sm font-medium text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10 rounded-lg transition-colors"
                >
                  ← Back to Jobs
                </Link>
              </div>
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
              <option value="interview_completed">Interview Completed</option>
              <option value="offer_extended">Offer Extended</option>
              <option value="offer_accepted">Offer Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <p className="text-gray-dark dark:text-gray-300">
                {statusFilter === 'all' 
                  ? 'No applications yet. Check back later!' 
                  : `No applications with status "${statusFilter}"`}
              </p>
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
                        <h3 className="text-xl font-semibold text-black dark:text-gray">
                          {application.candidate_profile.current_position || 'Candidate'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(application.application_status)}`}>
                          {application.application_status.replace('_', ' ')}
                        </span>
                      </div>
                      {application.candidate_profile.bio && (
                        <p className="text-sm text-gray-dark dark:text-gray-300 mb-3 line-clamp-2">
                          {application.candidate_profile.bio}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-dark dark:text-gray-300">
                        {application.candidate_profile.years_experience && (
                          <span>💼 {application.candidate_profile.years_experience} years experience</span>
                        )}
                        {application.candidate_profile.location && (
                          <span>📍 {application.candidate_profile.location}</span>
                        )}
                        <span>📅 Applied {new Date(application.submitted_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <select
                        value={application.application_status}
                        onChange={(e) => handleUpdateStatus(application.id, e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07]"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview_scheduled">Interview Scheduled</option>
                        <option value="interview_completed">Interview Completed</option>
                        <option value="offer_extended">Offer Extended</option>
                        <option value="offer_accepted">Offer Accepted</option>
                        <option value="offer_declined">Offer Declined</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <Link
                        href={`/candidate/profile/${application.candidate_profile.id}`}
                        className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors text-center"
                      >
                        View Profile →
                      </Link>
                    </div>
                  </div>

                  {/* Application Details */}
                  {application.cover_letter && (
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-[#333333]">
                      <h4 className="text-sm font-semibold text-black dark:text-gray mb-2">
                        Cover Letter
                      </h4>
                      <p className="text-sm text-gray-dark dark:text-gray-300 whitespace-pre-wrap">
                        {application.cover_letter}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-4">
                    {application.resume_url && (
                      <a
                        href={application.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        📄 View Resume →
                      </a>
                    )}
                    {application.portfolio_url && (
                      <a
                        href={application.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        🎨 View Portfolio →
                      </a>
                    )}
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

