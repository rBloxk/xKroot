'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function CandidateDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [onboardingAnswers, setOnboardingAnswers] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProfile()
    loadOnboardingAnswers()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/candidate/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadOnboardingAnswers = async () => {
    try {
      const response = await fetch('/api/candidate/onboarding')
      if (response.ok) {
        const data = await response.json()
        setOnboardingAnswers(data.answers)
      }
    } catch (error) {
      console.error('Error loading onboarding answers:', error)
    }
  }

  const getMissingFields = () => {
    if (!profile) return []
    const missing: string[] = []
    
    // Basic info (30 points)
    if (!profile.bio) missing.push('Bio')
    if (!profile.location) missing.push('Location')
    if (!profile.current_position) missing.push('Current Position')
    
    // Experience (20 points)
    if (profile.years_experience === null || profile.years_experience === undefined) missing.push('Years of Experience')
    if (!profile.education_level) missing.push('Education Level')
    
    // Preferences (20 points)
    if (!profile.preferred_work_type) missing.push('Preferred Work Type')
    if (!profile.salary_expectation_min && !profile.salary_expectation_max) missing.push('Salary Expectation')
    
    // Social links (15 points)
    if (!profile.linkedin_url) missing.push('LinkedIn URL')
    if (!profile.github_url) missing.push('GitHub URL')
    if (!profile.portfolio_url) missing.push('Portfolio URL')
    
    // Resume (15 points)
    if (!profile.raw_resume_text && !profile.resume_file_url) missing.push('Resume')
    
    return missing
  }

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (type === 'avatar') {
      setUploadingAvatar(true)
    } else {
      setUploadingCover(true)
    }

    try {
      // Get the session token from API (reads from HTTP-only cookies server-side)
      const tokenResponse = await fetch('/api/auth/session-token')
      const tokenData = await tokenResponse.json()
      
      if (!tokenResponse.ok || !tokenData.access_token) {
        const shouldLogin = window.confirm('Please log in to upload images. Would you like to go to the login page?')
        if (shouldLogin) {
          router.push('/login')
        }
        return
      }

      const accessToken = tokenData.access_token

      // Validate file before upload
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        alert(`File size exceeds 10MB limit. Please choose a smaller file.`)
        return
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type === 'avatar' ? 'avatar' : 'cover')
      const authHeader = `Bearer ${accessToken}`

      const response = await fetch('/api/candidate/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Update profile with new image URL
        // Get fresh token for profile update
        const updateTokenResponse = await fetch('/api/auth/session-token')
        const updateTokenData = await updateTokenResponse.json()
        const updateAccessToken = updateTokenData.access_token || accessToken
        
        // Prepare update payload
        const updatePayload: any = {
          bio: profile?.bio || '',
          location: profile?.location || '',
          current_position: profile?.current_position || '',
        }
        
        // Add the NEW image URL for the type being updated
        if (type === 'avatar') {
          updatePayload.avatar_url = data.url
          // Preserve existing cover image URL
          if (profile?.cover_image_url) {
            updatePayload.cover_image_url = profile.cover_image_url
          }
        } else {
          updatePayload.cover_image_url = data.url
          // Preserve existing avatar URL
          if (profile?.avatar_url) {
            updatePayload.avatar_url = profile.avatar_url
          }
        }
        
        // Include other profile fields if they exist
        if (profile?.years_experience !== undefined) updatePayload.years_experience = profile.years_experience
        if (profile?.education_level) updatePayload.education_level = profile.education_level
        if (profile?.availability_status) updatePayload.availability_status = profile.availability_status
        if (profile?.salary_expectation_min) updatePayload.salary_expectation_min = profile.salary_expectation_min
        if (profile?.salary_expectation_max) updatePayload.salary_expectation_max = profile.salary_expectation_max
        if (profile?.preferred_work_type) updatePayload.preferred_work_type = profile.preferred_work_type
        if (profile?.preferred_location) updatePayload.preferred_location = profile.preferred_location
        if (profile?.linkedin_url) updatePayload.linkedin_url = profile.linkedin_url
        if (profile?.github_url) updatePayload.github_url = profile.github_url
        if (profile?.portfolio_url) updatePayload.portfolio_url = profile.portfolio_url
        if (profile?.raw_resume_text) updatePayload.raw_resume_text = profile.raw_resume_text
        if (profile?.resume_file_url) updatePayload.resume_file_url = profile.resume_file_url
        
        const updateResponse = await fetch('/api/candidate/profile', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${updateAccessToken}`,
          },
          body: JSON.stringify(updatePayload),
        })

        const updateResponseData = await updateResponse.json()

        if (updateResponse.ok) {
          // Update profile state immediately with new URL to show updated image
          if (type === 'avatar' && data.url) {
            setProfile((prev: any) => ({
              ...prev,
              avatar_url: data.url
            }))
          } else if (type === 'cover' && data.url) {
            setProfile((prev: any) => ({
              ...prev,
              cover_image_url: data.url
            }))
          }
          // Reload profile to get complete updated data
          await loadProfile()
        } else {
          console.error('Profile update error:', updateResponseData)
          alert(`Upload successful but failed to update profile: ${updateResponseData.error || 'Unknown error'}`)
        }
      } else {
        console.error('Upload error:', data)
        // Handle specific error cases
        if (response.status === 401) {
          const shouldLogin = window.confirm('Your session has expired. Please log in again. Would you like to go to the login page?')
          if (shouldLogin) {
            router.push('/login')
          }
        } else {
          alert(data.error || 'Failed to upload image. Please check the browser console for details.')
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Failed to upload image: ${error.message || 'Please try again.'}`)
    } finally {
      if (type === 'avatar') {
        setUploadingAvatar(false)
      } else {
        setUploadingCover(false)
      }
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file, 'avatar')
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file, 'cover')
    }
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
            <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ''}!
            </h1>
            <p className="text-gray-dark dark:text-gray-300">
              Your candidate dashboard
            </p>
          </div>

          {!profile ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8">
              <h2 className="text-xl font-semibold text-black dark:text-gray mb-4">
                Complete Your Profile
              </h2>
              <p className="text-gray-dark dark:text-gray-300 mb-6">
                Get started by completing your profile to find the best job matches.
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
              {(() => {
                const missingFields = getMissingFields()
                const isComplete = profile.profile_completeness === 100
                return !isComplete && missingFields.length > 0 ? (
                  <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
                      Profile Incomplete - Missing Fields
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                      Your profile is {profile.profile_completeness || 0}% complete. Please complete the following fields to reach 100%:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-yellow-700 dark:text-yellow-400">
                      {missingFields.map((field, index) => (
                        <li key={index}>{field}</li>
                      ))}
                    </ul>
                    <Link
                      href="/candidate/setup"
                      className="inline-block mt-4 px-4 py-2 text-sm font-medium text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 rounded-lg transition-colors"
                    >
                      Complete Missing Fields →
                    </Link>
                  </div>
                ) : null
              })()}
              {/* Cover Image Section with Profile Picture Overlay */}
              <div className="mb-8 relative">
                <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden border border-gray-300 dark:border-[#333333] bg-gray-100 dark:bg-[#1a1a1a]">
                  {profile.cover_image_url ? (
                    <Image
                      key={profile.cover_image_url}
                      src={profile.cover_image_url}
                      alt="Profile cover"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-dark dark:text-gray-400">Upload a cover image</p>
                    </div>
                  )}
                  
                  {/* Cover Image Upload Button */}
                  <div className="absolute inset-0 bg-black/0 transition-colors flex items-end justify-end p-4 z-20">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="px-4 py-2 bg-white dark:bg-[#1a1a1a] text-black dark:text-white rounded-lg border border-gray-300 dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors opacity-0 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {uploadingCover ? 'Uploading...' : profile.cover_image_url ? 'Update Cover' : 'Upload Cover'}
                    </button>
                  </div>

                  {/* Profile Picture Overlay - Bottom Center */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-8 md:-translate-y-10 flex flex-col items-center gap-2 z-30">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-white dark:border-[#1a1a1a] bg-gray-100 dark:bg-[#252525] shadow-xl">
                      {profile.avatar_url ? (
                        <Image
                          key={profile.avatar_url}
                          src={profile.avatar_url}
                          alt="Profile picture"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      {/* Avatar Upload Overlay */}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex items-center justify-center group">
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <button
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-black/70 hover:bg-black/90 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingAvatar ? 'Uploading...' : profile.avatar_url ? 'Update' : 'Upload'}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-dark dark:text-gray-400 bg-white/90 dark:bg-[#1a1a1a]/90 px-3 py-1 rounded-full shadow-md">
                      Square image, 200x200px+. Max 10MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Profile Completeness Card */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                <h3 className="text-lg font-semibold text-black dark:text-gray mb-2">
                  Profile Completeness
                </h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-dark dark:text-gray-300 mb-2">
                    <span>{profile.profile_completeness || 0}%</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
                    <div
                      className="bg-black dark:bg-gray h-2 rounded-full transition-all"
                      style={{ width: `${profile.profile_completeness || 0}%` }}
                    ></div>
                  </div>
                </div>
                <Link
                  href="/candidate/setup"
                  className="text-sm text-black dark:text-gray hover:underline"
                >
                  Update Profile →
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                <h3 className="text-lg font-semibold text-black dark:text-gray mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-dark dark:text-gray-300">Matches</span>
                    <span className="font-medium text-black dark:text-gray">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-dark dark:text-gray-dark">Applications</span>
                    <span className="font-medium text-black dark:text-gray">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-dark dark:text-gray-dark">Assessments</span>
                    <span className="font-medium text-black dark:text-gray">0</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                <h3 className="text-lg font-semibold text-black dark:text-gray mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/candidate/setup"
                    className="block text-sm text-black dark:text-gray hover:underline"
                  >
                    Edit Profile →
                  </Link>
                  <Link
                    href="/candidate/skills"
                    className="block text-sm text-black dark:text-gray hover:underline"
                  >
                    Manage Skills →
                  </Link>
                  <Link
                    href="/candidate/matches"
                    className="block text-sm text-black dark:text-gray hover:underline"
                  >
                    View Matches →
                  </Link>
                  <Link
                    href="/candidate/applications"
                    className="block text-sm text-black dark:text-gray hover:underline"
                  >
                    My Applications →
                  </Link>
                  <Link
                    href="/candidate/assessments"
                    className="block text-sm text-black dark:text-gray hover:underline"
                  >
                    Take Assessment →
                  </Link>
                </div>
              </div>
              </div>

              {/* Detailed Information Sections */}
              <div className="mt-8 space-y-6">
                {/* Onboarding Information */}
                {onboardingAnswers && Object.keys(onboardingAnswers).length > 0 && (
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                    <h3 className="text-xl font-semibold text-black dark:text-white mb-6">
                      Onboarding Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {onboardingAnswers.experience_level && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                            Years of Experience
                          </h4>
                          <p className="text-lg text-black dark:text-white">
                            {onboardingAnswers.experience_level.answer} {onboardingAnswers.experience_level.answer === 1 ? 'year' : 'years'}
                          </p>
                        </div>
                      )}
                      {onboardingAnswers.primary_role && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                            Primary Role
                          </h4>
                          <p className="text-lg text-black dark:text-white">
                            {onboardingAnswers.primary_role.answer}
                          </p>
                        </div>
                      )}
                      {onboardingAnswers.tech_stack && (
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-2">
                            Tech Stack
                          </h4>
                          <p className="text-base text-black dark:text-white whitespace-pre-wrap">
                            {onboardingAnswers.tech_stack.answer}
                          </p>
                        </div>
                      )}
                      {onboardingAnswers.work_preference && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-1">
                            Work Preference
                          </h4>
                          <p className="text-lg text-black dark:text-white capitalize">
                            {onboardingAnswers.work_preference.answer === 'remote' ? 'Fully Remote' :
                             onboardingAnswers.work_preference.answer === 'hybrid' ? 'Hybrid (Remote + Office)' :
                             onboardingAnswers.work_preference.answer === 'onsite' ? 'On-site' :
                             onboardingAnswers.work_preference.answer === 'flexible' ? 'Flexible' :
                             onboardingAnswers.work_preference.answer}
                          </p>
                        </div>
                      )}
                      {onboardingAnswers.career_goals && (
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-2">
                            Career Goals (1-2 years)
                          </h4>
                          <p className="text-base text-black dark:text-white whitespace-pre-wrap">
                            {onboardingAnswers.career_goals.answer}
                          </p>
                        </div>
                      )}
                      {onboardingAnswers.challenges && (
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-2">
                            Challenges I Enjoy Solving
                          </h4>
                          <p className="text-base text-black dark:text-white whitespace-pre-wrap">
                            {onboardingAnswers.challenges.answer}
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
                            : `Up to $${profile.salary_expectation_max.toLocaleString()}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Links & Resume */}
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
                      <div>
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
                            View Resume PDF
                          </a>
                        ) : (
                          <p className="text-sm text-gray-dark dark:text-gray-400">
                            Resume text available
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </RoleProtectedRoute>
  )
}

