'use client'

import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="py-20 md:py-32 bg-white dark:bg-black transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-strong rounded-2xl p-8 md:p-12 text-center border border-gray-300 dark:border-[#404040] animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
              Ready to Find Your Perfect Match?
            </h2>
            <p className="text-lg text-gray-dark dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of candidates and companies who are already using xKroot to make better hiring decisions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/signup"
                className="px-8 py-4 text-base font-semibold text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Join as Candidate
              </Link>
              <Link
                href="/signup"
                className="px-8 py-4 text-base font-semibold text-white bg-[#004bff] dark:bg-[#004bff] hover:bg-[#0038cc] dark:hover:bg-[#0038cc] rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Join as Company
              </Link>
            </div>
            
            <p className="text-sm text-gray-dark dark:text-gray-300">
              Already have an account?{' '}
              <Link href="/login" className="text-[#004bff] dark:text-[#004bff] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

