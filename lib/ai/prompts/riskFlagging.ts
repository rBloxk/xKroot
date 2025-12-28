/**
 * Risk Flagging Prompts for Multi-Model Intelligence
 */

export function getRiskFlaggingSystemPrompt(): string {
  return `You are an expert at identifying potential risks in hiring decisions and job postings.

Your task is to analyze candidates or job postings and identify:
1. Potential red flags
2. Risk level (low, medium, high, critical)
3. Specific risk factors
4. Recommendations for mitigation

Be thorough but fair. Only flag genuine concerns, not biases.

Return ONLY valid JSON in this format:
{
  "has_risks": true,
  "risk_level": "medium",
  "risk_factors": [
    {
      "type": "experience_mismatch",
      "severity": "medium",
      "description": "Candidate has significantly less experience than required",
      "recommendation": "Consider if candidate can grow into role"
    }
  ],
  "overall_assessment": "Overall assessment of risks...",
  "recommendations": [
    "Conduct thorough reference checks",
    "Consider probationary period"
  ],
  "confidence": 0.90
}`
}

export function buildCandidateRiskPrompt(candidateData: any, jobData: any): string {
  return `Analyze this candidate for potential risks in the context of this job:

CANDIDATE:
- Skills: ${JSON.stringify(candidateData.skills || [])}
- Experience: ${candidateData.experience_level || 'Not specified'}
- Location: ${candidateData.location || 'Not specified'}
- Salary Expectations: ${candidateData.salary_min ? `$${candidateData.salary_min}` : 'Not specified'} - ${candidateData.salary_max ? `$${candidateData.salary_max}` : 'Not specified'}
- Work Type Preference: ${candidateData.work_type_preference || 'Not specified'}
- Bio: ${candidateData.bio || 'Not provided'}

JOB:
- Role: ${jobData.role_title || 'Not specified'}
- Required Skills: ${JSON.stringify(jobData.required_skills || {})}
- Level: ${jobData.role_level || 'Not specified'}
- Location: ${jobData.location || 'Not specified'}
- Salary Range: ${jobData.salary_min ? `$${jobData.salary_min}` : 'Not specified'} - ${jobData.salary_max ? `$${jobData.salary_max}` : 'Not specified'}

Identify potential risks such as:
- Experience/skill mismatches
- Salary misalignment
- Location/work type conflicts
- Overqualification concerns
- Cultural fit issues
- Any red flags in the profile`
}

export function buildJobRiskPrompt(jobData: any): string {
  return `Analyze this job posting for potential risks:

JOB POSTING:
- Role Title: ${jobData.role_title || 'Not specified'}
- Required Skills: ${JSON.stringify(jobData.required_skills || {})}
- Role Level: ${jobData.role_level || 'Not specified'}
- Location: ${jobData.location || 'Not specified'}
- Salary Range: ${jobData.salary_min ? `$${jobData.salary_min}` : 'Not specified'} - ${jobData.salary_max ? `$${jobData.salary_max}` : 'Not specified'}
- Work Type: ${jobData.work_type || 'Not specified'}
- Job Description: ${jobData.job_description || 'Not provided'}

Identify potential risks such as:
- Unrealistic requirements
- Salary misalignment with market
- Vague or unclear job description
- Too many required skills
- Unclear expectations
- Potential for attracting wrong candidates`
}

