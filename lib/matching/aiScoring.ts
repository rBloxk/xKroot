/**
 * AI Scoring Layer
 * This enhances the deterministic score with AI insights
 * Always has a fallback to deterministic-only if AI fails
 */

import { supabaseAdmin } from '@/lib/supabase'
import { orchestrateMultiModel } from '@/lib/ai/orchestration/consensus'
import { getMatchReasoningSystemPrompt, buildMatchReasoningPrompt } from '@/lib/ai/prompts/matchReasoning'

export interface AIScoreResult {
  success: boolean
  culturalFitScore?: number // 0-100
  softSkillsScore?: number // 0-100
  reasoning?: string
  strengths?: string[]
  concerns?: string[]
  error?: string
}

/**
 * Get AI prompt for matching
 */
async function getMatchingPrompt(): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_prompt')
      .select('prompt_template')
      .eq('prompt_name', 'matching_ai')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.warn('No active matching AI prompt found, using default')
      return null
    }

    return data.prompt_template
  } catch (error) {
    console.error('Error fetching AI prompt:', error)
    return null
  }
}

/**
 * Call AI service for matching insights
 * This is a placeholder that can be enhanced with actual AI integration
 */
async function callAIService(
  candidateData: any,
  jobData: any,
  deterministicScore: any
): Promise<AIScoreResult> {
  // TODO: Integrate with OpenAI/Anthropic
  // For now, return a structured response that simulates AI output
  
  // Check if AI service is configured
  const hasAIConfig = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
  
  if (!hasAIConfig) {
    // No AI configured, return neutral scores
    return {
      success: false,
      error: 'AI service not configured',
    }
  }

  try {
    // Use Multi-Model Intelligence for match reasoning (Phase 10)
    const systemPrompt = getMatchReasoningSystemPrompt()
    const prompt = buildMatchReasoningPrompt(candidateData, jobData)

    const consensusResult = await orchestrateMultiModel(
      'match_reasoning',
      prompt,
      systemPrompt,
      {
        timeout: 30000,
        requireAll: false,
        fallbackEnabled: true,
        jsonMode: true,
      }
    )

    // Extract results from consensus output
    if (consensusResult.consensus_output) {
      const output = consensusResult.consensus_output
      
      return {
        success: true,
        culturalFitScore: output.cultural_fit?.score || output.cultural_fit_score || 75,
        softSkillsScore: output.soft_skills_score || 70,
        reasoning: output.reasoning || 'Match analysis completed',
        strengths: output.strengths || [],
        concerns: output.concerns || [],
        matchScore: output.match_score,
        recommendations: output.recommendations || [],
        confidence: consensusResult.confidence_score,
      }
    }

    // Fallback if consensus output is invalid
    return {
      success: false,
      error: 'Invalid consensus output format',
    }
  } catch (error: any) {
    console.error('AI scoring error:', error)
    return {
      success: false,
      error: error.message || 'AI service error',
    }
  }
}

/**
 * Calculate AI-enhanced match score
 * Returns AI scores if available, otherwise returns null (use deterministic only)
 */
export async function calculateAIScore(
  candidateData: any,
  jobData: any,
  deterministicScore: any
): Promise<AIScoreResult> {
  try {
    const aiResult = await callAIService(candidateData, jobData, deterministicScore)
    
    if (!aiResult.success) {
      // AI failed, return failure (caller should use deterministic only)
      return aiResult
    }

    // Validate AI response structure
    if (
      typeof aiResult.culturalFitScore !== 'number' ||
      aiResult.culturalFitScore < 0 ||
      aiResult.culturalFitScore > 100
    ) {
      return {
        success: false,
        error: 'Invalid AI response format',
      }
    }

    return aiResult
  } catch (error: any) {
    console.error('AI scoring exception:', error)
    return {
      success: false,
      error: error.message || 'AI scoring failed',
    }
  }
}

/**
 * Combine deterministic and AI scores
 * Always falls back to deterministic if AI fails
 */
export function combineScores(
  deterministicScore: number,
  aiResult: AIScoreResult
): {
  finalScore: number
  breakdown: {
    deterministic: number
    aiEnhancement: number | null
    culturalFit: number | null
    softSkills: number | null
  }
} {
  // If AI failed, use deterministic only
  if (!aiResult.success || !aiResult.culturalFitScore || !aiResult.softSkillsScore) {
    return {
      finalScore: deterministicScore,
      breakdown: {
        deterministic: deterministicScore,
        aiEnhancement: null,
        culturalFit: null,
        softSkills: null,
      },
    }
  }

  // Combine scores with weights
  // Deterministic: 70%, AI Cultural Fit: 15%, AI Soft Skills: 15%
  const aiEnhancement = (aiResult.culturalFitScore * 0.5 + aiResult.softSkillsScore * 0.5)
  const finalScore = deterministicScore * 0.7 + aiEnhancement * 0.3

  return {
    finalScore: Math.round(finalScore * 100) / 100,
    breakdown: {
      deterministic: deterministicScore,
      aiEnhancement: Math.round(aiEnhancement * 100) / 100,
      culturalFit: Math.round(aiResult.culturalFitScore * 100) / 100,
      softSkills: Math.round(aiResult.softSkillsScore * 100) / 100,
    },
  }
}

