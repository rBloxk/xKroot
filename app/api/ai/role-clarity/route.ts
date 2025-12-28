import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { orchestrateMultiModel } from '@/lib/ai/orchestration/consensus'
import { getRoleClaritySystemPrompt, buildRoleClarityPrompt } from '@/lib/ai/prompts/roleClarity'

export const dynamic = 'force-dynamic'

/**
 * AI Role Clarity Assistant
 * Helps founders define what they actually need through interactive questions
 * 
 * This is a basic implementation that can be enhanced with full AI integration later
 * For now, it provides structured questions based on company stage and need type
 */

interface RoleClarityQuestion {
  id: string
  question: string
  type: 'text' | 'textarea' | 'select' | 'multi-select'
  required: boolean
  options?: Array<{ value: string; label: string }>
  followUp?: Record<string, string>
}

const ROLE_CLARITY_QUESTIONS: Record<string, RoleClarityQuestion[]> = {
  default: [
    {
      id: 'role_purpose',
      question: 'What is the main purpose of this role? What problem will this person solve?',
      type: 'textarea',
      required: true,
    },
    {
      id: 'must_have_skills',
      question: 'What are the absolute must-have skills for this role? (comma-separated)',
      type: 'text',
      required: true,
      placeholder: 'e.g., React, Node.js, AWS, Leadership',
    },
    {
      id: 'nice_to_have_skills',
      question: 'What skills would be nice to have but not essential?',
      type: 'text',
      required: false,
      placeholder: 'e.g., TypeScript, Docker, GraphQL',
    },
    {
      id: 'experience_level',
      question: 'What level of experience are you looking for?',
      type: 'select',
      required: true,
      options: [
        { value: 'intern', label: 'Intern (0-1 years)' },
        { value: 'junior', label: 'Junior (1-3 years)' },
        { value: 'mid', label: 'Mid-level (3-5 years)' },
        { value: 'senior', label: 'Senior (5-8 years)' },
        { value: 'lead', label: 'Lead (8+ years)' },
        { value: 'principal', label: 'Principal (10+ years)' },
      ],
    },
    {
      id: 'key_responsibilities',
      question: 'What are the top 3-5 key responsibilities for this role? (one per line)',
      type: 'textarea',
      required: true,
    },
    {
      id: 'success_metrics',
      question: 'How will you measure success in this role? What outcomes are you expecting?',
      type: 'textarea',
      required: false,
    },
  ],
  technical: [
    {
      id: 'tech_stack',
      question: 'What specific technologies or tech stack is required?',
      type: 'text',
      required: true,
      placeholder: 'e.g., React, Python, PostgreSQL, AWS',
    },
    {
      id: 'architecture_experience',
      question: 'Do you need someone who can design architecture or just implement?',
      type: 'select',
      required: false,
      options: [
        { value: 'implement_only', label: 'Implement existing architecture' },
        { value: 'design_and_implement', label: 'Design and implement' },
        { value: 'architecture_focus', label: 'Focus on architecture and design' },
      ],
    },
  ],
  product: [
    {
      id: 'product_stage',
      question: 'What stage is your product at?',
      type: 'select',
      required: true,
      options: [
        { value: 'idea', label: 'Idea/Concept' },
        { value: 'mvp', label: 'MVP/Prototype' },
        { value: 'growth', label: 'Growth Stage' },
        { value: 'scale', label: 'Scaling' },
      ],
    },
    {
      id: 'user_research',
      question: 'Do you need someone with user research experience?',
      type: 'select',
      required: false,
      options: [
        { value: 'yes', label: 'Yes, essential' },
        { value: 'nice_to_have', label: 'Nice to have' },
        { value: 'no', label: 'No' },
      ],
    },
  ],
}

/**
 * Generate structured role requirements from answers
 */
function generateRoleRequirements(answers: Record<string, any>, companyStage?: string): {
  role_title: string
  role_level: string
  job_description: string
  required_skills: any
  responsibilities: string[]
} {
  // Extract key information
  const mustHaveSkills = answers.must_have_skills?.answer
    ? answers.must_have_skills.answer.split(',').map((s: string) => s.trim()).filter(Boolean)
    : []
  
  const niceToHaveSkills = answers.nice_to_have_skills?.answer
    ? answers.nice_to_have_skills.answer.split(',').map((s: string) => s.trim()).filter(Boolean)
    : []

  const responsibilities = answers.key_responsibilities?.answer
    ? answers.key_responsibilities.answer.split('\n').map((r: string) => r.trim()).filter(Boolean)
    : []

  // Build required_skills JSONB structure
  const requiredSkills: any = {
    technical: [],
    soft: [],
  }

  // Categorize skills (basic categorization - can be enhanced with AI)
  mustHaveSkills.forEach((skill: string) => {
    const lowerSkill = skill.toLowerCase()
    if (lowerSkill.includes('leadership') || lowerSkill.includes('communication') || 
        lowerSkill.includes('team') || lowerSkill.includes('management')) {
      requiredSkills.soft.push(skill)
    } else {
      requiredSkills.technical.push(skill)
    }
  })

  // Generate role title suggestion
  const experienceLevel = answers.experience_level?.answer || 'mid'
  const rolePurpose = answers.role_purpose?.answer || ''
  
  // Try to extract role title from purpose
  let roleTitle = 'Role Title'
  if (rolePurpose) {
    // Simple extraction - can be enhanced with AI
    const titleMatch = rolePurpose.match(/(?:looking for|need|hiring|want)\s+(?:a|an)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)
    if (titleMatch) {
      roleTitle = titleMatch[1]
    }
  }

  // Generate job description
  const jobDescription = `
${rolePurpose}

Key Responsibilities:
${responsibilities.map(r => `- ${r}`).join('\n')}

Required Skills:
${mustHaveSkills.map(s => `- ${s}`).join('\n')}

${niceToHaveSkills.length > 0 ? `Nice to Have:\n${niceToHaveSkills.map(s => `- ${s}`).join('\n')}` : ''}

${answers.success_metrics?.answer ? `Success Metrics:\n${answers.success_metrics.answer}` : ''}
  `.trim()

  return {
    role_title: roleTitle,
    role_level: experienceLevel,
    job_description: jobDescription,
    required_skills: requiredSkills,
    responsibilities,
  }
}

