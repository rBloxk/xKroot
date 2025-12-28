/**
 * Deterministic Matching Logic
 * This is the fail-safe base layer that always works, even if AI fails
 */

export interface CandidateData {
  id: string
  skills: Array<{
    skill_name: string
    proficiency_level: string
    verified: boolean
  }>
  years_experience: number | null
  location: string | null
  preferred_work_type: string | null
  preferred_location: string | null
  salary_expectation_min: number | null
  salary_expectation_max: number | null
  availability_status: string
}

export interface JobData {
  id: string
  required_skills: any // JSONB object
  role_level: string | null
  work_type: string | null
  location: string | null
  salary_min: number | null
  salary_max: number | null
}

export interface DeterministicScore {
  totalScore: number // 0-100
  skillMatch: number // 0-100
  experienceMatch: number // 0-100
  locationMatch: number // 0-100
  salaryMatch: number // 0-100
  breakdown: {
    skillMatchPercentage: number
    skillMatchDetails: {
      matched: string[]
      missing: string[]
      extra: string[]
    }
    experienceScore: number
    locationScore: number
    salaryScore: number
  }
}

/**
 * Calculate skill match percentage
 */
function calculateSkillMatch(
  candidateSkills: CandidateData['skills'],
  requiredSkills: JobData['required_skills']
): { percentage: number; matched: string[]; missing: string[]; extra: string[] } {
  if (!requiredSkills || typeof requiredSkills !== 'object') {
    return { percentage: 0, matched: [], missing: [], extra: [] }
  }

  // Extract all required skills from JSONB structure
  const requiredSkillNames = new Set<string>()
  
  // Handle different JSONB structures
  if (Array.isArray(requiredSkills)) {
    requiredSkills.forEach(skill => {
      if (typeof skill === 'string') {
        requiredSkillNames.add(skill.toLowerCase())
      }
    })
  } else if (typeof requiredSkills === 'object') {
    // Handle structured format: { technical: [...], soft: [...] }
    Object.values(requiredSkills).forEach((category: any) => {
      if (Array.isArray(category)) {
        category.forEach((skill: string) => {
          if (typeof skill === 'string') {
            requiredSkillNames.add(skill.toLowerCase())
          }
        })
      }
    })
  }

  if (requiredSkillNames.size === 0) {
    return { percentage: 0, matched: [], missing: [], extra: [] }
  }

  // Get candidate skill names (normalized to lowercase)
  const candidateSkillNames = new Set(
    candidateSkills.map(s => s.skill_name.toLowerCase())
  )

  // Find matches
  const matched: string[] = []
  const missing: string[] = []
  const extra: string[] = []

  requiredSkillNames.forEach(required => {
    if (candidateSkillNames.has(required)) {
      matched.push(required)
    } else {
      missing.push(required)
    }
  })

  candidateSkillNames.forEach(candidate => {
    if (!requiredSkillNames.has(candidate)) {
      extra.push(candidate)
    }
  })

  // Calculate percentage
  const percentage = (matched.length / requiredSkillNames.size) * 100

  return { percentage, matched, missing, extra }
}

/**
 * Calculate experience match score
 */
function calculateExperienceMatch(
  candidateYears: number | null,
  roleLevel: string | null
): number {
  if (!candidateYears && !roleLevel) {
    return 50 // Neutral score if both missing
  }

  if (!candidateYears) {
    return 30 // Penalty for missing candidate experience
  }

  if (!roleLevel) {
    return 70 // Slight penalty for missing role level
  }

  // Map role levels to expected years
  const levelExpectations: Record<string, { min: number; ideal: number; max: number }> = {
    intern: { min: 0, ideal: 0, max: 1 },
    junior: { min: 0, ideal: 1, max: 3 },
    mid: { min: 2, ideal: 3, max: 5 },
    senior: { min: 4, ideal: 6, max: 8 },
    lead: { min: 6, ideal: 8, max: 12 },
    principal: { min: 10, ideal: 12, max: 20 },
    executive: { min: 15, ideal: 20, max: 30 },
  }

  const expectation = levelExpectations[roleLevel.toLowerCase()]
  if (!expectation) {
    return 50 // Unknown level
  }

  // Score based on how close candidate is to ideal
  if (candidateYears >= expectation.min && candidateYears <= expectation.max) {
    // Within range, score based on proximity to ideal
    const distanceFromIdeal = Math.abs(candidateYears - expectation.ideal)
    const maxDistance = Math.max(
      expectation.ideal - expectation.min,
      expectation.max - expectation.ideal
    )
    const proximityScore = 1 - (distanceFromIdeal / maxDistance)
    return 50 + (proximityScore * 50) // 50-100 range
  } else if (candidateYears < expectation.min) {
    // Underqualified
    const shortage = expectation.min - candidateYears
    return Math.max(0, 50 - (shortage * 10))
  } else {
    // Overqualified (but still acceptable)
    const excess = candidateYears - expectation.max
    return Math.max(60, 100 - (excess * 5))
  }
}

/**
 * Calculate location match score
 */
