'use client'

import { useState, useEffect } from 'react'

interface Skill {
  id: string
  skill_name: string
  skill_category: string | null
  proficiency_level: string
  years_experience: number | null
  verified: boolean
  source: string
}

interface SkillsReviewProps {
  candidateId: string
  onComplete?: () => void
}

export default function SkillsReview({ candidateId, onComplete }: SkillsReviewProps) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSkills()
  }, [candidateId])

  const loadSkills = async () => {
    try {
      const response = await fetch(`/api/candidate/skills?candidate_id=${candidateId}`)
      if (response.ok) {
        const data = await response.json()
        setSkills(data.skills || [])
      }
    } catch (error) {
      console.error('Error loading skills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveSkill = async (skillId: string) => {
    try {
      const response = await fetch(`/api/candidate/skills/${skillId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSkills(skills.filter(s => s.id !== skillId))
      } else {
        setError('Failed to remove skill')
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
        setSkills(skills.map(s => 
          s.id === skillId ? { ...s, proficiency_level: proficiency } : s
        ))
      } else {
        setError('Failed to update skill')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    }
  }

  const handleAddSkill = async () => {
    const skillName = prompt('Enter skill name:')
    if (!skillName) return

    try {
      const response = await fetch('/api/candidate/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidateId,
          skill_name: skillName,
          skill_category: 'other',
          proficiency_level: 'intermediate',
          source: 'self_reported',
        }),
      })

      if (response.ok) {
        await loadSkills()
      } else {
        setError('Failed to add skill')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading skills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-gray mb-2">
          Review Your Skills
        </h3>
        <p className="text-sm text-gray-dark dark:text-gray-300 mb-4">
          We've extracted these skills from your onboarding answers. Review and adjust as needed.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {skills.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-dark dark:text-gray-300 mb-4">
            No skills found. Skills will be extracted after completing onboarding.
          </p>
          <button
            onClick={handleAddSkill}
            className="px-4 py-2 text-sm font-medium text-black dark:text-white bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors"
          >
            Add Skill Manually
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center justify-between p-4 border border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#1a1a1a]"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-black dark:text-gray">
                    {skill.skill_name}
                  </span>
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
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-dark dark:text-gray-300">
                  <span className="capitalize">{skill.skill_category || 'Uncategorized'}</span>
                  <select
                    value={skill.proficiency_level}
                    onChange={(e) => handleUpdateProficiency(skill.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 dark:border-[#333333] rounded text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07]"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => handleRemoveSkill(skill.id)}
                className="ml-4 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Remove skill"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <button
          onClick={handleAddSkill}
          className="px-4 py-2 text-sm font-medium text-black dark:text-gray bg-white dark:bg-gray-dark/30 hover:bg-gray-50 dark:hover:bg-gray-dark/50 rounded-lg transition-colors"
        >
          + Add Skill
        </button>
        {onComplete && (
          <button
            onClick={onComplete}
            className="px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}

