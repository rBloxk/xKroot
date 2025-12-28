/**
 * Match Factors Utility Library
 * Provides functions for generating, explaining, and visualizing match factors
 */

export interface MatchFactorData {
  factor_type: string
  factor_name: string
  factor_score: number
  factor_weight: number
  factor_explanation: string | null
  evidence?: any
}

export interface FactorExplanation {
  title: string
  description: string
  details: string[]
  icon?: string
  color: string
}

/**
 * Get detailed explanation for a match factor
 */
export function getFactorExplanation(factor: MatchFactorData): FactorExplanation {
  const score = factor.factor_score
  const evidence = factor.evidence || {}

  switch (factor.factor_type) {
    case 'skill_match':
      const matched = evidence.matched || []
      const missing = evidence.missing || []
      const total = matched.length + missing.length
      
      return {
        title: 'Skill Compatibility',
        description: score >= 80
          ? 'Excellent skill match! You have most of the required skills.'
          : score >= 60
          ? 'Good skill match with some gaps.'
          : 'Limited skill match. Consider developing missing skills.',
        details: [
          `Matched ${matched.length} of ${total} required skills`,
          matched.length > 0 ? `Strong in: ${matched.slice(0, 3).join(', ')}${matched.length > 3 ? '...' : ''}` : '',
          missing.length > 0 ? `Missing: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}` : '',
        ].filter(Boolean),
        icon: '🎯',
        color: score >= 80 ? 'green' : score >= 60 ? 'blue' : 'red',
      }

    case 'experience_match':
      return {
        title: 'Experience Level',
        description: score >= 80
          ? 'Your experience level aligns perfectly with the role requirements.'
          : score >= 60
          ? 'Your experience is close to what\'s required.'
          : 'Experience level may not fully match the role requirements.',
        details: [
          'Based on years of experience and role level',
          score >= 80 ? 'You meet or exceed the experience requirements' : 'Consider if your experience is sufficient',
        ],
        icon: '💼',
        color: score >= 80 ? 'green' : score >= 60 ? 'blue' : 'red',
      }

    case 'location':
      return {
        title: 'Location Compatibility',
        description: score >= 80
          ? 'Perfect location match! Work arrangement aligns with your preferences.'
          : score >= 60
          ? 'Good location compatibility with some considerations.'
          : 'Location or work type may not fully align with your preferences.',
        details: [
          'Based on location and work type preferences',
          score >= 80 ? 'Location and work arrangement are ideal' : 'Consider if location/work type works for you',
        ],
        icon: '📍',
        color: score >= 80 ? 'green' : score >= 60 ? 'blue' : 'red',
      }

    case 'salary':
      return {
        title: 'Salary Alignment',
        description: score >= 80
          ? 'Salary expectations align well with the role.'
          : score >= 60
          ? 'Salary expectations are close but may need discussion.'
          : 'Salary expectations may not align with the role.',
        details: [
          'Based on your salary expectations vs. role salary range',
          score >= 80 ? 'Salary range matches your expectations' : 'Salary may need negotiation',
        ],
        icon: '💰',
        color: score >= 80 ? 'green' : score >= 60 ? 'blue' : 'red',
      }

    case 'cultural_fit':
      return {
        title: 'Cultural Fit',
        description: score >= 80
          ? 'Excellent cultural alignment! You\'re likely to thrive in this environment.'
          : score >= 60
          ? 'Good cultural fit with some differences.'
          : 'Cultural fit may need consideration.',
        details: [
          'AI-assessed cultural compatibility',
          'Based on company values, work style, and team dynamics',
        ],
        icon: '🤝',
        color: score >= 80 ? 'green' : score >= 60 ? 'blue' : 'red',
      }

    case 'soft_skills':
      return {
        title: 'Soft Skills',
        description: score >= 80
          ? 'Strong soft skills match! Your interpersonal skills align well.'
          : score >= 60
          ? 'Good soft skills compatibility.'
          : 'Soft skills may need development.',
        details: [
          'AI-assessed soft skills compatibility',
          'Communication, collaboration, and interpersonal skills',
        ],
        icon: '💬',
        color: score >= 80 ? 'green' : score >= 60 ? 'blue' : 'red',
      }

    case 'assessment':
      const factors = evidence.factors || []
      const boost = evidence.boost || 0
      
      return {
        title: 'Assessment Performance',
        description: score >= 80
          ? 'Outstanding assessment results! Your assessments demonstrate strong capabilities.'
          : score >= 60
          ? 'Good assessment performance.'
          : 'Assessment performance could be improved.',
        details: [
          `Assessment boost: +${boost.toFixed(1)} points`,
          factors.length > 0 ? `Based on: ${factors.join(', ')}` : 'Assessment scores enhance your match',
        ],
        icon: '📊',
        color: score >= 80 ? 'green' : score >= 60 ? 'blue' : 'red',
      }

    default:
      return {
        title: factor.factor_name,
        description: factor.factor_explanation || 'Match factor',
        details: [],
        icon: '✓',
        color: score >= 80 ? 'green' : score >= 60 ? 'blue' : 'red',
      }
  }
}

/**
 * Get color classes for factor score
 */
export function getFactorColorClasses(score: number): {
  text: string
  bg: string
  border: string
} {
  if (score >= 80) {
    return {
      text: 'text-green-700 dark:text-green-300',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
    }
  } else if (score >= 60) {
    return {
      text: 'text-[#0038cc] dark:text-[#4d7fff]',
      bg: 'bg-[#e6f0ff] dark:bg-[#001966]/20',
      border: 'border-[#99bfff] dark:border-[#002699]',
    }
  } else {
    return {
      text: 'text-red-700 dark:text-red-300',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
    }
  }
}

/**
 * Get factor weight percentage for visualization
 */
export function getFactorWeightPercentage(weight: number): number {
  return Math.round(weight * 100)
}

/**
 * Sort factors by importance (weight * score)
 */
export function sortFactorsByImportance(factors: MatchFactorData[]): MatchFactorData[] {
  return [...factors].sort((a, b) => {
    const importanceA = a.factor_weight * a.factor_score
    const importanceB = b.factor_weight * b.factor_score
    return importanceB - importanceA
  })
}

/**
 * Get overall match quality description
 */
export function getMatchQualityDescription(score: number): {
  label: string
  description: string
  color: string
} {
  if (score >= 90) {
    return {
      label: 'Excellent Match',
      description: 'This is an outstanding match with strong alignment across all factors.',
      color: 'green',
    }
  } else if (score >= 80) {
    return {
      label: 'Strong Match',
      description: 'This is a strong match with good alignment in most areas.',
      color: 'green',
    }
  } else if (score >= 70) {
    return {
      label: 'Good Match',
      description: 'This is a good match with solid alignment in key areas.',
      color: 'blue',
    }
  } else if (score >= 60) {
    return {
      label: 'Moderate Match',
      description: 'This is a moderate match with some alignment but areas for consideration.',
      color: 'blue',
    }
  } else {
    return {
      label: 'Limited Match',
      description: 'This match has limited alignment. Consider if it\'s the right fit.',
      color: 'red',
    }
  }
}

