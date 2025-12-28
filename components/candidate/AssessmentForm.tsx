'use client'

import { useState, useEffect } from 'react'
import { AssessmentDefinition, AssessmentQuestion, AssessmentAnswer, AssessmentType } from '@/lib/assessments/types'
import { getAssessmentDefinition } from '@/lib/assessments/types'

interface AssessmentFormProps {
  assessmentType: AssessmentType
  onComplete: (assessmentId: string) => void
  onCancel: () => void
}

export default function AssessmentForm({ assessmentType, onComplete, onCancel }: AssessmentFormProps) {
  const [definition, setDefinition] = useState<AssessmentDefinition | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const def = getAssessmentDefinition(assessmentType)
    setDefinition(def)
  }, [assessmentType])

  if (!definition) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-gray"></div>
      </div>
    )
  }

  const currentQuestion = definition.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / definition.questions.length) * 100
  const isLastQuestion = currentQuestionIndex === definition.questions.length - 1
  const canProceed = currentQuestion.required 
    ? answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== ''
    : true

  const handleAnswerChange = (value: string | number | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
    setError('')
  }

  const handleMultipleChoiceChange = (value: string, checked: boolean) => {
    const currentAnswer = (answers[currentQuestion.id] as string[]) || []
    if (checked) {
      handleAnswerChange([...currentAnswer, value])
    } else {
      handleAnswerChange(currentAnswer.filter(v => v !== value))
    }
  }

  const handleNext = () => {
    if (!canProceed) {
      setError('This question is required')
      return
    }

    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setError('')
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setError('')
    }
  }

  const handleSubmit = async () => {
    if (!canProceed) {
      setError('This question is required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Get candidate profile ID
      const profileResponse = await fetch('/api/candidate/profile')
      const profileData = await profileResponse.json()
      
      if (!profileResponse.ok || !profileData.profile) {
        throw new Error('Candidate profile not found. Please complete your profile first.')
      }

      const candidateId = profileData.profile.id

      // Format answers
      const formattedAnswers: AssessmentAnswer[] = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
        answeredAt: new Date().toISOString(),
      }))

      // Submit assessment
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          assessment_type: assessmentType,
          assessment_data: {
            answers: formattedAnswers,
            completedAt: new Date().toISOString(),
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit assessment')
      }

      // Call onComplete with assessment ID
      if (data.assessment?.id) {
        onComplete(data.assessment.id)
      } else {
        throw new Error('Assessment ID not returned')
      }
    } catch (err: any) {
      console.error('Assessment submission error:', err)
      setError(err.message || 'Failed to submit assessment. Please try again.')
      setIsSubmitting(false)
    }
  }

  const renderQuestionInput = (question: AssessmentQuestion) => {
    const currentAnswer = answers[question.id]

    switch (question.type) {
      case 'rating':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-dark dark:text-gray-400">
                {question.min || 1}
              </span>
              <span className="text-lg font-semibold text-black dark:text-gray">
                {typeof currentAnswer === 'number' ? currentAnswer : question.min || 1}
              </span>
              <span className="text-sm text-gray-dark dark:text-gray-400">
                {question.max || 5}
              </span>
            </div>
            <input
              type="range"
              min={question.min || 1}
              max={question.max || 5}
              value={typeof currentAnswer === 'number' ? currentAnswer : question.min || 1}
              onChange={(e) => handleAnswerChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            {question.helperText && (
              <p className="text-xs text-gray-dark dark:text-gray-400 mt-1">
                {question.helperText}
              </p>
            )}
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => {
              const isChecked = Array.isArray(currentAnswer) 
                ? currentAnswer.includes(option.value)
                : currentAnswer === option.value
              
              return (
                <label
                  key={option.value}
                  className="flex items-start p-3 border border-gray-300 dark:border-[#333333] rounded-lg cursor-pointer hover:border-black dark:hover:border-[#ffdf07] transition-colors"
                >
                  <input
                    type={Array.isArray(currentAnswer) ? 'checkbox' : 'radio'}
                    name={question.id}
                    value={option.value}
                    checked={isChecked}
                    onChange={(e) => {
                      if (Array.isArray(currentAnswer)) {
                        handleMultipleChoiceChange(option.value, e.target.checked)
                      } else {
                        handleAnswerChange(option.value)
                      }
                    }}
                    className="mt-1 mr-3"
                  />
                  <span className="text-black dark:text-gray flex-1">
                    {option.label}
                  </span>
                </label>
              )
            })}
          </div>
        )

      case 'text':
        return (
          <input
            type="text"
            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={question.placeholder}
            className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent"
          />
        )

      case 'textarea':
        return (
          <textarea
            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={question.placeholder}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 dark:border-[#333333] rounded-lg text-black dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#ffdf07] focus:border-transparent resize-none"
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-[#333333] p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-gray mb-2">
          {definition.title}
        </h2>
        <p className="text-gray-dark dark:text-gray-300 mb-4">
          {definition.description}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <div
            className="bg-black dark:bg-[#ffdf07] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-dark dark:text-gray-400">
          Question {currentQuestionIndex + 1} of {definition.questions.length}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Question */}
      <div className="mb-6">
        <label className="block text-lg font-semibold text-black dark:text-gray mb-4">
          {currentQuestion.question}
          {currentQuestion.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
        
        {currentQuestion.helperText && (
          <p className="text-sm text-gray-dark dark:text-gray-400 mb-4">
            {currentQuestion.helperText}
          </p>
        )}

        {renderQuestionInput(currentQuestion)}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-300 dark:border-[#333333]">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 text-sm font-medium text-black dark:text-gray border border-gray-300 dark:border-[#333333] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed || isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-black dark:bg-gray dark:text-black rounded-lg hover:bg-gray-dark dark:hover:bg-gray-dark/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting 
            ? 'Submitting...' 
            : isLastQuestion 
              ? 'Submit Assessment' 
              : 'Next'}
        </button>
      </div>
    </div>
  )
}

