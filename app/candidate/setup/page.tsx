'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import OnboardingQuestions from '@/components/candidate/OnboardingQuestions'
import ProfileForm from '@/components/candidate/ProfileForm'

type SetupStep = 'onboarding' | 'profile' | 'complete'

export default function CandidateSetupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<SetupStep>('onboarding')
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)

  const handleOnboardingComplete = async () => {
    setOnboardingCompleted(true)
    
    // Extract skills from onboarding answers
    try {
      // Get candidate profile ID
      const profileResponse = await fetch('/api/candidate/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        if (profileData.profile?.id) {
          // Trigger skill extraction
          await fetch('/api/ai/extract-skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidate_id: profileData.profile.id }),
          })
        }
      }
    } catch (error) {
      console.error('Error extracting skills:', error)
      // Don't block the flow if skill extraction fails
    }
    
    setCurrentStep('profile')
  }

  const handleProfileComplete = () => {
    setCurrentStep('complete')
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/candidate/dashboard')
    }, 2000)
  }

  return (
    <RoleProtectedRoute allowedRoles={['candidate']}>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8">
            <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-dark dark:text-gray-300 mb-8">
              Let's get to know you better. This will help us find the best matches for you.
            </p>

            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${currentStep === 'onboarding' ? 'text-black dark:text-white' : 'text-gray-dark dark:text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === 'onboarding' 
                      ? 'bg-black dark:bg-gray text-white dark:text-black' 
                      : onboardingCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 dark:bg-[#2a2a2a] text-gray-dark dark:text-gray-400'
                  }`}>
                    {onboardingCompleted ? '✓' : '1'}
                  </div>
                  <span className="ml-2 font-medium">Onboarding Questions</span>
                </div>
                <div className="flex-1 h-1 mx-4 bg-gray-200 dark:bg-[#2a2a2a]">
                  <div className={`h-full transition-all ${
                    onboardingCompleted ? 'bg-black dark:bg-gray' : 'bg-gray-200 dark:bg-[#2a2a2a]'
                  }`} style={{ width: onboardingCompleted ? '100%' : '0%' }}></div>
                </div>
                <div className={`flex items-center ${currentStep === 'profile' ? 'text-black dark:text-white' : 'text-gray-dark dark:text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === 'profile'
                      ? 'bg-black dark:bg-gray text-white dark:text-black'
                      : 'bg-gray-300 dark:bg-[#2a2a2a] text-gray-dark dark:text-gray-400'
                  }`}>
                    2
                  </div>
                  <span className="ml-2 font-medium">Profile Details</span>
                </div>
              </div>
            </div>

            {/* Content */}
            {currentStep === 'onboarding' && (
              <OnboardingQuestions onComplete={handleOnboardingComplete} />
            )}

            {currentStep === 'profile' && (
              <ProfileForm onComplete={handleProfileComplete} />
            )}

            {currentStep === 'complete' && (
              <div className="text-center py-12">
                <div className="text-green-600 dark:text-green-400 text-5xl mb-4">✓</div>
                <h3 className="text-xl font-semibold text-black dark:text-gray mb-2">
                  Profile Complete!
                </h3>
                <p className="text-gray-dark dark:text-gray-dark">
                  Redirecting to your dashboard...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  )
}

