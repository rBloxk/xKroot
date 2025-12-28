'use client'

import { useState, useEffect } from 'react'

const features = [
  {
    id: 'calendar',
    label: 'Meaningful calendar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    description: '',
  },
  {
    id: 'analytics',
    label: 'Insightful analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    description: '',
  },
  {
    id: 'integration',
    label: 'Seamless integration',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    description: 'Enhance productivity, streamline processes, and keep everything connected without disrupting your current setup.',
  },
  {
    id: 'boards',
    label: 'Effortless boards',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
      </svg>
    ),
    description: '',
  },
]

const integrations = [
  {
    id: 'springfield',
    name: 'Springfield',
    domain: 'springfield.com',
    icon: (
      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
    ),
    progress: 100,
  },
  {
    id: 'luminous',
    name: 'Luminous',
    domain: 'luminous.com',
    icon: (
      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    progress: 100,
  },
  {
    id: 'cloud',
    name: 'Cloud',
    domain: 'cloud.com',
    icon: (
      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      </div>
    ),
    progress: 100,
  },
]

export default function CollaborationSection() {
  const [activeFeature, setActiveFeature] = useState('integration')
  const [progressValues, setProgressValues] = useState([0, 0, 0])

  useEffect(() => {
    // Animate progress bars on mount
    const timer = setTimeout(() => {
      setProgressValues([100, 100, 100])
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  const currentFeature = features.find(f => f.id === activeFeature)

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-4 animate-fade-in">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-green-500">Features</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-black dark:text-gray animate-fade-in delay-100">
          Explore our most powerful features
        </h2>
        <p className="text-lg text-center text-gray-dark dark:text-gray-dark mb-16 max-w-2xl mx-auto animate-fade-in delay-200">
          Each feature is crafted to provide seamless integration and performance, ensuring a high level of functionality and efficiency.
        </p>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in-up delay-300">
          {/* Left: Feature List */}
          <div className="space-y-6">
            {features.map((feature) => (
              <div
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`cursor-pointer transition-all duration-300 ${
                  activeFeature === feature.id
                    ? 'border-l-4 border-black dark:border-gray pl-4'
                    : 'pl-4 border-l-4 border-transparent hover:border-gray-dark dark:hover:border-gray-dark'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`${
                    activeFeature === feature.id
                      ? 'text-black dark:text-gray'
                      : 'text-gray-dark dark:text-gray-dark'
                  }`}>
                    {feature.icon}
                  </div>
                  <h3 className={`text-lg font-semibold ${
                    activeFeature === feature.id
                      ? 'text-black dark:text-gray'
                      : 'text-gray-dark dark:text-gray-dark'
                  }`}>
                    {feature.label}
                  </h3>
                </div>
                {feature.description && activeFeature === feature.id && (
                  <p className="text-sm text-gray-dark dark:text-gray-dark ml-8 leading-relaxed animate-fade-in">
                    {feature.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Right: Integration UI */}
          <div className="glass rounded-2xl p-6">
            {/* Search Bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-dark dark:text-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 glass-strong rounded-lg text-black dark:text-gray placeholder-gray-dark dark:placeholder-gray-dark focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-gray"
                />
              </div>
              <button className="p-2 glass-strong rounded-lg hover:glass transition-all">
                <svg className="w-5 h-5 text-gray-dark dark:text-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Integration List */}
            <div className="space-y-4 mb-6">
              {integrations.map((integration, index) => (
                <div key={integration.id} className="glass-strong rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {integration.icon}
                      <div>
                        <div className="font-semibold text-black dark:text-gray">{integration.name}</div>
                        <div className="text-xs text-gray-dark dark:text-gray-dark">{integration.domain}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">Connected</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 glass rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressValues[index]}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Integration & Settings */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20 dark:border-gray-dark/30">
              <button className="flex items-center gap-2 px-4 py-2 glass-strong rounded-lg hover:glass transition-all text-black dark:text-gray font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add integration</span>
              </button>
              <button className="p-2 glass-strong rounded-lg hover:glass transition-all">
                <svg className="w-5 h-5 text-gray-dark dark:text-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


