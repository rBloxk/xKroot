'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface Job {
  id: string
  role_title: string
  role_level: string | null
  department: string | null
  job_description: string
  required_skills: any
  preferred_qualifications: string[]
  responsibilities: string[]
  work_type: string | null
  location: string | null
  salary_min: number | null
  salary_max: number | null
  equity_offered: boolean
  benefits: string[]
  application_deadline: string | null
  created_at: string
  company_profile: {
    id: string
    company_name: string
    company_size: string | null
    industry: string | null
    description: string | null
    website_url: string | null
    location: string | null
    startup_stage: string | null
    company_culture: any
  }
}

export default function JobDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const jobId = params.id as string
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCheckingSaved, setIsCheckingSaved] = useState(true)
  const [hasApplied, setHasApplied] = useState(false)
  const [isCheckingApplied, setIsCheckingApplied] = useState(true)

  useEffect(() => {
    loadJob()
    if (user?.user_type === 'candidate') {
      checkIfSaved()
      checkIfApplied()
    } else {
      setIsCheckingSaved(false)
      setIsCheckingApplied(false)
    }
  }, [jobId, user])

  const loadJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      if (response.ok) {
        const data = await response.json()
        setJob(data.job)
      } else {
        setError('Job not found')
      }
    } catch (error) {
      console.error('Error loading job:', error)
      setError('Failed to load job')
    } finally {
      setIsLoading(false)
    }
  }

  const checkIfSaved = async () => {
    try {
      setIsCheckingSaved(true)
      const response = await fetch('/api/candidate/saved-jobs')
      if (response.ok) {
        const data = await response.json()
        const savedJobIds = (data.savedJobs || []).map((sj: any) => sj.role_requirement?.id || sj.role_requirement_id)
        setIsSaved(savedJobIds.includes(jobId))
      }
    } catch (error) {
      console.error('Error checking if saved:', error)
    } finally {
      setIsCheckingSaved(false)
    }
  }

  const checkIfApplied = async () => {
    try {
      setIsCheckingApplied(true)
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        const appliedJobIds = (data.applications || []).map((app: any) => app.role_requirement?.id || app.role_requirement_id)
        setHasApplied(appliedJobIds.includes(jobId))
      }
    } catch (error) {
      console.error('Error checking if applied:', error)
    } finally {
      setIsCheckingApplied(false)
    }
  }

  const handleSaveJob = async () => {
    if (!user || user.user_type !== 'candidate') {
      const shouldLogin = window.confirm('Please log in as a candidate to save jobs. Would you like to go to the login page?')
      if (shouldLogin) {
        window.location.href = '/login'
      }
      return
    }

    try {
      setIsSaving(true)
      
      if (isSaved) {
        // Unsave the job
        const response = await fetch(`/api/candidate/saved-jobs?job_id=${jobId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setIsSaved(false)
        } else {
          const data = await response.json()
          alert(data.error || 'Failed to remove saved job')
        }
      } else {
        // Save the job
        const response = await fetch('/api/candidate/saved-jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ job_id: jobId }),
        })

        if (response.ok) {
          setIsSaved(true)
        } else {
          const data = await response.json()
          if (data.error === 'Job is already saved') {
            setIsSaved(true)
          } else {
            alert(data.error || 'Failed to save job')
          }
        }
      }
    } catch (error: any) {
      console.error('Error saving job:', error)
      alert(error.message || 'Failed to save job')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-black dark:text-gray mb-4">Job Not Found</h1>
          <p className="text-gray-dark dark:text-gray-300 mb-6">{error || 'The job you are looking for does not exist.'}</p>
          <Link
            href="/jobs"
            className="inline-block px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
          >
            Browse All Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/jobs"
            className="text-sm text-gray-dark dark:text-gray-300 hover:text-black dark:hover:text-gray transition-colors"
          >
            ← Back to All Jobs
          </Link>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
              {job.role_title}
            </h1>
            <p className="text-xl text-gray-dark dark:text-gray-300 mb-4">
              {job.company_profile.company_name}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-dark dark:text-gray-300">
              {job.role_level && (
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-900/30 rounded capitalize">
                  {job.role_level}
                </span>
              )}
              {job.department && (
                <span>📍 {job.department}</span>
              )}
              {job.work_type && (
                <span className="capitalize">💼 {job.work_type}</span>
              )}
              {job.location && (
                <span>🌍 {job.location}</span>
              )}
              {(job.salary_min || job.salary_max) && (
                <span>
                  💰 ${job.salary_min?.toLocaleString() || '0'} - ${job.salary_max?.toLocaleString() || '∞'}
                </span>
              )}
            </div>
          </div>

          {/* Company Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
            <h3 className="text-lg font-semibold text-black dark:text-gray mb-2">About the Company</h3>
            <div className="space-y-2 text-sm text-gray-dark dark:text-gray-300">
              {job.company_profile.industry && (
                <div>
                  <span className="font-medium text-black dark:text-gray">Industry: </span>
                  {job.company_profile.industry}
                </div>
              )}
              {job.company_profile.company_size && (
                <div>
                  <span className="font-medium text-black dark:text-gray">Size: </span>
                  <span className="capitalize">{job.company_profile.company_size}</span>
                </div>
              )}
              {job.company_profile.startup_stage && (
                <div>
                  <span className="font-medium text-black dark:text-gray">Stage: </span>
                  <span className="capitalize">{job.company_profile.startup_stage}</span>
                </div>
              )}
              {job.company_profile.description && (
                <p className="mt-2">{job.company_profile.description}</p>
              )}
              {job.company_profile.website_url && (
                <div>
                  <a
                    href={job.company_profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Visit Company Website →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-black dark:text-gray mb-3">Job Description</h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-dark dark:text-gray-300 whitespace-pre-wrap">
                {job.job_description}
              </p>
            </div>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black dark:text-gray mb-3">Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-dark dark:text-gray-300">
                {job.responsibilities.map((resp, index) => (
                  <li key={index}>{resp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Required Skills */}
          {job.required_skills && Object.keys(job.required_skills).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black dark:text-gray mb-3">Required Skills</h3>
              <div className="space-y-3">
                {Object.entries(job.required_skills).map(([category, skills]: [string, any]) => (
                  <div key={category}>
                    <h4 className="font-medium text-black dark:text-gray capitalize mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(skills) && skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 rounded text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Qualifications */}
          {job.preferred_qualifications && job.preferred_qualifications.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black dark:text-gray mb-3">Preferred Qualifications</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-dark dark:text-gray-300">
                {job.preferred_qualifications.map((qual, index) => (
                  <li key={index}>{qual}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-black dark:text-gray mb-3">Benefits</h3>
              <div className="flex flex-wrap gap-2">
                {job.benefits.map((benefit, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-sm"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {job.equity_offered && (
                <div>
                  <span className="font-medium text-black dark:text-gray">Equity: </span>
                  <span className="text-gray-dark dark:text-gray-300">Yes</span>
                </div>
              )}
              {job.application_deadline && (
                <div>
                  <span className="font-medium text-black dark:text-gray">Application Deadline: </span>
                  <span className="text-gray-dark dark:text-gray-300">
                    {new Date(job.application_deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium text-black dark:text-gray">Posted: </span>
                <span className="text-gray-dark dark:text-gray-300">
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-6 border-t border-gray-300 dark:border-[#333333]">
            <div className="flex gap-4">
              {hasApplied ? (
                <div className="flex-1 px-6 py-3 text-sm font-medium text-white bg-green-600 dark:bg-green-700 rounded-lg text-center flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Applied
                </div>
              ) : (
                <Link
                  href={`/jobs/${job.id}/apply`}
                  className="flex-1 px-6 py-3 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors text-center"
                >
                  Apply Now
                </Link>
              )}
              {user?.user_type === 'candidate' && (
                <button
                  onClick={handleSaveJob}
                  disabled={isSaving || isCheckingSaved}
                  className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    isSaved
                      ? 'text-white bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800'
                      : 'text-black dark:text-gray bg-white dark:bg-gray-dark/30 hover:bg-gray-50 dark:hover:bg-gray-dark/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isSaved ? 'Removing...' : 'Saving...'}
                    </>
                  ) : isSaved ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" clipRule="evenodd" />
                      </svg>
                      Saved
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Save Job
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

