/**
 * Enhanced Error Handling System
 *
 * Comprehensive error management with:
 * - Error classification and categorization
 * - Error logging and tracking
 * - Error recovery strategies
 * - User-friendly error messages
 * - Error boundary integration
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories
 */
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown',
}

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public category: ErrorCategory = ErrorCategory.UNKNOWN,
    public details?: any,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace?.(this, AppError);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      category: this.category,
      details: this.details,
      recoverable: this.recoverable,
      stack: this.stack,
    };
  }
}

/**
 * Network error
 */
export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', ErrorSeverity.MEDIUM, ErrorCategory.NETWORK, details);
    this.name = 'NetworkError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, public fieldErrors?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', ErrorSeverity.LOW, ErrorCategory.VALIDATION, {
      fieldErrors,
    });
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', ErrorSeverity.HIGH, ErrorCategory.AUTHENTICATION, undefined, false);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', ErrorSeverity.HIGH, ErrorCategory.AUTHORIZATION, undefined, false);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', ErrorSeverity.LOW, ErrorCategory.NOT_FOUND, { resource, id });
    this.name = 'NotFoundError';
  }
}

/**
 * Server error
 */
export class ServerError extends AppError {
  constructor(message: string, public statusCode: number = 500, details?: any) {
    super(message, 'SERVER_ERROR', ErrorSeverity.HIGH, ErrorCategory.SERVER, details, false);
    this.name = 'ServerError';
  }
}

/**
 * Error log entry
 */
interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  error: AppError;
  context?: {
    component?: string;
    action?: string;
    route?: string;
    userAgent?: string;
    userId?: string;
    [key: string]: any;
  };
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  maxLogSize: number;
  logRetentionDays: number;
  onError?: (error: AppError) => void;
  onRecover?: (error: AppError, recovery: any) => void;
}

/**
 * Enhanced error handler
 */
