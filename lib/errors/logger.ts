/**
 * Structured Error Logging & Monitoring System
 * Provides centralized logging with different severity levels and monitoring capabilities
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
  metadata?: Record<string, any>
}

export interface ErrorContext {
  taskType?: string
  taskId?: string
  modelName?: string
  userId?: string
  apiEndpoint?: string
  [key: string]: any
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs: number = 1000
  private enableConsole: boolean = true
  private enableDatabase: boolean = false // Can be enabled to store in database

  /**
   * Log a message with a specific level
   */
  log(level: LogLevel, message: string, context?: ErrorContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
      metadata: {
        environment: process.env.NODE_ENV || 'development',
      },
    }

    // Add to in-memory logs
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift() // Remove oldest log
    }

    // Console output
    if (this.enableConsole) {
      this.logToConsole(entry)
    }

    // Database storage (if enabled)
    if (this.enableDatabase) {
      this.logToDatabase(entry).catch(err => {
        console.error('Failed to log to database:', err)
      })
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: ErrorContext): void {
    this.log('debug', message, context)
  }

  /**
   * Info level logging
   */
  info(message: string, context?: ErrorContext): void {
    this.log('info', message, context)
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: ErrorContext): void {
    this.log('warn', message, context)
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: ErrorContext): void {
    this.log('error', message, context, error)
  }

  /**
   * Critical level logging
   */
  critical(message: string, error?: Error, context?: ErrorContext): void {
    this.log('critical', message, context, error)
  }

  /**
   * Log AI model call
   */
  logModelCall(
    modelName: string,
    taskType: string,
    taskId: string,
    success: boolean,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    const level = success ? 'info' : 'error'
    const message = success
      ? `Model call succeeded: ${modelName} for ${taskType}`
      : `Model call failed: ${modelName} for ${taskType}`

    this.log(level, message, {
      modelName,
      taskType,
      taskId,
      ...metadata,
    }, error ? new Error(error) : undefined)
  }

  /**
   * Log consensus result
   */
  logConsensus(
    taskType: string,
    taskId: string,
    confidence: number,
    modelCount: number,
    successCount: number,
    metadata?: Record<string, any>
  ): void {
    const level = confidence >= 0.7 ? 'info' : confidence >= 0.5 ? 'warn' : 'error'
    const message = `Consensus result: ${taskType} (confidence: ${(confidence * 100).toFixed(1)}%)`

    this.log(level, message, {
      taskType,
      taskId,
      confidence,
      modelCount,
      successCount,
      ...metadata,
    })
  }

  /**
   * Log drift detection
   */
  logDrift(
    taskType: string,
    driftType: string,
    severity: string,
    description: string,
    metadata?: Record<string, any>
  ): void {
    const level = severity === 'critical' ? 'critical' : severity === 'high' ? 'error' : 'warn'
    const message = `Drift detected: ${driftType} for ${taskType} (${severity})`

    this.log(level, message, {
      taskType,
      driftType,
      severity,
      description,
      ...metadata,
    })
  }

  /**
   * Log API error
   */
  logApiError(
    endpoint: string,
    method: string,
    statusCode: number,
    error: Error,
    context?: ErrorContext
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    const message = `API error: ${method} ${endpoint} - ${statusCode}`

    this.log(level, message, {
      endpoint,
      method,
      statusCode,
      ...context,
    }, error)
  }

  /**
   * Get recent logs
   */
  getRecentLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filtered = this.logs

    if (level) {
      filtered = filtered.filter(log => log.level === level)
    }

    return filtered.slice(-limit).reverse()
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeWindowMinutes: number = 60): {
    total: number
    byLevel: Record<LogLevel, number>
    byTaskType: Record<string, number>
    recentErrors: LogEntry[]
  } {
    const cutoff = new Date()
    cutoff.setMinutes(cutoff.getMinutes() - timeWindowMinutes)

    const recentLogs = this.logs.filter(log => log.timestamp >= cutoff)
    const errors = recentLogs.filter(log => log.level === 'error' || log.level === 'critical')

    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      critical: 0,
    }

    const byTaskType: Record<string, number> = {}

    recentLogs.forEach(log => {
      byLevel[log.level]++
      if (log.context?.taskType) {
        byTaskType[log.context.taskType] = (byTaskType[log.context.taskType] || 0) + 1
      }
    })

    return {
      total: recentLogs.length,
      byLevel,
      byTaskType,
      recentErrors: errors.slice(-20).reverse(),
    }
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    const level = entry.level.toUpperCase().padEnd(8)
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
    const errorStr = entry.error ? `\n  Error: ${entry.error.message}\n  Stack: ${entry.error.stack}` : ''

    const message = `[${timestamp}] ${level} ${entry.message}${contextStr}${errorStr}`

    switch (entry.level) {
      case 'debug':
        console.debug(message)
        break
      case 'info':
        console.info(message)
        break
      case 'warn':
        console.warn(message)
        break
      case 'error':
      case 'critical':
        console.error(message)
        break
    }
  }

  /**
   * Log to database (placeholder for future implementation)
   */
  private async logToDatabase(entry: LogEntry): Promise<void> {
    // TODO: Implement database logging
    // Could store in a logs table or use external logging service
    // For now, this is a placeholder
  }

  /**
   * Configure logger
   */
  configure(options: {
    maxLogs?: number
    enableConsole?: boolean
    enableDatabase?: boolean
  }): void {
    if (options.maxLogs !== undefined) {
      this.maxLogs = options.maxLogs
    }
    if (options.enableConsole !== undefined) {
      this.enableConsole = options.enableConsole
    }
    if (options.enableDatabase !== undefined) {
      this.enableDatabase = options.enableDatabase
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export function logDebug(message: string, context?: ErrorContext): void {
  logger.debug(message, context)
}

export function logInfo(message: string, context?: ErrorContext): void {
  logger.info(message, context)
}

export function logWarn(message: string, context?: ErrorContext): void {
  logger.warn(message, context)
}

export function logError(message: string, error?: Error, context?: ErrorContext): void {
  logger.error(message, error, context)
}

export function logCritical(message: string, error?: Error, context?: ErrorContext): void {
  logger.critical(message, error, context)
}

