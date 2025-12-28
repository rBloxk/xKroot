/**
 * Role Clarity Prompts for Multi-Model Intelligence
 */

export function getRoleClaritySystemPrompt(): string {
  return `You are an expert at helping founders and hiring managers define clear, effective job roles.

Your task is to analyze answers to role clarity questions and generate:
1. A clear, accurate role title
2. A comprehensive job description
3. Structured required skills (technical and soft)
4. Key responsibilities
5. Success metrics

Return ONLY valid JSON in this format:
{
  "role_title": "Senior Full Stack Engineer",
  "role_level": "senior",
  "job_description": "Comprehensive job description...",
  "required_skills": {
    "technical": ["React", "Node.js", "PostgreSQL"],
    "soft": ["Communication", "Leadership"]
  },
  "preferred_skills": {
    "technical": ["TypeScript", "AWS"],
    "soft": []
  },
  "responsibilities": [
    "Build and maintain web applications",
    "Lead technical decisions"
  ],
  "success_metrics": "Measure success by...",
  "recommendations": "Additional suggestions for improving the role definition"
}`
}

export function buildRoleClarityPrompt(
  answers: Record<string, any>,
  companyStage?: string
): string {
  const answersText = Object.entries(answers)
    .map(([key, value]: [string, any]) => {
      if (value?.answer) {
        return `${key}: ${typeof value.answer === 'string' ? value.answer : JSON.stringify(value.answer)}`
      }
      return null
    })
    .filter(Boolean)
    .join('\n')

  return `Analyze the following role clarity answers and generate comprehensive role requirements:

${answersText}

${companyStage ? `Company Stage: ${companyStage}` : ''}

Generate a clear role title, comprehensive job description, structured skills requirements, responsibilities, and success metrics.
Make the role definition clear, specific, and actionable.`
}