// GET - Get next question for role clarity
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const answersParam = searchParams.get('answers')
    const questionType = searchParams.get('type') || 'default'
    
    let answers: Record<string, any> = {}
    if (answersParam) {
      try {
        answers = JSON.parse(answersParam)
      } catch (e) {
        // Invalid JSON, use empty object
      }
    }

    const questions = ROLE_CLARITY_QUESTIONS[questionType] || ROLE_CLARITY_QUESTIONS.default
    const answeredIds = Object.keys(answers)
    
    // Find first unanswered question
    const nextQuestion = questions.find(q => !answeredIds.includes(q.id))
    
    if (nextQuestion) {
      return NextResponse.json({
        question: nextQuestion,
        progress: {
          answered: answeredIds.length,
          total: questions.length,
        },
      })
    } else {
      // All questions answered, generate role requirements
      const companyStage = searchParams.get('company_stage')
      const roleRequirements = generateRoleRequirements(answers, companyStage || undefined)
      
      return NextResponse.json({
        completed: true,
        role_requirements: roleRequirements,
        message: 'Role requirements generated successfully',
      })
    }
  } catch (error: any) {
    console.error('Get role clarity question error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// POST - Save answer and get next question or generate requirements
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { questionId, answer, allAnswers, questionType, companyStage } = await request.json()

    if (!questionId || answer === undefined || answer === null || answer === '') {
      return NextResponse.json(
        { error: 'Question ID and answer are required' },
        { status: 400 }
      )
    }

    // Merge with existing answers
    const answers = allAnswers || {}
    answers[questionId] = {
      answer,
      answeredAt: new Date().toISOString(),
    }

    const questions = ROLE_CLARITY_QUESTIONS[questionType || 'default'] || ROLE_CLARITY_QUESTIONS.default
    const answeredIds = Object.keys(answers)
    const allAnswered = questions.every(q => answeredIds.includes(q.id))

    if (allAnswered) {
      // Generate role requirements using MMI (Phase 10)
      let roleRequirements: any
      let mmiConfidence: number | null = null
      let mmiExplanation: string | null = null

      try {
        const systemPrompt = getRoleClaritySystemPrompt()
        const prompt = buildRoleClarityPrompt(answers, companyStage)

        const consensusResult = await orchestrateMultiModel(
          'role_clarity',
          prompt,
          systemPrompt,
          {
            timeout: 30000,
            requireAll: false,
            fallbackEnabled: true,
            jsonMode: true,
          }
        )

        // Extract role requirements from consensus output
        if (consensusResult.consensus_output) {
          const output = consensusResult.consensus_output
          roleRequirements = {
            role_title: output.role_title || 'Role Title',
            role_level: output.role_level || answers.experience_level?.answer || 'mid',
            job_description: output.job_description || '',
            required_skills: output.required_skills || { technical: [], soft: [] },
            preferred_skills: output.preferred_skills || { technical: [], soft: [] },
            responsibilities: output.responsibilities || [],
            success_metrics: output.success_metrics || answers.success_metrics?.answer || '',
            recommendations: output.recommendations || null,
          }

          mmiConfidence = consensusResult.confidence_score
          mmiExplanation = consensusResult.explanation || null
        } else {
          // Fallback to deterministic generation
          roleRequirements = generateRoleRequirements(answers, companyStage)
        }
      } catch (error: any) {
        console.error('MMI role clarity error:', error)
        // Fallback to deterministic generation
        roleRequirements = generateRoleRequirements(answers, companyStage)
      }
      
      return NextResponse.json({
        success: true,
        completed: true,
        role_requirements: roleRequirements,
        mmi_confidence: mmiConfidence,
        mmi_explanation: mmiExplanation,
        progress: {
          answered: answeredIds.length,
          total: questions.length,
        },
      })
    } else {
      // Return next question
      const nextQuestion = questions.find(q => !answeredIds.includes(q.id))
      
      return NextResponse.json({
        success: true,
        completed: false,
        question: nextQuestion,
        progress: {
          answered: answeredIds.length,
          total: questions.length,
        },
      })
    }
  } catch (error: any) {
    console.error('Save role clarity answer error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

