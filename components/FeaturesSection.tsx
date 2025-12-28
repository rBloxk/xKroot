'use client'

import { useState } from 'react'
import Link from 'next/link'

const features = [
  {
    id: 'calendar',
    label: 'Meaningful calendar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Calendar that organizes your life',
    description: 'Our intelligent calendar system helps you manage your time effectively, with smart scheduling and automated reminders to keep you on track.',
    visualization: (
      <div className="glass rounded-2xl p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold mb-2 text-black dark:text-gray">28</div>
          <div className="text-sm text-gray-dark dark:text-gray-dark">Events this month</div>
        </div>
      </div>
    ),
  },
  {
    id: 'analytics',
    label: 'Insightful analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Analytics that power smarter decisions',
    description: 'Our cutting-edge analytics deliver detailed trends, patterns, and actionable intelligence to help you make informed decisions.',
    visualization: (
      <div className="glass rounded-2xl p-6 h-full">
        <div className="flex justify-end mb-4">
          <svg className="w-5 h-5 text-gray-dark dark:text-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        
        {/* Donut Chart */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Purple segment (72%) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgb(168, 85, 247)"
              strokeWidth="20"
              strokeDasharray={`${2 * Math.PI * 40 * 0.72} ${2 * Math.PI * 40}`}
              strokeDashoffset="0"
              className="transition-all duration-500"
            />
            {/* Orange segment (18%) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgb(249, 115, 22)"
              strokeWidth="20"
              strokeDasharray={`${2 * Math.PI * 40 * 0.18} ${2 * Math.PI * 40}`}
              strokeDashoffset={`-${2 * Math.PI * 40 * 0.72}`}
              className="transition-all duration-500"
            />
            {/* Green segment (10%) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgb(34, 197, 94)"
              strokeWidth="20"
              strokeDasharray={`${2 * Math.PI * 40 * 0.10} ${2 * Math.PI * 40}`}
              strokeDashoffset={`-${2 * Math.PI * 40 * 0.90}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-black dark:text-gray">1,248</div>
            <div className="text-sm text-gray-dark dark:text-gray-dark">Total</div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-dark dark:text-gray-dark">Marketing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-black dark:text-gray">72%</span>
              <span className="text-xs text-green-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                +19.8%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-dark dark:text-gray-dark">Organic search</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-black dark:text-gray">18%</span>
              <span className="text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                -12.4%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-dark dark:text-gray-dark">Direct traffic</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-black dark:text-gray">10%</span>
              <span className="text-xs text-green-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                +14.5%
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'integration',
    label: 'Seamless integration',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    title: 'Integrations that connect everything',
    description: 'Connect all your favorite tools and platforms seamlessly. Our integration system ensures everything works together in perfect harmony.',
    visualization: (
      <div className="glass rounded-2xl p-6 h-full flex items-center justify-center">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-16 h-16 glass-strong rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 glass rounded"></div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'boards',
    label: 'Effortless boards',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
      </svg>
    ),
    title: 'Boards that organize your work',
    description: 'Visual project management made simple. Organize tasks, track progress, and collaborate with your team using our intuitive board system.',
    visualization: (
      <div className="glass rounded-2xl p-6 h-full flex items-center justify-center">
        <div className="grid grid-cols-3 gap-3 w-full">
          {['To Do', 'In Progress', 'Done'].map((col, idx) => (
            <div key={col} className="space-y-2">
              <div className="text-xs font-semibold text-gray-dark dark:text-gray-dark mb-2">{col}</div>
              {[1, 2].map((i) => (
                <div key={i} className="glass-strong rounded-lg p-2 h-16"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState('analytics')

  const currentFeature = features.find(f => f.id === activeFeature) || features[1]

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-4 animate-fade-in">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-gray-dark dark:text-gray-dark">Features</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-black dark:text-gray animate-fade-in delay-100">
          Suited for every scenario
        </h2>
        <p className="text-lg text-center text-gray-dark dark:text-gray-dark mb-12 max-w-2xl mx-auto animate-fade-in delay-200">
          Explore the comprehensive suite of tools designed to enhance your productivity and streamline your workflow.
        </p>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in delay-300">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                activeFeature === feature.id
                  ? 'glass-strong text-black dark:text-gray border-2 border-black dark:border-gray'
                  : 'glass text-gray-dark dark:text-gray-dark hover:glass-strong'
              }`}
            >
              {feature.icon}
              <span className="text-sm font-medium">{feature.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up delay-400">
          {/* Left: Description */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              {currentFeature.icon}
              <span className="text-sm font-semibold text-gray-dark dark:text-gray-dark">
                {currentFeature.label}
              </span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-gray">
              {currentFeature.title}
            </h3>
            <p className="text-lg text-gray-dark dark:text-gray-dark mb-6 leading-relaxed">
              {currentFeature.description}
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 glass-strong px-6 py-3 rounded-full text-black dark:text-gray font-semibold w-fit hover:scale-105 transition-transform"
            >
              Learn more
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Right: Visualization */}
          <div className="h-[400px]">
            {currentFeature.visualization}
          </div>
        </div>
      </div>
    </section>
  )
}


