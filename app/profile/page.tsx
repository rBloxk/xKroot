'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const { user, logout, refreshAuth } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [candidateProfile, setCandidateProfile] = useState<any>(null)
  const [companyProfile, setCompanyProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      loadProfiles()
    }
  }, [user])

  const loadProfiles = async () => {
    setIsLoading(true)
    try {
      // Load candidate profile if user is a candidate
      if (user?.user_type === 'candidate') {
        const candidateResponse = await fetch('/api/candidate/profile', {
          credentials: 'include',
        })
        if (candidateResponse.ok) {
          const candidateData = await candidateResponse.json()
          setCandidateProfile(candidateData.profile)
        } else {
          const errorData = await candidateResponse.json().catch(() => ({}))
          console.error('Failed to load candidate profile:', errorData)
        }
      }
      
      // Load company profile if user is a company
      if (user?.user_type === 'company') {
        const companyResponse = await fetch('/api/company/profile', {
          credentials: 'include',
        })
        if (companyResponse.ok) {
          const companyData = await companyResponse.json()
          setCompanyProfile(companyData.profile)
        } else {
          const errorData = await companyResponse.json().catch(() => ({}))
          console.error('Failed to load company profile:', errorData)
        }
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveName = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please log in to update your profile')
        return
      }

      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ full_name: fullName }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Name updated successfully')
        setIsEditing(false)
        await refreshAuth()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to update name')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (type === 'avatar') {
      setUploadingAvatar(true)
    } else {
      setUploadingCover(true)
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Please log in to upload images')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const uploadEndpoint = user?.user_type === 'candidate' 
        ? '/api/candidate/upload-image'
        : '/api/company/upload-image'

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Update profile with new image URL
        const profileEndpoint = user?.user_type === 'candidate'
          ? '/api/candidate/profile'
          : '/api/company/profile'

        const profile = user?.user_type === 'candidate' ? candidateProfile : companyProfile
        
        const updatePayload: any = {
          ...(user?.user_type === 'candidate' 
            ? {
                bio: profile?.bio || '',
                location: profile?.location || '',
                current_position: profile?.current_position || '',
              }
            : {
                company_name: profile?.company_name || '',
              }
          ),
        }
        
        if (type === 'avatar') {
          updatePayload[user?.user_type === 'candidate' ? 'avatar_url' : 'logo_url'] = data.url
          if (user?.user_type === 'candidate' && profile?.cover_image_url) {
            updatePayload.cover_image_url = profile.cover_image_url
          } else if (user?.user_type === 'company' && profile?.cover_image_url) {
            updatePayload.cover_image_url = profile.cover_image_url
          }
        } else {
          updatePayload.cover_image_url = data.url
          if (user?.user_type === 'candidate' && profile?.avatar_url) {
            updatePayload.avatar_url = profile.avatar_url
          } else if (user?.user_type === 'company' && profile?.logo_url) {
            updatePayload.logo_url = profile.logo_url
          }
        }
        
        // Include all other profile fields
        if (user?.user_type === 'candidate' && profile) {
          if (profile.years_experience !== undefined) updatePayload.years_experience = profile.years_experience
          if (profile.education_level) updatePayload.education_level = profile.education_level
          if (profile.availability_status) updatePayload.availability_status = profile.availability_status
          if (profile.salary_expectation_min) updatePayload.salary_expectation_min = profile.salary_expectation_min
          if (profile.salary_expectation_max) updatePayload.salary_expectation_max = profile.salary_expectation_max
          if (profile.preferred_work_type) updatePayload.preferred_work_type = profile.preferred_work_type
          if (profile.preferred_location) updatePayload.preferred_location = profile.preferred_location
          if (profile.linkedin_url) updatePayload.linkedin_url = profile.linkedin_url
          if (profile.github_url) updatePayload.github_url = profile.github_url
          if (profile.portfolio_url) updatePayload.portfolio_url = profile.portfolio_url
          if (profile.raw_resume_text) updatePayload.raw_resume_text = profile.raw_resume_text
          if (profile.resume_file_url) updatePayload.resume_file_url = profile.resume_file_url
        } else if (user?.user_type === 'company' && profile) {
          if (profile.company_size) updatePayload.company_size = profile.company_size
          if (profile.industry) updatePayload.industry = profile.industry
          if (profile.description) updatePayload.description = profile.description
          if (profile.website_url) updatePayload.website_url = profile.website_url
          if (profile.location) updatePayload.location = profile.location
        }
        
        const updateResponse = await fetch(profileEndpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(updatePayload),
        })

        if (updateResponse.ok) {
          await loadProfiles()
        } else {
          const updateData = await updateResponse.json()
          alert(`Upload successful but failed to update profile: ${updateData.error || 'Unknown error'}`)
        }
      } else {
        alert(data.error || 'Failed to upload image')
      }
    } catch (error: any) {
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

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const getProfileImage = () => {
    if (user?.user_type === 'candidate' && candidateProfile?.avatar_url) {
      return candidateProfile.avatar_url
    }
    if (user?.user_type === 'company' && companyProfile?.logo_url) {
      return companyProfile.logo_url
    }
    return null
  }

  const getCoverImage = () => {
    if (user?.user_type === 'candidate' && candidateProfile?.cover_image_url) {
      return candidateProfile.cover_image_url
    }
    if (user?.user_type === 'company' && companyProfile?.cover_image_url) {
      return companyProfile.cover_image_url
    }
    return null
  }

  const getDashboardLink = () => {
    if (user?.user_type === 'candidate') return '/candidate/dashboard'
    if (user?.user_type === 'company') return '/company/dashboard'
    return '/'
  }

  const getSetupLink = () => {
    if (user?.user_type === 'candidate') return '/candidate/setup'
    if (user?.user_type === 'company') return '/company/setup'
    return '/onboarding'
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
            <p className="mt-4 text-gray-dark dark:text-gray-300">Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                  My Profile
                </h1>
                <p className="text-gray-dark dark:text-gray-300">
                  Manage your account settings and profile information
                </p>
              </div>
              <Link
                href={getDashboardLink()}
                className="px-4 py-2 text-sm font-medium text-black dark:text-gray hover:bg-white/10 dark:hover:bg-gray-dark/10 rounded-lg transition-colors"
              >
                ← Dashboard
              </Link>
            </div>
          </div>

          {/* Cover Image Section */}
          <div className="mb-8 relative">
            <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden border border-gray-300 dark:border-[#333333] bg-gray-100 dark:bg-[#1a1a1a]">
              {getCoverImage() ? (
                <Image
                  src={getCoverImage()!}
                  alt="Profile cover"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-dark dark:text-gray-400">Upload a cover image</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 transition-colors flex items-center justify-center">
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
                  className="px-4 py-2 bg-white dark:bg-[#1a1a1a] text-black dark:text-white rounded-lg border border-gray-300 dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors opacity-0 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingCover ? 'Uploading...' : getCoverImage() ? 'Update Cover' : 'Upload Cover'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Information */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-black dark:text-white">
                    Account Information
                  </h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {error && (
                  <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-3">
                    <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <p className="text-black dark:text-white">{user?.email}</p>
                    <p className="text-xs text-gray-dark dark:text-gray-400 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
                          placeholder="Enter your full name"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveName}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false)
                              setFullName(user?.full_name || '')
                              setError('')
                              setSuccess('')
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-dark dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-black dark:text-white">
                        {user?.full_name || 'Not set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                      User Type
                    </label>
                    <p className="text-black dark:text-white capitalize">
                      {user?.user_type || 'Not set'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                      User ID
                    </label>
                    <p className="text-sm text-gray-dark dark:text-gray-300 font-mono break-all">
                      {user?.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role-Specific Profile Info */}
              {user?.user_type === 'candidate' && candidateProfile && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                      Candidate Profile
                    </h2>
                    <Link
                      href="/candidate/setup"
                      className="px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors"
                    >
                      Edit Profile →
                    </Link>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                        Profile Completeness
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
                          <div
                            className="bg-black dark:bg-gray h-2 rounded-full transition-all"
                            style={{ width: `${candidateProfile.profile_completeness || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-black dark:text-white">
                          {candidateProfile.profile_completeness || 0}%
                        </span>
                      </div>
                    </div>
                    {candidateProfile.bio && (
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Bio
                        </label>
                        <p className="text-black dark:text-white">{candidateProfile.bio}</p>
                      </div>
                    )}
                    {candidateProfile.location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Location
                        </label>
                        <p className="text-black dark:text-white">{candidateProfile.location}</p>
                      </div>
                    )}
                    {candidateProfile.current_position && (
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Current Position
                        </label>
                        <p className="text-black dark:text-white">{candidateProfile.current_position}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {user?.user_type === 'company' && companyProfile && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                      Company Profile
                    </h2>
                    <Link
                      href="/company/setup"
                      className="px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors"
                    >
                      Edit Profile →
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {companyProfile.company_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Company Name
                        </label>
                        <p className="text-black dark:text-white">{companyProfile.company_name}</p>
                      </div>
                    )}
                    {companyProfile.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <p className="text-black dark:text-white">{companyProfile.description}</p>
                      </div>
                    )}
                    {companyProfile.location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
                          Location
                        </label>
                        <p className="text-black dark:text-white">{companyProfile.location}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Profile Picture & Actions */}
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                  {user?.user_type === 'candidate' ? 'Profile Picture' : 'Company Logo'}
                </h3>
                <div className="flex flex-col items-center gap-4">
                  <div className={`relative ${user?.user_type === 'candidate' ? 'w-32 h-32 rounded-full' : 'w-32 h-32 rounded-lg'} overflow-hidden border-2 border-gray-300 dark:border-[#333333] bg-gray-100 dark:bg-[#252525] flex-shrink-0`}>
                    {getProfileImage() ? (
                      <Image
                        src={getProfileImage()!}
                        alt={user?.user_type === 'candidate' ? 'Profile picture' : 'Company logo'}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          console.error('Error loading profile image:', getProfileImage())
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {user?.user_type === 'candidate' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          )}
                        </svg>
                      </div>
                    )}
                  </div>
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
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingAvatar ? 'Uploading...' : getProfileImage() ? 'Update Picture' : 'Upload Picture'}
                  </button>
                  <p className="text-xs text-gray-dark dark:text-gray-400 text-center">
                    Recommended: Square image, at least 200x200px. Max 10MB.
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Link
                    href={getDashboardLink()}
                    className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors"
                  >
                    Go to Dashboard →
                  </Link>
                  <Link
                    href={getSetupLink()}
                    className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors"
                  >
                    Edit Profile →
                  </Link>
                  {user?.user_type === 'candidate' && (
                    <>
                      <Link
                        href="/candidate/matches"
                        className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors"
                      >
                        View Matches →
                      </Link>
                      <Link
                        href="/candidate/applications"
                        className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors"
                      >
                        My Applications →
                      </Link>
                    </>
                  )}
                  {user?.user_type === 'company' && (
                    <>
                      <Link
                        href="/company/jobs"
                        className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors"
                      >
                        Manage Jobs →
                      </Link>
                      <Link
                        href="/company/needs"
                        className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors"
                      >
                        Manage Needs →
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Account Settings */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                  Account Settings
                </h3>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
