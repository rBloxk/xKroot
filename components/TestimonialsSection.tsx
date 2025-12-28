'use client'

import { useState, useEffect } from 'react'

interface Testimonial {
  id: number
  name: string
  role: string
  company: string
  content: string
  type: 'candidate' | 'company'
  avatar?: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Software Engineer',
    company: 'Tech Startup',
    content: 'xKroot helped me find my dream job in just 2 weeks! The AI matching was incredibly accurate, and I connected with companies that truly aligned with my values and skills.',
    type: 'candidate',
  },
  {
    id: 2,
    name: 'Michael Rodriguez',
    role: 'CEO',
    company: 'Innovate Labs',
    content: 'We\'ve hired 5 amazing developers through xKroot. The platform understands what we\'re looking for and presents candidates who are not just qualified, but also a great cultural fit.',
    type: 'company',
  },
  {
    id: 3,
    name: 'Emily Johnson',
    role: 'Product Designer',
    company: 'Design Studio',
    content: 'The comprehensive profile system let me showcase my work beyond just a resume. I got matched with companies that appreciated my creative approach and design philosophy.',
    type: 'candidate',
  },
  {
    id: 4,
    name: 'David Park',
    role: 'CTO',
    company: 'ScaleUp Inc',
    content: 'The quality of candidates we receive is outstanding. xKroot\'s AI does the heavy lifting, so we can focus on what matters - building relationships with great talent.',
    type: 'company',
  },
  {
    id: 5,
    name: 'Jessica Martinez',
    role: 'Data Scientist',
    company: 'AI Research',
    content: 'I love how xKroot goes beyond traditional job boards. The skills assessment and matching algorithm really understand my expertise and career goals.',
    type: 'candidate',
  },
  {
    id: 6,
    name: 'Robert Thompson',
    role: 'Founder',
    company: 'StartupXYZ',
    content: 'As a growing startup, we need to move fast. xKroot has cut our hiring time in half while improving the quality of our hires. It\'s been a game-changer.',
    type: 'company',
  },
]

export default function TestimonialsSection() {
  const [activeType, setActiveType] = useState<'all' | 'candidate' | 'company'>('all')
  const [currentIndex, setCurrentIndex] = useState(0)

  const filteredTestimonials = 
    activeType === 'all' 
      ? testimonials 
      : testimonials.filter(t => t.type === activeType)

  const displayedTestimonials = filteredTestimonials.slice(currentIndex, currentIndex + 3)

  useEffect(() => {
    if (displayedTestimonials.length < 3 && currentIndex > 0) {
      setCurrentIndex(0)
    }
  }, [activeType, displayedTestimonials.length, currentIndex])

  const nextTestimonials = () => {
    if (currentIndex + 3 < filteredTestimonials.length) {
      setCurrentIndex(currentIndex + 3)
    } else {
      setCurrentIndex(0)
    }
  }

  const prevTestimonials = () => {
    if (currentIndex - 3 >= 0) {
      setCurrentIndex(currentIndex - 3)
    } else {
      setCurrentIndex(Math.max(0, filteredTestimonials.length - 3))
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <section className="py-20 md:py-32 bg-beige-light dark:bg-black transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#004bff]/50 dark:border-white/20 bg-[#004bff]/20 dark:bg-[#004bff]/30 backdrop-blur-sm mb-6">
              <span className="text-sm font-semibold text-[#004bff] dark:text-white">Testimonials</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-black dark:text-white">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-dark dark:text-gray-300 max-w-2xl mx-auto">
              Real stories from candidates and companies who have found success with xKroot.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center mb-12 animate-fade-in delay-100">
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-[#1a1a1a] p-1 border border-gray-300 dark:border-[#333333]">
              <button
                onClick={() => {
                  setActiveType('all')
                  setCurrentIndex(0)
                }}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  activeType === 'all'
                    ? 'bg-white dark:bg-[#1e1e1e] text-black dark:text-white'
                    : 'text-gray-dark dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setActiveType('candidate')
                  setCurrentIndex(0)
                }}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  activeType === 'candidate'
                    ? 'bg-white dark:bg-[#1e1e1e] text-black dark:text-white'
                    : 'text-gray-dark dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Candidates
              </button>
              <button
                onClick={() => {
                  setActiveType('company')
                  setCurrentIndex(0)
                }}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  activeType === 'company'
                    ? 'bg-white dark:bg-[#1e1e1e] text-black dark:text-white'
                    : 'text-gray-dark dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Companies
              </button>
            </div>
          </div>

          {/* Testimonials Grid */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
              {displayedTestimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 hover:border-[#004bff]/50 dark:hover:border-[#004bff] transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Quote Icon */}
                  <div className="mb-4">
                    <svg className="w-8 h-8 text-[#004bff] dark:text-[#004bff]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>

                  {/* Content */}
                  <p className="text-gray-dark dark:text-gray-300 mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#004bff]/20 dark:bg-[#004bff]/30 flex items-center justify-center text-[#004bff] dark:text-[#004bff] font-semibold">
                      {getInitials(testimonial.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-black dark:text-gray">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-dark dark:text-gray-400">
                        {testimonial.role}
                        {testimonial.company && ` at ${testimonial.company}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {filteredTestimonials.length > 3 && (
              <div className="flex justify-center gap-4">
                <button
                  onClick={prevTestimonials}
                  className="w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333333] flex items-center justify-center text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                  aria-label="Previous testimonials"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextTestimonials}
                  className="w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333333] flex items-center justify-center text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                  aria-label="Next testimonials"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

