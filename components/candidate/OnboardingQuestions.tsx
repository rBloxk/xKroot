'use client'

import { useState, useEffect, useRef } from 'react'

interface Question {
  id: string
  question: string
  type: 'text' | 'textarea' | 'number' | 'select'
  required: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  helperText?: string
}

// Comprehensive list of technologies, frameworks, and tools
const TECH_SUGGESTIONS = [
  // Frontend Frameworks & Libraries
  'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'SvelteKit', 'Remix',
  'Gatsby', 'Astro', 'Solid.js', 'Preact', 'Alpine.js', 'Ember.js', 'Backbone.js',
  
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', '.NET', 'Go', 'Rust',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'R', 'Dart', 'Elixir', 'Erlang',
  'Clojure', 'Haskell', 'F#', 'OCaml', 'Lua', 'Perl', 'Shell Scripting',
  
  // Backend Frameworks
  'Node.js', 'Express', 'NestJS', 'Fastify', 'Koa', 'Hapi', 'Django', 'Flask',
  'FastAPI', 'Ruby on Rails', 'Spring Boot', 'ASP.NET', 'Laravel', 'Symfony',
  'Phoenix', 'Gin', 'Echo', 'Fiber', 'Actix', 'Rocket',
  
  // Databases
  'PostgreSQL', 'MySQL', 'MariaDB', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra',
  'DynamoDB', 'Firebase', 'Supabase', 'Prisma', 'SQLite', 'Oracle', 'SQL Server',
  'Neo4j', 'CouchDB', 'InfluxDB', 'TimescaleDB', 'CockroachDB', 'PlanetScale',
  
  // Cloud & Infrastructure
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Ansible',
  'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Travis CI', 'CI/CD',
  'Linux', 'Nginx', 'Apache', 'Vercel', 'Netlify', 'Heroku', 'Railway',
  
  // Mobile Development
  'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Android', 'iOS', 'SwiftUI',
  'Jetpack Compose', 'Kotlin Multiplatform',
  
  // Styling & UI
  'Tailwind CSS', 'Bootstrap', 'Material-UI', 'Styled Components', 'Emotion',
  'CSS Modules', 'Sass', 'Less', 'PostCSS', 'Framer Motion', 'GSAP',
  
  // Tools & Others
  'Git', 'GraphQL', 'REST API', 'WebSocket', 'Microservices', 'Serverless',
  'Webpack', 'Vite', 'Parcel', 'Rollup', 'ESBuild', 'Turbo', 'Turborepo',
  'Jest', 'Cypress', 'Playwright', 'Selenium', 'Testing Library', 'Vitest',
  
  // AI & Machine Learning
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras', 'Pandas', 'NumPy',
  'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision',
  'OpenAI', 'Hugging Face', 'LangChain', 'LlamaIndex',
  
  // Design Tools
  'Figma', 'Sketch', 'Adobe XD', 'InVision', 'Principle', 'Framer', 'Webflow',
  
  // DevOps & Monitoring
  'Prometheus', 'Grafana', 'Datadog', 'New Relic', 'Sentry', 'LogRocket',
  'ELK Stack', 'Splunk', 'CloudWatch', 'Azure Monitor',
  
  // Version Control & Collaboration
  'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Slack', 'Notion',
  
  // Blockchain
  'Solidity', 'Ethereum', 'Web3', 'Blockchain', 'Smart Contracts',
  
  // Data & Analytics
  'Tableau', 'Power BI', 'Looker', 'Metabase', 'Apache Spark', 'Hadoop',
  'Kafka', 'RabbitMQ', 'Apache Airflow',
]

interface OnboardingQuestionsProps {
  onComplete: () => void
}

