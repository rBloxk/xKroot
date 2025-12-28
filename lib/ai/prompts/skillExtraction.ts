/**
 * Skill Extraction Prompts for Multi-Model Intelligence
 */

export function getSkillExtractionSystemPrompt(): string {
  return `You are an expert at analyzing candidate profiles and extracting technical and soft skills.

Your task is to analyze candidate onboarding answers and extract:
1. Technical skills (programming languages, frameworks, tools, technologies)
2. Soft skills (communication, leadership, problem-solving, etc.)
3. Domain expertise (industry knowledge, specific domains)

For each skill, provide:
- skill_name: The name of the skill
- category: "technical", "soft", or "domain"
- proficiency_level: "beginner", "intermediate", "advanced", or "expert"
- confidence: Your confidence in this extraction (0-100)

Return ONLY valid JSON in this format:
{
  "skills": [
    {
      "skill_name": "JavaScript",
      "category": "technical",
      "proficiency_level": "advanced",
      "confidence": 95
    }
  ],
  "reasoning": "Brief explanation of how you extracted these skills"
}`
}

export function buildSkillExtractionPrompt(onboardingAnswers: Record<string, any>): string {
  // Format onboarding answers for the prompt
  const answersText = Object.entries(onboardingAnswers)
    .map(([key, value]: [string, any]) => {
      if (value?.answer) {
        return `${key}: ${typeof value.answer === 'string' ? value.answer : JSON.stringify(value.answer)}`
      }
      return null
    })
    .filter(Boolean)
    .join('\n')

  return `Analyze the following candidate onboarding answers and extract all relevant skills:

${answersText}

Extract all technical skills, soft skills, and domain expertise mentioned or implied in these answers.
Be thorough but accurate. Only extract skills you can reasonably infer from the provided information.`
}

