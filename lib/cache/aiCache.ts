/**
 * AI Response Cache
 * Caches AI model responses to reduce costs and improve performance
 */

import { TaskType } from '../ai/types'

export interface CacheEntry {
  key: string
  value: any
  taskType: TaskType
  createdAt: number
  expiresAt: number
  hitCount: number
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum cache size
}

/**
 * In-memory cache (for server-side use)
 * In production, consider using Redis or similar
 */
class AICache {
  private cache: Map<string, CacheEntry> = new Map()
  private defaultTTL = 24 * 60 * 60 * 1000 // 24 hours
  private maxSize = 1000 // Maximum entries

  /**
   * Get cached value
   */
  get(key: string): any | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // Update hit count
    entry.hitCount++
    this.cache.set(key, entry)

    return entry.value
  }

  /**
   * Set cached value
   */
  set(key: string, value: any, taskType: TaskType, options: CacheOptions = {}): void {
    // Check cache size
    if (this.cache.size >= (options.maxSize || this.maxSize)) {
      // Remove oldest entry
      this.evictOldest()
    }

    const ttl = options.ttl || this.defaultTTL
    const entry: CacheEntry = {
      key,
      value,
      taskType,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      hitCount: 0,
    }

    this.cache.set(key, entry)
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) {
      return false
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    entries: number
    hitRate?: number
  } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
    }
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

// Singleton instance
const aiCache = new AICache()

/**
 * Generate cache key from input
 */
export function generateCacheKey(taskType: TaskType, input: any): string {
  // Create a hash of the input
  const inputString = JSON.stringify(input)
  
  // Simple hash function (for production, use crypto.createHash)
  let hash = 0
  for (let i = 0; i < inputString.length; i++) {
    const char = inputString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return `${taskType}_${Math.abs(hash).toString(36)}`
}

/**
 * Get cached AI response
 */
export function getCachedResponse(taskType: TaskType, input: any): any | null {
  const key = generateCacheKey(taskType, input)
  return aiCache.get(key)
}

/**
 * Cache AI response
 */
export function cacheResponse(
  taskType: TaskType,
  input: any,
  output: any,
  options: CacheOptions = {}
): void {
  const key = generateCacheKey(taskType, input)
  aiCache.set(key, output, taskType, options)
}

/**
 * Check if response is cached
 */
export function isCached(taskType: TaskType, input: any): boolean {
  const key = generateCacheKey(taskType, input)
  return aiCache.has(key)
}

/**
 * Clear cache
 */
export function clearCache(): void {
  aiCache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return aiCache.getStats()
}

/**
 * Clean expired cache entries
 */
export function cleanExpiredCache(): number {
  return aiCache.cleanExpired()
}