export default function OnboardingQuestions({ onComplete }: OnboardingQuestionsProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState<string | number>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState({ answered: 0, total: 0 })
  const [completed, setCompleted] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([])
  const [questionHistory, setQuestionHistory] = useState<string[]>([]) // Track question navigation history
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNextQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadQuestion = async (questionId?: string) => {
    setIsLoading(true)
    setError('')
    
    try {
      const url = questionId 
        ? `/api/candidate/onboarding/questions?questionId=${questionId}`
        : '/api/candidate/onboarding/questions'
      
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        if (data.completed) {
          setCompleted(true)
          onComplete()
        } else {
          setCurrentQuestion(data.question)
          setProgress(data.progress)
          // If loading a specific question (going back), restore its answer
          setAnswer(data.answer !== undefined && data.answer !== null ? data.answer : '')
        }
      } else {
        setError(data.error || 'Failed to load question')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const loadNextQuestion = async () => {
    await loadQuestion()
  }

  const handleNext = async () => {
    if (!currentQuestion) return

    // For number inputs, 0 is a valid answer (for freshers)
    if (currentQuestion.required) {
      if (currentQuestion.type === 'number') {
        if (answer === '' || answer === null || answer === undefined) {
          setError(`${currentQuestion.question} is required. Enter 0 if you are a fresher.`)
          return
        }
      } else if (!answer || answer === '') {
        setError(`${currentQuestion.question} is required`)
        return
      }
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await fetch('/api/candidate/onboarding/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer: answer,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSaving(false) // Reset saving state on success
        if (data.completed) {
          setCompleted(true)
          setTimeout(() => {
            onComplete()
          }, 500)
        } else {
          // Add to answered questions and history
          setAnsweredQuestions(prev => [...prev, currentQuestion.id])
          setQuestionHistory(prev => [...prev, currentQuestion.id])
          // Load next question
          loadNextQuestion()
        }
      } else {
        setError(data.error || 'Failed to save answer')
        setIsSaving(false)
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      setIsSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentQuestion && currentQuestion.type !== 'textarea') {
      e.preventDefault()
      handleNext()
    }
  }

  // Handle tech stack suggestions
  const handleTechStackInput = (value: string) => {
    setAnswer(value)
    setError('')
    
    // Show suggestions for tech_stack question
    if (currentQuestion?.id === 'tech_stack') {
      const lastWord = value.split(/[,\n]/).pop()?.trim().toLowerCase() || ''
      
      if (lastWord.length > 0) {
        const filtered = TECH_SUGGESTIONS.filter(tech =>
          tech.toLowerCase().startsWith(lastWord) &&
          !value.toLowerCase().includes(tech.toLowerCase())
        ).slice(0, 8)
        setSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
        setSelectedSuggestionIndex(-1)
      } else {
        setShowSuggestions(false)
        setSuggestions([])
      }
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  const insertSuggestion = (suggestion: string) => {
    if (!currentQuestion || currentQuestion.id !== 'tech_stack') return
    
    const currentValue = answer as string
    const parts = currentValue.split(/[,\n]/)
    parts[parts.length - 1] = suggestion
    
    const newValue = parts.join(', ') + (currentValue.trim().endsWith(',') ? '' : ', ')
    setAnswer(newValue)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedSuggestionIndex(-1)
    
    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus()
      // Move cursor to end
      const length = newValue.length
      textareaRef.current.setSelectionRange(length, length)
    }
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault()
        insertSuggestion(suggestions[selectedSuggestionIndex])
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setSuggestions([])
        setSelectedSuggestionIndex(-1)
      }
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSuggestions])

  const handleBack = async () => {
    if (questionHistory.length === 0 || !currentQuestion) return

    // Remove current question from history
    const newHistory = [...questionHistory]
    const previousQuestionId = newHistory.pop()
    
    if (previousQuestionId) {
      setQuestionHistory(newHistory)
      // Load the previous question with its saved answer
      await loadQuestion(previousQuestionId)
    }
  }

  const canGoBack = questionHistory.length > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-[#004bff] mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading question...</p>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-[#004bff] dark:text-[#004bff] text-6xl mb-6">✓</div>
          <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
            Onboarding Complete!
          </h2>
          <p className="text-lg text-gray-dark dark:text-gray-400">
            Great! Let's continue with your profile setup.
          </p>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-dark dark:text-gray-300">No questions available</p>
        </div>
      </div>
    )
  }

  const progressPercentage = progress.total > 0 
    ? ((progress.answered / progress.total) * 100) 
    : 0

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-dark dark:text-gray-400">
            Question {progress.answered + 1} of {progress.total}
          </span>
          <span className="text-sm font-medium text-gray-dark dark:text-gray-400">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#004bff] dark:bg-[#004bff] transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Question Label */}
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4 leading-tight">
              {currentQuestion.question}
              {currentQuestion.required && (
                <span className="text-red-500 ml-2">*</span>
              )}
            </h2>
            {currentQuestion.helperText && (
              <p className="text-lg text-gray-dark dark:text-gray-400">
                {currentQuestion.helperText}
              </p>
            )}
          </div>

          {/* Input Field */}
          <div className="mb-12 relative">
            {currentQuestion.type === 'textarea' ? (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={answer as string}
                  onChange={(e) => handleTechStackInput(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  onKeyPress={handleKeyPress}
                  placeholder={currentQuestion.placeholder}
                  required={currentQuestion.required}
                  rows={6}
                  className="w-full px-6 py-4 text-xl md:text-2xl border-2 border-gray-300 dark:border-[#333333] rounded-2xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-4 focus:ring-[#004bff]/30 dark:focus:ring-[#004bff]/30 focus:border-[#004bff] dark:focus:border-[#004bff] transition-all duration-200 resize-none"
                  style={{ minHeight: '150px' }}
                />
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && currentQuestion.id === 'tech_stack' && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1a1a1a] border-2 border-gray-300 dark:border-[#333333] rounded-xl shadow-xl max-h-64 overflow-y-auto"
                  >
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => insertSuggestion(suggestion)}
                        className={`w-full text-left px-4 py-3 text-lg hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors ${
                          index === selectedSuggestionIndex
                            ? 'bg-[#004bff]/10 dark:bg-[#004bff]/20 border-l-4 border-[#004bff]'
                            : 'border-l-4 border-transparent'
                        }`}
                      >
                        <span className="text-black dark:text-white">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : currentQuestion.type === 'select' ? (
              <select
                value={answer as string}
                onChange={(e) => {
                  setAnswer(e.target.value)
                  setError('')
                }}
                onKeyPress={handleKeyPress}
                className="w-full px-6 py-4 text-xl md:text-2xl border-2 border-gray-300 dark:border-[#333333] rounded-2xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-4 focus:ring-[#004bff]/30 dark:focus:ring-[#004bff]/30 focus:border-[#004bff] dark:focus:border-[#004bff] transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="">{currentQuestion.placeholder || 'Select an option...'}</option>
                {currentQuestion.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : currentQuestion.type === 'number' ? (
              <input
                type="number"
                value={answer === '' || answer === null || answer === undefined ? '' : answer}
                onChange={(e) => {
                  const value = e.target.value
                  // Allow empty string (while typing), 0, or positive numbers
                  if (value === '') {
                    setAnswer('')
                    setError('')
                  } else if (!isNaN(parseFloat(value)) && parseFloat(value) >= 0) {
                    // Convert to number, but keep 0 as 0 (not empty)
                    const numValue = parseFloat(value)
                    setAnswer(isNaN(numValue) ? '' : numValue)
                    setError('')
                  }
                }}
                onKeyPress={handleKeyPress}
                placeholder={currentQuestion.placeholder}
                required={currentQuestion.required}
                min="0"
                step="0.5"
                className="w-full px-6 py-4 text-xl md:text-2xl border-2 border-gray-300 dark:border-[#333333] rounded-2xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-4 focus:ring-[#004bff]/30 dark:focus:ring-[#004bff]/30 focus:border-[#004bff] dark:focus:border-[#004bff] transition-all duration-200"
              />
            ) : (
              <input
                type="text"
                value={answer as string}
                onChange={(e) => {
                  setAnswer(e.target.value)
                  setError('')
                }}
                onKeyPress={handleKeyPress}
                placeholder={currentQuestion.placeholder}
                required={currentQuestion.required}
                className="w-full px-6 py-4 text-xl md:text-2xl border-2 border-gray-300 dark:border-[#333333] rounded-2xl text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-4 focus:ring-[#004bff]/30 dark:focus:ring-[#004bff]/30 focus:border-[#004bff] dark:focus:border-[#004bff] transition-all duration-200"
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
            {canGoBack && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSaving || isLoading}
                className="px-8 py-4 text-xl font-bold text-black dark:text-white bg-gray-200 dark:bg-[#333333] rounded-xl hover:bg-gray-300 dark:hover:bg-[#444444] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={isSaving || (currentQuestion.required && (
                currentQuestion.type === 'number' 
                  ? (answer === '' || answer === null || answer === undefined)
                  : (!answer || answer === '')
              ))}
              className="px-12 py-4 text-xl font-bold text-white bg-[#004bff] dark:bg-[#004bff] rounded-xl hover:bg-[#0038cc] dark:hover:bg-[#0038cc] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              {isSaving ? 'Saving...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