function calculateLocationMatch(
  candidateLocation: string | null,
  candidatePreferredLocation: string | null,
  candidatePreferredWorkType: string | null,
  jobLocation: string | null,
  jobWorkType: string | null
): number {
  // If job is remote and candidate prefers remote, perfect match
  if (jobWorkType === 'remote' && candidatePreferredWorkType === 'remote') {
    return 100
  }

  // If job is remote and candidate is flexible, good match
  if (jobWorkType === 'remote' && (candidatePreferredWorkType === 'flexible' || !candidatePreferredWorkType)) {
    return 90
  }

  // If candidate prefers remote but job is not remote, lower score
  if (candidatePreferredWorkType === 'remote' && jobWorkType !== 'remote') {
    return 30
  }

  // If both have locations, check if they match
  if (jobLocation && candidateLocation) {
    const jobLocLower = jobLocation.toLowerCase()
    const candidateLocLower = candidateLocation.toLowerCase()

    // Exact match
    if (jobLocLower === candidateLocLower) {
      return 100
    }

    // Same city (handle "City, Country" format)
    const jobCity = jobLocLower.split(',')[0].trim()
    const candidateCity = candidateLocLower.split(',')[0].trim()
    if (jobCity === candidateCity) {
      return 90
    }

    // Same country
    const jobCountry = jobLocLower.split(',')[1]?.trim()
    const candidateCountry = candidateLocLower.split(',')[1]?.trim()
    if (jobCountry && candidateCountry && jobCountry === candidateCountry) {
      return 70
    }

    // Different locations
    return 40
  }

  // If candidate has preferred location and it matches
  if (jobLocation && candidatePreferredLocation) {
    const jobLocLower = jobLocation.toLowerCase()
    const preferredLocLower = candidatePreferredLocation.toLowerCase()

    if (jobLocLower === preferredLocLower) {
      return 95
    }

    const jobCity = jobLocLower.split(',')[0].trim()
    const preferredCity = preferredLocLower.split(',')[0].trim()
    if (jobCity === preferredCity) {
      return 85
    }
  }

  // Default: neutral score
  return 50
}

/**
 * Calculate salary match score
 */
function calculateSalaryMatch(
  candidateMin: number | null,
  candidateMax: number | null,
  jobMin: number | null,
  jobMax: number | null
): number {
  // If no salary info, neutral score
  if (!candidateMin && !candidateMax && !jobMin && !jobMax) {
    return 50
  }

  // If only one side has salary info, slight penalty
  if ((!candidateMin && !candidateMax) || (!jobMin && !jobMax)) {
    return 60
  }

  // Normalize ranges
  const candidateRange = {
    min: candidateMin || 0,
    max: candidateMax || Infinity,
  }

  const jobRange = {
    min: jobMin || 0,
    max: jobMax || Infinity,
  }

  // Check for overlap
  const overlapMin = Math.max(candidateRange.min, jobRange.min)
  const overlapMax = Math.min(candidateRange.max, jobRange.max)

  if (overlapMin <= overlapMax) {
    // There's overlap
    const overlapSize = overlapMax - overlapMin
    const candidateRangeSize = candidateRange.max - candidateRange.min
    const jobRangeSize = jobRange.max - jobRange.min
    const avgRangeSize = (candidateRangeSize + jobRangeSize) / 2

    if (avgRangeSize === 0) {
      return 100 // Exact match
    }

    const overlapPercentage = (overlapSize / avgRangeSize) * 100
    return Math.min(100, 70 + (overlapPercentage * 0.3)) // 70-100 range
  } else {
    // No overlap - calculate how far apart
    const gap = Math.min(
      Math.abs(candidateRange.max - jobRange.min),
      Math.abs(jobRange.min - candidateRange.max)
    )
    const avgRange = (candidateRange.max + jobRange.max + candidateRange.min + jobRange.min) / 4
    const gapPercentage = (gap / avgRange) * 100

    // Penalty based on gap size
    return Math.max(0, 50 - (gapPercentage * 0.5))
  }
}

/**
 * Calculate deterministic match score
 * This is the fail-safe base score that always works
 */
export function calculateDeterministicScore(
  candidate: CandidateData,
  job: JobData
): DeterministicScore {
  // Calculate individual components
  const skillMatch = calculateSkillMatch(candidate.skills, job.required_skills)
  const experienceScore = calculateExperienceMatch(candidate.years_experience, job.role_level)
  const locationScore = calculateLocationMatch(
    candidate.location,
    candidate.preferred_location,
    candidate.preferred_work_type,
    job.location,
    job.work_type
  )
  const salaryScore = calculateSalaryMatch(
    candidate.salary_expectation_min,
    candidate.salary_expectation_max,
    job.salary_min,
    job.salary_max
  )

  // Weighted combination
  // Skills: 40%, Experience: 25%, Location: 20%, Salary: 15%
  const totalScore =
    skillMatch.percentage * 0.4 +
    experienceScore * 0.25 +
    locationScore * 0.2 +
    salaryScore * 0.15

  return {
    totalScore: Math.round(totalScore * 100) / 100, // Round to 2 decimals
    skillMatch: Math.round(skillMatch.percentage * 100) / 100,
    experienceMatch: Math.round(experienceScore * 100) / 100,
    locationMatch: Math.round(locationScore * 100) / 100,
    salaryMatch: Math.round(salaryScore * 100) / 100,
    breakdown: {
      skillMatchPercentage: skillMatch.percentage,
      skillMatchDetails: {
        matched: skillMatch.matched,
        missing: skillMatch.missing,
        extra: skillMatch.extra,
      },
      experienceScore,
      locationScore,
      salaryScore,
    },
  }
}

