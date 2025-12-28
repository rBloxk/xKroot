'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Job {
  id: string
  role_title: string
  role_level: string | null
  department: string | null
  work_type: string | null
  location: string | null
  salary_min: number | null
  salary_max: number | null
  job_description: string | null
  created_at: string
  company_profile: {
    company_name: string
    company_size: string | null
    industry: string | null
    startup_stage: string | null
    logo_url: string | null
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    role_level: '',
    work_type: '',
    department: '',
  })

  useEffect(() => {
    loadJobs()
  }, [filters])

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      let url = '/api/jobs?status=open'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        let filteredJobs = data.jobs || []
        
        // Apply client-side filters
        if (filters.role_level) {
          filteredJobs = filteredJobs.filter((job: Job) => job.role_level === filters.role_level)
        }
        if (filters.work_type) {
          filteredJobs = filteredJobs.filter((job: Job) => job.work_type === filters.work_type)
        }
        if (filters.department) {
          filteredJobs = filteredJobs.filter((job: Job) => job.department === filters.department)
        }
        
        setJobs(filteredJobs)
      } else {
        setError('Failed to load jobs')
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
      setError('Failed to load jobs')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            Opportunities
          </h1>
          <p className="text-gray-dark dark:text-gray-300">
            Find your next opportunity
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                Role Level
              </label>
              <select
                value={filters.role_level}
                onChange={(e) => setFilters({ ...filters, role_level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
              >
                <option value="">All Levels</option>
                <option value="intern">Intern</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid-level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="principal">Principal</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                Work Type
              </label>
              <select
                value={filters.work_type}
                onChange={(e) => setFilters({ ...filters, work_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
              >
                <option value="">All Types</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                placeholder="Filter by department..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
            <p className="text-gray-dark dark:text-gray-300">
              No open positions found. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 hover:border-black dark:hover:border-gray transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {job.company_profile.logo_url && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-300 dark:border-[#333333] flex-shrink-0">
                          <Image
                            src={job.company_profile.logo_url}
                            alt={job.company_profile.company_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-black dark:text-white">
                          {job.role_title}
                        </h3>
                        <p className="text-lg text-gray-dark dark:text-gray-300">
                          {job.company_profile.company_name}
                        </p>
                      </div>
                      {/* {job.role_level && (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 rounded capitalize">
                          {job.role_level}
                        </span>
                      )} */}
                    </div>
                    {job.job_description && (
                      <p className="text-sm text-gray-dark dark:text-gray-400 mt-3 line-clamp-3">
                        {job.job_description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-dark dark:text-gray-300 mt-3">
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
                      {job.company_profile.startup_stage && (
                        <span className="capitalize">🚀 {job.company_profile.startup_stage}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className="text-sm text-gray-dark dark:text-gray-300">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

