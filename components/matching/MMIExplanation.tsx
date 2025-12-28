'use client'

import { ConsensusResult } from '@/lib/ai/types'
import { generateExplanation, Explanation } from '@/lib/ai/explainability/explainer'
import { getConfidenceDisplay, getConfidenceBadgeClasses } from '@/lib/ai/confidence/calculator'
import { useState } from 'react'

interface MMIExplanationProps {
  consensus?: ConsensusResult | null
  matchScore?: number
  matchConfidence?: number
}

export default function MMIExplanation({ consensus, matchScore, matchConfidence }: MMIExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // If no consensus data, show basic confidence if available
  if (!consensus && matchConfidence !== undefined) {
    const confidence = getConfidenceDisplay(matchConfidence)
    const badgeClasses = getConfidenceBadgeClasses(confidence.level)

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">{confidence.icon}</span>
          <span className={`text-sm font-semibold ${badgeClasses.text}`}>
            {confidence.label}
          </span>
          <span className="text-xs text-gray-dark dark:text-gray-400">
            ({((matchConfidence || 0) * 100).toFixed(0)}%)
          </span>
        </div>
        <p className="text-xs text-gray-dark dark:text-gray-300 mt-1">
          {confidence.description}
        </p>
      </div>
    )
  }

  if (!consensus) {
    return null
  }

  const explanation = generateExplanation(consensus)
  const confidence = getConfidenceDisplay(consensus.confidence_score)
  const badgeClasses = getConfidenceBadgeClasses(confidence.level)

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{confidence.icon}</span>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              Multi-Model Intelligence Analysis
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded ${badgeClasses.bg} ${badgeClasses.text}`}>
                {confidence.label} ({(consensus.confidence_score * 100).toFixed(0)}%)
              </span>
              {consensus.model_agreement !== undefined && (
                <span className="text-xs text-gray-dark dark:text-gray-400">
                  {((consensus.model_agreement * 100).toFixed(0))}% agreement
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-700 dark:text-blue-300 hover:underline"
        >
          {isExpanded ? 'Less' : 'More'}
        </button>
      </div>

      {/* Summary */}
      <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
        {explanation.summary}
      </p>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 space-y-3">
          {/* Model Contributions */}
          {explanation.modelContributions.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Model Contributions:
              </h5>
              <div className="space-y-2">
                {explanation.modelContributions.map((contrib, idx) => (
                  <div key={idx} className="text-xs text-blue-800 dark:text-blue-300">
                    <div className="font-medium">{contrib.insight}</div>
                    <div className="text-blue-700 dark:text-blue-400 ml-2">
                      {contrib.contribution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision */}
          <div>
            <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Decision:
            </h5>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              {explanation.decision.method} - {explanation.decision.reasoning}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 font-medium">
              {explanation.decision.recommendation}
            </p>
          </div>

          {/* Details */}
          {explanation.details.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Details:
              </h5>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                {explanation.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confidence Reasoning */}
          <div>
            <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Confidence Reasoning:
            </h5>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              {explanation.confidence.reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

