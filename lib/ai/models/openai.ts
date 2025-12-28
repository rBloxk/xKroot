/**
 * OpenAI (GPT-4) Model Integration
 */

import { ModelResponse, ModelName } from '../types'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4-turbo-preview'

export interface OpenAIRequest {
  model?: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  response_format?: {
    type: 'json_object'
  }
  temperature?: number
  max_tokens?: number
}

/**
 * Call OpenAI GPT-4 model
 */
export async function callOpenAI(
  prompt: string,
  systemPrompt?: string,
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean
  }
): Promise<ModelResponse> {
  const startTime = Date.now()
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: 'OPENAI_API_KEY not configured',
    }
  }

  try {
    const messages: OpenAIRequest['messages'] = []
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      })
    }
    
    messages.push({
      role: 'user',
      content: prompt,
    })

    const requestBody: OpenAIRequest = {
      model: options?.model || DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    }

    // Enable JSON mode if requested
    if (options?.jsonMode) {
      requestBody.response_format = { type: 'json_object' }
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error?.message || `OpenAI API error: ${response.statusText}`,
      }
    }

    const data = await response.json()
    const processingTimeMs = Date.now() - startTime

    // Extract response
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return {
        success: false,
        error: 'No content in OpenAI response',
      }
    }

    // Parse JSON if JSON mode was used
    let output: any
    try {
      output = JSON.parse(content)
    } catch {
      // If not JSON, return as string
      output = content
    }

    // Calculate cost (approximate)
    const tokensUsed = data.usage?.total_tokens || 0
    const costUsd = calculateCost(tokensUsed, requestBody.model || DEFAULT_MODEL)

    return {
      success: true,
      output,
      rawResponse: JSON.stringify(data),
      tokensUsed,
      processingTimeMs,
      costUsd,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'OpenAI API call failed',
    }
  }
}

/**
 * Calculate approximate cost for OpenAI API call
 */
function calculateCost(tokens: number, model: string): number {
  // Pricing as of 2024 (approximate)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4-turbo-preview': { input: 0.01 / 1000, output: 0.03 / 1000 },
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 },
  }

  const modelPricing = pricing[model] || pricing['gpt-4-turbo-preview']
  // Assume 50/50 split for simplicity (actual split would require tracking input/output separately)
  const estimatedCost = (tokens / 2) * modelPricing.input + (tokens / 2) * modelPricing.output

  return Math.round(estimatedCost * 1000000) / 1000000 // Round to 6 decimals
}

