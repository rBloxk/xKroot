/**
 * Match Reasoning Prompts for Multi-Model Intelligence
 */

export function getMatchReasoningSystemPrompt(): string {
  return `You are an expert at analyzing candidate-job matches and providing detailed reasoning.

Your task is to analyze a candidate profile and job requirements, then provide:
1. A match score (0-100)
2. Detailed reasoning for the match
3. Strengths (what makes this a good match)
4. Concerns (potential issues or gaps)
5. Cultural fit assessment
6. Recommendations for next steps

Return ONLY valid JSON in this format:
{
  "match_score": 85,
  "reasoning": "Detailed explanation of why this is a good match...",
  "strengths": [
    "Strong technical skills match",
    "Relevant experience"
  ],
  "concerns": [
    "May need training on specific framework",
    "Salary expectations may not align"
  ],
  "cultural_fit": {
    "score": 80,
    "explanation": "Candidate values align well with company culture"
  },
  "recommendations": [
    "Proceed with technical interview",
    "Discuss salary expectations early"
  ],
  "confidence": 0.85
}`
}

export function buildMatchReasoningPrompt(
  candidateData: any,
  jobData: any
): string {
  return `Analyze the match between this candidate and job:

CANDIDATE PROFILE:
- Skills: ${JSON.stringify(candidateData.skills || [])}
- Experience Level: ${candidateData.experience_level || 'Not specified'}
- Location: ${candidateData.location || 'Not specified'}
- Salary Expectations: ${candidateData.salary_min ? `$${candidateData.salary_min}` : 'Not specified'} - ${candidateData.salary_max ? `$${candidateData.salary_max}` : 'Not specified'}
- Work Type Preference: ${candidateData.work_type_preference || 'Not specified'}
- Bio: ${candidateData.bio || 'Not provided'}

JOB REQUIREMENTS:
- Role Title: ${jobData.role_title || 'Not specified'}
- Required Skills: ${JSON.stringify(jobData.required_skills || {})}
- Role Level: ${jobData.role_level || 'Not specified'}
- Location: ${jobData.location || 'Not specified'}
- Salary Range: ${jobData.salary_min ? `$${jobData.salary_min}` : 'Not specified'} - ${jobData.salary_max ? `$${jobData.salary_max}` : 'Not specified'}
- Work Type: ${jobData.work_type || 'Not specified'}
- Job Description: ${jobData.job_description || 'Not provided'}

Provide a comprehensive match analysis with score, reasoning, strengths, concerns, cultural fit, and recommendations.`
}

