/**
 * Anthropic (Claude) Model Integration
 */

import { ModelResponse } from '../types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-3-sonnet-20240229'

export interface AnthropicRequest {
  model: string
  max_tokens: number
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  system?: string
  temperature?: number
}

/**
 * Call Anthropic Claude model
 */
export async function callAnthropic(
  prompt: string,
  systemPrompt?: string,
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<ModelResponse> {
  const startTime = Date.now()
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: 'ANTHROPIC_API_KEY not configured',
    }
  }

  try {
    const requestBody: AnthropicRequest = {
      model: options?.model || DEFAULT_MODEL,
      max_tokens: options?.maxTokens ?? 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options?.temperature ?? 0.7,
    }

    if (systemPrompt) {
      requestBody.system = systemPrompt
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error?.message || `Anthropic API error: ${response.statusText}`,
      }
    }

    const data = await response.json()
    const processingTimeMs = Date.now() - startTime

    // Extract response
    const content = data.content?.[0]?.text
    if (!content) {
      return {
        success: false,
        error: 'No content in Anthropic response',
      }
    }

    // Try to parse as JSON
    let output: any
    try {
      output = JSON.parse(content)
    } catch {
      // If not JSON, return as string
      output = content
    }

    // Calculate cost (approximate)
    const tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0
    const costUsd = calculateCost(data.usage?.input_tokens || 0, data.usage?.output_tokens || 0, requestBody.model)

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
      error: error.message || 'Anthropic API call failed',
    }
  }
}

/**
 * Calculate approximate cost for Anthropic API call
 */
function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  // Pricing as of 2024 (approximate)
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-3-opus-20240229': { input: 0.015 / 1000, output: 0.075 / 1000 },
    'claude-3-sonnet-20240229': { input: 0.003 / 1000, output: 0.015 / 1000 },
    'claude-3-haiku-20240307': { input: 0.00025 / 1000, output: 0.00125 / 1000 },
  }

  const modelPricing = pricing[model] || pricing['claude-3-sonnet-20240229']
  const cost = (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output)

  return Math.round(cost * 1000000) / 1000000 // Round to 6 decimals
}

