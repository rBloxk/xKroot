'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function CompanyDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/company/profile')
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

  const getMissingFields = () => {
    if (!profile) return []
    const missing: string[] = []
    
    // Required fields for 100% completeness
    if (!profile.company_name) missing.push('Company Name')
    if (!profile.description) missing.push('Description')
    if (!profile.company_size) missing.push('Company Size')
    if (!profile.industry) missing.push('Industry')
    if (!profile.location) missing.push('Location')
    
    return missing
  }

  const isProfileComplete = () => {
    if (!profile) return false
    const requiredFields = [
      'company_name',
      'description',
      'company_size',
      'industry',
      'location',
    ]
    return requiredFields.every(field => profile[field])
  }

  const handleImageUpload = async (file: File, type: 'logo' | 'cover') => {
    if (type === 'logo') {
      setUploadingLogo(true)
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
      formData.append('type', type)

      const response = await fetch('/api/company/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
        
        // Prepare update payload - only send necessary fields
        const updatePayload: any = {
          company_name: profile?.company_name || '',
        }
        
        // Add the NEW image URL for the type being updated
        if (type === 'logo') {
          updatePayload.logo_url = data.url
          // Preserve existing cover image URL
          if (profile?.cover_image_url) {
            updatePayload.cover_image_url = profile.cover_image_url
          }
        } else {
          updatePayload.cover_image_url = data.url
          // Preserve existing logo URL
          if (profile?.logo_url) {
            updatePayload.logo_url = profile.logo_url
          }
        }
        
        // Include other profile fields if they exist
        if (profile?.company_size) updatePayload.company_size = profile.company_size
        if (profile?.industry) updatePayload.industry = profile.industry
        if (profile?.description) updatePayload.description = profile.description
        if (profile?.website_url) updatePayload.website_url = profile.website_url
        if (profile?.location) updatePayload.location = profile.location
        if (profile?.headquarters_location) updatePayload.headquarters_location = profile.headquarters_location
        if (profile?.company_type) updatePayload.company_type = profile.company_type
        if (profile?.funding_stage) updatePayload.funding_stage = profile.funding_stage
        if (profile?.startup_stage) updatePayload.startup_stage = profile.startup_stage
        if (profile?.company_culture) {
          // Handle company_culture - it might be a JSON object or string
          updatePayload.company_culture = typeof profile.company_culture === 'string' 
            ? profile.company_culture 
            : JSON.stringify(profile.company_culture)
        }
        // Handle array fields - ensure they're arrays
        if (profile?.benefits_offered) {
          updatePayload.benefits_offered = Array.isArray(profile.benefits_offered)
            ? profile.benefits_offered
            : typeof profile.benefits_offered === 'string'
            ? profile.benefits_offered
            : []
        }
        if (profile?.tech_stack) {
          updatePayload.tech_stack = Array.isArray(profile.tech_stack)
            ? profile.tech_stack
            : typeof profile.tech_stack === 'string'
            ? profile.tech_stack
            : []
        }
        
        const updateResponse = await fetch('/api/company/profile', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${updateAccessToken}`,
          },
          body: JSON.stringify(updatePayload),
        })

        const updateResponseData = await updateResponse.json()

        if (updateResponse.ok) {
          await loadProfile() // Reload profile to show new image
        } else {
          console.error('Profile update error:', updateResponseData)
          alert(`Upload successful but failed to update profile: ${updateResponseData.error || 'Unknown error'}`)
        }
      } else {
        console.error('Upload error:', data)
        alert(data.error || 'Failed to upload image. Please check the browser console for details.')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Failed to upload image: ${error.message || 'Please try again.'}`)
    } finally {
      if (type === 'logo') {
        setUploadingLogo(false)
      } else {
        setUploadingCover(false)
      }
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file, 'logo')
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
      <RoleProtectedRoute allowedRoles={['company']}>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-[#ffdf07] mx-auto"></div>
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
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
              Welcome back{profile?.company_name ? `, ${profile.company_name}` : ''}!
            </h1>
            <p className="text-gray-dark dark:text-gray-300">
              Your company dashboard
            </p>
          </div>

          {!profile ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
                Complete Your Company Profile
              </h2>
              <p className="text-gray-dark dark:text-gray-300 mb-6">
                Get started by completing your company profile to start posting jobs and finding candidates.
              </p>
              <Link
                href="/company/setup"
                className="inline-block px-6 py-2 text-sm font-medium text-white bg-black dark:bg-[#ffdf07] dark:text-black hover:bg-gray-dark dark:hover:bg-[#ffdf07]/90 rounded-lg transition-colors"
              >
                Complete Profile
              </Link>
            </div>
          ) : (
            <>
              {(() => {
                const missingFields = getMissingFields()
                const isComplete = isProfileComplete()
                return !isComplete && missingFields.length > 0 ? (
                  <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
                      Profile Incomplete - Missing Fields
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                      Your profile is incomplete. Please complete the following required fields to reach 100%:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-yellow-700 dark:text-yellow-400">
                      {missingFields.map((field, index) => (
                        <li key={index}>{field}</li>
                      ))}
                    </ul>
                    <Link
                      href="/company/setup"
                      className="inline-block mt-4 px-4 py-2 text-sm font-medium text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 rounded-lg transition-colors"
                    >
                      Complete Missing Fields →
                    </Link>
                  </div>
                ) : null
              })()}
              {/* Cover Image Section with Company Logo Overlay */}
              <div className="mb-8 relative">
                <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden border border-gray-300 dark:border-[#333333] bg-gray-100 dark:bg-[#1a1a1a]">
                  {profile.cover_image_url ? (
                    <Image
                      src={profile.cover_image_url}
                      alt="Company cover"
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

                  {/* Company Logo Overlay - Bottom Center */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-8 md:-translate-y-10 flex flex-col items-center gap-2 z-30">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border-2 border-white dark:border-[#1a1a1a] bg-gray-100 dark:bg-[#252525] shadow-xl">
                      {profile.logo_url ? (
                        <Image
                          src={profile.logo_url}
                          alt="Company logo"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Logo Upload Overlay */}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex items-center justify-center group">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-black/70 hover:bg-black/90 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingLogo ? 'Uploading...' : profile.logo_url ? 'Update' : 'Upload'}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-dark dark:text-gray-400 bg-white/90 dark:bg-[#1a1a1a]/90 px-3 py-1 rounded-full shadow-md">
                      Square image, 200x200px+. Max 10MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Company Info Card */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                    Company Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-dark dark:text-gray-300">Size: </span>
                      <span className="font-medium text-black dark:text-white capitalize">
                        {profile.company_size || 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-dark dark:text-gray-300">Stage: </span>
                      <span className="font-medium text-black dark:text-white capitalize">
                        {profile.startup_stage || 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-dark dark:text-gray-300">Industry: </span>
                      <span className="font-medium text-black dark:text-white">
                        {profile.industry || 'Not set'}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/company/setup"
                    className="mt-4 inline-block text-sm text-black dark:text-white hover:underline"
                  >
                    Update Profile →
                  </Link>
                </div>

                {/* Quick Stats */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                    Quick Stats
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-dark dark:text-gray-300">Active Jobs</span>
                      <span className="font-medium text-black dark:text-white">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-dark dark:text-gray-300">Total Matches</span>
                      <span className="font-medium text-black dark:text-white">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-dark dark:text-gray-300">Applications</span>
                      <span className="font-medium text-black dark:text-white">0</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <Link
                      href="/company/setup"
                      className="block text-sm text-black dark:text-white hover:underline"
                    >
                      Edit Profile →
                    </Link>
                    <Link
                      href="/company/jobs/new"
                      className="block text-sm text-black dark:text-white hover:underline"
                    >
                      Post a Job →
                    </Link>
                    <Link
                      href="/company/jobs"
                      className="block text-sm text-black dark:text-white hover:underline"
                    >
                      Manage Jobs →
                    </Link>
                    <Link
                      href="/company/needs"
                      className="block text-sm text-black dark:text-white hover:underline"
                    >
                      Company Needs →
                    </Link>
                    <Link
                      href="/company/jobs"
                      className="block text-sm text-black dark:text-white hover:underline"
                    >
                      View Jobs & Matches →
                    </Link>
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
