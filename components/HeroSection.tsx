'use client'

import Link from 'next/link'

export default function HeroSection() {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features')
    featuresSection?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative py-20 md:py-32 bg-beige-light dark:bg-black transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#004bff]/50 dark:border-white/20 bg-[#004bff]/20 dark:bg-[#004bff]/30 backdrop-blur-sm mb-8 animate-fade-in">
                <svg className="w-4 h-4 text-[#004bff] dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-semibold text-[#004bff] dark:text-white">AI-Powered Hiring Platform</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-black dark:text-white leading-tight animate-fade-in delay-100">
                Find Your
                <span className="block text-[#004bff] dark:text-[#004bff]">Perfect Match</span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-dark dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-fade-in delay-200">
                Connect talented candidates with innovative companies. Our AI-powered platform makes hiring and job searching smarter, faster, and more effective.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in delay-300">
                <Link
                  href="/signup"
                  className="px-8 py-4 text-base font-semibold text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                >
                  Get Started
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <button
                  onClick={scrollToFeatures}
                  className="px-8 py-4 text-base font-semibold text-black dark:text-white bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-colors"
                >
                  Learn More
                </button>
              </div>
            </div>
            
            {/* Right: Visual */}
            <div className="relative animate-fade-in-up delay-400">
              <div className="glass rounded-2xl p-8 border border-gray-300 dark:border-[#333333]">
                <div className="grid grid-cols-2 gap-4">
                  {/* Candidate Card */}
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-300 dark:border-[#333333]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-black dark:text-gray">Candidate</div>
                        <div className="text-xs text-gray-dark dark:text-gray-300">Profile Match</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div className="h-full bg-[#004bff] rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <div className="text-xs text-gray-dark dark:text-gray-300">85% Match</div>
                    </div>
                  </div>
                  
                  {/* Company Card */}
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-300 dark:border-[#333333]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-black dark:text-gray">Company</div>
                        <div className="text-xs text-gray-dark dark:text-gray-300">Active Roles</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-black dark:text-gray">12</div>
                      <div className="text-xs text-gray-dark dark:text-gray-300">Open Positions</div>
                    </div>
                  </div>
                  
                  {/* Match Indicator */}
                  <div className="col-span-2 bg-gradient-to-r from-[#004bff] to-blue-500 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold mb-1">AI Match Found</div>
                        <div className="text-xs opacity-90">Perfect fit detected</div>
                      </div>
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

