'use client'

import { MatchFactorData } from '@/lib/matching/factors'
import { getFactorExplanation, getFactorColorClasses } from '@/lib/matching/factors'

interface MatchFactorCardProps {
  factor: MatchFactorData
  showDetails?: boolean
}

export default function MatchFactorCard({ factor, showDetails = true }: MatchFactorCardProps) {
  const explanation = getFactorExplanation(factor)
  const colors = getFactorColorClasses(factor.factor_score)
  const score = factor.factor_score

  return (
    <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg} transition-all hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {explanation.icon && (
            <span className="text-xl">{explanation.icon}</span>
          )}
          <div>
            <h5 className="text-sm font-semibold text-black dark:text-gray">
              {explanation.title}
            </h5>
            {factor.factor_weight < 1 && (
              <span className="text-xs text-gray-dark dark:text-gray-400">
                {Math.round(factor.factor_weight * 100)}% weight
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${colors.text}`}>
            {score.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              score >= 80
                ? 'bg-green-500 dark:bg-green-400'
                : score >= 60
                ? 'bg-[#004bff] dark:bg-[#4d7fff]'
                : 'bg-red-500 dark:bg-red-400'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Description */}
      {showDetails && (
        <>
          <p className="text-xs text-gray-dark dark:text-gray-300 mb-2">
            {explanation.description}
          </p>

          {/* Details */}
          {explanation.details.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <ul className="space-y-1">
                {explanation.details.map((detail, idx) => (
                  <li key={idx} className="text-xs text-gray-dark dark:text-gray-400 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence */}
          {factor.evidence && Object.keys(factor.evidence).length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {factor.evidence.matched && factor.evidence.matched.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Matched Skills:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {factor.evidence.matched.slice(0, 5).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {factor.evidence.matched.length > 5 && (
                      <span className="text-xs text-gray-dark dark:text-gray-400">
                        +{factor.evidence.matched.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              {factor.evidence.missing && factor.evidence.missing.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">
                    Missing Skills:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {factor.evidence.missing.slice(0, 5).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {factor.evidence.missing.length > 5 && (
                      <span className="text-xs text-gray-dark dark:text-gray-400">
                        +{factor.evidence.missing.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

