'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'
import MatchFactorCard from '@/components/matching/MatchFactorCard'
import { sortFactorsByImportance, getMatchQualityDescription } from '@/lib/matching/factors'
import MMIExplanation from '@/components/matching/MMIExplanation'

interface MatchFactor {
  id: string
  factor_type: string
  factor_name: string
  factor_score: number
  factor_weight: number
  factor_explanation: string | null
  evidence?: any
}

interface Match {
  id: string
  match_score: number
  match_confidence: number
  match_reasoning: string | null
  skill_match_percentage: number | null
  cultural_fit_score: number | null
  match_status: string
  created_at: string
  candidate_profile: {
    id: string
    bio: string | null
    location: string | null
    current_position: string | null
    years_experience: number | null
    availability_status: string
  }
  match_factor: MatchFactor[]
}

export default function CompanyMatchesPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.jobId as string
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [job, setJob] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadJobAndMatches()
  }, [jobId])

  const loadJobAndMatches = async () => {
    try {
      // Load job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`)
      if (jobResponse.ok) {
        const jobData = await jobResponse.json()
        setJob(jobData.job)
      }

      // Load matches
      const matchesResponse = await fetch(`/api/matches/company?job_id=${jobId}`)
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json()
        setMatches(matchesData.matches || [])
      } else {
        setError('Failed to load matches')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateMatches = async () => {
    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/matches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Reload matches
        loadJobAndMatches()
      } else {
        setError(data.error || 'Failed to generate matches')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUpdateMatchStatus = async (matchId: string, status: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_status: status }),
      })

      if (response.ok) {
        loadJobAndMatches()
      } else {
        setError('Failed to update match status')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
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
                  Candidate Matches
                </h1>
                {job && (
                  <p className="text-gray-dark dark:text-gray-300">
                    For: {job.role_title} at {job.company_profile.company_name}
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
                <button
                  onClick={handleGenerateMatches}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Refresh Matches'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {!job ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <p className="text-gray-dark dark:text-gray-300">Job not found</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <p className="text-gray-dark dark:text-gray-300 mb-4">
                No matches found yet. Generate matches to find candidates!
              </p>
              <button
                onClick={handleGenerateMatches}
                disabled={isGenerating}
                className="px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Matches'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-semibold text-black dark:text-gray">
                          Candidate Profile
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreBgColor(match.match_score)} ${getScoreColor(match.match_score)}`}>
                          {match.match_score.toFixed(1)}% Match
                        </div>
                      </div>
                      {match.candidate_profile.current_position && (
                        <p className="text-lg text-gray-dark dark:text-gray-300 mb-2">
                          {match.candidate_profile.current_position}
                        </p>
                      )}
                      {match.candidate_profile.bio && (
                        <p className="text-sm text-gray-dark dark:text-gray-300 mb-3 line-clamp-2">
                          {match.candidate_profile.bio}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-dark dark:text-gray-300">
                        {match.candidate_profile.years_experience && (
                          <span>💼 {match.candidate_profile.years_experience} years experience</span>
                        )}
                        {match.candidate_profile.location && (
                          <span>📍 {match.candidate_profile.location}</span>
                        )}
                        <span className="capitalize">
                          Status: {match.candidate_profile.availability_status}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <select
                        value={match.match_status}
                        onChange={(e) => handleUpdateMatchStatus(match.id, e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07]"
                      >
                        <option value="pending">Pending</option>
                        <option value="presented">Presented</option>
                        <option value="viewed">Viewed</option>
                        <option value="interested">Interested</option>
                        <option value="applied">Applied</option>
                        <option value="rejected">Rejected</option>
                        <option value="hired">Hired</option>
                      </select>
                      <Link
                        href={`/candidate/profile/${match.candidate_profile.id}`}
                        className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors text-center"
                      >
                        View Profile →
                      </Link>
                    </div>
                  </div>

                  {/* Confidence Badge */}
                  {match.match_confidence !== undefined && match.match_confidence !== null && (
                    <div className="mt-4">
                      <MMIExplanation 
                        matchScore={match.match_score}
                        matchConfidence={match.match_confidence}
                      />
                    </div>
                  )}

                  {/* Match Quality */}
                  {(() => {
                    const quality = getMatchQualityDescription(match.match_score)
                    return (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-black dark:text-gray">
                            Match Quality:
                          </span>
                          <span className={`text-sm font-medium ${
                            quality.color === 'green' 
                              ? 'text-green-700 dark:text-green-300'
                              : quality.color === 'yellow'
                              ? 'text-yellow-700 dark:text-yellow-300'
                              : 'text-red-700 dark:text-red-300'
                          }`}>
                            {quality.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-dark dark:text-gray-300">
                          {quality.description}
                        </p>
                      </div>
                    )
                  })()}

                  {/* Match Breakdown */}
                  {match.match_factor && match.match_factor.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-300 dark:border-[#333333]">
                      <h4 className="text-sm font-semibold text-black dark:text-gray mb-3">
                        Why This Match?
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sortFactorsByImportance(match.match_factor).map((factor) => (
                          <MatchFactorCard
                            key={factor.id}
                            factor={factor}
                            showDetails={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Reasoning */}
                  {match.match_reasoning && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                        AI Insights
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {match.match_reasoning}
                      </p>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-dark dark:text-gray-300">
                    {match.skill_match_percentage && (
                      <span>
                        Skill Match: {match.skill_match_percentage.toFixed(1)}%
                      </span>
                    )}
                    {match.cultural_fit_score && (
                      <span>
                        Cultural Fit: {match.cultural_fit_score.toFixed(1)}%
                      </span>
                    )}
                    <span>
                      Confidence: {(match.match_confidence * 100).toFixed(0)}%
                    </span>
                    <span>
                      Matched: {new Date(match.created_at).toLocaleDateString()}
                    </span>
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

