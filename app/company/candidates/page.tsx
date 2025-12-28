'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Candidate {
  id: string
  bio: string | null
  location: string | null
  current_position: string | null
  years_experience: number | null
  education_level: string | null
  availability_status: string
  preferred_work_type: string | null
  preferred_location: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  profile_completeness: number
  avatar_url: string | null
  users: {
    id: string
    full_name: string | null
    email: string
  }
}

export default function CompanyCandidatesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [candidateFilters, setCandidateFilters] = useState({
    availability_status: '',
    location: '',
    work_type: '',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    } else if (!authLoading && user?.user_type !== 'company') {
      router.push('/')
    } else if (!authLoading && user?.user_type === 'company') {
      loadCandidates()
    }
  }, [authLoading, user, router, candidateFilters])

  const loadCandidates = async () => {
    try {
      setIsLoading(true)
      setError('')
      let url = '/api/candidates'
      const params = new URLSearchParams()
      
      if (candidateFilters.availability_status) {
        params.append('availability_status', candidateFilters.availability_status)
      }
      if (candidateFilters.location) {
        params.append('location', candidateFilters.location)
      }
      if (candidateFilters.work_type) {
        params.append('work_type', candidateFilters.work_type)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.candidates || [])
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to load candidates')
      }
    } catch (error) {
      console.error('Error loading candidates:', error)
      setError('Failed to load candidates')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || !user || user.user_type !== 'company') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading candidates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            Available Candidates
          </h1>
          <p className="text-gray-dark dark:text-gray-300">
            Discover talented professionals open to opportunities
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                Availability Status
              </label>
              <select
                value={candidateFilters.availability_status}
                onChange={(e) => setCandidateFilters({ ...candidateFilters, availability_status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="open">Open to Opportunities</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={candidateFilters.location}
                onChange={(e) => setCandidateFilters({ ...candidateFilters, location: e.target.value })}
                placeholder="Filter by location..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                Preferred Work Type
              </label>
              <select
                value={candidateFilters.work_type}
                onChange={(e) => setCandidateFilters({ ...candidateFilters, work_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
              >
                <option value="">All Types</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {candidates.length === 0 ? (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
            <p className="text-gray-dark dark:text-gray-300">
              No available candidates found. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 hover:border-black dark:hover:border-gray transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 dark:border-[#333333] bg-gray-100 dark:bg-[#252525] flex-shrink-0">
                    {candidate.avatar_url ? (
                      <Image
                        src={candidate.avatar_url}
                        alt={candidate.users.full_name || 'Candidate'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Candidate Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-black dark:text-white">
                        {candidate.users.full_name || candidate.users.email}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded capitalize ${
                        candidate.availability_status === 'available'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                      }`}>
                        {candidate.availability_status === 'available' ? 'Available' : 'Open to Opportunities'}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 rounded">
                        {candidate.profile_completeness}% Complete
                      </span>
                    </div>
                    
                    {candidate.current_position && (
                      <p className="text-lg text-gray-dark dark:text-gray-300 mb-2">
                        {candidate.current_position}
                      </p>
                    )}
                    
                    {candidate.bio && (
                      <p className="text-sm text-gray-dark dark:text-gray-400 mb-3 line-clamp-2">
                        {candidate.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-dark dark:text-gray-300">
                      {candidate.location && (
                        <span>📍 {candidate.location}</span>
                      )}
                      {candidate.years_experience !== null && (
                        <span>💼 {candidate.years_experience} years experience</span>
                      )}
                      {candidate.preferred_work_type && (
                        <span className="capitalize">🏠 {candidate.preferred_work_type}</span>
                      )}
                      {candidate.education_level && (
                        <span>🎓 {candidate.education_level}</span>
                      )}
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-3 mt-3">
                      {candidate.linkedin_url && (
                        <a
                          href={candidate.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          LinkedIn →
                        </a>
                      )}
                      {candidate.github_url && (
                        <a
                          href={candidate.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 dark:text-gray-400 hover:underline text-sm"
                        >
                          GitHub →
                        </a>
                      )}
                      {candidate.portfolio_url && (
                        <a
                          href={candidate.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 dark:text-purple-400 hover:underline text-sm"
                        >
                          Portfolio →
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    <Link
                      href={`/candidate/profile/${candidate.id}`}
                      className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

