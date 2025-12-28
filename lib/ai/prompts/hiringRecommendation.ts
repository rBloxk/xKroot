/**
 * Hiring Recommendation Prompts for Multi-Model Intelligence
 */

export function getHiringRecommendationSystemPrompt(): string {
  return `You are an expert hiring advisor providing final hiring recommendations.

Your task is to analyze all available information about a candidate-job match and provide:
1. A hiring recommendation (strong_yes, yes, maybe, no, strong_no)
2. Confidence level (high, medium, low)
3. Detailed reasoning
4. Key factors influencing the decision
5. Next steps recommendations

Return ONLY valid JSON in this format:
{
  "recommendation": "yes",
  "confidence": "high",
  "score": 85,
  "reasoning": "Detailed explanation of the recommendation...",
  "key_factors": {
    "strengths": [
      "Excellent technical match",
      "Strong cultural fit"
    ],
    "concerns": [
      "May need onboarding support"
    ]
  },
  "next_steps": [
    "Proceed with technical interview",
    "Schedule culture fit interview",
    "Discuss salary expectations"
  ],
  "alternative_recommendations": [
    "Consider for a different role if available"
  ],
  "confidence_score": 0.88
}`
}

export function buildHiringRecommendationPrompt(
  candidateData: any,
  jobData: any,
  matchData: any,
  assessmentData?: any
): string {
  return `Provide a final hiring recommendation based on this comprehensive information:

CANDIDATE:
- Skills: ${JSON.stringify(candidateData.skills || [])}
- Experience: ${candidateData.experience_level || 'Not specified'}
- Location: ${candidateData.location || 'Not specified'}
- Salary Expectations: ${candidateData.salary_min ? `$${candidateData.salary_min}` : 'Not specified'} - ${candidateData.salary_max ? `$${candidateData.salary_max}` : 'Not specified'}
- Bio: ${candidateData.bio || 'Not provided'}

JOB:
- Role: ${jobData.role_title || 'Not specified'}
- Required Skills: ${JSON.stringify(jobData.required_skills || {})}
- Level: ${jobData.role_level || 'Not specified'}
- Location: ${jobData.location || 'Not specified'}
- Salary Range: ${jobData.salary_min ? `$${jobData.salary_min}` : 'Not specified'} - ${jobData.salary_max ? `$${jobData.salary_max}` : 'Not specified'}

MATCH ANALYSIS:
- Match Score: ${matchData.match_score || 'Not calculated'}
- Skill Match: ${matchData.skill_match_percentage || 'Not calculated'}%
- Cultural Fit: ${matchData.cultural_fit_score || 'Not calculated'}
- Reasoning: ${matchData.match_reasoning || 'Not provided'}

${assessmentData ? `ASSESSMENT RESULTS:
${JSON.stringify(assessmentData, null, 2)}` : ''}

Provide a final hiring recommendation with detailed reasoning, confidence level, and actionable next steps.`
}

