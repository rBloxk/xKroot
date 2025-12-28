import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Basic onboarding questions structure
// In future, these will be AI-driven and adaptive
const ONBOARDING_QUESTIONS = [
  {
    id: 'experience_level',
    question: 'How many years of professional experience do you have?',
    type: 'number',
    required: true,
    placeholder: 'Enter 0 if you are a fresher',
    helperText: 'Enter 0 if you are a fresher or have less than 1 year of experience',
    followUp: {
      '< 1': 'junior',
      '1-3': 'mid',
      '3-5': 'mid-senior',
      '5+': 'senior',
    },
  },
  {
    id: 'primary_role',
    question: 'What is your primary role or area of expertise?',
    type: 'text',
    required: true,
    placeholder: 'e.g., Software Engineer, Product Designer, Data Scientist',
  },
  {
    id: 'tech_stack',
    question: 'What technologies, tools, or frameworks are you most comfortable with?',
    type: 'textarea',
    required: true,
    placeholder: 'List the technologies you work with (e.g., React, Python, AWS, Figma)',
  },
  {
    id: 'work_preference',
    question: 'What is your preferred work arrangement?',
    type: 'select',
    required: true,
    options: [
      { value: 'remote', label: 'Fully Remote' },
      { value: 'hybrid', label: 'Hybrid (Remote + Office)' },
      { value: 'onsite', label: 'On-site' },
      { value: 'flexible', label: 'Flexible' },
    ],
  },
  {
    id: 'career_goals',
    question: 'What are your career goals for the next 1-2 years?',
    type: 'textarea',
    required: false,
    placeholder: 'Tell us about what you want to achieve in your career',
  },
  {
    id: 'challenges',
    question: 'What kind of challenges or problems do you enjoy solving?',
    type: 'textarea',
    required: false,
    placeholder: 'Describe the types of problems you find most engaging',
  },
]

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check for query parameters
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')

    // Check if user has a candidate profile
    const { data: candidateProfile } = await supabaseAdmin
      .from('candidate_profile')
      .select('id, onboarding_answers')
      .eq('user_id', user.id)
      .single()

    const answers = candidateProfile?.onboarding_answers as Record<string, any> || {}
    const answeredIds = Object.keys(answers)

    // If a specific question ID is requested, return that question with its answer
    if (questionId) {
      const question = ONBOARDING_QUESTIONS.find(q => q.id === questionId)
      if (!question) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        )
      }

      const questionAnswer = answers[questionId]?.answer

      return NextResponse.json({
        question: question,
        answer: questionAnswer,
        progress: {
          answered: answeredIds.length,
          total: ONBOARDING_QUESTIONS.length,
        },
      })
    }

    // If profile exists and has onboarding answers, return next question
    if (candidateProfile?.onboarding_answers) {
      // Find first unanswered question
      const nextQuestion = ONBOARDING_QUESTIONS.find(q => !answeredIds.includes(q.id))
      
      if (nextQuestion) {
        return NextResponse.json({
          question: nextQuestion,
          progress: {
            answered: answeredIds.length,
            total: ONBOARDING_QUESTIONS.length,
          },
        })
      } else {
        // All questions answered
        return NextResponse.json({
          completed: true,
          message: 'All onboarding questions completed',
        })
      }
    }

    // Return first question
    return NextResponse.json({
      question: ONBOARDING_QUESTIONS[0],
      progress: {
        answered: 0,
        total: ONBOARDING_QUESTIONS.length,
      },
    })
  } catch (error: any) {
    console.error('Get onboarding question error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { questionId, answer } = await request.json()

    // Validate questionId
    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      )
    }

    // Validate answer - allow 0, false, and empty strings for optional questions
    // Only reject if answer is explicitly null or undefined
    if (answer === undefined || answer === null) {
      return NextResponse.json(
        { error: 'Answer is required' },
        { status: 400 }
      )
    }

    // Get or create candidate profile
    let { data: candidateProfile } = await supabaseAdmin
      .from('candidate_profile')
      .select('id, onboarding_answers')
      .eq('user_id', user.id)
      .single()

    let onboardingAnswers: Record<string, any> = {}
    
    if (candidateProfile?.onboarding_answers) {
      onboardingAnswers = candidateProfile.onboarding_answers as Record<string, any>
    }

    // Save the answer
    onboardingAnswers[questionId] = {
      answer,
      answeredAt: new Date().toISOString(),
    }

    // Update or create candidate profile
    if (candidateProfile) {
      const { error: updateError } = await supabaseAdmin
        .from('candidate_profile')
        .update({
          onboarding_answers: onboardingAnswers,
          updated_at: new Date().toISOString(),
        })
        .eq('id', candidateProfile.id)

      if (updateError) {
        console.error('Error updating onboarding answers:', updateError)
        console.error('Question ID:', questionId)
        console.error('Answer:', answer)
        console.error('User ID:', user.id)
        console.error('Profile ID:', candidateProfile.id)
        return NextResponse.json(
          { 
            error: updateError.message || 'Failed to save answer',
            details: process.env.NODE_ENV === 'development' ? updateError : undefined,
            code: updateError.code,
          },
          { status: 500 }
        )
      }
    } else {
      // Create new candidate profile
      const { error: insertError } = await supabaseAdmin
        .from('candidate_profile')
        .insert({
          user_id: user.id,
          onboarding_answers: onboardingAnswers,
        })

      if (insertError) {
        console.error('Error creating candidate profile with onboarding:', insertError)
        console.error('Question ID:', questionId)
        console.error('Answer:', answer)
        console.error('User ID:', user.id)
        console.error('Onboarding answers:', JSON.stringify(onboardingAnswers, null, 2))
        return NextResponse.json(
          { 
            error: insertError.message || 'Failed to create profile',
            details: process.env.NODE_ENV === 'development' ? insertError : undefined,
            code: insertError.code,
          },
          { status: 500 }
        )
      }
    }

    // Check if all questions are answered
    const answeredIds = Object.keys(onboardingAnswers)
    const allAnswered = ONBOARDING_QUESTIONS.every(q => answeredIds.includes(q.id))

    return NextResponse.json({
      success: true,
      completed: allAnswered,
      progress: {
        answered: answeredIds.length,
        total: ONBOARDING_QUESTIONS.length,
      },
    })
  } catch (error: any) {
    console.error('Save onboarding answer error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

