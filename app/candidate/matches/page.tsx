'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'
import MatchFactorCard from '@/components/matching/MatchFactorCard'
import { sortFactorsByImportance, getMatchQualityDescription } from '@/lib/matching/factors'
import MMIExplanation from '@/components/matching/MMIExplanation'
import { getConfidenceDisplay, getConfidenceBadgeClasses } from '@/lib/ai/confidence/calculator'

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
  role_requirement: {
    id: string
    role_title: string
    role_level: string | null
    department: string | null
    work_type: string | null
    location: string | null
    salary_min: number | null
    salary_max: number | null
    company_profile: {
      id: string
      company_name: string
      company_size: string | null
      industry: string | null
      startup_stage: string | null
    }
  }
  match_factor: MatchFactor[]
}

export default function CandidateMatchesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [candidateId, setCandidateId] = useState<string | null>(null)

  useEffect(() => {
    loadCandidateProfile()
  }, [])

  const loadCandidateProfile = async () => {
    try {
      const response = await fetch('/api/candidate/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.profile?.id) {
          setCandidateId(data.profile.id)
          loadMatches(data.profile.id)
        } else {
          setError('Please complete your profile first')
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Failed to load profile')
      setIsLoading(false)
    }
  }

  const loadMatches = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/matches/candidate?candidate_id=${candidateId}`)
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
      } else {
        setError('Failed to load matches')
      }
    } catch (error) {
      console.error('Error loading matches:', error)
      setError('Failed to load matches')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateMatches = async () => {
    if (!candidateId) return

    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/matches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Reload matches
        if (candidateId) loadMatches(candidateId)
      } else {
        setError(data.error || 'Failed to generate matches')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    } finally {
      setIsGenerating(false)
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
                  Your Job Matches
                </h1>
                <p className="text-gray-dark dark:text-gray-300">
                  Discover opportunities that match your profile
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/candidate/dashboard"
                  className="px-4 py-2 text-sm font-medium text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10 rounded-lg transition-colors"
                >
                  ← Dashboard
                </Link>
                <button
                  onClick={handleGenerateMatches}
                  disabled={isGenerating || !candidateId}
                  className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate Matches'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {!candidateId ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <p className="text-gray-dark dark:text-gray-300 mb-4">
                Please complete your profile first to see matches.
              </p>
              <Link
                href="/candidate/setup"
                className="inline-block px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
              >
                Complete Profile
              </Link>
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <p className="text-gray-dark dark:text-gray-300 mb-4">
                No matches found yet. Generate matches to discover opportunities!
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
                          {match.role_requirement.role_title}
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreBgColor(match.match_score)} ${getScoreColor(match.match_score)}`}>
                          {match.match_score.toFixed(1)}% Match
                        </div>
                      </div>
                      <p className="text-lg text-gray-dark dark:text-gray-300 mb-3">
                        {match.role_requirement.company_profile.company_name}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-dark dark:text-gray-300">
                        {match.role_requirement.role_level && (
                          <span className="capitalize">Level: {match.role_requirement.role_level}</span>
                        )}
                        {match.role_requirement.department && (
                          <span>📍 {match.role_requirement.department}</span>
                        )}
                        {match.role_requirement.work_type && (
                          <span className="capitalize">💼 {match.role_requirement.work_type}</span>
                        )}
                        {match.role_requirement.location && (
                          <span>🌍 {match.role_requirement.location}</span>
                        )}
                        {(match.role_requirement.salary_min || match.role_requirement.salary_max) && (
                          <span>
                            💰 ${match.role_requirement.salary_min?.toLocaleString() || '0'} - ${match.role_requirement.salary_max?.toLocaleString() || '∞'}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/jobs/${match.role_requirement.id}`}
                      className="ml-4 px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
                    >
                      View Job →
                    </Link>
                  </div>

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

                  {/* Match Status */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-gray-dark dark:text-gray-300">
                      Status: <span className="capitalize font-medium">{match.match_status}</span>
                    </span>
                    {match.cultural_fit_score && (
                      <span className="text-xs text-gray-dark dark:text-gray-300">
                        • Cultural Fit: {match.cultural_fit_score.toFixed(1)}%
                      </span>
                    )}
                    <span className="text-xs text-gray-dark dark:text-gray-300">
                      • Confidence: {(match.match_confidence * 100).toFixed(0)}%
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

