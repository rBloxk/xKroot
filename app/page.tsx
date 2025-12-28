'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import HeroSection from '@/components/HeroSection'
import HowItWorksSection from '@/components/HowItWorksSection'
import FeaturesSectionHome from '@/components/FeaturesSectionHome'
import StatsSection from '@/components/StatsSection'
import TestimonialsSection from '@/components/TestimonialsSection'
import CTASection from '@/components/CTASection'
import Footer from '@/components/Footer'

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user) {
      // Redirect authenticated users to their role-specific home page
      if (user.user_type === 'candidate') {
        router.push('/candidate/opportunities')
      } else if (user.user_type === 'company') {
        router.push('/company/candidates')
      }
    }
  }, [authLoading, user, router])

  // Show landing page for unauthenticated users or while loading
  return (
    <div className="min-h-screen">
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSectionHome />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
   
    </div>
  )
}
