'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'

interface Skill {
  id: string
  skill_name: string
  skill_category: string | null
  proficiency_level: string
  years_experience: number | null
  verified: boolean
  source: string
  created_at: string
}

export default function CandidateSkillsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    skill_category: '',
    proficiency_level: 'intermediate',
    years_experience: '',
  })

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
          loadSkills(data.profile.id)
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

  const loadSkills = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/candidate/skills?candidate_id=${candidateId}`)
      if (response.ok) {
        const data = await response.json()
        setSkills(data.skills || [])
      }
    } catch (error) {
      console.error('Error loading skills:', error)
      setError('Failed to load skills')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!candidateId || !newSkill.skill_name) return

    try {
      const response = await fetch('/api/candidate/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidateId,
          ...newSkill,
        }),
      })

      if (response.ok) {
        setNewSkill({
          skill_name: '',
          skill_category: '',
          proficiency_level: 'intermediate',
          years_experience: '',
        })
        setShowAddForm(false)
        if (candidateId) loadSkills(candidateId)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add skill')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to remove this skill?')) return

    try {
      const response = await fetch(`/api/candidate/skills/${skillId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (candidateId) loadSkills(candidateId)
      } else {
        setError('Failed to delete skill')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    }
  }

  const handleUpdateProficiency = async (skillId: string, proficiency: string) => {
    try {
      const response = await fetch(`/api/candidate/skills/${skillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proficiency_level: proficiency }),
      })

      if (response.ok) {
        if (candidateId) loadSkills(candidateId)
      } else {
        setError('Failed to update skill')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    }
  }

  if (isLoading) {
    return (
      <RoleProtectedRoute allowedRoles={['candidate']}>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
            <p className="mt-4 text-gray-dark dark:text-gray-dark">Loading...</p>
          </div>
        </div>
      </RoleProtectedRoute>
    )
  }

  return (
    <RoleProtectedRoute allowedRoles={['candidate']}>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
                  My Skills
                </h1>
                <p className="text-gray-dark dark:text-gray-dark">
                  Manage your skills and proficiency levels
                </p>
              </div>
              <Link
                href="/candidate/dashboard"
                className="px-4 py-2 text-sm font-medium text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10 rounded-lg transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {!candidateId ? (
            <div className="bg-white dark:bg-gray-dark rounded-lg border border-gray-300 dark:border-gray-dark/50 p-6 md:p-8 text-center">
              <p className="text-gray-dark dark:text-gray-dark mb-4">
                Please complete your profile first to manage skills.
              </p>
              <Link
                href="/candidate/setup"
                className="inline-block px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
              >
                Complete Profile
              </Link>
            </div>
          ) : (
            <>
              {/* Add Skill Form */}
              {showAddForm ? (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 mb-6">
                  <h2 className="text-lg font-semibold text-black dark:text-gray mb-4">
                    Add New Skill
                  </h2>
                  <form onSubmit={handleAddSkill} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Skill Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newSkill.skill_name}
                          onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                          required
                          placeholder="e.g., React, Python, Figma"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={newSkill.skill_category}
                          onChange={(e) => setNewSkill({ ...newSkill, skill_category: e.target.value })}
                          placeholder="e.g., programming, design, management"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Proficiency Level
                        </label>
                        <select
                          value={newSkill.proficiency_level}
                          onChange={(e) => setNewSkill({ ...newSkill, proficiency_level: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={newSkill.years_experience}
                          onChange={(e) => setNewSkill({ ...newSkill, years_experience: e.target.value })}
                          placeholder="e.g., 3.5"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 text-sm font-medium text-black dark:text-gray bg-white dark:bg-gray-dark/30 hover:bg-gray-50 dark:hover:bg-gray-dark/50 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
                      >
                        Add Skill
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="mb-6">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
                  >
                    + Add Skill
                  </button>
                </div>
              )}

              {/* Skills List */}
              {skills.length === 0 ? (
                <div className="bg-white dark:bg-gray-dark rounded-lg border border-gray-300 dark:border-gray-dark/50 p-6 md:p-8 text-center">
                  <p className="text-gray-dark dark:text-gray-dark mb-4">
                    No skills added yet. Add your first skill to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="bg-white dark:bg-gray-dark rounded-lg border border-gray-300 dark:border-gray-dark/50 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-black dark:text-gray">
                              {skill.skill_name}
                            </h3>
                            {skill.source === 'ai_inferred' && (
                              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
                                AI Extracted
                              </span>
                            )}
                            {skill.verified && (
                              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-dark dark:text-gray-dark">
                            {skill.skill_category && (
                              <span className="capitalize">{skill.skill_category}</span>
                            )}
                            <select
                              value={skill.proficiency_level}
                              onChange={(e) => handleUpdateProficiency(skill.id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-dark/50 rounded text-black dark:text-gray bg-white dark:bg-gray-dark/30 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-gray"
                            >
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                              <option value="expert">Expert</option>
                            </select>
                            {skill.years_experience && (
                              <span>{skill.years_experience} years</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="ml-4 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remove skill"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RoleProtectedRoute>
  )
}

