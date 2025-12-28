'use client'

import { useState, useEffect } from 'react'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'
import AssessmentForm from '@/components/candidate/AssessmentForm'
import { AssessmentType } from '@/lib/assessments/types'

interface Assessment {
  id: string
  assessment_type: string
  score: number | null
  score_breakdown: any
  strengths: string[]
  areas_for_improvement: string[]
  recommendations: string[]
  assessment_date: string
  created_at: string
}

const ASSESSMENT_TYPES = [
  { value: 'technical', label: 'Technical Skills', description: 'Assess your technical capabilities and coding skills' },
  { value: 'cultural_fit', label: 'Cultural Fit', description: 'Evaluate how well you align with company cultures' },
  { value: 'communication', label: 'Communication', description: 'Test your communication and collaboration skills' },
  { value: 'problem_solving', label: 'Problem Solving', description: 'Assess your analytical and problem-solving abilities' },
  { value: 'leadership', label: 'Leadership', description: 'Evaluate your leadership and management potential' },
]

export default function CandidateAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [takingAssessment, setTakingAssessment] = useState<AssessmentType | null>(null)

  useEffect(() => {
    loadAssessments()
  }, [typeFilter])

  const loadAssessments = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      let url = '/api/assessments'
      if (typeFilter !== 'all') {
        url += `?assessment_type=${typeFilter}`
      }

      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setAssessments(data.assessments || [])
      } else {
        setError(data.error || 'Failed to load assessments')
        console.error('Error response:', data)
      }
    } catch (error: any) {
      console.error('Error loading assessments:', error)
      setError(error.message || 'Failed to load assessments')
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeLabel = (type: string) => {
    return ASSESSMENT_TYPES.find(t => t.value === type)?.label || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getTypeDescription = (type: string) => {
    return ASSESSMENT_TYPES.find(t => t.value === type)?.description || ''
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500 dark:text-gray-400'
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 dark:bg-gray-900/30'
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

  const handleAssessmentComplete = (assessmentId: string) => {
    setTakingAssessment(null)
    loadAssessments() // Reload to show new assessment
  }

  const handleAssessmentCancel = () => {
    setTakingAssessment(null)
  }

  // Show assessment form if taking an assessment
  if (takingAssessment) {
    return (
      <RoleProtectedRoute allowedRoles={['candidate']}>
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <button
                onClick={handleAssessmentCancel}
                className="text-sm text-gray-dark dark:text-gray-400 hover:text-black dark:hover:text-gray mb-4"
              >
                ← Back to Assessments
              </button>
            </div>
            <AssessmentForm
              assessmentType={takingAssessment}
              onComplete={handleAssessmentComplete}
              onCancel={handleAssessmentCancel}
            />
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
                  My Assessments
                </h1>
                <p className="text-gray-dark dark:text-gray-300">
                  View and manage your assessment results
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

          {/* Type Filter */}
          <div className="mb-6 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-4">
            <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-2">
              Filter by Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
            >
              <option value="all">All Types</option>
              {ASSESSMENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Available Assessments */}
          {typeFilter === 'all' && (
            <div className="mb-8 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
              <h2 className="text-xl font-semibold text-black dark:text-gray mb-2">
                Available Assessments
              </h2>
              <p className="text-sm text-gray-dark dark:text-gray-300 mb-4">
                Complete assessments to improve your match scores and showcase your skills to companies.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ASSESSMENT_TYPES.map(type => {
                  const hasAssessment = assessments.some(a => a.assessment_type === type.value)
                  const latestAssessment = assessments.find(a => a.assessment_type === type.value)
                  
                  return (
                    <div
                      key={type.value}
                      className="p-4 border border-gray-300 dark:border-[#333333] rounded-lg hover:border-black dark:hover:border-[#ffdf07] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-black dark:text-gray">
                          {type.label}
                        </h3>
                        {hasAssessment && latestAssessment?.score !== null && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            latestAssessment.score >= 80 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                              : latestAssessment.score >= 60
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                          }`}>
                            {latestAssessment.score}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-dark dark:text-gray-300 mb-4">
                        {type.description}
                      </p>
                      <button
                        onClick={() => setTakingAssessment(type.value as AssessmentType)}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
                      >
                        {hasAssessment ? 'Retake Assessment' : 'Take Assessment'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Assessment Results */}
          {assessments.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <p className="text-gray-dark dark:text-gray-300 mb-4">
                {typeFilter === 'all' 
                  ? "You haven't taken any assessments yet." 
                  : `No assessments of type "${getTypeLabel(typeFilter)}"`}
              </p>
              {typeFilter === 'all' && (
                <p className="text-sm text-gray-dark dark:text-gray-400">
                  Take an assessment above to get started!
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-semibold text-black dark:text-gray">
                          {getTypeLabel(assessment.assessment_type)}
                        </h3>
                        {assessment.score !== null && (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(assessment.score)} ${getScoreColor(assessment.score)}`}>
                            Score: {assessment.score}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-dark dark:text-gray-400 mb-4">
                        Taken on {new Date(assessment.assessment_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Strengths */}
                  {assessment.strengths && assessment.strengths.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-[#333333]">
                      <h4 className="text-sm font-semibold text-black dark:text-gray mb-2">
                        Strengths
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-dark dark:text-gray-300">
                        {assessment.strengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {assessment.areas_for_improvement && assessment.areas_for_improvement.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-[#333333]">
                      <h4 className="text-sm font-semibold text-black dark:text-gray mb-2">
                        Areas for Improvement
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-dark dark:text-gray-300">
                        {assessment.areas_for_improvement.map((area, idx) => (
                          <li key={idx}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {assessment.recommendations && assessment.recommendations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-[#333333]">
                      <h4 className="text-sm font-semibold text-black dark:text-gray mb-2">
                        Recommendations
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-dark dark:text-gray-300">
                        {assessment.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Score Breakdown */}
                  {assessment.score_breakdown && typeof assessment.score_breakdown === 'object' && (
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-[#333333]">
                      <h4 className="text-sm font-semibold text-black dark:text-gray mb-2">
                        Score Breakdown
                      </h4>
                      <div className="text-sm text-gray-dark dark:text-gray-300">
                        <pre className="whitespace-pre-wrap font-sans">
                          {JSON.stringify(assessment.score_breakdown, null, 2)}
                        </pre>
                      </div>
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

