'use client'

import { useState, useEffect, useRef } from 'react'

interface Stat {
  value: number
  label: string
  suffix?: string
  prefix?: string
}

const stats: Stat[] = [
  { value: 1000, label: 'Active Candidates', suffix: '+' },
  { value: 250, label: 'Companies', suffix: '+' },
  { value: 5000, label: 'Successful Matches', suffix: '+' },
  { value: 92, label: 'Match Accuracy', suffix: '%' },
]

export default function StatsSection() {
  const [counts, setCounts] = useState(stats.map(() => 0))
  const [hasAnimated, setHasAnimated] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            animateCounters()
          }
        })
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [hasAnimated])

  const animateCounters = () => {
    stats.forEach((stat, index) => {
      const duration = 2000 // 2 seconds
      const steps = 60
      const increment = stat.value / steps
      const stepDuration = duration / steps

      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= stat.value) {
          setCounts((prev) => {
            const newCounts = [...prev]
            newCounts[index] = stat.value
            return newCounts
          })
          clearInterval(timer)
        } else {
          setCounts((prev) => {
            const newCounts = [...prev]
            newCounts[index] = Math.floor(current)
            return newCounts
          })
        }
      }, stepDuration)
    })
  }

  return (
    <section ref={sectionRef} className="py-20 md:py-32 bg-beige-light dark:bg-black transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl md:text-5xl font-bold text-[#004bff] dark:text-[#004bff] mb-2">
                  {stat.prefix}
                  {counts[index].toLocaleString()}
                  {stat.suffix}
                </div>
                <div className="text-sm md:text-base text-gray-dark dark:text-gray-300 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

