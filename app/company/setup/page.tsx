'use client'

import { useRouter } from 'next/navigation'
import RoleProtectedRoute from '@/components/RoleProtectedRoute'
import CompanyProfileForm from '@/components/company/CompanyProfileForm'

export default function CompanySetupPage() {
  const router = useRouter()

  const handleProfileComplete = () => {
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/company/dashboard')
    }, 2000)
  }

  return (
    <RoleProtectedRoute allowedRoles={['company']}>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-black">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8">
            <h1 className="text-3xl font-bold text-black dark:text-gray mb-2">
              Complete Your Company Profile
            </h1>
            <p className="text-gray-dark dark:text-gray-300 mb-8">
              Tell us about your company to start finding the right candidates.
            </p>

            <CompanyProfileForm onComplete={handleProfileComplete} />
          </div>
        </div>
      </div>
    </RoleProtectedRoute>
  )
}

