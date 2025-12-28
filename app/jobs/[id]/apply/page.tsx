'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function ApplyPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  const { user, authenticated } = useAuth()
  const [job, setJob] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    cover_letter: '',
    resume_url: '',
    portfolio_url: '',
  })

  useEffect(() => {
    if (!authenticated) {
      router.push(`/login?redirect_to=/jobs/${jobId}/apply`)
      return
    }

    loadJob()
  }, [authenticated, jobId, router])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          ...formData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/candidate/applications')
        }, 2000)
      } else {
        setError(data.error || 'Failed to submit application')
        setIsSubmitting(false)
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null // Will redirect
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="max-w-md w-full text-center">
          <div className="text-green-600 dark:text-green-400 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-black dark:text-gray mb-2">
            Application Submitted!
          </h2>
          <p className="text-gray-dark dark:text-gray-300 mb-4">
            Your application has been successfully submitted.
          </p>
          <p className="text-sm text-gray-dark dark:text-gray-300">
            Redirecting to your applications...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/jobs/${jobId}`}
            className="text-sm text-gray-dark dark:text-gray-300 hover:text-black dark:hover:text-gray transition-colors"
          >
            ← Back to Job
          </Link>
        </div>

        {job && (
          <div className="mb-6 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
            <h2 className="text-2xl font-bold text-black dark:text-gray mb-2">
              {job.role_title}
            </h2>
            <p className="text-lg text-gray-dark dark:text-gray-300">
              {job.company_profile.company_name}
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8">
          <h1 className="text-2xl font-bold text-black dark:text-gray mb-6">
            Submit Application
          </h1>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                Cover Letter
              </label>
              <textarea
                value={formData.cover_letter}
                onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                rows={8}
                placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                Resume URL (Optional)
              </label>
              <input
                type="url"
                value={formData.resume_url}
                onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                placeholder="https://your-resume.com/resume.pdf"
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
              />
              <p className="mt-1 text-xs text-gray-dark dark:text-gray-300">
                Link to your resume or upload it to a file sharing service
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
                Portfolio URL (Optional)
              </label>
              <input
                type="url"
                value={formData.portfolio_url}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                placeholder="https://yourportfolio.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link
                href={`/jobs/${jobId}`}
                className="px-6 py-2 text-sm font-medium text-black dark:text-gray bg-white dark:bg-gray-dark/30 hover:bg-gray-50 dark:hover:bg-gray-dark/50 rounded-lg transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

