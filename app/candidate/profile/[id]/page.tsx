'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'
import Image from 'next/image'

interface CandidateProfile {
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
  resume_file_url: string | null
  raw_resume_text: string | null
  salary_expectation_min: number | null
  salary_expectation_max: number | null
  onboarding_answers: Record<string, { answer: any; answeredAt: string }> | null
  profile_completeness: number
  avatar_url: string | null
  cover_image_url: string | null
  users: {
    id: string
    full_name: string | null
    email: string
  }
}

export default function CandidateProfilePage() {
  const params = useParams()
  const { user } = useAuth()
  const candidateId = params.id as string
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (candidateId) {
      loadProfile()
    }
  }, [candidateId])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch(`/api/candidates/${candidateId}`)
      const data = await response.json()
      
      if (response.ok) {
        setProfile(data.candidate)
      } else {
        setError(data.error || 'Failed to load candidate profile')
      }
    } catch (error: any) {
      console.error('Error loading profile:', error)
      setError(error.message || 'Failed to load candidate profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <RoleProtectedRoute allowedRoles={['company']}>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
            <p className="mt-4 text-gray-dark dark:text-gray-300">Loading profile...</p>
          </div>
        </div>
      </RoleProtectedRoute>
    )
  }

  if (error || !profile) {
    return (
      <RoleProtectedRoute allowedRoles={['company']}>
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 text-center">
              <p className="text-red-600 dark:text-red-400">{error || 'Candidate profile not found'}</p>
              <Link
                href="/"
                className="inline-block mt-4 px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
              >
                ← Back to Candidates
              </Link>
            </div>
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
            <Link
              href="/company/candidates"
              className="text-sm text-gray-dark dark:text-gray-300 hover:text-black dark:hover:text-white mb-4 inline-block"
            >
              ← Back to Candidates
            </Link>
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
              Candidate Profile
            </h1>
          </div>

          {/* Cover Image with Profile Picture Overlay */}
          <div className="mb-8 relative">
            <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden border border-gray-300 dark:border-[#333333] bg-gray-100 dark:bg-[#1a1a1a]">
              {profile.cover_image_url ? (
                <Image
                  src={profile.cover_image_url}
                  alt="Profile cover"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-dark dark:text-gray-400"></p>
                </div>
              )}
            </div>

            {/* Profile Picture Overlay - Bottom Center */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-8 md:-translate-y-10 flex flex-col items-center gap-2 z-30">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-white dark:border-[#1a1a1a] bg-gray-100 dark:bg-[#252525] shadow-xl">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.users.full_name || 'Candidate'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-1">
                  {profile.users.full_name || profile.users.email}
                </h2>
                {profile.current_position && (
                  <p className="text-lg text-gray-dark dark:text-gray-300">
                    {profile.current_position}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    profile.availability_status === 'available'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : profile.availability_status === 'open'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
                  }`}>
                    {profile.availability_status === 'available' ? 'Available' :
                     profile.availability_status === 'open' ? 'Open to Opportunities' :
                     profile.availability_status === 'not_looking' ? 'Not Looking' :
                     profile.availability_status === 'passive' ? 'Passive' :
                     profile.availability_status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200">
                    {profile.profile_completeness}% Complete
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Onboarding Information */}
              {profile.onboarding_answers && Object.keys(profile.onboarding_answers).length > 0 && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-6">
                    Onboarding Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.onboarding_answers.experience_level && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                          Years of Experience
                        </h4>
                        <p className="text-lg text-black dark:text-white">
                          {profile.onboarding_answers.experience_level.answer} {profile.onboarding_answers.experience_level.answer === 1 ? 'year' : 'years'}
                        </p>
                      </div>
                    )}
                    {profile.onboarding_answers.primary_role && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                          Primary Role
                        </h4>
                        <p className="text-lg text-black dark:text-white">
                          {profile.onboarding_answers.primary_role.answer}
                        </p>
                      </div>
                    )}
                    {profile.onboarding_answers.tech_stack && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-2">
                          Tech Stack
                        </h4>
                        <p className="text-base text-black dark:text-white whitespace-pre-wrap">
                          {profile.onboarding_answers.tech_stack.answer}
                        </p>
                      </div>
                    )}
                    {profile.onboarding_answers.work_preference && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                          Work Preference
                        </h4>
                        <p className="text-lg text-black dark:text-white capitalize">
                          {profile.onboarding_answers.work_preference.answer === 'remote' ? 'Fully Remote' :
                           profile.onboarding_answers.work_preference.answer === 'hybrid' ? 'Hybrid (Remote + Office)' :
                           profile.onboarding_answers.work_preference.answer === 'onsite' ? 'On-site' :
                           profile.onboarding_answers.work_preference.answer === 'flexible' ? 'Flexible' :
                           profile.onboarding_answers.work_preference.answer}
                        </p>
                      </div>
                    )}
                    {profile.onboarding_answers.career_goals && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-2">
                          Career Goals (1-2 years)
                        </h4>
                        <p className="text-base text-black dark:text-white whitespace-pre-wrap">
                          {profile.onboarding_answers.career_goals.answer}
                        </p>
                      </div>
                    )}
                    {profile.onboarding_answers.challenges && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-2">
                          Challenges I Enjoy Solving
                        </h4>
                        <p className="text-base text-black dark:text-white whitespace-pre-wrap">
                          {profile.onboarding_answers.challenges.answer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Profile Information */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                <h3 className="text-xl font-semibold text-black dark:text-white mb-6">
                  Profile Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.bio && (
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-2">
                        Bio
                      </h4>
                      <p className="text-base text-black dark:text-white whitespace-pre-wrap">
                        {profile.bio}
                      </p>
                    </div>
                  )}
                  {profile.location && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                        Location
                      </h4>
                      <p className="text-lg text-black dark:text-white">
                        {profile.location}
                      </p>
                    </div>
                  )}
                  {profile.current_position && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                        Current Position
                      </h4>
                      <p className="text-lg text-black dark:text-white">
                        {profile.current_position}
                      </p>
                    </div>
                  )}
                  {profile.years_experience !== null && profile.years_experience !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                        Years of Experience
                      </h4>
                      <p className="text-lg text-black dark:text-white">
                        {profile.years_experience} {profile.years_experience === 1 ? 'year' : 'years'}
                      </p>
                    </div>
                  )}
                  {profile.education_level && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                        Education Level
                      </h4>
                      <p className="text-lg text-black dark:text-white">
                        {profile.education_level}
                      </p>
                    </div>
                  )}
                  {profile.availability_status && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                        Availability Status
                      </h4>
                      <p className="text-lg text-black dark:text-white capitalize">
                        {profile.availability_status === 'available' ? 'Available' :
                         profile.availability_status === 'open' ? 'Open to Opportunities' :
                         profile.availability_status === 'not_looking' ? 'Not Looking' :
                         profile.availability_status === 'passive' ? 'Passive' :
                         profile.availability_status}
                      </p>
                    </div>
                  )}
                  {profile.preferred_work_type && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                        Preferred Work Type
                      </h4>
                      <p className="text-lg text-black dark:text-white capitalize">
                        {profile.preferred_work_type === 'remote' ? 'Fully Remote' :
                         profile.preferred_work_type === 'hybrid' ? 'Hybrid (Remote + Office)' :
                         profile.preferred_work_type === 'onsite' ? 'On-site' :
                         profile.preferred_work_type === 'flexible' ? 'Flexible' :
                         profile.preferred_work_type}
                      </p>
                    </div>
                  )}
                  {profile.preferred_location && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                        Preferred Location
                      </h4>
                      <p className="text-lg text-black dark:text-white">
                        {profile.preferred_location}
                      </p>
                    </div>
                  )}
                  {(profile.salary_expectation_min || profile.salary_expectation_max) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                        Salary Expectation
                      </h4>
                      <p className="text-lg text-black dark:text-white">
                        {profile.salary_expectation_min && profile.salary_expectation_max
                          ? `$${profile.salary_expectation_min.toLocaleString()} - $${profile.salary_expectation_max.toLocaleString()}`
                          : profile.salary_expectation_min
                          ? `$${profile.salary_expectation_min.toLocaleString()}+`
                          : profile.salary_expectation_max
                          ? `Up to $${profile.salary_expectation_max.toLocaleString()}`
                          : 'Not specified'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Links & Resume */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                <h3 className="text-xl font-semibold text-black dark:text-white mb-6">
                  Links & Resume
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.linkedin_url && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-2">
                        LinkedIn
                      </h4>
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {profile.linkedin_url}
                      </a>
                    </div>
                  )}
                  {profile.github_url && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-2">
                        GitHub
                      </h4>
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {profile.github_url}
                      </a>
                    </div>
                  )}
                  {profile.portfolio_url && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-2">
                        Portfolio
                      </h4>
                      <a
                        href={profile.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {profile.portfolio_url}
                      </a>
                    </div>
                  )}
                  {(profile.resume_file_url || profile.raw_resume_text) && (
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-2">
                        Resume
                      </h4>
                      {profile.resume_file_url ? (
                        <a
                          href={profile.resume_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Resume PDF →
                        </a>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-dark dark:text-gray-400 mb-2">
                            Resume text available
                          </p>
                          <details className="mt-2">
                            <summary className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                              View Resume Text
                            </summary>
                            <div className="mt-2 p-4 bg-gray-50 dark:bg-[#252525] rounded-lg">
                              <p className="text-sm text-black dark:text-white whitespace-pre-wrap">
                                {profile.raw_resume_text}
                              </p>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Actions</h3>
                <div className="space-y-2">
                  <Link
                    href={`/company/jobs/new?candidate_id=${profile.id}`}
                    className="block w-full px-4 py-2 text-sm font-medium text-center text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
                  >
                    Post Job for This Candidate
                  </Link>
                  <Link
                    href="/company/jobs"
                    className="block w-full px-4 py-2 text-sm font-medium text-center text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors border border-gray-300 dark:border-[#333333]"
                  >
                    View Jobs & Matches
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  )
}

