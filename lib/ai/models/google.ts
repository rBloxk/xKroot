/**
 * Google (Gemini) Model Integration
 */

import { ModelResponse } from '../types'

const GOOGLE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-pro'

/**
 * Call Google Gemini model
 */
export async function callGoogle(
  prompt: string,
  systemPrompt?: string,
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<ModelResponse> {
  const startTime = Date.now()
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: 'GOOGLE_API_KEY not configured',
    }
  }

  try {
    const model = options?.model || DEFAULT_MODEL
    const url = `${GOOGLE_API_URL}/${model}:generateContent?key=${apiKey}`

    // Combine system prompt and user prompt
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\n${prompt}`
      : prompt

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: fullPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2000,
        responseMimeType: 'application/json', // Request JSON response
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error?.message || `Google API error: ${response.statusText}`,
      }
    }

    const data = await response.json()
    const processingTimeMs = Date.now() - startTime

    // Extract response
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) {
      return {
        success: false,
        error: 'No content in Google response',
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
    // Note: Gemini pricing may vary, using approximate values
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0
    const costUsd = calculateCost(tokensUsed, model)

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
      error: error.message || 'Google API call failed',
    }
  }
}

/**
 * Calculate approximate cost for Google API call
 */
function calculateCost(tokens: number, model: string): number {
  // Pricing as of 2024 (approximate - Gemini pricing may vary)
  const pricing: Record<string, number> = {
    'gemini-pro': 0.0005 / 1000, // Per token (input + output)
    'gemini-1.5-pro': 0.00125 / 1000,
  }

  const pricePerToken = pricing[model] || pricing['gemini-pro']
  const cost = tokens * pricePerToken

  return Math.round(cost * 1000000) / 1000000 // Round to 6 decimals
}

