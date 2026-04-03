/**
 * Custom error classes for the AI Investment Report system
 *
 * These errors provide structured context for different failure modes,
 * enabling better error handling, logging, and user feedback.
 */

/**
 * Base class for all investment report errors
 * Includes context about when/where the error occurred
 */
export class InvestmentReportError extends Error {
  readonly timestamp: Date;

  constructor(
    message: string,
    public readonly context: {
      component: string; // Which service/component threw the error
      operation?: string; // What operation was being performed
      cause?: Error; // Original error if wrapping
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = context.timestamp || new Date();
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Format error for logging (structured)
   */
  toLogObject(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      component: this.context.component,
      operation: this.context.operation,
      cause: this.context.cause?.message,
      stack: this.stack,
      timestamp: this.context.timestamp.toISOString(),
    };
  }

  /**
   * Format error for user display (safe message)
   */
  toUserMessage(): string {
    // Return a safe, non-technical message for the user
    return `${this.message}`;
  }
}

/**
 * Error thrown when an AI agent fails to execute
 * This could be due to API errors, model failures, or invalid responses
 */
export class AgentExecutionError extends InvestmentReportError {
  constructor(
    message: string,
    agentName: string,
    operation: string,
    cause?: Error
  ) {
    super(message, {
      component: 'Agent',
      operation: `${agentName}:${operation}`,
      cause,
    });
    this.name = 'AgentExecutionError';
  }

  /**
   * Check if the error is recoverable (e.g., timeout vs permanent failure)
   */
  isRecoverable(): boolean {
    // Timeout errors and rate limits are recoverable with retry
    if (this.context.cause) {
      const causeMsg = this.context.cause.message.toLowerCase();
      return (
        causeMsg.includes('timeout') ||
        causeMsg.includes('rate limit') ||
        causeMsg.includes('429') ||
        causeMsg.includes('503') ||
        causeMsg.includes('502')
      );
    }
    return false;
  }
}

/**
 * Error thrown when a financial calculation fails
 * This could be due to invalid inputs, division by zero, or mathematical errors
 */
export class CalculationError extends InvestmentReportError {
  constructor(
    message: string,
    calculationType: string, // e.g., 'IRR', 'NPV', 'payback_period'
    context?: {
      inputs?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, {
      component: 'Calculator',
      operation: calculationType,
      cause: context?.cause,
    });
    this.name = 'CalculationError';
  }
}

/**
 * Error thrown when an LLM API call times out
 * This is distinct from other agent errors and may need special handling
 */
export class LLMTimeoutError extends AgentExecutionError {
  constructor(
    agentName: string,
    operation: string,
    timeoutMs: number,
    cause?: Error
  ) {
    super(
      `LLM call timed out after ${timeoutMs}ms`,
      agentName,
      operation,
      cause
    );
    this.name = 'LLMTimeoutError';
  }

  /**
   * Get the timeout duration in milliseconds
   */
  getTimeoutDuration(): number {
    const match = this.message.match(/(\d+)ms/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

/**
 * Error thrown when data validation fails
 * This indicates the input data is invalid or missing required fields
 */
export class ValidationError extends InvestmentReportError {
  constructor(
    message: string,
    public readonly validationErrors: Array<{
      field: string;
      message: string;
      value?: unknown;
    }>
  ) {
    super(message, {
      component: 'Validator',
      operation: 'validate',
    });
    this.name = 'ValidationError';
  }

  /**
   * Get a formatted list of validation errors
   */
  getErrorList(): string {
    return this.validationErrors
      .map((err) => `  - ${err.field}: ${err.message}${err.value !== undefined ? ` (got: ${JSON.stringify(err.value)})` : ''}`)
      .join('\n');
  }

  /**
   * Format for user display
   */
  override toUserMessage(): string {
    return `数据验证失败:\n${this.getErrorList()}`;
  }
}

/**
 * Error thrown when PDF generation fails
 */
export class PDFGenerationError extends InvestmentReportError {
  constructor(
    message: string,
    format: string,
    cause?: Error
  ) {
    super(message, {
      component: 'PDFGenerator',
      operation: `generate_${format}`,
      cause,
    });
    this.name = 'PDFGenerationError';
  }
}

/**
 * Error thrown when required data is missing
 */
export class MissingDataError extends InvestmentReportError {
  constructor(
    message: string,
    public readonly missingFields: string[]
  ) {
    super(message, {
      component: 'DataContext',
      operation: 'validate',
    });
    this.name = 'MissingDataError';
  }

  /**
   * Format for user display
   */
  override toUserMessage(): string {
    return `缺少必要数据:\n${this.missingFields.map((f) => `  - ${f}`).join('\n')}`;
  }
}

/**
 * Type guard to check if an error is an InvestmentReportError
 */
export function isInvestmentReportError(error: unknown): error is InvestmentReportError {
  return error instanceof InvestmentReportError;
}

/**
 * Helper to wrap unknown errors in AgentExecutionError
 * Use this in catch blocks when the error type is unknown
 */
export function wrapUnknownAgentError(
  error: unknown,
  agentName: string,
  operation: string,
  fallbackMessage: string = 'Agent执行失败'
): AgentExecutionError {
  if (error instanceof AgentExecutionError) {
    return error;
  }

  if (error instanceof Error) {
    return new AgentExecutionError(
      `${fallbackMessage}: ${error.message}`,
      agentName,
      operation,
      error
    );
  }

  // error is unknown (string, number, null, undefined, etc.)
  return new AgentExecutionError(
    `${fallbackMessage}: ${String(error)}`,
    agentName,
    operation
  );
}

/**
 * Helper to safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Helper to check if an error is a timeout (LLMTimeoutError or contains timeout in message)
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof LLMTimeoutError) {
    return true;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('timeout') || msg.includes('timed out');
  }

  return false;
}