export class ErrorHandler {
  private errorLogs: ErrorLogEntry[] = [];
  private config: ErrorHandlerConfig;
  private errorCallbacks: Map<string, (error: AppError) => void> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableReporting: false,
      maxLogSize: 1000,
      logRetentionDays: 30,
      ...config,
    };

    this.setupGlobalErrorHandlers();
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.handleError(
        new AppError(
          event.message,
          'UNHANDLED_ERROR',
          ErrorSeverity.HIGH,
          ErrorCategory.CLIENT,
          {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          }
        )
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new AppError(
          event.reason?.message || 'Unhandled promise rejection',
          'UNHANDLED_PROMISE',
          ErrorSeverity.HIGH,
          ErrorCategory.CLIENT,
          { reason: event.reason }
        )
      );
    });
  }

  /**
   * Handle error
   */
  handleError(error: Error | AppError, context?: ErrorLogEntry['context']): string {
    const appError = error instanceof AppError ? error : this.convertToAppError(error);

    const logEntry: ErrorLogEntry = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      error: appError,
      context,
      resolved: false,
    };

    // Add to logs
    if (this.config.enableLogging) {
      this.errorLogs.push(logEntry);

      // Trim logs if needed
      if (this.errorLogs.length > this.config.maxLogSize) {
        this.errorLogs = this.errorLogs.slice(-this.config.maxLogSize);
      }

      // Clean old logs
      this.cleanOldLogs();
    }

    // Log to console
    this.logToConsole(appError, context);

    // Call error callback
    this.config.onError?.(appError);

    // Call specific error callbacks
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(appError);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });

    // Report error if enabled
    if (this.config.enableReporting) {
      this.reportError(appError, context);
    }

    return logEntry.id;
  }

  /**
   * Convert generic error to AppError
   */
  private convertToAppError(error: Error): AppError {
    if (error instanceof TypeError) {
      return new AppError(
        error.message,
        'TYPE_ERROR',
        ErrorSeverity.MEDIUM,
        ErrorCategory.CLIENT
      );
    }

    if (error instanceof ReferenceError) {
      return new AppError(
        error.message,
        'REFERENCE_ERROR',
        ErrorSeverity.HIGH,
        ErrorCategory.CLIENT
      );
    }

    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      ErrorSeverity.MEDIUM,
      ErrorCategory.UNKNOWN
    );
  }

  /**
   * Log to console
   */
  private logToConsole(error: AppError, context?: any): void {
    const logMethod = {
      [ErrorSeverity.LOW]: console.info,
      [ErrorSeverity.MEDIUM]: console.warn,
      [ErrorSeverity.HIGH]: console.error,
      [ErrorSeverity.CRITICAL]: console.error,
    }[error.severity];

    logMethod('Error logged:', {
      message: error.message,
      code: error.code,
      severity: error.severity,
      category: error.category,
      context,
      stack: error.stack,
    });
  }

  /**
   * Report error (to external service)
   */
  private reportError(error: AppError, context?: any): void {
    // This would integrate with error reporting services like Sentry, LogRocket, etc.
    console.log('Error would be reported:', error, context);
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean old logs
   */
  private cleanOldLogs(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.logRetentionDays);

    this.errorLogs = this.errorLogs.filter((log) => log.timestamp > cutoffDate);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: AppError): string {
    const messages: Record<string, string> = {
      NETWORK_ERROR: '网络连接失败，请检查您的网络连接',
      VALIDATION_ERROR: '请检查输入内容是否正确',
      AUTH_ERROR: '登录已过期，请重新登录',
      AUTHORIZATION_ERROR: '您没有权限执行此操作',
      NOT_FOUND: '请求的资源不存在',
      SERVER_ERROR: '服务器错误，请稍后重试',
      UNKNOWN_ERROR: '发生未知错误，请稍后重试',
    };

    return messages[error.code] || error.message;
  }

  /**
   * Get recovery action for error
   */
  getRecoveryAction(error: AppError): {
    label: string;
    action: () => void;
  } | null {
    const actions: Record<string, { label: string; action: () => void }> = {
      NETWORK_ERROR: {
        label: '重试',
        action: () => window.location.reload(),
      },
      AUTH_ERROR: {
        label: '重新登录',
        action: () => {
          window.location.href = '/login';
        },
      },
      NOT_FOUND: {
        label: '返回首页',
        action: () => {
          window.location.href = '/';
        },
      },
    };

    return actions[error.code] || null;
  }

  /**
   * Register error callback
   */
  onError(errorCode: string, callback: (error: AppError) => void): () => void {
    this.errorCallbacks.set(errorCode, callback);

    return () => {
      this.errorCallbacks.delete(errorCode);
    };
  }

  /**
   * Resolve error
   */
  resolveError(errorId: string, recovery?: any): void {
    const logEntry = this.errorLogs.find((log) => log.id === errorId);
    if (logEntry) {
      logEntry.resolved = true;
      logEntry.resolvedAt = new Date();

      if (recovery) {
        this.config.onRecover?.(logEntry.error, recovery);
      }
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    unresolved: number;
  } {
    const bySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0,
    };

    const byCategory: Record<ErrorCategory, number> = {
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.AUTHENTICATION]: 0,
      [ErrorCategory.AUTHORIZATION]: 0,
      [ErrorCategory.NOT_FOUND]: 0,
      [ErrorCategory.SERVER]: 0,
      [ErrorCategory.CLIENT]: 0,
      [ErrorCategory.UNKNOWN]: 0,
    };

    let unresolved = 0;

    this.errorLogs.forEach((log) => {
      bySeverity[log.error.severity]++;
      byCategory[log.error.category]++;
      if (!log.resolved) unresolved++;
    });

    return {
      total: this.errorLogs.length,
      bySeverity,
      byCategory,
      unresolved,
    };
  }

  /**
   * Get error logs
   */
  getErrorLogs(filters?: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    resolved?: boolean;
    limit?: number;
  }): ErrorLogEntry[] {
    let logs = [...this.errorLogs];

    if (filters?.severity) {
      logs = logs.filter((log) => log.error.severity === filters.severity);
    }

    if (filters?.category) {
      logs = logs.filter((log) => log.error.category === filters.category);
    }

    if (filters?.resolved !== undefined) {
      logs = logs.filter((log) => log.resolved === filters.resolved);
    }

    if (filters?.limit) {
      logs = logs.slice(-filters.limit);
    }

    return logs;
  }

  /**
   * Clear error logs
   */
  clearErrorLogs(): void {
    this.errorLogs = [];
  }

  /**
   * Export error logs
   */
  exportErrorLogs(): string {
    return JSON.stringify(this.errorLogs, null, 2);
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = new ErrorHandler();

/**
 * Convenience function to handle errors
 */
export function handleError(error: Error | AppError, context?: any): string {
  return errorHandler.handleError(error, context);
}

/**
 * Convenience function to get user message
 */
export function getUserMessage(error: AppError): string {
  return errorHandler.getUserMessage(error);
}

/**
 * Convenience function to get recovery action
 */
export function getRecoveryAction(error: AppError): { label: string; action: () => void } | null {
  return errorHandler.getRecoveryAction(error);
}

/**
 * React error boundary integration
 */
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: any) => {
    errorHandler.handleError(error, {
      component: 'ReactErrorBoundary',
      errorInfo,
    });
  };

  return { handleError };
}
