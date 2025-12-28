'use client'

import { useState, useEffect } from 'react'

interface Question {
  id: string
  question: string
  type: 'text' | 'textarea' | 'select' | 'multi-select'
  required: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
}

interface RoleClarityAssistantProps {
  onComplete: (roleRequirements: any) => void
  companyStage?: string
}

export default function RoleClarityAssistant({ onComplete, companyStage }: RoleClarityAssistantProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState<string>('')
  const [allAnswers, setAllAnswers] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState({ answered: 0, total: 0 })
  const [completed, setCompleted] = useState(false)
  const [generatedRequirements, setGeneratedRequirements] = useState<any>(null)

  useEffect(() => {
    loadNextQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadNextQuestion = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const answersJson = JSON.stringify(allAnswers)
      const response = await fetch(
        `/api/ai/role-clarity?answers=${encodeURIComponent(answersJson)}&type=default${companyStage ? `&company_stage=${companyStage}` : ''}`
      )
      const data = await response.json()

      if (response.ok) {
        if (data.completed && data.role_requirements) {
          setCompleted(true)
          setGeneratedRequirements(data.role_requirements)
        } else {
          setCurrentQuestion(data.question)
          setProgress(data.progress)
          setAnswer('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentQuestion) return

    if (currentQuestion.required && (!answer || answer === '')) {
      setError('This question is required')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const updatedAnswers = { ...allAnswers, [currentQuestion.id]: { answer, answeredAt: new Date().toISOString() } }
      
      const response = await fetch('/api/ai/role-clarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer: answer,
          allAnswers: updatedAnswers,
          questionType: 'default',
          companyStage,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setAllAnswers(updatedAnswers)
        
        if (data.completed && data.role_requirements) {
          setCompleted(true)
          setGeneratedRequirements(data.role_requirements)
        } else {
          // Load next question
          setCurrentQuestion(data.question)
          setProgress(data.progress)
          setAnswer('')
        }
      } else {
        setError(data.error || 'Failed to save answer')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUseGenerated = () => {
    if (generatedRequirements) {
      onComplete(generatedRequirements)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-gray mx-auto"></div>
          <p className="mt-4 text-gray-dark dark:text-gray-300">Loading question...</p>
        </div>
      </div>
    )
  }

  if (completed && generatedRequirements) {
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <div className="text-green-600 dark:text-green-400 text-4xl mb-4">✓</div>
          <h3 className="text-xl font-semibold text-black dark:text-gray mb-2">
            Role Requirements Generated!
          </h3>
          <p className="text-gray-dark dark:text-gray-300">
            We've generated a structured role based on your answers. Review and adjust as needed.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
              Role Title
            </label>
            <input
              type="text"
              value={generatedRequirements.role_title}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
              Job Description
            </label>
            <textarea
              value={generatedRequirements.job_description}
              readOnly
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-dark dark:text-gray-300 mb-1">
              Required Skills (JSON)
            </label>
            <textarea
              value={JSON.stringify(generatedRequirements.required_skills, null, 2)}
              readOnly
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setCompleted(false)
              setAllAnswers({})
              loadNextQuestion()
            }}
            className="px-4 py-2 text-sm font-medium text-black dark:text-gray bg-white dark:bg-gray-dark/30 hover:bg-gray-50 dark:hover:bg-gray-dark/50 rounded-lg transition-colors"
          >
            Start Over
          </button>
          <button
            onClick={handleUseGenerated}
            className="px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors"
          >
            Use These Requirements
          </button>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-dark dark:text-gray-300">No questions available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-dark dark:text-gray-300 mb-2">
          <span>Progress</span>
          <span>{progress.answered} / {progress.total}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
          <div
            className="bg-black dark:bg-gray h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress.answered / progress.total) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-lg font-medium text-black dark:text-gray mb-3">
            {currentQuestion.question}
            {currentQuestion.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>

          {currentQuestion.type === 'textarea' && (
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
              required={currentQuestion.required}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
            />
          )}

          {currentQuestion.type === 'text' && (
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
              required={currentQuestion.required}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
            />
          )}

          {currentQuestion.type === 'select' && (
            <select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required={currentQuestion.required}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent transition-colors"
            >
              <option value="">Select an option...</option>
              {currentQuestion.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black hover:bg-gray-dark dark:hover:bg-gray-dark/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  )
}

