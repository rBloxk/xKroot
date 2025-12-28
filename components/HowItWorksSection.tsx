'use client'

import { useState } from 'react'

const candidateSteps = [
  {
    number: '01',
    title: 'Create Your Profile',
    description: 'Build a comprehensive profile showcasing your skills, experience, and career goals. Go beyond a resume.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Get Matched',
    description: 'Our AI analyzes your profile and finds opportunities that match your skills, culture fit, and career aspirations.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Apply & Connect',
    description: 'Review your matches, apply to roles that interest you, and connect directly with hiring managers.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
]

const companySteps = [
  {
    number: '01',
    title: 'Post Your Roles',
    description: 'Create detailed job postings that describe not just the role, but your company culture and what you\'re looking for.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'AI Matching',
    description: 'Our intelligent system finds qualified candidates who match your requirements, culture, and team dynamics.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Hire Talent',
    description: 'Review matched candidates, conduct interviews, and hire the perfect fit for your team faster than ever.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
]

export default function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<'candidate' | 'company'>('candidate')
  const steps = activeTab === 'candidate' ? candidateSteps : companySteps

  return (
    <section className="py-20 md:py-32 bg-white dark:bg-black transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#004bff]/50 dark:border-white/20 bg-[#004bff]/20 dark:bg-[#004bff]/30 backdrop-blur-sm mb-6">
              <span className="text-sm font-semibold text-[#004bff] dark:text-white">How It Works</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-black dark:text-white">
              Simple. Smart. Effective.
            </h2>
            <p className="text-lg text-gray-dark dark:text-gray-300 max-w-2xl mx-auto">
              Whether you're looking for opportunities or talent, our platform makes the process seamless.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-12 animate-fade-in delay-100">
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-[#1a1a1a] p-1 border border-gray-300 dark:border-[#333333]">
              <button
                onClick={() => setActiveTab('candidate')}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'candidate'
                    ? 'bg-white dark:bg-[#1e1e1e] text-black dark:text-white'
                    : 'text-gray-dark dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                For Candidates
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'company'
                    ? 'bg-white dark:bg-[#1e1e1e] text-black dark:text-white'
                    : 'text-gray-dark dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                For Companies
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up delay-200">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 hover:border-[#004bff]/50 dark:hover:border-[#004bff] transition-colors"
              >
                {/* Number Badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-[#004bff] text-white flex items-center justify-center font-bold text-lg">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="w-14 h-14 rounded-lg bg-[#004bff]/20 dark:bg-[#004bff]/30 flex items-center justify-center text-[#004bff] dark:text-[#004bff] mb-4">
                  {step.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-black dark:text-gray mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-dark dark:text-gray-300 leading-relaxed">
                  {step.description}
                </p>
                
                {/* Connector Line (not on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300 dark:bg-[#333333]">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#004bff]"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

