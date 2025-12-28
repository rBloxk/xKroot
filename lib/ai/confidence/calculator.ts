/**
 * Confidence Calculator
 * Provides utilities for calculating and displaying confidence levels
 */

import { ConfidenceLevel } from '../types'
import { ConsensusScore } from '../orchestration/scorer'

export interface ConfidenceDisplay {
  level: ConfidenceLevel
  score: number
  label: string
  description: string
  color: string
  icon: string
}

/**
 * Get confidence display information
 */
export function getConfidenceDisplay(confidence: number): ConfidenceDisplay {
  const level = getConfidenceLevel(confidence)
  
  return {
    level,
    score: confidence,
    label: getConfidenceLabel(level),
    description: getConfidenceDescription(level, confidence),
    color: getConfidenceColor(level),
    icon: getConfidenceIcon(level),
  }
}

/**
 * Get confidence level from score
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}

/**
 * Get confidence label
 */
function getConfidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'High Confidence'
    case 'medium':
      return 'Medium Confidence'
    case 'low':
      return 'Low Confidence'
  }
}

/**
 * Get confidence description
 */
function getConfidenceDescription(level: ConfidenceLevel, score: number): string {
  const percent = (score * 100).toFixed(0)
  
  switch (level) {
    case 'high':
      return `High confidence (${percent}%) - Models are in strong agreement. This result is highly reliable.`
    case 'medium':
      return `Medium confidence (${percent}%) - Models show moderate agreement. This result is reasonably reliable.`
    case 'low':
      return `Low confidence (${percent}%) - Models show disagreement or uncertainty. Review carefully.`
  }
}

/**
 * Get confidence color
 */
function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'green'
    case 'medium':
      return 'blue'
    case 'low':
      return 'red'
  }
}

/**
 * Get confidence icon
 */
function getConfidenceIcon(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return '✓'
    case 'medium':
      return '⚠'
    case 'low':
      return '?'
  }
}

/**
 * Get confidence badge classes
 */
export function getConfidenceBadgeClasses(level: ConfidenceLevel): {
  bg: string
  text: string
  border: string
} {
  switch (level) {
    case 'high':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-200',
        border: 'border-green-300 dark:border-green-700',
      }
    case 'medium':
      return {
        bg: 'bg-[#e6f0ff] dark:bg-[#001966]/30',
        text: 'text-[#0038cc] dark:text-[#99bfff]',
        border: 'border-[#99bfff] dark:border-[#002699]',
      }
    case 'low':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-200',
        border: 'border-red-300 dark:border-red-700',
      }
  }
}

/**
 * Calculate confidence from consensus score
 */
export function calculateConfidenceFromConsensus(consensusScore: ConsensusScore): ConfidenceDisplay {
  return getConfidenceDisplay(consensusScore.confidence)
}

