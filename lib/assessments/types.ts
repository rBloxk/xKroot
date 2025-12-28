/**
 * Assessment Types and Question Definitions
 * Each assessment type has a set of questions and scoring logic
 */

export type AssessmentType = 
  | 'technical' 
  | 'cultural_fit' 
  | 'communication' 
  | 'problem_solving' 
  | 'leadership'

export interface AssessmentQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'text' | 'rating' | 'textarea'
  required: boolean
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  placeholder?: string
  helperText?: string
}

export interface AssessmentDefinition {
  type: AssessmentType
  title: string
  description: string
  questions: AssessmentQuestion[]
  scoringWeights?: Record<string, number>
}

export interface AssessmentAnswer {
  questionId: string
  answer: string | number | string[]
  answeredAt: string
}

export interface AssessmentSubmission {
  assessment_type: AssessmentType
  answers: AssessmentAnswer[]
}

// Assessment Definitions
export const ASSESSMENT_DEFINITIONS: Record<AssessmentType, AssessmentDefinition> = {
  technical: {
    type: 'technical',
    title: 'Technical Skills Assessment',
    description: 'Assess your technical capabilities and coding skills',
    questions: [
      {
        id: 'tech_experience',
        question: 'How many years of technical experience do you have?',
        type: 'rating',
        required: true,
        min: 0,
        max: 20,
        helperText: 'Years of professional technical experience',
      },
      {
        id: 'primary_languages',
        question: 'What are your primary programming languages? (Select all that apply)',
        type: 'multiple_choice',
        required: true,
        options: [
          { value: 'javascript', label: 'JavaScript/TypeScript' },
          { value: 'python', label: 'Python' },
          { value: 'java', label: 'Java' },
          { value: 'cpp', label: 'C++' },
          { value: 'go', label: 'Go' },
          { value: 'rust', label: 'Rust' },
          { value: 'php', label: 'PHP' },
          { value: 'ruby', label: 'Ruby' },
          { value: 'swift', label: 'Swift' },
          { value: 'kotlin', label: 'Kotlin' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'framework_experience',
        question: 'Which frameworks have you worked with? (Select all that apply)',
        type: 'multiple_choice',
        required: false,
        options: [
          { value: 'react', label: 'React' },
          { value: 'vue', label: 'Vue.js' },
          { value: 'angular', label: 'Angular' },
          { value: 'nextjs', label: 'Next.js' },
          { value: 'nodejs', label: 'Node.js' },
          { value: 'django', label: 'Django' },
          { value: 'flask', label: 'Flask' },
          { value: 'spring', label: 'Spring' },
          { value: 'express', label: 'Express' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'problem_solving_approach',
        question: 'Describe your approach to solving a complex technical problem.',
        type: 'textarea',
        required: true,
        placeholder: 'Explain your problem-solving methodology...',
        helperText: 'Include steps like research, planning, implementation, testing',
      },
      {
        id: 'code_quality',
        question: 'How important is code quality to you?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        helperText: '1 = Not important, 5 = Extremely important',
      },
      {
        id: 'learning_new_tech',
        question: 'How do you approach learning new technologies?',
        type: 'textarea',
        required: true,
        placeholder: 'Describe your learning process...',
      },
    ],
    scoringWeights: {
      tech_experience: 0.2,
      primary_languages: 0.15,
      framework_experience: 0.15,
      problem_solving_approach: 0.25,
      code_quality: 0.1,
      learning_new_tech: 0.15,
    },
  },

  cultural_fit: {
    type: 'cultural_fit',
    title: 'Cultural Fit Assessment',
    description: 'Evaluate how well you align with company cultures',
    questions: [
      {
        id: 'work_style',
        question: 'What is your preferred work style?',
        type: 'multiple_choice',
        required: true,
        options: [
          { value: 'collaborative', label: 'Highly Collaborative' },
          { value: 'independent', label: 'Independent' },
          { value: 'balanced', label: 'Balanced (Mix of both)' },
        ],
      },
      {
        id: 'communication_preference',
        question: 'How do you prefer to communicate?',
        type: 'multiple_choice',
        required: true,
        options: [
          { value: 'async', label: 'Asynchronous (Email, Slack)' },
          { value: 'sync', label: 'Synchronous (Meetings, Calls)' },
          { value: 'mixed', label: 'Mixed approach' },
        ],
      },
      {
        id: 'feedback_style',
        question: 'How do you prefer to give and receive feedback?',
        type: 'textarea',
        required: true,
        placeholder: 'Describe your feedback preferences...',
      },
      {
        id: 'team_values',
        question: 'What team values are most important to you? (Select all that apply)',
        type: 'multiple_choice',
        required: true,
        options: [
          { value: 'transparency', label: 'Transparency' },
          { value: 'innovation', label: 'Innovation' },
          { value: 'work_life_balance', label: 'Work-Life Balance' },
          { value: 'growth', label: 'Personal Growth' },
          { value: 'diversity', label: 'Diversity & Inclusion' },
          { value: 'accountability', label: 'Accountability' },
          { value: 'autonomy', label: 'Autonomy' },
        ],
      },
      {
        id: 'conflict_resolution',
        question: 'How do you handle conflicts or disagreements in a team?',
        type: 'textarea',
        required: true,
        placeholder: 'Describe your conflict resolution approach...',
      },
    ],
    scoringWeights: {
      work_style: 0.2,
      communication_preference: 0.2,
      feedback_style: 0.25,
      team_values: 0.2,
      conflict_resolution: 0.15,
    },
  },

  communication: {
    type: 'communication',
    title: 'Communication Skills Assessment',
    description: 'Test your communication and collaboration skills',
    questions: [
      {
        id: 'presentation_comfort',
        question: 'How comfortable are you with public speaking and presentations?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        helperText: '1 = Very uncomfortable, 5 = Very comfortable',
      },
      {
        id: 'written_communication',
        question: 'How would you rate your written communication skills?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        helperText: '1 = Poor, 5 = Excellent',
      },
      {
        id: 'active_listening',
        question: 'Describe a situation where active listening was crucial.',
        type: 'textarea',
        required: true,
        placeholder: 'Share an example...',
      },
      {
        id: 'cross_functional',
        question: 'How comfortable are you working with non-technical stakeholders?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        helperText: '1 = Very uncomfortable, 5 = Very comfortable',
      },
      {
        id: 'documentation',
        question: 'How do you approach documentation and knowledge sharing?',
        type: 'textarea',
        required: true,
        placeholder: 'Describe your documentation practices...',
      },
    ],
    scoringWeights: {
      presentation_comfort: 0.2,
      written_communication: 0.2,
      active_listening: 0.25,
      cross_functional: 0.2,
      documentation: 0.15,
    },
  },

  problem_solving: {
    type: 'problem_solving',
    title: 'Problem Solving Assessment',
    description: 'Assess your analytical and problem-solving abilities',
    questions: [
      {
        id: 'analytical_thinking',
        question: 'How would you rate your analytical thinking skills?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        helperText: '1 = Poor, 5 = Excellent',
      },
      {
        id: 'problem_example',
        question: 'Describe a complex problem you solved recently. What was your approach?',
        type: 'textarea',
        required: true,
        placeholder: 'Explain the problem, your approach, and the outcome...',
      },
      {
        id: 'data_driven',
        question: 'How important is data-driven decision making to you?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        helperText: '1 = Not important, 5 = Extremely important',
      },
      {
        id: 'creativity',
        question: 'Describe a time when you used creative thinking to solve a problem.',
        type: 'textarea',
        required: true,
        placeholder: 'Share your creative problem-solving example...',
      },
      {
        id: 'persistence',
        question: 'How do you handle problems that seem unsolvable?',
        type: 'textarea',
        required: true,
        placeholder: 'Describe your approach to difficult challenges...',
      },
    ],
    scoringWeights: {
      analytical_thinking: 0.2,
      problem_example: 0.3,
      data_driven: 0.15,
      creativity: 0.2,
      persistence: 0.15,
    },
  },

  leadership: {
    type: 'leadership',
    title: 'Leadership Assessment',
    description: 'Evaluate your leadership and management potential',
    questions: [
      {
        id: 'leadership_experience',
        question: 'Do you have leadership or management experience?',
        type: 'multiple_choice',
        required: true,
        options: [
          { value: 'yes_team', label: 'Yes, managed a team' },
          { value: 'yes_project', label: 'Yes, led projects' },
          { value: 'informal', label: 'Informal leadership roles' },
          { value: 'no', label: 'No, but interested' },
        ],
      },
      {
        id: 'leadership_style',
        question: 'What is your leadership style?',
        type: 'multiple_choice',
        required: true,
        options: [
          { value: 'servant', label: 'Servant Leader' },
          { value: 'transformational', label: 'Transformational' },
          { value: 'democratic', label: 'Democratic' },
          { value: 'coaching', label: 'Coaching' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'mentoring',
        question: 'Describe your experience with mentoring or coaching others.',
        type: 'textarea',
        required: true,
        placeholder: 'Share your mentoring experience...',
      },
      {
        id: 'decision_making',
        question: 'How do you make decisions as a leader?',
        type: 'textarea',
        required: true,
        placeholder: 'Describe your decision-making process...',
      },
      {
        id: 'team_motivation',
        question: 'How do you motivate and inspire your team?',
        type: 'textarea',
        required: true,
        placeholder: 'Share your approach to team motivation...',
      },
    ],
    scoringWeights: {
      leadership_experience: 0.2,
      leadership_style: 0.15,
      mentoring: 0.25,
      decision_making: 0.2,
      team_motivation: 0.2,
    },
  },
}

/**
 * Get assessment definition by type
 */
export function getAssessmentDefinition(type: AssessmentType): AssessmentDefinition {
  return ASSESSMENT_DEFINITIONS[type]
}

/**
 * Get all assessment types
 */
export function getAllAssessmentTypes(): AssessmentType[] {
  return Object.keys(ASSESSMENT_DEFINITIONS) as AssessmentType[]
}

