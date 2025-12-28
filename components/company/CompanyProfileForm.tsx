'use client'

import { useState, useEffect } from 'react'

interface CompanyProfileFormProps {
  onComplete: () => void
}

interface FormStep {
  key: keyof FormData
  label: string
  placeholder: string
  type: 'text' | 'textarea' | 'select' | 'tech-select'
  required?: boolean
  options?: { value: string; label: string }[]
  suggestions?: string[]
  helperText?: string
}

interface FormData {
  company_name: string
  company_size: string
  industry: string
  description: string
  website_url: string
  location: string
  headquarters_location: string
  company_type: string
  funding_stage: string
  startup_stage: string
  company_culture: string
  benefits_offered: string
  tech_stack: string
}

const formSteps: FormStep[] = [
  {
    key: 'company_name',
    label: "What's your company name?",
    placeholder: 'Enter your company name',
    type: 'text',
    required: true,
    helperText: 'This is how candidates will find you'
  },
  {
    key: 'description',
    label: 'Tell us about your company',
    placeholder: 'Describe what your company does, your mission, and what makes you unique...',
    type: 'textarea',
    helperText: 'Help candidates understand your company better'
  },
  {
    key: 'company_size',
    label: 'How many people work at your company?',
    placeholder: 'Select company size',
    type: 'select',
    options: [
      { value: 'startup', label: 'Startup (1-10 employees)' },
      { value: 'small', label: 'Small (11-50 employees)' },
      { value: 'medium', label: 'Medium (51-200 employees)' },
      { value: 'large', label: 'Large (201-1000 employees)' },
      { value: 'enterprise', label: 'Enterprise (1000+ employees)' }
    ]
  },
  {
    key: 'industry',
    label: 'What industry are you in?',
    placeholder: 'e.g., Technology, Healthcare, Finance, E-commerce',
    type: 'tech-select',
    helperText: 'Click the + button to add industries',
    suggestions: [
      // Technology & Software
      'Technology', 'Software', 'SaaS', 'Cloud Computing', 'Cybersecurity', 'Artificial Intelligence',
      'Machine Learning', 'Data Science', 'Blockchain', 'Cryptocurrency', 'Fintech', 'EdTech',
      'HealthTech', 'PropTech', 'AdTech', 'MarTech', 'LegalTech', 'HR Tech',
      // E-commerce & Retail
      'E-commerce', 'Retail', 'Online Marketplace', 'Fashion', 'Consumer Goods', 'Luxury Goods',
      // Finance & Banking
      'Finance', 'Banking', 'Investment', 'Insurance', 'Wealth Management', 'Trading',
      'Payment Processing', 'Accounting', 'Financial Services',
      // Healthcare & Biotech
      'Healthcare', 'Biotechnology', 'Pharmaceuticals', 'Medical Devices', 'Telemedicine',
      'Health & Wellness', 'Life Sciences', 'Clinical Research',
      // Media & Entertainment
      'Media', 'Entertainment', 'Gaming', 'Streaming', 'Publishing', 'Music', 'Film & TV',
      'Social Media', 'Content Creation', 'Digital Marketing',
      // Education
      'Education', 'E-Learning', 'Online Education', 'Training', 'Tutoring',
      // Real Estate & Construction
      'Real Estate', 'Construction', 'Architecture', 'Property Management', 'Urban Planning',
      // Manufacturing & Industrial
      'Manufacturing', 'Industrial', 'Automotive', 'Aerospace', 'Energy', 'Oil & Gas',
      'Renewable Energy', 'Utilities',
      // Transportation & Logistics
      'Transportation', 'Logistics', 'Supply Chain', 'Shipping', 'Freight', 'Delivery',
      // Food & Beverage
      'Food & Beverage', 'Restaurant', 'Food Delivery', 'Agriculture', 'Farming',
      // Hospitality & Tourism
      'Hospitality', 'Tourism', 'Travel', 'Hotels', 'Airlines',
      // Professional Services
      'Consulting', 'Legal Services', 'Accounting Services', 'Marketing', 'Advertising',
      'Public Relations', 'Design', 'Architecture Services',
      // Non-Profit & Government
      'Non-Profit', 'Government', 'Public Sector', 'NGO',
      // Other
      'Telecommunications', 'Telecom', 'Internet', 'Telecommunications', 'Utilities',
      'Research', 'R&D', 'Science', 'Engineering'
    ]
  },
  {
    key: 'startup_stage',
    label: 'What stage is your company at?',
    placeholder: 'Select startup stage',
    type: 'select',
    options: [
      { value: 'idea', label: 'Idea Stage' },
      { value: 'mvp', label: 'MVP Stage' },
      { value: 'scale', label: 'Scale Stage' }
    ]
  },
  {
    key: 'company_type',
    label: 'What type of company are you?',
    placeholder: 'Select company type',
    type: 'select',
    options: [
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Private' },
      { value: 'nonprofit', label: 'Nonprofit' },
      { value: 'government', label: 'Government' }
    ]
  },
  {
    key: 'funding_stage',
    label: 'What is your funding stage?',
    placeholder: 'e.g., Seed, Series A, Series B, IPO, Bootstrapped',
    type: 'text',
    helperText: 'Optional - helps candidates understand your company stage'
  },
  {
    key: 'website_url',
    label: 'What is your company website?',
    placeholder: 'https://yourcompany.com',
    type: 'text',
    helperText: 'Where can candidates learn more about you?'
  },
  {
    key: 'location',
    label: 'Where is your company located?',
    placeholder: 'City, Country',
    type: 'text',
    helperText: 'Primary location of your operations'
  },
  {
    key: 'headquarters_location',
    label: 'Where is your headquarters?',
    placeholder: 'City, Country',
    type: 'text',
    helperText: 'Optional - if different from main location'
  },
  {
    key: 'tech_stack',
    label: 'What technologies do you use?',
    placeholder: 'e.g., React, Node.js, AWS, PostgreSQL, Python',
    type: 'tech-select',
    helperText: 'Click the + button to add technologies',
    suggestions: [
      // Frontend
      'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'TypeScript', 'JavaScript',
      'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'Material-UI', 'Styled Components',
      // Backend
      'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Ruby on Rails',
      'Spring Boot', 'ASP.NET', 'Laravel', 'PHP', 'Go', 'Rust',
      // Databases
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra',
      'DynamoDB', 'Firebase', 'Supabase', 'Prisma', 'SQLite',
      // Cloud & DevOps
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform',
      'Jenkins', 'GitHub Actions', 'CI/CD', 'Linux', 'Nginx', 'Apache',
      // Mobile
      'React Native', 'Flutter', 'Swift', 'Ionic', 'Xamarin', 'Android', 'iOS', 'Kotlin', 'Java', 'C++', 'C#', '.NET', 'Scala', 'R',
      // Tools & Others
      'Git', 'GraphQL', 'REST API', 'WebSocket', 'Microservices', 'Serverless',
      'Machine Learning', 'TensorFlow', 'PyTorch', 'Data Science', 'Blockchain',
      'Python', 'Java', 'C++', 'C#', '.NET', 'Scala', 'R',
      // AI
      'AI', 'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision',
      'Robotics', 'Automation', 'Blockchain', 'Cryptocurrency', 'Fintech', 'EdTech',
      'HealthTech', 'PropTech', 'AdTech', 'MarTech', 'LegalTech', 'HR Tech',
      'E-commerce', 'Retail', 'Online Marketplace', 'Fashion', 'Consumer Goods', 'Luxury Goods',
      'Finance', 'Banking', 'Investment', 'Insurance', 'Wealth Management', 'Trading',
      'Payment Processing', 'Accounting', 'Financial Services',
    ]
  },
  {
    key: 'benefits_offered',
    label: 'What benefits do you offer?',
    placeholder: 'e.g., Health Insurance, Remote Work, Stock Options, Flexible Hours',
    type: 'tech-select',
    helperText: 'Click the + button to add benefits',
    suggestions: [
      // Health & Wellness
      'Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance',
      'Mental Health Support', 'Gym Membership', 'Wellness Programs', 'Fitness Allowance',
      // Work Arrangements
      'Remote Work', 'Hybrid Work', 'Flexible Hours', 'Flexible Schedule',
      'Work From Home', '4-Day Work Week', 'Unlimited PTO', 'Paid Time Off',
      // Financial
      'Stock Options', 'Equity', '401(k)', 'Retirement Plan', 'Pension',
      'Performance Bonus', 'Signing Bonus', 'Profit Sharing', 'Salary Reviews',
      // Professional Development
      'Learning Budget', 'Training Programs', 'Conference Attendance', 'Certification Support',
      'Career Development', 'Mentorship Program', 'Internal Training', 'Online Courses',
      // Perks & Culture
      'Free Meals', 'Snacks & Drinks', 'Company Events', 'Team Building',
      'Pet-Friendly Office', 'Game Room', 'Nap Room', 'On-site Gym',
      // Time Off
      'Paid Holidays', 'Sick Leave', 'Maternity Leave', 'Paternity Leave',
      'Bereavement Leave', 'Sabbatical', 'Personal Days',
      // Other
      'Commuter Benefits', 'Transportation Allowance', 'Phone Allowance', 'Laptop Provided',
      'Home Office Stipend', 'Childcare Support', 'Relocation Assistance', 'Travel Opportunities'
    ]
  },
  {
    key: 'company_culture',
    label: 'Describe your company culture',
    placeholder: 'Tell us about your values, work style, and what makes your culture unique...',
    type: 'textarea',
    helperText: 'Help candidates understand your work environment'
  }
]

export default function CompanyProfileForm({ onComplete }: CompanyProfileFormProps) {
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    company_size: '',
    industry: '',
    description: '',
    website_url: '',
    location: '',
    headquarters_location: '',
    company_type: '',
    funding_stage: '',
    startup_stage: '',
    company_culture: '',
    benefits_offered: '',
    tech_stack: '',
  })

  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/company/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          setFormData({
            company_name: data.profile.company_name || '',
            company_size: data.profile.company_size || '',
            industry: data.profile.industry || '',
            description: data.profile.description || '',
            website_url: data.profile.website_url || '',
            location: data.profile.location || '',
            headquarters_location: data.profile.headquarters_location || '',
            company_type: data.profile.company_type || '',
            funding_stage: data.profile.funding_stage || '',
            startup_stage: data.profile.startup_stage || '',
            company_culture: data.profile.company_culture 
              ? JSON.stringify(data.profile.company_culture, null, 2)
              : '',
            benefits_offered: Array.isArray(data.profile.benefits_offered)
              ? data.profile.benefits_offered.join(', ')
              : '',
            tech_stack: Array.isArray(data.profile.tech_stack)
              ? data.profile.tech_stack.join(', ')
              : '',
          })
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get visible steps based on conditions
  const getVisibleSteps = () => {
    return formSteps.filter(step => {
      // Show startup_stage only if company_size is 'startup'
      if (step.key === 'startup_stage' && formData.company_size !== 'startup') {
        return false
      }
      return true
    })
  }

  const handleNext = async () => {
    const visibleSteps = getVisibleSteps()
    const currentField = visibleSteps[currentStep]
    
    // Validate required fields
    if (currentField.required && !formData[currentField.key]) {
      setError(`${currentField.label} is required`)
      return
    }

    setError('')

    // If it's the last step, save the form
    if (currentStep === visibleSteps.length - 1) {
      await handleSubmit()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }


  const handleSubmit = async () => {
    if (!formData.company_name) {
      setError('Company name is required')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      // Convert company_culture to JSON if it's plain text
      let companyCultureJson = formData.company_culture
      if (formData.company_culture) {
        try {
          // Try to parse as JSON first
          JSON.parse(formData.company_culture)
          // If successful, it's already valid JSON
          companyCultureJson = formData.company_culture
        } catch (e) {
          // If not valid JSON, convert plain text to JSON object
          companyCultureJson = JSON.stringify({
            description: formData.company_culture
          })
        }
      }

      const submitData = {
        ...formData,
        company_culture: companyCultureJson || null
      }

      const response = await fetch('/api/company/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (response.ok) {
        setTimeout(() => {
          onComplete()
        }, 500)
      } else {
        setError(data.error || 'Failed to save profile')
        setIsSaving(false)
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      setIsSaving(false)
    }
  }

  const handleChange = (value: string) => {
    const visibleSteps = getVisibleSteps()
    const currentField = visibleSteps[currentStep]
    setFormData(prev => ({ ...prev, [currentField.key]: value }))
    setError('')
  }

  const handleAddTech = (tech: string) => {
    const visibleSteps = getVisibleSteps()
    const currentField = visibleSteps[currentStep]
    const currentTechs = formData[currentField.key] 
      ? formData[currentField.key].split(',').map(t => t.trim()).filter(t => t)
      : []
    
    if (!currentTechs.includes(tech)) {
      const updatedTechs = [...currentTechs, tech]
      setFormData(prev => ({ ...prev, [currentField.key]: updatedTechs.join(', ') }))
      setError('')
    }
  }

  const handleRemoveTech = (tech: string) => {
    const visibleSteps = getVisibleSteps()
    const currentField = visibleSteps[currentStep]
    const currentTechs = formData[currentField.key] 
      ? formData[currentField.key].split(',').map(t => t.trim()).filter(t => t)
      : []
    
    const updatedTechs = currentTechs.filter(t => t !== tech)
    setFormData(prev => ({ ...prev, [currentField.key]: updatedTechs.join(', ') }))
    setError('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    const visibleSteps = getVisibleSteps()
    const currentField = visibleSteps[currentStep]
    if (e.key === 'Enter' && currentField && currentField.type !== 'textarea') {
      e.preventDefault()
      handleNext()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-[#ffdf07] mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    )
  }

  const visibleSteps = getVisibleSteps()
  const currentField = visibleSteps[currentStep]
  const progress = ((currentStep + 1) / visibleSteps.length) * 100
  const currentValue = formData[currentField.key]
  const selectedTechs = (currentField.key === 'tech_stack' || currentField.key === 'benefits_offered' || currentField.key === 'industry') && currentValue
    ? currentValue.split(',').map(t => t.trim()).filter(t => t)
    : []
  const availableTechs = currentField.suggestions?.filter(tech => !selectedTechs.includes(tech)) || []

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-dark dark:text-gray-400">
            Step {currentStep + 1} of {visibleSteps.length}
          </span>
          <span className="text-sm font-medium text-gray-dark dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#ffdf07] dark:bg-[#ffdf07] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Question Label */}
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4 leading-tight">
              {currentField.label}
            </h2>
            {currentField.helperText && (
              <p className="text-lg text-gray-dark dark:text-gray-400">
                {currentField.helperText}
              </p>
            )}
          </div>

          {/* Input Field */}
          <div className="mb-12">
            {currentField.type === 'tech-select' ? (
              <div className="space-y-6">
                {/* Selected Items */}
                {selectedTechs.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-3">
                      {currentField.key === 'benefits_offered' 
                        ? 'Selected Benefits:' 
                        : currentField.key === 'industry'
                        ? 'Selected Industries:'
                        : 'Selected Technologies:'}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {selectedTechs.map((tech) => (
                        <div
                          key={tech}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffdf07] dark:bg-[#ffdf07] text-black rounded-xl font-medium"
                        >
                          <span>{tech}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTech(tech)}
                            className="ml-1 hover:bg-black/10 rounded-full p-1 transition-colors"
                            aria-label={`Remove ${tech}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Items */}
                <div>
                  <p className="text-sm font-medium text-gray-dark dark:text-gray-400 mb-3">
                    {currentField.key === 'benefits_offered' 
                      ? (selectedTechs.length > 0 ? 'Add More Benefits:' : 'Select Benefits:')
                      : currentField.key === 'industry'
                      ? (selectedTechs.length > 0 ? 'Add More Industries:' : 'Select Industries:')
                      : (selectedTechs.length > 0 ? 'Add More Technologies:' : 'Select Technologies:')
                    }
                  </p>
                  <div className="max-h-[400px] overflow-y-auto border-2 border-gray-300 dark:border-[#333333] rounded-2xl p-4 bg-white dark:bg-[#1a1a1a]">
                    <div className="flex flex-wrap gap-3">
                      {availableTechs.map((tech) => (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => handleAddTech(tech)}
                          className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] hover:border-[#ffdf07] dark:hover:border-[#ffdf07] hover:bg-[#ffdf07]/10 dark:hover:bg-[#ffdf07]/10 transition-all duration-200 font-medium"
                        >
                          <span>{tech}</span>
                          <svg className="w-5 h-5 text-[#ffdf07]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : currentField.type === 'textarea' ? (
              <textarea
                value={currentValue}
                onChange={(e) => handleChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentField.placeholder}
                rows={6}
                className="w-full px-6 py-4 text-xl md:text-2xl border-2 border-gray-300 dark:border-[#333333] rounded-2xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-4 focus:ring-[#ffdf07]/30 dark:focus:ring-[#ffdf07]/30 focus:border-[#ffdf07] dark:focus:border-[#ffdf07] transition-all duration-200 resize-none"
                style={{ minHeight: '150px' }}
              />
            ) : currentField.type === 'select' ? (
              <select
                value={currentValue}
                onChange={(e) => handleChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-6 py-4 text-xl md:text-2xl border-2 border-gray-300 dark:border-[#333333] rounded-2xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-4 focus:ring-[#ffdf07]/30 dark:focus:ring-[#ffdf07]/30 focus:border-[#ffdf07] dark:focus:border-[#ffdf07] transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="">{currentField.placeholder}</option>
                {currentField.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={currentField.key === 'website_url' ? 'url' : 'text'}
                value={currentValue}
                onChange={(e) => handleChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentField.placeholder}
                className="w-full px-6 py-4 text-xl md:text-2xl border-2 border-gray-300 dark:border-[#333333] rounded-2xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-4 focus:ring-[#ffdf07]/30 dark:focus:ring-[#ffdf07]/30 focus:border-[#ffdf07] dark:focus:border-[#ffdf07] transition-all duration-200"
              />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 text-center">
              <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSaving}
                className="px-8 py-4 text-lg font-semibold text-black dark:text-white bg-white dark:bg-[#1a1a1a] border-2 border-gray-300 dark:border-[#333333] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={isSaving || (currentField.required && !currentValue)}
              className="px-12 py-4 text-xl font-bold text-black bg-[#ffdf07] dark:bg-[#ffdf07] rounded-xl hover:bg-[#ffdf07]/90 dark:hover:bg-[#ffdf07]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              {isSaving ? 'Saving...' : currentStep === visibleSteps.length - 1 ? 'Onboard' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
